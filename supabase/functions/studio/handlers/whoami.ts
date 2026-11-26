import { requirePlatformAdmin, studioCorsHeaders } from '../../_shared/platformAdmin.ts'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    await requirePlatformAdmin(req)
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 401, headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
