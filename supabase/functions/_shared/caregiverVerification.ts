import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const CODE_TTL_MS = 5 * 60 * 1000
export const PROOF_TTL_MS = 30 * 60 * 1000
export const MAX_ATTEMPTS = 5
export const RESEND_COOLDOWN_MS = 30 * 1000
export const MAX_CODES_PER_HOUR = 5

const encoder = new TextEncoder()

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function generateCode(): string {
  const limit = 4294967296 - (4294967296 % 1000000)
  const buf = new Uint32Array(1)
  do {
    crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return String(buf[0] % 1000000).padStart(6, '0')
}

export function generateProof(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function hashCode(caregiverId: string, code: string): Promise<string> {
  return sha256Hex(`code:${caregiverId}:${code}`)
}

export function hashProof(caregiverId: string, proof: string): Promise<string> {
  return sha256Hex(`proof:${caregiverId}:${proof}`)
}

export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return '***'
  const local = email.slice(0, at)
  const domain = email.slice(at)
  if (local.length === 1) return `*${domain}`
  return `${local[0]}${'*'.repeat(local.length - 1)}${domain}`
}

export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? ''
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type CaregiverForVerification = {
  id: string
  name: string | null
  email: string
  company_id: string
  status: string | null
  link_expires_at: string | null
  user_id: string | null
  source: string | null
}

export async function findVerifiableCaregiver(
  supabase: SupabaseClient,
  token: unknown
): Promise<CaregiverForVerification | null> {
  if (!token || typeof token !== 'string') return null

  const { data: caregiver, error } = await supabase
    .from('caregivers')
    .select('id, name, email, company_id, status, link_expires_at, user_id, source')
    .eq('token', token)
    .maybeSingle()

  if (error || !caregiver || caregiver.user_id) return null

  const isExpired = caregiver.status === 'pending' &&
    caregiver.link_expires_at &&
    new Date() > new Date(caregiver.link_expires_at)
  if (isExpired) return null

  return caregiver as CaregiverForVerification
}

export async function findValidProof(
  supabase: SupabaseClient,
  caregiverId: string,
  proof: unknown
): Promise<string | null> {
  if (typeof proof !== 'string' || !/^[0-9a-f]{64}$/.test(proof)) return null

  const proofHash = await hashProof(caregiverId, proof)
  const { data } = await supabase
    .from('caregiver_verification_codes')
    .select('id')
    .eq('caregiver_id', caregiverId)
    .eq('proof_hash', proofHash)
    .is('proof_used_at', null)
    .gt('proof_expires_at', new Date().toISOString())
    .maybeSingle()

  return data?.id ?? null
}

export async function consumeProof(supabase: SupabaseClient, rowId: string): Promise<void> {
  await supabase
    .from('caregiver_verification_codes')
    .update({ proof_used_at: new Date().toISOString() })
    .eq('id', rowId)
    .is('proof_used_at', null)
}
