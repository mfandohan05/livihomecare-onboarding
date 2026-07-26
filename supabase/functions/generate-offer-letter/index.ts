import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fillOfferLetterTemplate(
  templateBytes: Uint8Array,
  caregiver: any,
  signature: string,
  extra: { address?: string; city?: string; state?: string; zip?: string },
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  const filledFieldNames: string[] = []

  const trySet = (fieldName: string, value: string) => {
    try {
        form.getTextField(fieldName).setText(value ?? '')
        filledFieldNames.push(fieldName)
        console.log(`✓ ${fieldName}`)
    } catch {
        console.log(`✗ ${fieldName} — not found on template`)
    }
}

  trySet('employee_name', caregiver.name)
  trySet('employee_name_greeting', caregiver.name)
  trySet('employee_signature', signature)
  trySet('employee_date', today)

  trySet('contractor_name', caregiver.name)
  trySet('contractor_name_greeting', caregiver.name)
  trySet('contractor_name_print', caregiver.name)
  trySet('contractor_name_intro', caregiver.name)
  trySet('contractor_signature', signature)
  trySet('contractor_date', today)

  trySet('position', caregiver.position_title || '')

  trySet('start_date', caregiver.start_date || '')
  trySet('effective_date', caregiver.start_date || '')
  trySet('letter_date', today)
  trySet('hourly_rate', caregiver.pay_rate?.toString() || '')
  trySet('live_in_hourly_rate', caregiver.companion_pay_rate?.toString() || '')
  trySet('companion_rate', caregiver.companion_pay_rate?.toString() || '')
  trySet('mileage_rate', caregiver.mileage_rate?.toString() || '')

  const positionIntro = caregiver.position_title
    ? `${caregiver.position_title}${caregiver.employment_type ? ` (${caregiver.employment_type})` : ''}`
    : ''
  trySet('position_intro', positionIntro)
  trySet('position_title', caregiver.position_title || '')
  trySet('position_accept', caregiver.position_title || '')

  trySet('address', extra.address || '')
  trySet('city', extra.city || '')
  trySet('state', extra.state || '')
  trySet('zip', extra.zip || '')

  form.updateFieldAppearances(font)

  for (const fieldName of filledFieldNames) {
    if (fieldName.toLowerCase().includes('signature')) {
      try {
        form.getTextField(fieldName).updateAppearances(await pdfDoc.embedFont(StandardFonts.HelveticaOblique))
      } catch {
      }
    }
  }

  for (const fieldName of filledFieldNames) {
    try {
      form.getField(fieldName).enableReadOnly()
    } catch {
    }
  }

  return await pdfDoc.save()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { caregiverId, signature, address, city, state, zip } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('*, company_id')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    const templatePath = `templates/${caregiver.company_id}/offer_letter_${caregiver.role}.pdf`
    const { data: template, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (templateError || !template) {
      throw new Error(`No offer letter template found at "${templatePath}". Upload a fillable template for this company/role before generating this document.`)
    }

    const templateBytes = new Uint8Array(await template.arrayBuffer())
    const finalPdfBytes = await fillOfferLetterTemplate(
      templateBytes,
      caregiver,
      signature || caregiver.name,
      { address, city, state, zip }
    )

    const filePath = `${caregiver.company_id}/${caregiverId}/offer_letter.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(filePath, finalPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

    await supabase.from('caregiver_documents').upsert({
      caregiver_id: caregiverId,
      company_id: caregiver.company_id,
      document_type: 'offer_letter_generated',
      file_name: 'offer_letter.pdf',
      file_path: filePath,
      file_size: finalPdfBytes.byteLength,
      mime_type: 'application/pdf',
    }, { onConflict: 'caregiver_id, document_type' })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})