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
    const { token } = await req.json()
    if (!token || typeof token !== 'string') return NOT_FOUND

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase
      .from('caregivers')
      .select('*, company_id')
      .eq('token', token)
      .maybeSingle()

    if (error || !data) return NOT_FOUND

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return NOT_FOUND
  }
})
