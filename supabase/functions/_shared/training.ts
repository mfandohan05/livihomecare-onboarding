import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCallerUser, serviceClient } from './caregiverAccess.ts'

export const trainingCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const trainingJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...trainingCorsHeaders, 'Content-Type': 'application/json' },
  })

export class TrainingError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export const trainingErrorResponse = (err: unknown) => {
  if (err instanceof TrainingError) return trainingJson({ error: err.message }, err.status)
  console.error(err)
  return trainingJson({ error: 'Something went wrong' }, 500)
}

export const CAREGIVER_ROLES = ['caregiver', 'nurse_prn', 'nurse_director', 'other']

export type TrainingAdminContext = {
  supabase: SupabaseClient
  userId: string
  companyId: string
  isPlatformAdmin: boolean
  name: string
  email: string
}

export async function requireTrainingAdmin(req: Request, requestedCompanyId: unknown): Promise<TrainingAdminContext> {
  const supabase = serviceClient()
  const user = await getCallerUser(req, supabase)
  if (!user) throw new TrainingError('Unauthorized', 401)

  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (platformAdmin) {
    if (typeof requestedCompanyId !== 'string' || !requestedCompanyId) {
      throw new TrainingError('companyId is required')
    }
    return {
      supabase,
      userId: user.id,
      companyId: requestedCompanyId,
      isPlatformAdmin: true,
      name: 'Platform Admin',
      email: user.email || '',
    }
  }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, name, email, company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin || !admin.company_id) throw new TrainingError('Unauthorized', 401)

  return {
    supabase,
    userId: admin.id,
    companyId: admin.company_id,
    isPlatformAdmin: false,
    name: admin.name || '',
    email: admin.email || user.email || '',
  }
}

export function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function appliesToRole(training: { roles: string[] | null }, role: string): boolean {
  const roles = training.roles || []
  return roles.length === 0 || roles.includes(role)
}

export async function assignTrainings(
  supabase: SupabaseClient,
  caregiver: { id: string; company_id: string; role: string }
): Promise<void> {
  const { data: trainings, error } = await supabase
    .from('trainings')
    .select('id, due_days, roles')
    .eq('company_id', caregiver.company_id)
    .eq('is_published', true)
  if (error) throw error

  const applicable = (trainings || []).filter((t) => appliesToRole(t, caregiver.role))
  if (applicable.length === 0) return

  const { data: existing, error: existingError } = await supabase
    .from('caregiver_trainings')
    .select('training_id')
    .eq('caregiver_id', caregiver.id)
  if (existingError) throw existingError

  const have = new Set((existing || []).map((r) => r.training_id))
  const now = Date.now()
  const rows = applicable
    .filter((t) => !have.has(t.id))
    .map((t) => ({
      caregiver_id: caregiver.id,
      training_id: t.id,
      company_id: caregiver.company_id,
      assigned_at: new Date(now).toISOString(),
      due_date: t.due_days ? new Date(now + t.due_days * 86400000).toISOString() : null,
    }))

  if (rows.length === 0) return

  const { error: insertError } = await supabase
    .from('caregiver_trainings')
    .upsert(rows, { onConflict: 'caregiver_id,training_id', ignoreDuplicates: true })
  if (insertError) throw insertError
}

const ASSIGNMENT_CHUNK = 500

export async function assignTrainingsToMany(
  supabase: SupabaseClient,
  companyId: string,
  caregivers: { id: string; role: string }[]
): Promise<number> {
  if (caregivers.length === 0) return 0

  const { data: trainings, error } = await supabase
    .from('trainings')
    .select('id, due_days, roles')
    .eq('company_id', companyId)
    .eq('is_published', true)
  if (error) throw error

  const now = Date.now()
  const rows = caregivers.flatMap((caregiver) =>
    (trainings || [])
      .filter((t) => appliesToRole(t, caregiver.role))
      .map((t) => ({
        caregiver_id: caregiver.id,
        training_id: t.id,
        company_id: companyId,
        assigned_at: new Date(now).toISOString(),
        due_date: t.due_days ? new Date(now + t.due_days * 86400000).toISOString() : null,
      }))
  )

  const failed = new Set<string>()
  for (let i = 0; i < rows.length; i += ASSIGNMENT_CHUNK) {
    const chunk = rows.slice(i, i + ASSIGNMENT_CHUNK)
    const { error: insertError } = await supabase
      .from('caregiver_trainings')
      .upsert(chunk, { onConflict: 'caregiver_id,training_id', ignoreDuplicates: true })
    if (insertError) {
      console.error('training assignment chunk failed:', insertError)
      for (const row of chunk) failed.add(row.caregiver_id)
    }
  }
  return failed.size
}
