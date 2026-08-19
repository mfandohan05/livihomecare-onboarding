import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'
import { fillOfferLetterTemplate } from '../_shared/offerLetterFill.ts'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Non-destructive twin of generate-offer-letter: same fixed-field fill logic (via the
// shared offerLetterFill module), but never uploads the result or touches
// caregiver_documents — generate-offer-letter would overwrite that caregiver's actual
// signed offer letter, which Preview Fill must never do.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, roleKey, caregiverId, signature, address, city, state, zip } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!roleKey) throw new Error('roleKey is required')
    if (!caregiverId) throw new Error('caregiverId is required')

    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', caregiverId)
      .eq('company_id', companyId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Test caregiver not found for this company')

    const templatePath = `templates/${companyId}/offer_letter_${roleKey}.pdf`
    const { data: template, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (templateError || !template) {
      throw new Error(`No template found at "${templatePath}". Upload a template for this role before previewing.`)
    }

    const templateBytes = new Uint8Array(await template.arrayBuffer())
    const filledBytes = await fillOfferLetterTemplate(
      templateBytes,
      caregiver,
      signature || caregiver.name,
      { address, city, state, zip }
    )

    return new Response(
      JSON.stringify({ pdfBase64: toBase64(filledBytes) }),
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
