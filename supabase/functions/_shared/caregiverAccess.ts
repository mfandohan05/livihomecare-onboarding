import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'

export type CallerKind = 'caregiver' | 'admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// Resolves the user behind the request's bearer token. The public anon key is
// also a valid bearer token, but it belongs to no user, so it resolves to null.
export async function getCallerUser(req: Request, supabase: SupabaseClient): Promise<User | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (error || !user) return null
  return user
}

// Whether `userId` is an admin of the given company.
export async function isAdminOfCompany(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .eq('company_id', companyId)
    .maybeSingle()
  return !!data
}

// Guards every function that acts on a caregiver record identified by a
// client-supplied caregiverId. The caller must be either:
//   - the caregiver themselves (caregivers.user_id = the verified JWT user), or
//   - an admin of that caregiver's company.
// Anything else (anon key, another caregiver, an admin of another company, an
// unknown id) gets the same generic error so ids can't be probed.
export async function requireCaregiverAccess(
  req: Request,
  caregiverId: unknown,
  allow: CallerKind[] = ['caregiver', 'admin']
): Promise<{ supabase: SupabaseClient; userId: string; kind: CallerKind }> {
  const denied = new Error('Unauthorized')

  if (typeof caregiverId !== 'string' || !UUID_RE.test(caregiverId)) throw denied

  const supabase = serviceClient()
  const user = await getCallerUser(req, supabase)
  if (!user) throw denied

  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('id, company_id, user_id')
    .eq('id', caregiverId)
    .maybeSingle()
  if (!caregiver) throw denied

  if (allow.includes('caregiver') && caregiver.user_id && caregiver.user_id === user.id) {
    return { supabase, userId: user.id, kind: 'caregiver' }
  }

  if (allow.includes('admin') && await isAdminOfCompany(supabase, user.id, caregiver.company_id)) {
    return { supabase, userId: user.id, kind: 'admin' }
  }

  throw denied
}

// For caregiver self-service functions that take no caregiverId at all: the
// record is derived purely from the verified JWT.
export async function requireOwnCaregiver(req: Request): Promise<{
  supabase: SupabaseClient
  userId: string
  caregiver: Record<string, unknown> & { id: string; company_id: string }
}> {
  const denied = new Error('Unauthorized')

  const supabase = serviceClient()
  const user = await getCallerUser(req, supabase)
  if (!user) throw denied

  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!caregiver) throw denied

  return { supabase, userId: user.id, caregiver }
}
