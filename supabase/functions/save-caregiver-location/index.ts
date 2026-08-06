import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOT_FOUND = new Response(
  JSON.stringify({ error: 'Invalid or expired link' }),
  { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, lat, lng } = await req.json()
    if (!token || typeof token !== 'string') return NOT_FOUND
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: caregiver, error: lookupError } = await supabase
      .from('caregivers')
      .select('id')
      .eq('token', token)
      .maybeSingle()

    if (lookupError || !caregiver) return NOT_FOUND

    const { error } = await supabase
      .from('caregivers')
      .update({ lat, lng })
      .eq('id', caregiver.id)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return NOT_FOUND
  }
})
