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

    // Fetch caregiver
    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('id, name')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    // Load template from storage
    const { data: templateData, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download('templates/direct_deposit_form.pdf')

    if (templateError || !templateData) throw new Error('Could not load template')

    const templateBytes = new Uint8Array(await templateData.arrayBuffer())
    const pdfDoc = await PDFDocument.load(templateBytes)

    // Fill form fields
    const form = pdfDoc.getForm()
    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })

    // Format name as Last, First for legal name field
    const nameParts = caregiver.name.trim().split(' ')
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0]
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : ''
    const legalName = lastName && firstName ? `${lastName}, ${firstName}` : caregiver.name

    form.getTextField('Text1').setText(legalName)
    form.getTextField('Text2').setText(caregiver.name) // signature as typed name
    form.getTextField('Text3').setText(today)

    // Flatten so fields are baked in and not editable
    form.flatten()

    const filledPdfBytes = await pdfDoc.save()

    // Upload to generated-pdfs bucket
    const filePath = `${caregiverId}/direct_deposit_authorization.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(filePath, filledPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

    // Upsert caregiver_documents row
    await supabase.from('caregiver_documents').upsert({
      caregiver_id: caregiverId,
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