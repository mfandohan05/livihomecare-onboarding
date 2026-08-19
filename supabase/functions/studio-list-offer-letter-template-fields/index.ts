import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'
import { OFFER_LETTER_FIELD_NAMES, listTemplateFieldNames } from '../_shared/offerLetterFill.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, roleKey } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!roleKey) throw new Error('roleKey is required')

    const templatePath = `templates/${companyId}/offer_letter_${roleKey}.pdf`
    const { data: template, error: downloadError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (downloadError || !template) {
      return new Response(
        JSON.stringify({ exists: false, fields: [], knownFieldsPresent: [] }),
        { headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bytes = new Uint8Array(await template.arrayBuffer())
    const fields = await listTemplateFieldNames(bytes)
    const knownFieldsPresent = OFFER_LETTER_FIELD_NAMES.filter((f) => fields.includes(f))

    return new Response(
      JSON.stringify({ exists: true, fields, knownFieldsPresent }),
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
