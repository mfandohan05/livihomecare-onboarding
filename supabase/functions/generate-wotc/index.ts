import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maps each question's answer options to their button field names
const BUTTON_MAP = {
  q1: { Yes: 'Button4',  No: 'Button5',  'Prefer Not to Answer': 'Button6' },
  q2: { Yes: 'Button9',  No: 'Button10', 'Prefer Not to Answer': 'Button11', 'Not Applicable': 'Button12' },
  q3: { Yes: 'Button13', No: 'Button14', 'Prefer Not to Answer': 'Button15' },
  q4: { Yes: 'Button18', No: 'Button17', 'Prefer Not to Answer': 'Button16' },
  q5: { Yes: 'Button19', No: 'Button20', 'Prefer Not to Answer': 'Button21' },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { caregiverId, wotcAnswers, signature } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch caregiver
    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('id, name, position_title')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    // Load template from storage
    const { data: templateData, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download('templates/wotc.pdf')

    if (templateError || !templateData) throw new Error('Could not load wotc.pdf template')

    const templateBytes = new Uint8Array(await templateData.arrayBuffer())
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()

    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })

    // Fill text fields
    form.getTextField('Text1').setText(caregiver.name)
    form.getTextField('Text2').setText(caregiver.position_title || '')
    form.getTextField('Text3').setText(today)
    form.getTextField('Text22').setText(signature || caregiver.name)
    form.getTextField('Text23').setText(today)

    // Check the correct button for each question answer
    if (wotcAnswers) {
      for (const [questionId, answer] of Object.entries(wotcAnswers)) {
        const questionMap = BUTTON_MAP[questionId as keyof typeof BUTTON_MAP]
        if (!questionMap || !answer) continue

        const buttonFieldName = questionMap[answer as keyof typeof questionMap]
        if (!buttonFieldName) continue

        try {
          const checkbox = form.getCheckBox(buttonFieldName)
          checkbox.check()
        } catch {
          // Field might be a different widget type depending on PDF version — skip silently
          console.warn(`Could not check field ${buttonFieldName}`)
        }
      }
    }

    // Flatten so fields are baked in
    form.flatten()

    const filledPdfBytes = await pdfDoc.save()

    // Upload to generated-pdfs bucket
    const filePath = `${caregiverId}/wotc_disclosure.pdf`
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
      document_type: 'wotc_disclosure',
      file_name: 'wotc_disclosure.pdf',
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