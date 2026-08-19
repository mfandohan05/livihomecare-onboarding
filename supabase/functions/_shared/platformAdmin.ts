import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const studioCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export async function requirePlatformAdmin(req: Request): Promise<{ supabase: SupabaseClient; userId: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Unauthorized')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) throw new Error('Unauthorized')

  const { data: admin, error: adminError } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('id', user.id)
    .single()

  if (adminError || !admin) throw new Error('Unauthorized')

  return { supabase, userId: user.id }
}
