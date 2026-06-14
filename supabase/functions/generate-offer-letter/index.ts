import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildOfferLetterHtml(caregiver: any): string {
  const role = caregiver.role;
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  if (role === 'nurse_prn') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #111; padding: 0; }
          h2 { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
          p { margin: 0 0 12px; }
          .label { font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          ul { padding-left: 20px; margin: 8px 0 12px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h2>Independent Contractor Employment Agreement</h2>
        <p><span class="label">Title:</span> Agency PRN Nurse</p>
        <p>This Agreement is between Livi Home Care ("The Agency") and <strong>${caregiver.name}</strong> ("The Contractor"). Whereas the Agency desires to engage the services of the Contractor, and the Contractor desires to provide such services under the terms and conditions set forth herein, the parties agree as follows:</p>
        <div class="grid">
          <div><p class="label">Start Date:</p><p>${caregiver.start_date || '________________'}</p></div>
          <div><p class="label">Pay Rate:</p><p>$${caregiver.pay_rate ? `${caregiver.pay_rate}.00` : '_______.00'} per hour</p></div>
          <div><p class="label">Pay Frequency:</p><p>Weekly</p></div>
        </div>
        <p class="label">Duties and Responsibilities:</p>
        <p>The Contractor agrees to perform services in a professional manner, using their skills, experience, and talents to fulfill the responsibilities required for their role. The Contractor will adhere to all Agency's policies, procedures, and any applicable local, state, and federal laws while engaged by the Agency.</p>
        <p class="label">Responsibilities include, but are not limited to:</p>
        <ul>
          <li>Conducting assessments for new clients</li>
          <li>Performing quarterly and annual assessments of current clients</li>
          <li>Managing care plans in accordance with physicians' instructions</li>
          <li>Attending all Leadership and Team Management Meetings</li>
          <li>Supervising and evaluating Caregivers as needed, and creating a positive and collaborative work environment</li>
          <li>Ensuring Compliance and Quality Assurance</li>
          <li>Additional duties may be assigned by the agency as needed</li>
        </ul>
        <p class="label">Mileage Reimbursement:</p>
        <p>For client assessments and other home visits, Livi Home Care will reimburse mileage at the federal rate of <strong>$0.725 per mile</strong>. Mileage reimbursement applies to travel required for client-related purposes only.</p>
        <p class="label">Duration and Termination:</p>
        <ul>
          <li><strong>Contractor's Termination:</strong> The Contractor may terminate this Agreement by providing at least 14 days' notice.</li>
          <li><strong>Agency's Termination:</strong> The Agency may terminate this Agreement by providing at least 14 days' notice.</li>
        </ul>
        <p class="label">Confidentiality:</p>
        <p>The Contractor agrees to maintain confidentiality regarding all Agency and client information, in compliance with HIPAA regulations and any other applicable privacy standards.</p>
        <p class="label">Independent Contractor Status:</p>
        <p>The Contractor is engaged as an independent contractor and does not have the authority to act on behalf of the Agency, including making any agreements with clients.</p>
        <p class="label">Attendance:</p>
        <p>The Contractor is expected to appear at designated work locations as scheduled. Failure to appear on more than two occasions within a 12-month period without prior notice may result in immediate termination.</p>
        <p class="label">Governing Law:</p>
        <p>This Agreement shall be governed under the laws of the State of North Carolina.</p>
        <p class="label">Entire Agreement:</p>
        <p>This Agreement constitutes the entire agreement between the Agency and the Contractor, superseding all prior agreements, discussions, or understandings, whether written or verbal.</p>
        <p>Digitally signed by: ${caregiver.name} on ${date}</p>
      </body>
      </html>
    `
  }

  if (role === 'nurse_director') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #111; padding: 0; }
          h2 { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
          p { margin: 0 0 12px; }
          .label { font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          ul, ol { padding-left: 20px; margin: 8px 0 12px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h2>Agency Director Agreement</h2>
        <p><span class="label">Title:</span> Agency Director</p>
        <p>This Agreement is between Livi Home Care ("The Agency") and <strong>${caregiver.name}</strong> ("The Contractor"). The parties agree as follows:</p>
        <div class="grid">
          <div><p class="label">Start Date:</p><p>${caregiver.start_date || '________________'}</p></div>
          <div><p class="label">Pay Rate:</p><p>$${caregiver.pay_rate ? `${caregiver.pay_rate}.00` : '_______.00'} per hour</p></div>
          <div><p class="label">Pay Frequency:</p><p>Weekly</p></div>
        </div>
        <p class="label">Duties and Responsibilities:</p>
        <ol>
          <li><strong>Management:</strong> Provide administrative direction, develop policies and procedures, supervise staff, attend all leadership meetings.</li>
          <li><strong>Compliance:</strong> Monitor and maintain high-quality care standards. Conduct regular audits and assessments.</li>
          <li><strong>Client Care:</strong> Oversee client intake, address concerns, perform quarterly and annual assessments, manage care plans.</li>
          <li><strong>Qualifications:</strong> Registered Nurse or equivalent management experience in home care or licensed health care program.</li>
        </ol>
        <p class="label">Mileage Reimbursement:</p>
        <p>Reimbursed at the federal rate of <strong>$0.725 per mile</strong> for client-related travel and office team management meetings.</p>
        <p class="label">Duration and Termination:</p>
        <ul>
          <li><strong>Contractor's Termination:</strong> 14 days' notice required.</li>
          <li><strong>Agency's Termination:</strong> 14 days' notice required.</li>
        </ul>
        <p class="label">Confidentiality:</p>
        <p>The Contractor agrees to maintain confidentiality of all Agency and client information in compliance with HIPAA and applicable privacy standards.</p>
        <p class="label">Independent Contractor Status:</p>
        <p>The Contractor is engaged as an independent contractor and does not have authority to act on behalf of the Agency.</p>
        <p class="label">Governing Law:</p>
        <p>This Agreement shall be governed under the laws of the State of North Carolina.</p>
        <p class="label">Entire Agreement:</p>
        <p>This Agreement constitutes the entire agreement between the parties, superseding all prior agreements.</p>
        <p>Digitally signed by: ${caregiver.name} on ${date}</p>
      </body>
      </html>
    `
  }

  // Default: caregiver offer letter
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #111; padding: 0; }
        h2 { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
        p { margin: 0 0 12px; }
        .label { font-weight: bold; }
        ul { padding-left: 20px; margin: 8px 0 12px; }
        li { margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <h2>Offer of Employment</h2>
      <p>Dear ${caregiver.name},</p>
      <p>We are pleased to extend an offer of employment with <strong>Livi Home Care</strong> for the position of <strong>${caregiver.position_title} (${caregiver.employment_type})</strong>. This offer is contingent upon the successful completion and verification of the following:</p>
      <ul>
        <li>Criminal background check</li>
        <li>Verification of qualifications and professional healthcare credentials</li>
        <li>Reference checks</li>
        <li>Proof of reliable transportation, including a valid driver's license and current insurance</li>
      </ul>
      <p class="label">Position Title:</p>
      <p>${caregiver.position_title}</p>
      <p class="label">Compensation:</p>
      <p>Hands-on care assignments will start at <strong>$${caregiver.pay_rate} per hour</strong>. The base rate for non-hands-on companion or sitter services is <strong>$${caregiver.companion_pay_rate} per hour</strong>.</p>
      <p class="label">Mileage Reimbursement:</p>
      <p>Mileage will be reimbursed at <strong>$0.725 per mile</strong> when using your personal vehicle to transport clients or complete approved errands.</p>
      <p class="label">Scheduling & Hours:</p>
      <p>This position does <strong>not guarantee a minimum number of hours, a fixed schedule, or a specific number of client assignments</strong>.</p>
      <p class="label">Employment Relationship (At-Will):</p>
      <p>Your employment with Livi Home Care is <strong>at-will</strong> in accordance with North Carolina law.</p>
      <p class="label">Confidentiality:</p>
      <p>You agree to maintain strict confidentiality of all client and company information in compliance with HIPAA and all applicable privacy laws.</p>
      <p class="label">Non-Solicitation:</p>
      <p>During your employment and for <strong>24 months after separation</strong>, you agree not to solicit or accept private work from any client assigned through the company.</p>
      <p class="label">Call-Out / Cancellation Policy:</p>
      <p>You are required to provide <strong>at least 24 hours' notice</strong> if you are unable to work a scheduled shift, except in emergencies.</p>
      <p class="label">Governing Law:</p>
      <p>This agreement shall be governed by the laws of the State of North Carolina.</p>
      <p>By accepting this offer, you acknowledge that your hours, schedule, and client assignments are variable and not guaranteed.</p>
      <br/>
      <p>Sincerely,</p>
      <p><strong>Sylvie Fandohan</strong><br/>Livi Home Care</p>
      <p>Digitally signed by: ${caregiver.name} on ${date}</p>
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

    // Fetch caregiver data
    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', caregiverId)
      .single()

    if (caregiverError || !caregiver) throw new Error('Caregiver not found')

    // Build HTML for this role
    const html = buildOfferLetterHtml(caregiver)

    // Send to PDFShift
    const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${Deno.env.get('PDFSHIFT_API_KEY')}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: html,
        margin: {
          top: '120px',
          bottom: '100px',
          left: '60px',
          right: '60px'
        },
        format: 'Letter',
      })
    })

    if (!pdfShiftResponse.ok) {
      const err = await pdfShiftResponse.text()
      throw new Error(`PDFShift error: ${err}`)
    }

    const contentPdfBytes = new Uint8Array(await pdfShiftResponse.arrayBuffer())

    // Load template from storage
    const { data: templateData, error: templateError } = await supabase.storage
      .from('generated-pdfs')
      .download('templates/empty_doc_template.pdf')

    if (templateError || !templateData) throw new Error('Could not load template')

    const templateBytes = new Uint8Array(await templateData.arrayBuffer())

    // Load both PDFs with pdf-lib
    const templateDoc = await PDFDocument.load(templateBytes)
    const contentDoc = await PDFDocument.load(contentPdfBytes)

    // Get the template page (header/footer/logo)
    const templatePage = templateDoc.getPage(0)
    const { width, height } = templatePage.getSize()

    // Create final document
    const finalDoc = await PDFDocument.create()

    // For each page of content, embed it and stamp the template on top
    const contentPageCount = contentDoc.getPageCount()

    for (let i = 0; i < contentPageCount; i++) {
      // Embed content page
      const [embeddedContent] = await finalDoc.embedPages(contentDoc.getPages().slice(i, i + 1))

      // Add a new page to final doc matching template size
      const finalPage = finalDoc.addPage([width, height])

      // Draw content first
      finalPage.drawPage(embeddedContent, { x: 0, y: 0, width, height })

      // Embed and draw template (header/footer/logo) on top
      const [embeddedTemplate] = await finalDoc.embedPages([templatePage])
      finalPage.drawPage(embeddedTemplate, { x: 0, y: 0, width, height })
    }

    const finalPdfBytes = await finalDoc.save()

    // Upload to generated-pdfs bucket
    const filePath = `${caregiverId}/offer_letter.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(filePath, finalPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

    // Upsert caregiver_documents row
    await supabase.from('caregiver_documents').upsert({
      caregiver_id: caregiverId,
      document_type: 'offer_letter_generated',
      file_name: 'offer_letter.pdf',
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