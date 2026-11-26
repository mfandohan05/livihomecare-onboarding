import { getCallerUser, serviceClient } from '../_shared/caregiverAccess.ts'
import { generateProof, hashProof } from '../_shared/caregiverVerification.ts'
import { SWITCH_TTL_MS, corsHeaders, json, switchMarker, verifiedEmailRecently } from '../_shared/googleSwitch.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = serviceClient()
    const user = await getCallerUser(req, supabase)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    if (!verifiedEmailRecently(req)) {
      return json({ success: false, error: 'Please use the link in your reset email again to continue.' })
    }

    const { data: admin } = await supabase.from('admin_users').select('id').eq('id', user.id).maybeSingle()
    if (admin) return json({ success: false, error: 'This account cannot be changed from here.' })

    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('id, status')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!caregiver) return json({ success: false, error: 'No employee onboarding is linked to this account.' })
    if (caregiver.status === 'cancelled') {
      return json({ success: false, error: 'Your onboarding was cancelled. Please contact your employer.' })
    }

    const now = Date.now()
    const proof = generateProof()

    const { error: insertError } = await supabase.from('caregiver_verification_codes').insert({
      caregiver_id: caregiver.id,
      code_hash: await switchMarker(caregiver.id, user.id),
      expires_at: new Date(now).toISOString(),
      verified_at: new Date(now).toISOString(),
      proof_hash: await hashProof(caregiver.id, proof),
      proof_expires_at: new Date(now + SWITCH_TTL_MS).toISOString(),
    })

    if (insertError) {
      console.error('switch proof insert failed:', insertError)
      return json({ success: false, error: 'Could not start switching accounts. Please try again.' })
    }

    return json({ success: true, caregiverId: caregiver.id, proof })
  } catch (err) {
    console.error('caregiver-start-google-switch failed:', err)
    return json({ success: false, error: 'Could not start switching accounts. Please try again.' }, 500)
  }
})
