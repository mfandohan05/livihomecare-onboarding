import { getCallerUser, serviceClient } from '../_shared/caregiverAccess.ts'
import { consumeProof, hashProof } from '../_shared/caregiverVerification.ts'
import { corsHeaders, json, switchMarker } from '../_shared/googleSwitch.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EXPIRED = { success: false, expired: true, error: 'This request expired. Please request a new reset email and try again.' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caregiverId, proof } = await req.json()
    if (typeof caregiverId !== 'string' || !UUID_RE.test(caregiverId)) return json(EXPIRED)
    if (typeof proof !== 'string' || !/^[0-9a-f]{64}$/.test(proof)) return json(EXPIRED)

    const supabase = serviceClient()
    const user = await getCallerUser(req, supabase)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    if (!(user.identities ?? []).some((i) => i.provider === 'google')) {
      return json({ success: false, error: 'Sign in with Google to continue.' })
    }

    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('id, user_id, status')
      .eq('id', caregiverId)
      .maybeSingle()
    if (!caregiver?.user_id) return json(EXPIRED)

    const { data: proofRow } = await supabase
      .from('caregiver_verification_codes')
      .select('id, code_hash')
      .eq('caregiver_id', caregiver.id)
      .eq('proof_hash', await hashProof(caregiver.id, proof))
      .is('proof_used_at', null)
      .gt('proof_expires_at', new Date().toISOString())
      .maybeSingle()

    if (!proofRow || proofRow.code_hash !== await switchMarker(caregiver.id, caregiver.user_id)) {
      return json(EXPIRED)
    }

    const oldUserId = caregiver.user_id as string

    if (user.id === oldUserId) {
      await consumeProof(supabase, proofRow.id)
      return json({ success: true, status: caregiver.status, unchanged: true })
    }

    const { data: admin } = await supabase.from('admin_users').select('id').eq('id', user.id).maybeSingle()
    if (admin) {
      return json({ success: false, error: 'This Google account cannot be used for employee onboarding. Please choose a different one.' })
    }

    const { data: otherCaregiver } = await supabase
      .from('caregivers')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (otherCaregiver) {
      return json({ success: false, error: 'This Google account is already linked to another employee. Please choose a different one.' })
    }

    const { data: relinked, error: relinkError } = await supabase
      .from('caregivers')
      .update({ user_id: user.id })
      .eq('id', caregiver.id)
      .eq('user_id', oldUserId)
      .select('id')

    if (relinkError || !relinked?.length) {
      console.error('relink failed:', relinkError)
      return json({ success: false, error: 'Could not switch your Google account. Please try again.' })
    }

    await consumeProof(supabase, proofRow.id)

    const { error: deleteError } = await supabase.auth.admin.deleteUser(oldUserId)
    if (deleteError) console.error('deleting previous account failed:', deleteError)

    return json({ success: true, status: caregiver.status })
  } catch (err) {
    console.error('caregiver-finish-google-switch failed:', err)
    return json({ success: false, error: 'Could not switch your Google account. Please try again.' }, 500)
  }
})
