import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildJobDescriptionHtml(caregiver: any): string {
  const isNurse = caregiver.role === 'nurse_prn' || caregiver.role === 'nurse_director'
  const isOther = caregiver.role === 'other'

  let title = 'Job Description for the In-Home Aide'
  let intro = 'Livi Home Care In-Home Aide is responsible for providing basic nursing care to our clients in their home. You will work under the supervision of our Registered Nurse.'
  let duties: string[] = [
    'Assisting with personal care such as bathing, mouth care, skin care and hair care',
    'Assisting with ambulation',
    'Medication reminder',
    'Perform incidental household services essential to the client\'s care at home',
    'Observe, record and report any changes in the client\'s condition to the Livi Home Care Registered Nurse/supervisor',
    'Assisting with mobility and transfers, including helping clients get in and out of bed or chairs',
    'Assisting with meal preparation and feeding clients if necessary',
    'Providing companionship and emotional support to clients and their families',
    'Following infection control measures, including proper hand hygiene and PPE usage',
    'Maintaining client records accurately and timely',
    'Maintaining client confidentiality',
    'Participating in ongoing education and training',
    'Collaborating with other healthcare professionals to ensure coordinated and quality care',
    'Adhering to safety guidelines to prevent accidents and injuries',
    'Help with transportation',
    'Other services as assigned',
  ]

  if (isNurse) {
    title = 'Job Description for the Registered Nurse'
    intro = 'A Livi Home Care Registered Nurse is responsible for providing skilled nursing care to our clients in their home.'
    duties = [
      'Conducting assessments for new clients',
      'Performing quarterly and annual assessment of current clients',
      'Managing care plans in accordance with physicians\' instructions',
      'Attend all Leadership and Team Management meetings',
      'Supervise and evaluate caregivers as needed',
      'Create a positive and collaborative work environment',
      'Ensure compliance and quality assurance',
      'Additional duties may be assigned by the agency as needed',
    ]
  } else if (isOther && caregiver.job_duties) {
    title = caregiver.job_description || 'Job Description'
    intro = ''
    duties = caregiver.job_duties
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => line.trim())
  } else if (isOther) {
    title = 'Job Description for Office Staff'
    intro = 'Livi Home Care Office Staff is responsible for supporting the administrative operations of the agency.'
    duties = [
      'Answering and directing phone calls and emails',
      'Scheduling and coordinating caregiver assignments',
      'Maintaining client and employee records',
      'Processing payroll and billing documentation',
      'Assisting with onboarding new caregivers',
      'Coordinating with healthcare providers and clients',
      'Supporting management with administrative tasks',
      'Ensuring compliance with agency policies and procedures',
      'Other duties as assigned',
    ]
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #111; }
        h2 { font-size: 15px; font-weight: bold; margin-bottom: 12px; }
        p { margin: 0 0 10px; }
        .label { font-weight: bold; }
        ul { padding-left: 20px; margin: 8px 0 12px; }
        li { margin-bottom: 4px; }
        .signature-block { margin-top: 40px; }
        .sig-line { display: inline-block; border-bottom: 1px solid #111; width: 260px; margin-right: 40px; }
        .sig-label { font-size: 11px; color: #555; margin-top: 4px; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      ${intro ? `<p>${intro}</p>` : ''}
      <p class="label">Your duties may include the following:</p>
      <ul>
        ${duties.map(d => `<li>${d}</li>`).join('')}
      </ul>
      <p style="margin-top: 16px;">
        I, <strong>${caregiver.name}</strong>, acknowledge that I have read and understood the above job description
        and agree to perform the duties outlined to the best of my ability.
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
    </body>
    </html>
  `
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
      .select('*')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    const html = buildJobDescriptionHtml(caregiver)

    // Send to PDFShift
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

    // Load template
    const { data: templateData, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download('templates/empty_doc_template.pdf')

    if (templateError || !templateData) throw new Error('Could not load template')

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

    const filePath = `${caregiverId}/job_description.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(filePath, finalPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

    await supabase.from('caregiver_documents').upsert({
      caregiver_id: caregiverId,
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