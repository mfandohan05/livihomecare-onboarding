import { serviceClient } from '../_shared/caregiverAccess.ts'
import {
  MAX_ATTEMPTS,
  PROOF_TTL_MS,
  findVerifiableCaregiver,
  generateProof,
  hashCode,
  hashProof,
  timingSafeEqual,
} from '../_shared/caregiverVerification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const INVALID = { success: false, error: 'That code is incorrect or has expired.' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, code } = await req.json()
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return json({ success: false, error: 'Enter the 6-digit code.' })
    }

    const supabase = serviceClient()
    const caregiver = await findVerifiableCaregiver(supabase, token)
    if (!caregiver) return json({ error: 'Invalid or expired link' }, 404)

    const { data: row } = await supabase
      .from('caregiver_verification_codes')
      .select('id, code_hash, expires_at, attempts, verified_at')
      .eq('caregiver_id', caregiver.id)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!row || new Date(row.expires_at) <= new Date() || row.attempts >= MAX_ATTEMPTS) {
      return json(INVALID)
    }

    const { data: claimed } = await supabase
      .from('caregiver_verification_codes')
      .update({ attempts: row.attempts + 1 })
      .eq('id', row.id)
      .eq('attempts', row.attempts)
      .select('id')

    if (!claimed?.length) return json(INVALID)

    const submittedHash = await hashCode(caregiver.id, code)
    if (!timingSafeEqual(submittedHash, row.code_hash)) {
      const remaining = MAX_ATTEMPTS - (row.attempts + 1)
      return json({
        success: false,
        error: remaining > 0
          ? 'That code is incorrect or has expired.'
          : 'Too many incorrect attempts. Please request a new code.',
        attemptsRemaining: remaining,
      })
    }

    const proof = generateProof()
    const { data: verified } = await supabase
      .from('caregiver_verification_codes')
      .update({
        verified_at: new Date().toISOString(),
        proof_hash: await hashProof(caregiver.id, proof),
        proof_expires_at: new Date(Date.now() + PROOF_TTL_MS).toISOString(),
      })
      .eq('id', row.id)
      .is('verified_at', null)
      .select('id')

    if (!verified?.length) return json(INVALID)

    return json({ success: true, proof, name: caregiver.name, email: caregiver.email })
  } catch (err) {
    console.error('caregiver-verify-code failed:', err)
    return json({ success: false, error: 'Could not verify the code. Please try again.' }, 500)
  }
})
