import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'
import { OFFER_LETTER_FIELD_NAMES, listTemplateFieldNames } from '../_shared/offerLetterFill.ts'

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Uploads to the exact path generate-offer-letter reads from
// (generated-pdfs/templates/{companyId}/offer_letter_{roleKey}.pdf), then immediately
// re-reads it and reports which of the ~20 fixed field names generate-offer-letter tries
// to fill are actually present — there's no configurable field_mapping for offer letters,
// so this fixed checklist is the only way to catch a reverted/mis-exported template here.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, roleKey, fileBase64, contentType } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!roleKey) throw new Error('roleKey is required')
    if (!fileBase64) throw new Error('fileBase64 is required')
    if (contentType !== 'application/pdf') throw new Error('Template must be a PDF file')

    const base64Payload = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64
    const bytes = decodeBase64(base64Payload)

    const templatePath = `templates/${companyId}/offer_letter_${roleKey}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(templatePath, bytes, { contentType: 'application/pdf', upsert: true })

    if (uploadError) throw uploadError

    let fields: string[] = []
    try {
      fields = await listTemplateFieldNames(bytes)
    } catch (parseError) {
      throw new Error(`Uploaded, but the file couldn't be read as a fillable PDF form: ${parseError.message}`)
    }

    const knownFieldsPresent = OFFER_LETTER_FIELD_NAMES.filter((f) => fields.includes(f))

    return new Response(
      JSON.stringify({ success: true, fields, knownFieldsPresent }),
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
