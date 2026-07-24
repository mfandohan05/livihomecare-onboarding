import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { caregiverId, references, signature } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('id, name, company_id')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    const templatePath = `templates/${caregiver.company_id}/reference_check.pdf`
    const { data: templateData, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (templateError || !templateData) {
      throw new Error(`Could not load template at "${templatePath}". Upload a fillable template for this company before generating this document.`)
    }

    const templateBytes = new Uint8Array(await templateData.arrayBuffer())
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const ref1 = references?.[0] || {}
    const ref2 = references?.[1] || {}

    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })

    const trySet = (fieldName: string, value: string) => {
      try {
        form.getTextField(fieldName).setText(value || '')
      } catch {
        console.warn(`Field "${fieldName}" not found on template — skipped`)
      }
    }

    trySet('ref1_name', ref1.name)
    trySet('ref1_company', ref1.company)
    trySet('ref1_relationship', ref1.relationship)
    trySet('ref1_contact', [ref1.phone, ref1.email].filter(Boolean).join('\n'))

    trySet('ref2_name', ref2.name)
    trySet('ref2_company', ref2.company)
    trySet('ref2_relationship', ref2.relationship)
    trySet('ref2_contact', [ref2.phone, ref2.email].filter(Boolean).join('\n'))

    trySet('employee_name', caregiver.name)
    trySet('employee_signature', signature || caregiver.name)
    trySet('employee_date', today)

    form.updateFieldAppearances(font)

    form.flatten()

    const filledPdfBytes = await pdfDoc.save()

    const filePath = `${caregiver.company_id}/${caregiverId}/reference_check.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(filePath, filledPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

    await supabase.from('caregiver_documents').upsert({
      caregiver_id: caregiverId,
      company_id: caregiver.company_id,
      document_type: 'reference_check',
      file_name: 'reference_check.pdf',
      file_path: filePath,
      file_size: filledPdfBytes.byteLength,
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