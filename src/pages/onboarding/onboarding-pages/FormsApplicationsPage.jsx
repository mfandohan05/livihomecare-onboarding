import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
})

const jobDescriptions = {
    caregiver: {
        title: 'Job Description for the In-Home Aide',
        intro: 'Livi Home Care In-Home Aide is responsible for providing basic nursing care to our clients in their home. You will work under the supervision of our Registered Nurse.',
        duties: [
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
    },
    nurse: {
        title: 'Job Description for the Registered Nurse',
        intro: 'A Livi Home Care Registered Nurse is responsible for providing skilled nursing care to our clients in their home.',
        duties: [
            'Conducting assessments for new clients',
            'Performing quarterly and annual assessment of current clients.',
            'Managing care plans in accordance with physicians’ instructions',
            'Attend all	Leadership and Team Management meetings',
            'Supervise and evaluate caregivers as needed',
            'Create a positive and collaborative work environment',
            'Ensure compliance and quality assurance',
            'Additional duties may be assigned by the agency as needed.'
        ]
    },
    other: {
        title: 'Job Description for Office Staff',
        intro: 'Livi Home Care Office Staff is responsible for supporting the administrative operations of the agency.',
        duties: [
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
}

const SignatureField = ({ formId, label = 'Type your full name to sign', signatures, onSign, caregiver }) => (
    <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3">
            By typing your name below, you are providing a legally binding electronic signature.
        </p>
        <div className="space-y-2">
            <Label htmlFor={`sig_${formId}`}>{label}</Label>
            <Input
                id={`sig_${formId}`}
                placeholder={caregiver.name}
                value={signatures[formId] || ''}
                onChange={(e) => onSign(formId, e.target.value)}
                className="font-serif italic"
            />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Date: {today}</p>
    </div>

)

const FormButton = ({ formId, disabled, completed, markComplete }) => (
    <Button
        onClick={() => markComplete(formId)}
        disabled={disabled}
        className="mt-4 bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {completed[formId] ? 'Signed ✓' : 'Sign & Continue'}
    </Button>
)

export default function FormsApplicationsPage({ stepLabel, caregiver, onNext, initialData, onChange, onHepBChange, setSaving }) {
    const [expanded, setExpanded] = useState({ form_0: true })
    const [completed, setCompleted] = useState(initialData?.completed || {})
    const [signatures, setSignatures] = useState(initialData?.signatures || {})
    const [hepBStatus, setHepBStatus] = useState(initialData?.hepBStatus || '')
    const [directDeposit, setDirectDeposit] = useState({
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: '',
    })

    const toggle = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }
    const updateSignature = (formId, value) => {
        const updated = { ...signatures, [formId]: value }
        setSignatures(updated);
        onChange({ signatures: updated, completed })
    }
    const updateHepBStatus = (status) => {
        setHepBStatus(status)
        onHepBChange(status)
    }

    const markComplete = (formId) => {
        const updated = { ...completed, [formId]: true }
        setCompleted(updated)
        onChange({ signatures, completed: updated })
        const nextIndex = parseInt(formId.split('_')[1]) + 1
        setExpanded(prev => ({ ...prev, [`form_${nextIndex}`]: true }))
    }

    const allCompleted = [0, 1, 2, 3, 4, 5, 6, 7].every(i => completed[`form_${i}`])


    const FormContent = ({ children, color = '#F9F9F9' }) => (
        <div
            className="rounded-lg p-5 mb-4 text-sm leading-relaxed space-y-3 border border-border"
            style={{ background: color }}
        >
            {children}
        </div>
    )
    const handleDirectDepositComplete = async (formId) => {
        setSaving(true);
        const { error } = await supabase.functions.invoke('save-banking-info', {
            body: {
                caregiverId: caregiver.id,
                bankName: directDeposit.bankName,
                routingNumber: directDeposit.routingNumber,
                accountNumber: directDeposit.accountNumber,
                accountType: directDeposit.accountType,
            }
        })

        if (error) {
            console.error('Error saving banking info:', error)
            return
        }

        markComplete(formId)
        setSaving(false);
    }
    const forms = [
        {
            id: 'form_0',
            title: 'New Hire Notification',
            render: () => (
                <>
                    <FormContent>
                        <p className="font-medium">New Hire Notification Form</p>
                        <p>All new hires must complete the online onboarding process before starting any shifts. This onboarding covers Livi Home Care's policies, procedures, and expectations and must be fully completed prior to your first scheduled shift.</p>
                        <p className="font-medium mt-2">Orientation Payment</p>
                        <p>The orientation payment will be made to you after you have successfully completed 10 shifts with Livi Home Care.</p>
                        <p className="mt-2">By signing below, you acknowledge that you understand and agree to the requirements outlined above.</p>
                    </FormContent>
                    <SignatureField formId="form_0" signatures={signatures} onSign={(formId, value) => updateSignature(formId, value)} caregiver={caregiver} />
                    <FormButton
                        formId="form_0"
                        disabled={!signatures['form_0']?.trim() || completed['form_0']}
                        completed={completed}
                        markComplete={markComplete}
                    />
                </>
            )
        },
        {
            id: 'form_1',
            title: `Job Description - ${caregiver.job_description}`,
            render: () => {
                const jobDesc = jobDescriptions[caregiver.role] || jobDescriptions.caregiver

                return (
                    <>
                        <FormContent>
                            <p className="font-medium">{jobDesc.title}</p>
                            <p>{jobDesc.intro}</p>
                            <p className="font-medium mt-2">Your duties may include the following:</p>
                            <ul className="space-y-1 pl-4">
                                {jobDesc.duties.map((duty, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                        {duty}
                                    </li>
                                ))}
                            </ul>
                        </FormContent>
                        <SignatureField
                            formId="form_1"
                            signatures={signatures}
                            onSign={(formId, value) => updateSignature(formId, value)}
                            caregiver={caregiver}
                            label="Type your full name to acknowledge this job description"
                        />
                        <FormButton
                            formId="form_1"
                            disabled={!signatures['form_1']?.trim() || completed['form_1']}
                            completed={completed}
                            markComplete={markComplete}
                        />
                    </>
                )
            }
        },
        {
            id: 'form_2',
            title: 'Non-Compete Agreement',
            render: () => (
                <>
                    <FormContent>
                        <p className="font-medium">Employee Non-Compete Agreement</p>
                        <p>This Non-Compete Agreement is entered into on {today}, by and between Livi Home Care, located at 179 Gasoline Alley Dr. Suite 203, Mooresville NC 28117 and <strong>{caregiver.name}</strong>.</p>
                        <p className="font-medium mt-2">Non-Compete Obligation</p>
                        <p>In consideration of employment with Livi Home Care, Employee agrees that for a period of <strong>36 months</strong> following the termination of employment, for any reason, they shall not:</p>
                        <ul className="space-y-1 pl-4">
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                Provide home care, personal care, respite or companion services to any current or prospective clients of Livi Home Care with whom employees had direct or indirect interaction or access to confidential information during their employment.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                Solicit or attempt to solicit any clients, prospective clients, or employees of Livi Home Care to work with or for a competing business.
                            </li>
                        </ul>
                        <p className="font-medium mt-2">Confidentiality</p>
                        <p>Employee agrees not to disclose any confidential information or trade secrets learned during the course of employment, including but not limited to:</p>
                        <ul className="space-y-1 pl-4">
                            {[
                                'Client information, including personal health information',
                                'Pricing strategies, marketing plans, and service delivery models',
                                'Any other proprietary information belonging to Livi Home Care',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="font-medium mt-2">Enforcement</p>
                        <p>If the employee violates the terms of this agreement, Livi Home Care may seek appropriate legal remedies, including injunctive relief and damages. This Agreement constitutes the entire agreement between the parties with respect to the non-compete obligations.</p>
                    </FormContent>
                    <SignatureField formId="form_2" signatures={signatures} onSign={(formId, value) => updateSignature(formId, value)} caregiver={caregiver} label="Type your full name to sign the Non-Compete Agreement" />
                    <FormButton
                        formId="form_2"
                        disabled={!signatures['form_2']?.trim() || completed['form_2']}
                        completed={completed}
                        markComplete={markComplete}
                    />
                </>
            )
        },
        {
            id: 'form_3',
            title: 'Consent for Criminal Background Check',
            render: () => (
                <>
                    <FormContent>
                        <p className="font-medium">Criminal Background Check Consent Form</p>
                        <p>I, <strong>{caregiver.name}</strong>, hereby authorize Livi Home Care and its designated agents or representatives to conduct a comprehensive criminal background check as part of the employment screening process.</p>
                        <p>I understand that this background check may include, but is not limited to, verification of criminal history, driving records, and other background information relevant to my potential employment with Livi Home Care.</p>
                        <p>I understand that the information obtained from the background check will be used solely for employment purposes and will be kept strictly confidential in compliance with all applicable laws.</p>
                        <ul className="space-y-1 pl-4 mt-2">
                            {[
                                'I further release Livi Home Care, its agents, and all parties involved from any claims, damages, or liabilities arising from or related to this criminal background check.',
                                'I understand that I have the right to request a copy of the report upon which the hiring decision is based if an adverse action is taken.',
                                'I understand that this consent will remain in effect for the duration of my employment, allowing Livi Home Care to conduct periodic background checks as necessary.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-2">I have read this authorization and release, and I fully understand its contents. I certify that the information I have provided is accurate and complete to the best of my knowledge.</p>
                    </FormContent>
                    <SignatureField formId="form_3" signatures={signatures} onSign={(formId, value) => updateSignature(formId, value)} caregiver={caregiver} label="Type your full name to consent" />
                    <FormButton
                        formId="form_3"
                        disabled={!signatures['form_3']?.trim() || completed['form_3']}
                        completed={completed}
                        markComplete={markComplete}
                    />
                </>
            )
        },
        {
            id: 'form_4',
            title: 'Drug Test Policy & Acknowledgment',
            render: () => (
                <>
                    <FormContent>
                        <p className="font-medium">Drug Test Policy & Acknowledgment</p>
                        <ul className="space-y-2 pl-4">
                            {[
                                'All employees of Livi Home Care, including but not limited to caregivers, nurses, administrative staff, and management, are subject to drug testing at random intervals and thereafter.',
                                'Drug testing will be conducted in accordance with applicable laws and regulations.',
                                'Random drug testing may be conducted throughout an employee\'s tenure with Livi Home Care to ensure compliance with the drug-free workplace policy.',
                                'Any employee who refuses to undergo drug testing or tests positive for prohibited substances may face disciplinary action, up to and including termination of employment.',
                                'Drug testing results will be treated as confidential information and will only be disclosed to authorized personnel on a need-to-know basis.',
                                'Employees who are prescribed medications that may result in a positive drug test result must notify their supervisor and provide appropriate documentation from a licensed healthcare provider.',
                                'Livi Home Care reserves the right to modify this policy as deemed necessary and to ensure compliance with applicable laws and regulations.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3">By signing below, I acknowledge that I have received and read a copy of the Drug Test Policy for Livi Home Care Employees. I understand my responsibilities under this policy and agree to comply with all requirements outlined herein.</p>
                    </FormContent>
                    <SignatureField formId="form_4" signatures={signatures} onSign={(formId, value) => updateSignature(formId, value)} caregiver={caregiver} label="Type your full name to acknowledge the Drug Test Policy" />
                    <FormButton
                        formId="form_4"
                        disabled={!signatures['form_4']?.trim() || completed['form_4']}
                        completed={completed}
                        markComplete={markComplete}
                    />
                </>
            )
        },
        {
            id: 'form_5',
            title: 'Hepatitis B Vaccine Status',
            render: () => (
                <>
                    <FormContent>
                        <p className="font-medium">Hepatitis B Vaccine Status</p>
                        <p>I understand that due to my occupational exposure to blood or other potentially infectious materials (OPIM), I may be at risk of acquiring Hepatitis B virus (HBV) infection.</p>
                        <p>Livi Home Care has given me the opportunity to be vaccinated with the Hepatitis B vaccine at no charge to myself.</p>
                        <p className="mt-2">Please select the option that applies to you:</p>
                    </FormContent>

                    <div className="space-y-3 mb-6">
                        {[
                            { value: 'decline', label: 'I decline the Hepatitis B vaccine at this time. I understand that by declining I continue to be at risk of acquiring Hepatitis B.' },
                            { value: 'received', label: 'I have already received the full Hepatitis B vaccination series.' },
                            { value: 'immune', label: 'An antibody test has confirmed that I am immune to Hepatitis B.' },
                            { value: 'medical', label: 'I have medical reasons not to receive the vaccine. I will provide documentation from a licensed healthcare provider.' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => updateHepBStatus(option.value)}
                                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-start gap-3 ${hepBStatus === option.value
                                    ? 'border-[#577C09] bg-[#E8F0D0] text-[#3D5906]'
                                    : 'border-border hover:border-[#577C09] hover:bg-[#E8F0D0]/30'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${hepBStatus === option.value
                                    ? 'border-[#577C09]'
                                    : 'border-muted-foreground'
                                    }`}>
                                    {hepBStatus === option.value && (
                                        <div className="w-2 h-2 rounded-full bg-[#577C09]" />
                                    )}
                                </div>
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <SignatureField formId="form_5" signatures={signatures} onSign={(formId, value) => updateSignature(formId, value)} caregiver={caregiver} label="Type your full name to confirm your vaccine status" />
                    <FormButton
                        formId="form_5"
                        disabled={!hepBStatus || !signatures['form_5']?.trim() || completed['form_5']}
                        completed={completed}
                        markComplete={markComplete}
                    />
                </>
            )
        },
        {
            id: 'form_6',
            title: 'Direct Deposit Authorization',
            render: () => (
                <>
                    <FormContent>
                        <p className="font-medium">Employee Direct Deposit Authorization</p>
                        <p>I hereby voluntarily authorize MDC Global Care Solutions dba Livi Home Care, either directly or through its payroll service provider, to deposit any amounts owed to me by initiating credit entries to my account at the financial institution indicated on this form.</p>
                        <p className="mt-2 font-medium text-amber-700">Important: A <strong>$79 correction fee</strong> will be assessed if incorrect banking information results in a failed or misdirected deposit. You will also need to wait until the next scheduled payday to receive your pay.</p>
                    </FormContent>

                    <div className="space-y-4 mb-6">
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                placeholder="e.g. Bank of America"
                                value={directDeposit.bankName}
                                onChange={(e) => setDirectDeposit(prev => ({ ...prev, bankName: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="routingNumber">Routing Number</Label>
                                <Input
                                    id="routingNumber"
                                    placeholder="9-digit ABA number"
                                    maxLength={9}
                                    value={directDeposit.routingNumber}
                                    onChange={(e) => setDirectDeposit(prev => ({ ...prev, routingNumber: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input
                                    id="accountNumber"
                                    placeholder="Account number"
                                    value={directDeposit.accountNumber}
                                    onChange={(e) => setDirectDeposit(prev => ({ ...prev, accountNumber: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Account Type</Label>
                            <div className="flex gap-4">
                                {['Checking', 'Savings'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setDirectDeposit(prev => ({ ...prev, accountType: type }))}
                                        className={`px-6 py-2 rounded-md border text-sm font-medium transition-colors ${directDeposit.accountType === type
                                            ? 'bg-[#577C09] text-white border-[#577C09]'
                                            : 'bg-white text-foreground border-border hover:bg-muted'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <SignatureField formId="form_6" signatures={signatures} onSign={(formId, value) => updateSignature(formId, value)} caregiver={caregiver} label="Type your full name to authorize direct deposit" />
                    <FormButton
                        formId="form_6"
                        disabled={
                            !directDeposit.bankName.trim() ||
                            !directDeposit.routingNumber.trim() ||
                            !directDeposit.accountNumber.trim() ||
                            !directDeposit.accountType ||
                            !signatures['form_6']?.trim() ||
                            completed['form_6']
                        }
                        completed={completed}
                        markComplete={handleDirectDepositComplete}
                    />
                </>
            )
        },
        {
            id: 'form_7',
            title: 'Pre-Employment Orientation Checklist',
            render: () => (
                <>
                    <FormContent>
                        <p className="font-medium">Pre-Employment Orientation</p>
                        <p className="font-medium mt-2">Completed application includes:</p>
                        <ul className="space-y-1 pl-4">
                            {[
                                'Resume',
                                'Signed Job Description & Offer Letter',
                                'NA Listing Verification / Health Care Personnel Registry Check',
                                'Proof of TB Skin Test or Chest X-Ray',
                                'Proof of Hepatitis B Immunization or Declination',
                                'Proof of Blood Borne Pathogen Training',
                                'Reference Check(s)',
                                'Signed Consent for Criminal Background Check',
                                'Drug Test Policy & Acknowledgment',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="font-medium mt-3">The Orientation covers the following:</p>
                        <ul className="space-y-1 pl-4">
                            {[
                                'Review of Livi Home Care Policies and Procedures',
                                'Livi Home Care Vision, Mission and Values',
                                'Infection and Exposure Control',
                                'Universal Precautions',
                                'Cleanup Procedures',
                                'Hepatitis B and Tuberculosis Awareness and Procedures',
                                'Safe Transfer of Clients (Back Safety)',
                                'Home and Fire Safety',
                                'Emergency Preparedness',
                                'Abuse, Neglect, Injury of Unknown Source',
                                'Client\'s Rights and Advance Directives',
                                'HIPAA and Client Confidentiality',
                                'Documentation',
                                'Home Expectations',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#577C09] shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3">My signature below verifies that I have received all the required documents and have participated in the above orientation session.</p>
                    </FormContent>
                    <SignatureField formId="form_7" signatures={signatures} onSign={(formId, value) => updateSignature(formId, value)} caregiver={caregiver} label="Type your full name to confirm completion of pre-employment orientation" />
                    <FormButton
                        formId="form_7"
                        disabled={!signatures['form_7']?.trim() || completed['form_7']}
                        completed={completed}
                        markComplete={markComplete}
                    />
                </>
            )
        },
    ]

    return (
        <div className="max-w-2xl mx-auto py-8 md:py-16 px-4 md:px-8">

            <div className="flex items-center gap-2 mb-2">
                <ScrollText className="w-5 h-5 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">{stepLabel}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Forms & Agreements</h1>
            <p className="text-muted-foreground mb-2">
                Please read and sign each form below. All forms must be completed before continuing.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
                {Object.keys(completed).length} of {forms.length} forms completed
            </p>

            {/* Forms */}
            <div className="space-y-4 mb-8">
                {forms.map((form, index) => {
                    const isOpen = expanded[form.id]
                    const isDone = completed[form.id]

                    return (
                        <div
                            key={form.id}
                            className={`border rounded-xl overflow-hidden transition-colors ${isDone ? 'border-[#577C09]' : 'border-border'
                                }`}
                        >
                            <button
                                onClick={() => toggle(form.id)}
                                className="w-full flex items-center justify-between px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-medium ${isDone
                                        ? 'border-[#577C09] bg-[#577C09] text-white'
                                        : 'border-muted-foreground text-muted-foreground'
                                        }`}>
                                        {isDone ? '✓' : index + 1}
                                    </div>
                                    <span className={`font-medium text-sm ${isDone ? 'text-[#577C09]' : ''}`}>
                                        {form.title}
                                    </span>
                                    {isDone && (
                                        <span className="text-xs text-[#577C09] bg-[#E8F0D0] px-2 py-0.5 rounded-full">
                                            Signed
                                        </span>
                                    )}
                                </div>
                                {isOpen
                                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                            </button>

                            {/* Form Content */}
                            {isOpen && (
                                <div className="px-4 md:px-6 pb-6 border-t border-border pt-6">
                                    {form.render()}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {!allCompleted && (
                <p className="text-sm text-muted-foreground mb-4">
                    Please complete and sign all forms before continuing.
                </p>
            )}

            <Button
                onClick={onNext}
                disabled={!allCompleted}
                className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Save & Continue
            </Button>

        </div>
    )
}