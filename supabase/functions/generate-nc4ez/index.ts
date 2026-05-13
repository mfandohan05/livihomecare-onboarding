import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caregiverId, caregiverName, nc4ezData } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: templateFile, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download('templates/nc4ez.pdf')

    if (templateError) throw new Error(`Could not load NC-4EZ template: ${templateError.message}`)

    const templateBytes = await templateFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)
    const page = pdfDoc.getPage(1) // page 2 (0-indexed)

    const { height } = page.getSize()

    // helper to draw text — converts from top-origin to bottom-origin
    const draw = (text: string, x: number, yFromTop: number, size = 10) => {
      if (!text) return
      page.drawText(text, {
        x,
        y: height - yFromTop,
        size,
        color: rgb(0, 0, 0),
      })
    }

    // helper to draw X in checkbox
    const drawX = (x: number, yFromTop: number) => {
      page.drawText('X', {
        x,
        y: height - yFromTop,
        size: 10,
        color: rgb(0, 0, 0),
      })
    }

    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric'
    })

    // Filing status checkboxes
    if (nc4ezData.filingStatus === 'single') drawX(156, 104)
    if (nc4ezData.filingStatus === 'head') drawX(309, 104)
    if (nc4ezData.filingStatus === 'joint') drawX(405, 104)

    // SSN — format as XXX-XX-XXXX
    const ssn = nc4ezData.ssn?.replace(/-/g, '') || ''
    const ssnFormatted = ssn.length === 9
      ? `${ssn.slice(0,3)}-${ssn.slice(3,5)}-${ssn.slice(5)}`
      : nc4ezData.ssn || ''
    draw(ssnFormatted, 59, 135, 10)

    // Name
    draw(nc4ezData.firstName || '', 59, 165, 10)
    draw(nc4ezData.middleInitial || '', 420, 165, 10)
    draw(nc4ezData.lastName || '', 447, 165, 10)

    // Address
    draw(nc4ezData.address || '', 59, 196, 10)
    draw(nc4ezData.county || '', 512, 196, 10)

    // City, State, ZIP
    draw(nc4ezData.city || '', 59, 227, 10)
    draw(nc4ezData.state || '', 392, 227, 10)
    draw(nc4ezData.zip || '', 432, 227, 10)

    // Line 1 — allowances
    draw(nc4ezData.allowances || '0', 560, 502, 10)

    // Line 2 — additional withholding
    if (nc4ezData.additionalWithholding) {
      draw(nc4ezData.additionalWithholding, 518, 522, 10)
    }

    // Exempt checkboxes
    if (nc4ezData.exempt3) drawX(568, 577)
    if (nc4ezData.exempt4) drawX(568, 612)

    // Signature and date
    draw(`${nc4ezData.firstName || ''} ${nc4ezData.lastName || ''}`.trim(), 130, 728, 10)
    draw(today, 530, 728, 10)

    const filledPdfBytes = await pdfDoc.save()
    const sanitizedName = caregiverName.replace(/[^a-zA-Z0-9]/g, '_')
    const outputPath = `${caregiverId}/${sanitizedName}_NC4EZ_Completed.pdf`

    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(outputPath, filledPdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) throw new Error(`Could not save NC-4EZ: ${uploadError.message}`)

    await supabase
      .from('caregiver_documents')
      .upsert({
        caregiver_id: caregiverId,
        document_type: 'nc4ez_completed',
        file_name: `${sanitizedName}_NC4EZ_Completed.pdf`,
        file_path: outputPath,
        mime_type: 'application/pdf',
      }, { onConflict: 'caregiver_id, document_type' })

    return new Response(
      JSON.stringify({ success: true, path: outputPath }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})