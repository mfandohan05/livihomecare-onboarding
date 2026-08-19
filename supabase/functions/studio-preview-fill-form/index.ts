import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'
import { fillDocumentTemplate, resolveFieldMappingValues } from '../_shared/pdfFill.ts'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, formKey, fieldMapping, caregiverId, signature, hepBStatus, references } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!formKey) throw new Error('formKey is required')
    if (!caregiverId) throw new Error('caregiverId is required')
    if (!Array.isArray(fieldMapping)) throw new Error('fieldMapping must be an array')

    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', caregiverId)
      .eq('company_id', companyId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Test caregiver not found for this company')

    const templatePath = `templates/${companyId}/${formKey}.pdf`
    const { data: template, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (templateError || !template) {
      throw new Error(`No template found at "${templatePath}". Upload a template for this form before previewing.`)
    }

    const fieldValues = resolveFieldMappingValues(fieldMapping, caregiver, signature || '', {
      hepBStatus: hepBStatus || '',
      references: references || [],
    })

    const templateBytes = new Uint8Array(await template.arrayBuffer())
    const filledBytes = await fillDocumentTemplate(templateBytes, fieldValues)

    return new Response(
      JSON.stringify({ pdfBase64: toBase64(filledBytes), fieldValues }),
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
