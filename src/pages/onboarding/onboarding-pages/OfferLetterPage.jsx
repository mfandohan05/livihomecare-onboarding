import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileSignature, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const today = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function CaregiverOfferLetter({ caregiver }) {
  return (
    <div className="space-y-5 text-sm leading-relaxed">
      <p className="text-lg font-semibold">Offer of Employment</p>
      <p>Dear {caregiver.name},</p>
      <p>
        We are pleased to extend an offer of employment with <strong>Livi Home Care</strong> for
        the position of <strong>{caregiver.position_title} ({caregiver.employment_type})</strong>. This offer is
        contingent upon the successful completion and verification of the following:
      </p>
      <ul className="space-y-1 pl-4">
        {[
          'Criminal background check',
          'Verification of qualifications and professional healthcare credentials',
          'Reference checks',
          'Proof of reliable transportation, including a valid driver\'s license and current insurance',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <p>Below is a summary of the terms and conditions of your employment:</p>
      <div className="space-y-4">
        <div>
          <p className="font-medium">Position Title:</p>
          <p className="text-muted-foreground">{caregiver.position_title}</p>
        </div>
        <div>
          <p className="font-medium">Compensation:</p>
          <p className="text-muted-foreground">
            Compensation rates may vary depending on the specific client case, the level of care
            required, and your experience, qualifications, and certifications. Hands-on care
            assignments will start at <strong>${caregiver.pay_rate} per hour</strong> and may increase based on
            the client's needs, level of care required, scheduling demands, and at the sole
            discretion of the company. The base rate for non-hands-on companion or sitter
            services is <strong>${caregiver.companion_pay_rate} per hour</strong>.
          </p>
        </div>
        <div>
          <p className="font-medium">Mileage Reimbursement:</p>
          <p className="text-muted-foreground">
            Mileage will be reimbursed at the rate of <strong>$0.725 per mile</strong> when using
            your personal vehicle to transport clients or complete approved errands on their behalf.
          </p>
        </div>
        <div>
          <p className="font-medium">Scheduling & Hours:</p>
          <p className="text-muted-foreground">
            This position does <strong>not guarantee a minimum number of hours, a fixed schedule,
              or a specific number of client assignments</strong>. Work hours, schedules, and client
            placements are based on client needs, your availability, and operational requirements,
            all of which may fluctuate.
          </p>
        </div>
        <div>
          <p className="font-medium">Attendance:</p>
          <p className="text-muted-foreground">
            You are expected to report to assigned work locations as scheduled. Failure to report
            to work on more than two occasions within a 12-month period without prior notice may
            result in termination of employment.
          </p>
        </div>
        <div>
          <p className="font-medium">Employment Relationship (At-Will):</p>
          <p className="text-muted-foreground">
            Your employment with Livi Home Care is <strong>at-will</strong>, in accordance with
            North Carolina law. This means that either you or the Company may terminate the
            employment relationship at any time, with or without cause or prior notice, subject
            to applicable law.
          </p>
        </div>
        <div>
          <p className="font-medium">Confidentiality:</p>
          <p className="text-muted-foreground">
            You agree to maintain strict confidentiality of all client and company information in
            compliance with HIPAA and all applicable privacy laws. Unauthorized disclosure may
            result in disciplinary action, up to and including termination, and possible legal action.
          </p>
        </div>
        <div>
          <p className="font-medium">Non-Solicitation of Clients & Staff:</p>
          <p className="text-muted-foreground">
            During your employment and for a period of <strong>24 months after separation</strong>,
            you agree not to directly or indirectly solicit, accept private work from, or provide
            services outside of Livi Home Care to any client you were assigned through the company,
            or recruit Livi Home Care employees for outside employment.
          </p>
        </div>
        <div>
          <p className="font-medium">Call-Out / Cancellation Policy:</p>
          <p className="text-muted-foreground">
            You are required to provide <strong>at least 24 hours' notice</strong> if you are
            unable to work a scheduled shift, except in emergencies. Excessive cancellations may
            result in reduced assignments or termination.
          </p>
        </div>
        <div>
          <p className="font-medium">Return of Company Property:</p>
          <p className="text-muted-foreground">
            Upon termination of employment, you agree to return all company property, including
            but not limited to identification badges, documents, electronic records, and any other
            materials belonging to Livi Home Care.
          </p>
        </div>
        <div>
          <p className="font-medium">Governing Law:</p>
          <p className="text-muted-foreground">
            This agreement shall be governed by and interpreted in accordance with the laws of the
            State of North Carolina.
          </p>
        </div>
      </div>
      <p>
        By accepting this offer, you acknowledge that you understand and agree that your hours,
        schedule, and client assignments are variable and not guaranteed.
      </p>
      <p>If you have any questions, please feel free to reach out.</p>
      <div>
        <p>Sincerely,</p>
        <p className="font-medium mt-1">Sylvie Fandohan</p>
        <p className="text-muted-foreground">Livi Home Care</p>
      </div>
    </div>
  )
}

function NurseContractorAgreement({ caregiver }) {
  return (
    <div className="space-y-5 text-sm leading-relaxed">
      <p className="text-lg font-semibold">Independent Contractor Employment Agreement</p>
      <div>
        <p className="font-medium">Title: Agency PRN Nurse</p>
        <p className="mt-2">
          This Agreement is between Livi Home Care ("The Agency") and <strong>{caregiver.name}</strong> ("The Contractor").
          Whereas the Agency desires to engage the services of the Contractor, and the Contractor desires to
          provide such services under the terms and conditions set forth herein, the parties agree as follows:
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-medium">Start Date:</p>
          <p className="text-muted-foreground">{caregiver.start_date || '________________'}</p>
        </div>
        <div>
          <p className="font-medium">Pay Rate:</p>
          <p className="text-muted-foreground">
            ${caregiver.pay_rate ? `${caregiver.pay_rate}.00` : '_______.00'} per hour
          </p>
        </div>
        <div>
          <p className="font-medium">Pay Frequency:</p>
          <p className="text-muted-foreground">Weekly</p>
        </div>
      </div>
      <div>
        <p className="font-medium">Duties and Responsibilities:</p>
        <p className="text-muted-foreground mt-1">
          The Contractor agrees to perform services in a professional manner, using their skills, experience,
          and talents to fulfill the responsibilities required for their role. The Contractor will adhere to
          all Agency's policies, procedures, and any applicable local, state, and federal laws while engaged by the Agency.
        </p>
        <p className="font-medium mt-2">Responsibilities include, but are not limited to:</p>
        <ul className="space-y-1 pl-4 mt-1">
          {[
            'Conducting assessments for new clients',
            'Performing quarterly and annual assessments of current clients',
            'Managing care plans in accordance with physicians\' instructions',
            'Attending all Leadership and Team Management Meetings',
            'Supervising and evaluating Caregivers as needed, and creating a positive and collaborative work environment',
            'Ensuring Compliance and Quality Assurance',
            'Additional duties may be assigned by the agency as needed',
          ].map((duty, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
              {duty}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium">Mileage Reimbursement:</p>
        <p className="text-muted-foreground mt-1">
          For client assessments and other home visits, Livi Home Care will reimburse mileage at the federal
          rate of <strong>$0.725 per mile</strong>. Mileage reimbursement applies to travel required for
          client-related purposes only. Mileage will also be paid for coming into the office for Team Management
          meetings, but mileage will not be paid for dropping off paperwork at the contractor's convenience.
        </p>
      </div>
      <div>
        <p className="font-medium">Assessment and Visit Time:</p>
        <p className="text-muted-foreground mt-1">
          The agency will compensate for the time spent on each client assessment or visit, with the expectation
          that each will be completed within a reasonable time not to exceed two hours, unless otherwise pre-approved.
        </p>
      </div>
      <div>
        <p className="font-medium">Duration and Termination:</p>
        <ul className="space-y-1 pl-4 mt-1">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
            <span><strong>Contractor's Termination:</strong> The Contractor may terminate this Agreement by providing at least 14 days' notice.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
            <span><strong>Agency's Termination:</strong> The Agency may terminate this Agreement by providing at least 14 days' notice.</span>
          </li>
        </ul>
      </div>
      <div>
        <p className="font-medium">Confidentiality:</p>
        <p className="text-muted-foreground mt-1">
          The Contractor agrees to maintain confidentiality regarding all Agency and client information, in
          compliance with HIPAA regulations and any other applicable privacy standards. Unauthorized disclosure
          of any such confidential information, directly or indirectly, may result in legal action and the
          Agency's pursuit of all available remedies.
        </p>
      </div>
      <div>
        <p className="font-medium">Independent Contractor Status:</p>
        <p className="text-muted-foreground mt-1">
          The Contractor is engaged as an independent contractor and does not have the authority to act on
          behalf of the Agency, including making any agreements with clients.
        </p>
      </div>
      <div>
        <p className="font-medium">Attendance:</p>
        <p className="text-muted-foreground mt-1">
          The Contractor is expected to appear at designated work locations as scheduled. Failure to appear
          on more than two occasions within a 12-month period without prior notice may result in immediate
          termination of this Agreement.
        </p>
      </div>
      <div>
        <p className="font-medium">Disability:</p>
        <p className="text-muted-foreground mt-1">
          If the Contractor becomes unable to perform their duties due to physical or mental disability,
          the Agency may terminate this Agreement by providing 7 days' written notice.
        </p>
      </div>
      <div>
        <p className="font-medium">Compliance:</p>
        <p className="text-muted-foreground mt-1">
          The Contractor agrees to follow all rules, regulations, and obligations specified in this Agreement
          and the Agency's policies. Non-compliance may lead to immediate termination.
        </p>
      </div>
      <div>
        <p className="font-medium">Return of Company Property:</p>
        <p className="text-muted-foreground mt-1">
          Upon termination, the Contractor agrees to return all Agency property, including electronic records,
          data reports, and any other materials owned by the Agency.
        </p>
      </div>
      <div>
        <p className="font-medium">Governing Law:</p>
        <p className="text-muted-foreground mt-1">
          This Agreement shall be governed under the laws of the State of North Carolina.
        </p>
      </div>
      <div>
        <p className="font-medium">Entire Agreement:</p>
        <p className="text-muted-foreground mt-1">
          This Agreement constitutes the entire agreement between the Agency and the Contractor, superseding
          all prior agreements, discussions, or understandings, whether written or verbal.
        </p>
      </div>
    </div>
  )
}

function NurseDirectorAgreement({ caregiver }) {
  return (
    <div className="space-y-5 text-sm leading-relaxed">
      <p className="text-lg font-semibold">Agency Director Agreement</p>
      <div>
        <p className="font-medium">Title: Agency Director</p>
        <p className="mt-2">
          This Agreement is between Livi Home Care ("The Agency") and <strong>{caregiver.name}</strong> ("The Contractor").
          Whereas the Company desires to engage the services of the Contractor, and the Contractor desires to
          provide such services under the terms and conditions set forth herein, the parties agree as follows:
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-medium">Start Date:</p>
          <p className="text-muted-foreground">{caregiver.start_date || '________________'}</p>
          <p className='text-muted-foreground'>Effective from {caregiver.start_date || '___________________'} until either party terminates this Agreement in accordance
            with the terms outlined herein.
          </p>
        </div>
        <div>
          <p className="font-medium">Pay Rate:</p>
          <p className="text-muted-foreground">
            ${caregiver.pay_rate ? `${caregiver.pay_rate}.00` : '_______.00'} per hour
          </p>
        </div>
        <div>
          <p className="font-medium">Pay Frequency:</p>
          <p className="text-muted-foreground">Weekly</p>
        </div>
      </div>
      <div>
        <p className="font-medium">Duties and Responsibilities:</p>
        <div className="text-muted-foreground mt-1">
          The Contractor agrees to perform services in a professional manner using their skills, experience, and 
          talents to fulfill the responsibilities required for their role. The Contractor will adhere to all agency policies 
          and procedures, and any applicable local, state, and federal laws while engaged with the company.
          <br></br>
          <span className='text-foreground'>Responsibilities include, but are not limited to:</span>
          <ol className='list-decimal list-outside pl-5 text-foreground mt-1'>
            <li><strong>Management:</strong>
            <br></br>
            - Provide administrative directions to Livi Home Care<br></br>
            - Develop or implement effective policies and procedures to ensure efficient operations.<br></br>
            - Supervise, mentor, and evaluate staff members.<br></br>
            - Attend all leadership and team management meetings</li>
            <li><strong>Ensure compliance with all relevant regulations, laws, and accreditation standards:</strong><br></br>
            - Monitor and maintain high-quality care standards.<br></br>
            - Conduct regular audits and assessments to identify areas for improvement and ensure client satisfaction.</li>
            <li><strong>Client Care:</strong><br></br>
            - Oversee client intake processes, ensuring comprehensive assessments and personalized care plans.<br></br>
            - Address client concerns promptly and effectively, maintaining excellent relationships with our clients.<br></br>
            - Work closely with healthcare professionals and families to provide the best possible care for our clients.<br></br>
            - Performing quarterly and annual assessment of current clients.<br></br>
            - Conducting assessment for new clients.<br></br>
            - Managing care plans in accordance with physicians' instructions.</li>
            <li><strong>Qualifications:</strong><br></br>
            - A Registered Nurse OR: <br></br>
            - An individual who holds a bachelor's degree in health, business, or public administration science AND has at 
            least one year of supervisory or management experience in home care or other licensed health care program; OR<br></br>
            - An individual who has at least two years of supervisory or management experience in home care or any other provider licensed pursuant to G.S.
            131 E or G.S. 122C<br></br>
            - Very good knowledge of healthcare regulations, policies, and best practices.<br></br>
            - Exceptional interpersonal communication and team-building skills.</li>
          </ol>
        </div>
        <div className='mt-2 text-muted-foreground'>
          <span className='text-foreground'>Mileage Reimbursement: </span><span className=''>For client assessments and other home visits, Livi Home Care will reimburse mileage at 
          the federal rate of $0.725 per mile. Mileage reimbursement applies to travel required for client-related purposes only. Mileage will also be paid for coming
          onto the office for team management meetings, but mileage will not be paid for dropping off paperwork at the contractor's convenience.</span>
        </div>
        <div className='mt-2 text-muted-foreground'>
          <span className='text-foreground'>Assessment and Visit Time: </span>The agency will compensate for the time spent on each client assessment or visit, with the expectation that 
          each will be completed within a reasonable time not to exceed two hours, unless otherwise pre-approved.
        </div>
        <div className='mt-2 text-muted-foreground'>
          <span className='text-foreground'>Duration and Termination: </span>
          <ul>
            <li><strong>Contractor's Termination: </strong>The Contractor may terminate this Agreement by providing at least 14 days' notice.</li>
            <li><strong>Agency's Termination: </strong>The Company may terminate this Agreement by providing at least 14 days' notice.</li>
          </ul>
        </div>
      </div>
      <div>
        <p className="font-medium">Confidentiality:</p>
        <p className="text-muted-foreground mt-1">
          The Contractor agrees to maintain confidentiality regarding all Company and client information, 
          in compliance with HIPAA regulations and any other applicable privacy standards. Unauthorized disclosure 
          of any such confidential information, directly or indirectly, may result in legal action and the Company's 
          pursuit of all available remedies.
        </p>
      </div>
      <div>
        <p className='font-medium'>Independent Contractor Status:</p>
        <p className='text-muted-foreground mt-1'>The Contractor is engaged as an independent contractor and 
          does not have the authority to act on behalf of the Company, including making any agreements with clients.</p>
      </div>
      <div>
        <p className='font-medium'>Attendance:</p>
        <p className='text-muted-foreground mt-1'>The Contractor is expected to appear at designated work locations as 
          scheduled. Failure to appear on more than two occasions within a 12-month period without prior notice may 
          result in immediate termination of this Agreement.</p>
      </div>
      <div>
        <p className='font-medium'>Disability:</p>
        <p className='text-muted-foreground mt-1'>If the Contractor becomes unable to perform their duties due to physical or 
          mental disability, the Company may terminate this Agreement by providing 7 days' written notice.</p>
      </div>
      <div>
        <p className='font-medium'>Compliance:</p>
        <p className='text-muted-foreground mt-1'>The Contractor agrees to follow all rules, regulations, and obligations 
          specified in this Agreement and the Company's policies. Non-compliance may lead to immediate termination.</p>
      </div>
      <div>
        <p className='font-medium'>Return of Company Property:</p>
        <p className='text-muted-foreground mt-1'>Upon termination, the Contractor agrees to return all Company's property, including 
          electronic records, data reports, and any other materials owned by the Company.</p>
      </div>
      <div>
        <p className="font-medium">Governing Law:</p>
        <p className="text-muted-foreground mt-1">
          This Agreement shall be governed under the laws of the State of North Carolina.
        </p>
      </div>
      <div>
        <p className='font-medium'>Entire Agreement:</p>
        <p className='text-muted-foreground mt-1'>This Agreement constitutes the entire agreement between 
          the Company and the Contractor, superseding all prior agreements, discussions, or understandings, 
          whether written or verbal.</p>
      </div>
    </div>
  )
}

function OtherOfferLetter({ caregiver, signed, signature, onSignatureChange, onSign }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loadingPdf, setLoadingPdf] = useState(true)
  const [notUploaded, setNotUploaded] = useState(false)

  useEffect(() => {
    const fetchPdf = async () => {
      const { data: doc } = await supabase
        .from('caregiver_documents')
        .select('file_path')
        .eq('caregiver_id', caregiver.id)
        .eq('document_type', 'offer_letter_other')
        .maybeSingle()

      if (!doc) { setNotUploaded(true); setLoadingPdf(false); return }

      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600)

      if (data?.signedUrl) setPdfUrl(data.signedUrl)
      setLoadingPdf(false)
    }
    fetchPdf()
  }, [caregiver.id])

  if (loadingPdf) return <p className="text-sm text-muted-foreground py-4">Loading offer letter...</p>

  if (notUploaded) return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p className="text-sm text-amber-800 font-medium">Offer letter not yet available</p>
      <p className="text-xs text-amber-700 mt-1">
        Livi Home Care is preparing your offer letter. Please check back shortly or contact the office.
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-xl overflow-hidden" style={{ height: '500px' }}>
        <iframe src={pdfUrl} className="w-full h-full" title="Offer Letter" />
      </div>
      <div className="border-t pt-6">
        <p className="font-medium mb-4">Acknowledgment and Acceptance</p>
        <p className="text-muted-foreground text-sm mb-6">
          I have read and agree to the terms outlined in this offer letter.
        </p>
        {signed ? (
          <div className="flex items-center gap-2 text-[#577C09] font-medium">
            <CheckCircle className="w-4 h-4" />
            Offer letter signed — {today}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otherSignature">
                Full name (signature) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="otherSignature"
                placeholder={caregiver.name}
                value={signature}
                onChange={(e) => onSignatureChange(e.target.value)}
                className="font-serif italic"
              />
              <p className="text-xs text-muted-foreground">
                By typing your name, you are providing a legally binding electronic signature.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Date: {today}</p>
            <Button
              onClick={onSign}
              disabled={!signature.trim()}
              className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50"
            >
              Sign & Accept Offer
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OfferLetterPage({ stepLabel, caregiver, onNext, initialData, onChange }) {
  const [signature, setSignature] = useState(initialData?.signature || '')
  const [address, setAddress] = useState(initialData?.address || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [state, setState] = useState(initialData?.state || '')
  const [zip, setZip] = useState(initialData?.zip || '')
  const [signed, setSigned] = useState(initialData?.signed || false)

  const isNurse = caregiver.role === 'nurse_prn' || caregiver.role === 'nurse_director';
  const isPrnNurse = caregiver.role === 'nurse_prn';
  const isDirector = caregiver.role === 'nurse_director'
  const isOther = caregiver.role === 'other'

  const canSign = signature.trim() && (
    isNurse ? true : address.trim() && city.trim() && state.trim() && zip.trim()
  )

  const handleSign = () => {
    setSigned(true)
    onChange({ signature, address, city, state, zip, signed: true })
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-8">

      <div className="flex items-center gap-2 mb-2">
        <FileSignature className="w-5 h-5 text-[#577C09]" />
        <span className="text-[#577C09] font-medium">{stepLabel}</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">
        {isPrnNurse ? 'Contractor Agreement' : isDirector ? 'Director Agreement' : 'Offer Letter'}
      </h1>
      <p className="text-muted-foreground mb-8">
        Please read carefully and sign at the bottom to accept your position with Livi Home Care.
      </p>

      <div className="border border-border rounded-xl p-8 mb-8">
        {isOther ? (
          <OtherOfferLetter
            caregiver={caregiver}
            signed={signed}
            signature={signature}
            onSignatureChange={(val) => {
              setSignature(val)
              onChange({ signature: val, address, city, state, zip, signed })
            }}
            onSign={() => {
              setSigned(true)
              onChange({ signature, address, city, state, zip, signed: true })
            }}
          />
        ) : (
          <>
            {isPrnNurse && <NurseContractorAgreement caregiver={caregiver} />}
{isDirector && <NurseDirectorAgreement caregiver={caregiver} />}
{!isNurse && !isOther && <CaregiverOfferLetter caregiver={caregiver} />}
            {/* Signature Section */}
            <div className="border-t pt-6 mt-6">
              <p className="font-medium mb-4">Acknowledgment and Acceptance</p>
              <p className="text-muted-foreground mb-6">
                {isNurse
                  ? `I, ${caregiver.name}, agree to the terms of this Independent Contractor Agreement with Livi Home Care.`
                  : `I accept the position of ${caregiver.position_title} with Livi Home Care under the terms outlined in this offer letter.`
                }
              </p>
              {signed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#577C09] font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {isNurse ? 'Agreement signed' : 'Offer letter signed'} — {today}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Signed by: <span className="font-serif italic">{signature}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="offerSignature">
                      Full name (signature) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="offerSignature"
                      placeholder={caregiver.name}
                      value={signature}
                      onChange={(e) => {
                        setSignature(e.target.value)
                        onChange({ signature: e.target.value, address, city, state, zip, signed })
                      }}
                      className="font-serif italic"
                    />
                    <p className="text-xs text-muted-foreground">
                      By typing your name, you are providing a legally binding electronic signature.
                    </p>
                  </div>
                  {!isNurse && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="offerAddress">Street address <span className="text-red-500">*</span></Label>
                        <Input id="offerAddress" placeholder="123 Main St" value={address}
                          onChange={(e) => { setAddress(e.target.value); onChange({ signature, address: e.target.value, city, state, zip, signed }) }} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-1">
                          <Label htmlFor="offerCity">City <span className="text-red-500">*</span></Label>
                          <Input id="offerCity" placeholder="Charlotte" value={city}
                            onChange={(e) => { setCity(e.target.value); onChange({ signature, address, city: e.target.value, state, zip, signed }) }} />
                        </div>
                        <div className="space-y-2 col-span-1">
                          <Label htmlFor="offerState">State <span className="text-red-500">*</span></Label>
                          <Input id="offerState" placeholder="NC" maxLength={2} value={state}
                            onChange={(e) => { setState(e.target.value); onChange({ signature, address, city, state: e.target.value, zip, signed }) }} />
                        </div>
                        <div className="space-y-2 col-span-1">
                          <Label htmlFor="offerZip">Zip <span className="text-red-500">*</span></Label>
                          <Input id="offerZip" placeholder="28201" maxLength={5} value={zip}
                            onChange={(e) => { setZip(e.target.value); onChange({ signature, address, city, state, zip: e.target.value, signed }) }} />
                        </div>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">Date: {today}</p>
                  <Button onClick={handleSign} disabled={!canSign}
                    className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isNurse ? 'Sign & Accept Agreement' : 'Sign & Accept Offer'}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={!signed}
        className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save & Continue
      </Button>

    </div>
  )
}