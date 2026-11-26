import { sha256Hex } from './caregiverVerification.ts'

export const SWITCH_TTL_MS = 15 * 60 * 1000
const RECENT_VERIFICATION_MS = 30 * 60 * 1000
const EMAIL_VERIFIED_METHODS = ['recovery', 'otp', 'magiclink']

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

export function switchMarker(caregiverId: string, oldUserId: string): Promise<string> {
  return sha256Hex(`google-switch:${caregiverId}:${oldUserId}`)
}

function jwtPayload(req: Request): Record<string, unknown> | null {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function verifiedEmailRecently(req: Request): boolean {
  const amr = jwtPayload(req)?.amr
  if (!Array.isArray(amr)) return false
  const cutoff = (Date.now() - RECENT_VERIFICATION_MS) / 1000
  return amr.some((entry) =>
    EMAIL_VERIFIED_METHODS.includes(entry?.method) && typeof entry?.timestamp === 'number' && entry.timestamp >= cutoff
  )
}
