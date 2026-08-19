import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, fileBase64, contentType } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!fileBase64 || !contentType) throw new Error('fileBase64 and contentType are required')

    const ext = EXT_BY_CONTENT_TYPE[contentType]
    if (!ext) throw new Error(`Unsupported image type "${contentType}"`)

    const base64Payload = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64
    const bytes = decodeBase64(base64Payload)

    const logoPath = `logos/${companyId}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('company_assets')
      .upload(logoPath, bytes, { contentType, upsert: true })

    if (uploadError) throw uploadError

    const { error: updateError } = await supabase
      .from('company_data')
      .update({ logo_path: logoPath })
      .eq('company_id', companyId)

    if (updateError) throw updateError

    const { data: publicUrlData } = supabase.storage.from('company_assets').getPublicUrl(logoPath)

    return new Response(
      JSON.stringify({ logo_path: logoPath, public_url: publicUrlData.publicUrl }),
      { headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const status = err.message === 'Unauthorized' ? 401 : 500
    return new Response(
      JSON.stringify({ error: err.message }),
      { status, headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
