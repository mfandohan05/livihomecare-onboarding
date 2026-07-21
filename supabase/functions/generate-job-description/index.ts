import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fillJobDescriptionTemplate(
  templateBytes: Uint8Array,
  caregiver: any,
  signature: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const trySet = (fieldName: string, value: string) => {
    try {
      form.getTextField(fieldName).setText(value)
    } catch {
    }
  }

  trySet('employee_name', caregiver.name)
  trySet('employee_signature', signature)
  trySet('employee_date', new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))

  form.updateFieldAppearances(font)

  try {
    const signatureField = form.getTextField('employee_signature')
    signatureField.updateAppearances(italicFont)
  } catch {
  }

  const employeeFieldNames = ['employee_name', 'employee_signature', 'employee_date']
  for (const fieldName of employeeFieldNames) {
    try {
      const field = form.getField(fieldName)
      field.enableReadOnly()
    } catch {
    }
  }

  return await pdfDoc.save()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { caregiverId, signature, roleKeyOverride } = await req.json()

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

    const roleKey = roleKeyOverride || caregiver.role
    const templatePath = `templates/${caregiver.company_id}/job_desc_${roleKey}.pdf`

    const { data: template, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (templateError || !template) {
      throw new Error(
        `No job description template found at "${templatePath}". Upload a fillable PDF template for this company/role before generating this document.`
      )
    }

    const templateBytes = new Uint8Array(await template.arrayBuffer())
    const finalPdfBytes = await fillJobDescriptionTemplate(templateBytes, caregiver, signature || caregiver.name)

    const filePath = `${caregiver.company_id}/${caregiverId}/job_description.pdf`
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
      document_type: 'job_description',
      file_name: 'job_description.pdf',
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