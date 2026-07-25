import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caregiverId, ssn, dob, ein } = await req.json()

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')
    if (!encryptionKey) throw new Error('Encryption key not set')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('company_id')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    const { error } = await supabase.rpc('save_ssn_encrypted', {
      p_caregiver_id: caregiverId,
      p_company_id: caregiver.company_id,
      p_ssn: ssn || '',
      p_dob: dob || '',
      p_ein: ein || '',
      p_encryption_key: encryptionKey
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})