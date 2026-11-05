import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCallerUser, serviceClient } from './caregiverAccess.ts'

export type AdminContext = {
  supabase: SupabaseClient
  userId: string
  email: string
  name: string
  role: string
  companyId: string
}

// For admin-only functions that act on the caller's own company and take no
// company id from the request. The company is derived purely from the verified
// JWT -> admin_users row. Anon key, caregivers, and users with no admin_users
// row (or no company) all get the same generic error.
export async function requireAdminContext(req: Request): Promise<AdminContext> {
  const denied = new Error('Unauthorized')

  const supabase = serviceClient()
  const user = await getCallerUser(req, supabase)
  if (!user) throw denied

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, name, email, role, company_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!admin || !admin.company_id) throw denied

  return {
    supabase,
    userId: admin.id,
    email: admin.email || user.email || '',
    name: admin.name,
    role: admin.role,
    companyId: admin.company_id,
  }
}
