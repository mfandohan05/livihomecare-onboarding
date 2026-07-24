import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fillDocumentTemplate(
  templateBytes: Uint8Array,
  fieldValues: Record<string, string | boolean>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const filledFieldNames: string[] = []

  for (const [fieldName, value] of Object.entries(fieldValues)) {
    try {
      if (typeof value === 'boolean') {
        const checkbox = form.getCheckBox(fieldName)
        value ? checkbox.check() : checkbox.uncheck()
      } else {
        form.getTextField(fieldName).setText(value ?? '')
      }
      filledFieldNames.push(fieldName)
    } catch {
      console.warn(`Field "${fieldName}" not found on template — skipped`)
    }
  }

  form.updateFieldAppearances(font)

  for (const fieldName of filledFieldNames) {
    if (fieldName.toLowerCase().includes('signature')) {
      try {
        form.getTextField(fieldName).updateAppearances(italicFont)
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
    const { caregiverId, documentType, fieldValues } = await req.json()

    if (!documentType || !fieldValues || typeof fieldValues !== 'object') {
      throw new Error('Missing or malformed request: documentType and fieldValues are required')
    }

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

    const templatePath = `templates/${caregiver.company_id}/${documentType}.pdf`
    const { data: template, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download(templatePath)

    if (templateError || !template) {
      throw new Error(`No template found at "${templatePath}". Upload a fillable PDF template for this company/document before generating it.`)
    }

    const templateBytes = new Uint8Array(await template.arrayBuffer())
    const finalPdfBytes = await fillDocumentTemplate(templateBytes, fieldValues)

    const filePath = `${caregiver.company_id}/${caregiverId}/${documentType}.pdf`
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
      document_type: documentType,
      file_name: `${documentType}.pdf`,
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