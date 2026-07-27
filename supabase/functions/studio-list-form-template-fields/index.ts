import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'
import { listTemplateFieldNames } from '../_shared/pdfFill.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, formKey } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!formKey) throw new Error('formKey is required')

    const templatePath = `templates/${companyId}/${formKey}.pdf`
    const { data: template, error: downloadError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (downloadError || !template) {
      return new Response(
        JSON.stringify({ exists: false, fields: [] }),
        { headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bytes = new Uint8Array(await template.arrayBuffer())
    const fields = await listTemplateFieldNames(bytes)

    return new Response(
      JSON.stringify({ exists: true, fields }),
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
