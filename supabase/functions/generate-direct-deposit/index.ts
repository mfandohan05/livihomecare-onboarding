import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { caregiverId } = await req.json()

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

    const templatePath = `templates/${caregiver.company_id}/direct_deposit_authorization.pdf`
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

    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })

    const trySet = (fieldName: string, value: string) => {
      try {
        form.getTextField(fieldName).setText(value)
      } catch {
        console.warn(`Field "${fieldName}" not found on template — skipped`)
      }
    }
    trySet('employee_name_intro', caregiver.name)
    trySet('employee_name', caregiver.name)
    trySet('employee_signature', caregiver.name)
    trySet('employee_date', today)

    form.updateFieldAppearances(font)

    form.flatten()

    const filledPdfBytes = await pdfDoc.save()

    const filePath = `${caregiver.company_id}/${caregiverId}/direct_deposit_authorization.pdf`
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
      document_type: 'direct_deposit_authorization',
      file_name: 'direct_deposit_authorization.pdf',
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