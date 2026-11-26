import { requireCaregiverAccess } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caregiverId } = await req.json()
    const { supabase } = await requireCaregiverAccess(req, caregiverId, ['admin'])

    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('id, user_id')
      .eq('id', caregiverId)
      .single()

    if (!caregiver) return json({ error: 'Unauthorized' }, 401)

    if (!caregiver.user_id) {
      return json({ success: true, deleted: false })
    }

    const { data: adminTarget } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', caregiver.user_id)
      .maybeSingle()
    if (adminTarget) {
      return json({ success: false, error: 'This employee is linked to an admin account and cannot be deleted from here.' })
    }

    const { data: otherLinks } = await supabase
      .from('caregivers')
      .select('id')
      .eq('user_id', caregiver.user_id)
      .neq('id', caregiver.id)
      .limit(1)

    const { data: unlinked, error: unlinkError } = await supabase
      .from('caregivers')
      .update({ user_id: null })
      .eq('id', caregiver.id)
      .eq('user_id', caregiver.user_id)
      .select('id')

    if (unlinkError || !unlinked?.length) {
      console.error('unlink failed:', unlinkError)
      return json({ success: false, error: 'Could not delete this employee\'s sign-in account. Please try again.' })
    }

    if (otherLinks?.length) {
      return json({ success: true, deleted: false })
    }

    await supabase.from('caregiver_verification_codes').delete().eq('caregiver_id', caregiver.id)

    const { error: deleteError } = await supabase.auth.admin.deleteUser(caregiver.user_id)
    if (deleteError && deleteError.status !== 404) {
      console.error('deleteUser failed:', deleteError)
      await supabase.from('caregivers').update({ user_id: caregiver.user_id }).eq('id', caregiver.id)
      return json({ success: false, error: 'Could not delete this employee\'s sign-in account. Please try again.' })
    }

    return json({ success: true, deleted: !deleteError })
  } catch (err) {
    console.error('admin-delete-caregiver-auth failed:', err)
    return json({ success: false, error: 'Could not delete this employee\'s sign-in account. Please try again.' }, 500)
  }
})
