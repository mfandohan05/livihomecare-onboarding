import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function renderContentBlocksToHtml(blocks: any[]): string {
  return blocks.map((block) => {
    if (block.type === 'heading') {
      return `<p class="label">${block.text}</p>`
    }
    if (block.type === 'list') {
      return `<ul>${(block.items || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>`
    }
    if (block.type === 'numbered_list') {
      return `<ol>${(block.items || []).map((item: any) => `
        <li><strong>${item.text}</strong>
          ${item.sub_items ? `<ul>${item.sub_items.map((s: string) => `<li>${s}</li>`).join('')}</ul>` : ''}
        </li>
      `).join('')}</ol>`
    }
    return `<p>${block.text}</p>`
  }).join('')
}

function buildDocumentHtml(caregiver: any, title: string, contentBlocks: any[], includeSignatureBlock: boolean): string {
  const bodyHtml = renderContentBlocksToHtml(contentBlocks)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #111; }
        h2 { font-size: 15px; font-weight: bold; margin-bottom: 12px; }
        p { margin: 0 0 10px; }
        .label { font-weight: bold; margin-top: 10px; }
        ul, ol { padding-left: 20px; margin: 8px 0 12px; }
        li { margin-bottom: 4px; }
        .signature-block { margin-top: 40px; }
        .sig-line { display: inline-block; border-bottom: 1px solid #111; width: 260px; margin-right: 40px; }
        .sig-label { font-size: 11px; color: #555; margin-top: 4px; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      ${bodyHtml}
      ${includeSignatureBlock ? `
        <p style="margin-top: 16px;">
          I, <strong>${caregiver.name}</strong>, acknowledge that I have read and understood the above and agree to its terms.
        </p>
        <div class="signature-block">
          <div style="display: flex; gap: 40px; margin-top: 24px;">
            <div>
              <div class="sig-line">${caregiver.name}</div>
              <div class="sig-label">Employee Signature</div>
            </div>
            <div>
              <div class="sig-line">${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
              <div class="sig-label">Date</div>
            </div>
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { caregiverId, documentType, title, contentBlocks, includeSignatureBlock = true } = await req.json()

    if (!documentType || !title || !Array.isArray(contentBlocks)) {
      throw new Error('Missing or malformed request: documentType, title, and contentBlocks are required')
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

    const html = buildDocumentHtml(caregiver, title, contentBlocks, includeSignatureBlock)

    const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${Deno.env.get('PDFSHIFT_API_KEY')}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: html,
        format: 'Letter',
        margin: {
          top: '120px',
          bottom: '100px',
          left: '60px',
          right: '60px',
        },
      })
    })

    if (!pdfShiftResponse.ok) {
      const err = await pdfShiftResponse.text()
      throw new Error(`PDFShift error: ${err}`)
    }

    const contentPdfBytes = new Uint8Array(await pdfShiftResponse.arrayBuffer())
    let templateData
    const companyTemplatePath = `templates/${caregiver.company_id}/empty_doc_template.pdf`
    const { data: companyTemplate, error: companyTemplateError } = await supabase.storage
      .from('generated-pdfs')
      .download(companyTemplatePath)

    if (!companyTemplateError && companyTemplate) {
      templateData = companyTemplate
    } else {
      const { data: defaultTemplate, error: defaultTemplateError } = await supabase.storage
        .from('generated-pdfs')
        .download('templates/default/empty_doc_template.pdf')

      if (defaultTemplateError || !defaultTemplate) throw new Error('Could not load template')
      templateData = defaultTemplate
    }

    const templateBytes = new Uint8Array(await templateData.arrayBuffer())
    const templateDoc = await PDFDocument.load(templateBytes)
    const contentDoc = await PDFDocument.load(contentPdfBytes)

    const templatePage = templateDoc.getPage(0)
    const { width, height } = templatePage.getSize()

    const finalDoc = await PDFDocument.create()
    const contentPageCount = contentDoc.getPageCount()

    for (let i = 0; i < contentPageCount; i++) {
      const [embeddedContent] = await finalDoc.embedPages(contentDoc.getPages().slice(i, i + 1))
      const finalPage = finalDoc.addPage([width, height])
      finalPage.drawPage(embeddedContent, { x: 0, y: 0, width, height })
      const [embeddedTemplate] = await finalDoc.embedPages([templatePage])
      finalPage.drawPage(embeddedTemplate, { x: 0, y: 0, width, height })
    }

    const finalPdfBytes = await finalDoc.save()

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