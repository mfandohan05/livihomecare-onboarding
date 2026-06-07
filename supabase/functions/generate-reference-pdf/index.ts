import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

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
      .select('id, name')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    const { data: templateData, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download('templates/reference_check.pdf')

    if (templateError || !templateData) throw new Error('Could not load reference_check.pdf template')

    const templateBytes = new Uint8Array(await templateData.arrayBuffer())
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()

    const ref1 = references?.[0] || {}
    const ref2 = references?.[1] || {}

    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })

    // Reference 1
    form.getTextField('Text1').setText(ref1.name || '')
    form.getTextField('Text2').setText(ref1.company || '')
    form.getTextField('Text3').setText(ref1.relationship || '')
    form.getTextField('Text4').setText([ref1.phone, ref1.email].filter(Boolean).join('\n'))

    // Reference 2
    form.getTextField('Text5').setText(ref2.name || '')
    form.getTextField('Text6').setText(ref2.company || '')
    form.getTextField('Text7').setText(ref2.relationship || '')
    form.getTextField('Text8').setText([ref2.phone, ref2.email].filter(Boolean).join('\n'))

    // Applicant section
    form.getTextField('Text9').setText(caregiver.name)
    form.getTextField('Text10').setText(signature || caregiver.name)
    form.getTextField('Text11').setText(today)

    form.flatten()

    const filledPdfBytes = await pdfDoc.save()

    const filePath = `${caregiverId}/reference_check.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(filePath, filledPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

    await supabase.from('caregiver_documents').upsert({
      caregiver_id: caregiverId,
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