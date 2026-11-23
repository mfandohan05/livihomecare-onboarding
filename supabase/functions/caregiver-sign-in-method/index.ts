import { serviceClient } from '../_shared/caregiverAccess.ts'

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
    const { email } = await req.json()
    if (typeof email !== 'string' || !email.includes('@') || email.length > 320) {
      return json({ usesGoogle: false })
    }

    const supabase = serviceClient()

    const { data: caregivers } = await supabase
      .from('caregivers')
      .select('user_id')
      .ilike('email', email.trim().replace(/[\\%_]/g, '\\$&'))
      .not('user_id', 'is', null)
      .limit(1)

    const userId = caregivers?.[0]?.user_id
    if (!userId) return json({ usesGoogle: false })

    const { data } = await supabase.auth.admin.getUserById(userId)
    const identities = data?.user?.identities ?? []
    const usesGoogle = identities.some((i) => i.provider === 'google') &&
      !identities.some((i) => i.provider === 'email')

    return json({ usesGoogle })
  } catch {
    return json({ usesGoogle: false })
  }
})
