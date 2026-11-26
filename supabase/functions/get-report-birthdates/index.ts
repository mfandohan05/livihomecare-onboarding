import { requireAdminContext } from '../_shared/requireAdmin.ts'
import { getCallerUser, serviceClient } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_IDS = 5000
const LOOKUP_CHUNK = 200
const CONCURRENCY = 10

class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

const RECENT_SIGN_IN_SECONDS = 5 * 60

type AuthMethod = { method?: string; timestamp?: number }

function tokenClaims(req: Request): { amr?: AuthMethod[] } {
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const payload = token.split('.')[1] || ''
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
  try {
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

function signedInWithPasswordRecently(req: Request) {
  const now = Math.floor(Date.now() / 1000)
  return (tokenClaims(req).amr || []).some(
    (entry) => entry.method === 'password' && typeof entry.timestamp === 'number' && now - entry.timestamp <= RECENT_SIGN_IN_SECONDS
  )
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++])
  })
  await Promise.all(workers)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!req.headers.get('Authorization')) {
      console.error('get-report-birthdates: no Authorization header')
      throw new HttpError('Unauthorized', 401)
    }

    const admin = await requireAdminContext(req).catch(async () => {
      const supabase = serviceClient()
      const user = await getCallerUser(req, supabase)
      if (!user) {
        console.error('get-report-birthdates: token did not resolve to a user')
      } else {
        const { data: row } = await supabase.from('admin_users').select('id, company_id').eq('id', user.id).maybeSingle()
        console.error(`get-report-birthdates: user ${user.id} ${row ? 'has no company_id on admin_users' : 'has no admin_users row'}`)
      }
      throw new HttpError('Unauthorized', 401)
    })

    if (!signedInWithPasswordRecently(req)) {
      throw new HttpError('Please confirm your password again.', 403)
    }

    const { caregiverIds } = await req.json()

    if (!Array.isArray(caregiverIds) || caregiverIds.length === 0 || caregiverIds.length > MAX_IDS) {
      throw new HttpError('Invalid request', 400)
    }
    const requested = [...new Set(caregiverIds)]
    if (!requested.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
      throw new HttpError('Invalid request', 400)
    }

    const allowed: string[] = []
    for (let from = 0; from < requested.length; from += LOOKUP_CHUNK) {
      const { data, error } = await admin.supabase
        .from('caregivers')
        .select('id')
        .eq('company_id', admin.companyId)
        .in('id', requested.slice(from, from + LOOKUP_CHUNK))
      if (error) throw new Error('lookup failed')
      allowed.push(...(data || []).map((row: { id: string }) => row.id))
    }

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')
    if (!encryptionKey) throw new Error('Encryption key not set')

    const birthdates: Record<string, string> = {}
    await pool(allowed, CONCURRENCY, async (caregiverId) => {
      const { data, error } = await admin.supabase.rpc('get_ssn_decrypted', {
        p_caregiver_id: caregiverId,
        p_encryption_key: encryptionKey,
      })
      if (error) throw new Error('decrypt failed')
      const row = Array.isArray(data) ? data[0] : data
      if (row?.dob) birthdates[caregiverId] = String(row.dob)
    })

    const { error: auditError } = await admin.supabase.from('audit_logs').insert({
      admin_id: admin.userId,
      admin_email: admin.email,
      action: 'exported_birthdates',
      company_id: admin.companyId,
      metadata: {
        admin_name: admin.name,
        employees: allowed.length,
        with_birthdate: Object.keys(birthdates).length,
      },
    })
    if (auditError) throw new Error('audit failed')

    return json({ birthdates })
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    console.error('get-report-birthdates:', (error as Error).message)
    return json({ error: 'Could not load dates of birth.' }, 500)
  }
})
