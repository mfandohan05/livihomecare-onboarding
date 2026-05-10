import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ChevronLeft, ChevronRight, CheckCircle, Upload, Download, AlertCircle } from 'lucide-react'

const today = new Date().toLocaleDateString('en-US', {
  month: '2-digit', day: '2-digit', year: 'numeric'
}).replace(/\//g, '/')

const Field = ({ label, id, children, required }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
  </div>
)

const RadioOption = ({ value, label, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center gap-3 ${
      checked
        ? 'border-[#577C09] bg-[#E8F0D0] text-[#3D5906]'
        : 'border-border hover:border-[#577C09] hover:bg-[#E8F0D0]/30'
    }`}
  >
    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
      checked ? 'border-[#577C09]' : 'border-muted-foreground'
    }`}>
      {checked && <div className="w-2 h-2 rounded-full bg-[#577C09]" />}
    </div>
    {label}
  </button>
)

const Checkbox = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-[#577C09] border-[#577C09]' : 'border-muted-foreground'
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
    {label && <label className="text-sm">{label}</label>}
  </div>
)

function I9Form({ data, onChange, onSave, saved }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })

  const citizenshipOptions = [
    { value: '1', label: 'A citizen of the United States' },
    { value: '2', label: 'A noncitizen national of the United States' },
    { value: '3', label: 'A lawful permanent resident (enter USCIS or A-Number below)' },
    { value: '4', label: 'An alien authorized to work (enter expiration date and number below)' },
  ]

  const canSave = data.lastName && data.firstName && data.address &&
    data.city && data.state && data.zip && data.dob &&
    data.ssn && data.email && data.phone && data.citizenshipStatus

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">You are completing Section 1 only.</p>
          <p>Livi Home Care will complete Section 2 with you directly after your first day of employment.</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Last name" id="i9_lastName" required>
            <Input id="i9_lastName" value={data.lastName || ''} onChange={set('lastName')} placeholder="Santos" />
          </Field>
          <Field label="First name" id="i9_firstName" required>
            <Input id="i9_firstName" value={data.firstName || ''} onChange={set('firstName')} placeholder="Maria" />
          </Field>
          <Field label="Middle initial" id="i9_middleInitial">
            <Input id="i9_middleInitial" value={data.middleInitial || ''} onChange={set('middleInitial')} placeholder="A" maxLength={1} />
          </Field>
          <Field label="Other last names used" id="i9_otherLastNames">
            <Input id="i9_otherLastNames" value={data.otherLastNames || ''} onChange={set('otherLastNames')} placeholder="N/A" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Address</h3>
        <div className="space-y-4">
          <Field label="Street address" id="i9_address" required>
            <Input id="i9_address" value={data.address || ''} onChange={set('address')} placeholder="123 Main St" />
          </Field>
          <Field label="Apartment number" id="i9_apt">
            <Input id="i9_apt" value={data.apt || ''} onChange={set('apt')} placeholder="Apt 4B (if applicable)" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City" id="i9_city" required>
              <Input id="i9_city" value={data.city || ''} onChange={set('city')} placeholder="Charlotte" />
            </Field>
            <Field label="State" id="i9_state" required>
              <Input id="i9_state" value={data.state || ''} onChange={set('state')} placeholder="NC" maxLength={2} />
            </Field>
            <Field label="ZIP code" id="i9_zip" required>
              <Input id="i9_zip" value={data.zip || ''} onChange={set('zip')} placeholder="28201" maxLength={5} />
            </Field>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Additional Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of birth (MM/DD/YYYY)" id="i9_dob" required>
            <Input id="i9_dob" value={data.dob || ''} onChange={set('dob')} placeholder="01/15/1990" />
          </Field>
          <Field label="U.S. Social Security Number" id="i9_ssn" required>
            <Input id="i9_ssn" value={data.ssn || ''} onChange={set('ssn')} placeholder="XXX-XX-XXXX" />
          </Field>
          <Field label="Email address" id="i9_email" required>
            <Input id="i9_email" type="email" value={data.email || ''} onChange={set('email')} placeholder="maria@email.com" />
          </Field>
          <Field label="Telephone number" id="i9_phone" required>
            <Input id="i9_phone" type="tel" value={data.phone || ''} onChange={set('phone')} placeholder="(704) 555-0123" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Citizenship / Immigration Status <span className="text-red-500">*</span></h3>
        <div className="space-y-2">
          {citizenshipOptions.map((opt) => (
            <RadioOption key={opt.value} value={opt.value} label={opt.label} checked={data.citizenshipStatus === opt.value} onChange={(v) => onChange({ ...data, citizenshipStatus: v })} />
          ))}
        </div>
        {data.citizenshipStatus === '3' && (
          <div className="mt-4">
            <Field label="USCIS A-Number" id="i9_uscis">
              <Input id="i9_uscis" value={data.uscisNumber || ''} onChange={set('uscisNumber')} placeholder="A-000000000" />
            </Field>
          </div>
        )}
        {data.citizenshipStatus === '4' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Expiration date (MM/DD/YYYY)" id="i9_expDate">
              <Input id="i9_expDate" value={data.expDate || ''} onChange={set('expDate')} placeholder="01/01/2027" />
            </Field>
            <Field label="USCIS A-Number or I-94 or Passport Number" id="i9_alienNumber">
              <Input id="i9_alienNumber" value={data.alienNumber || ''} onChange={set('alienNumber')} />
            </Field>
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <p className="text-xs text-muted-foreground mb-4">
          I attest, under penalty of perjury, that I am aware that federal law provides for imprisonment and/or fines for false statements or use of false documents. The information I have provided is true and correct.
        </p>
        <p className="text-xs text-muted-foreground mb-4">Date: {today}</p>
        {saved ? (
          <div className="flex items-center gap-2 text-[#577C09] text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Section 1 saved successfully
          </div>
        ) : (
          <Button onClick={onSave} disabled={!canSave} className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
            Save Section 1
          </Button>
        )}
      </div>
    </div>
  )
}

function W4Form({ data, onChange, onSave, saved }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })

  const filingOptions = [
    { value: 'single', label: 'Single or Married filing separately' },
    { value: 'joint', label: 'Married filing jointly or Qualifying surviving spouse' },
    { value: 'head', label: 'Head of household' },
  ]

  const canSave = data.firstName && data.lastName && data.ssn &&
    data.address && data.cityStateZip && data.filingStatus

  return (
    <div className="space-y-6">
      <div className="bg-[#E8F0D0] rounded-lg p-4">
        <p className="text-sm text-[#3D5906]">
          <span className="font-medium">Steps 2–4 are optional</span> — most employees only need to complete Step 1 and sign.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Step 1 — Personal Information <span className="text-red-500">*</span></h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name and middle initial" id="w4_firstName" required>
              <Input id="w4_firstName" value={data.firstName || ''} onChange={set('firstName')} placeholder="Maria A." />
            </Field>
            <Field label="Last name" id="w4_lastName" required>
              <Input id="w4_lastName" value={data.lastName || ''} onChange={set('lastName')} placeholder="Santos" />
            </Field>
          </div>
          <Field label="Address" id="w4_address" required>
            <Input id="w4_address" value={data.address || ''} onChange={set('address')} placeholder="123 Main St" />
          </Field>
          <Field label="City, state, and ZIP code" id="w4_cityStateZip" required>
            <Input id="w4_cityStateZip" value={data.cityStateZip || ''} onChange={set('cityStateZip')} placeholder="Charlotte, NC 28201" />
          </Field>
          <Field label="Social Security Number" id="w4_ssn" required>
            <Input id="w4_ssn" value={data.ssn || ''} onChange={set('ssn')} placeholder="XXX-XX-XXXX" />
          </Field>
          <div>
            <Label>Filing status <span className="text-red-500">*</span></Label>
            <div className="space-y-2 mt-2">
              {filingOptions.map((opt) => (
                <RadioOption key={opt.value} value={opt.value} label={opt.label} checked={data.filingStatus === opt.value} onChange={(v) => onChange({ ...data, filingStatus: v })} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1 pb-2 border-b">Step 2 — Multiple Jobs or Spouse Works <span className="text-xs font-normal text-muted-foreground">(optional)</span></h3>
        <p className="text-xs text-muted-foreground mb-4">Complete only if you hold more than one job or are married filing jointly and your spouse also works.</p>
        <Checkbox checked={data.multipleJobs || false} onChange={(v) => onChange({ ...data, multipleJobs: v })} label="Check here if there are only two jobs total. Do the same on the W-4 for the other job." />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1 pb-2 border-b">Step 3 — Claim Dependents <span className="text-xs font-normal text-muted-foreground">(optional)</span></h3>
        <p className="text-xs text-muted-foreground mb-4">Only if your total income will be $200,000 or less ($400,000 or less if married filing jointly).</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Qualifying children under 17 × $2,200" id="w4_childCredit">
            <Input id="w4_childCredit" value={data.childCredit || ''} onChange={set('childCredit')} placeholder="$0" />
          </Field>
          <Field label="Other dependents × $500" id="w4_otherDependents">
            <Input id="w4_otherDependents" value={data.otherDependents || ''} onChange={set('otherDependents')} placeholder="$0" />
          </Field>
          <Field label="Total credits (Step 3)" id="w4_totalCredits">
            <Input id="w4_totalCredits" value={data.totalCredits || ''} onChange={set('totalCredits')} placeholder="$0" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1 pb-2 border-b">Step 4 — Other Adjustments <span className="text-xs font-normal text-muted-foreground">(optional)</span></h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="4(a) Other income (not from jobs)" id="w4_otherIncome">
            <Input id="w4_otherIncome" value={data.otherIncome || ''} onChange={set('otherIncome')} placeholder="$0" />
          </Field>
          <Field label="4(b) Deductions" id="w4_deductions">
            <Input id="w4_deductions" value={data.deductions || ''} onChange={set('deductions')} placeholder="$0" />
          </Field>
          <Field label="4(c) Extra withholding per pay period" id="w4_extraWithholding">
            <Input id="w4_extraWithholding" value={data.extraWithholding || ''} onChange={set('extraWithholding')} placeholder="$0" />
          </Field>
        </div>
        <div className="mt-4">
          <Checkbox checked={data.exempt || false} onChange={(v) => onChange({ ...data, exempt: v })} label="Claim exemption from withholding for 2026 (only if you had no federal income tax liability in 2025 and expect none in 2026)" />
        </div>
      </div>

      <div className="border-t pt-6">
        <p className="text-xs text-muted-foreground mb-4">Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.</p>
        <p className="text-xs text-muted-foreground mb-4">Date: {today}</p>
        {saved ? (
          <div className="flex items-center gap-2 text-[#577C09] text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            W-4 saved successfully
          </div>
        ) : (
          <Button onClick={onSave} disabled={!canSave} className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
            Save W-4
          </Button>
        )}
      </div>
    </div>
  )
}

function W9Form({ data, onChange, onSave, saved }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })

  const taxClassifications = [
    { value: 'individual', label: 'Individual / Sole proprietor' },
    { value: 'c_corp', label: 'C Corporation' },
    { value: 's_corp', label: 'S Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'trust', label: 'Trust / Estate' },
    { value: 'llc', label: 'LLC' },
    { value: 'other', label: 'Other' },
  ]

  const canSave = data.name && data.address && data.cityStateZip &&
    (data.ssn || data.ein) && data.taxClassification && !(data.ssn && data.ein)

  return (
    <div className="space-y-6">
      <div className="bg-[#E8F0D0] rounded-lg p-4">
        <p className="text-sm text-[#3D5906]">
          <span className="font-medium">W-9 is for independent contractors.</span> As a contractor with Livi Home Care, you are responsible for paying your own taxes. This form provides your taxpayer identification number for 1099 reporting.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Name & Business Information</h3>
        <div className="space-y-4">
          <Field label="Full legal name (as shown on your tax return)" id="w9_name" required>
            <Input id="w9_name" value={data.name || ''} onChange={set('name')} placeholder="Dr. James Carter" />
          </Field>
          <Field label="Business name / DBA (if different from above)" id="w9_businessName">
            <Input id="w9_businessName" value={data.businessName || ''} onChange={set('businessName')} placeholder="Leave blank if not applicable" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Federal Tax Classification <span className="text-red-500">*</span></h3>
        <div className="space-y-2">
          {taxClassifications.map((opt) => (
            <RadioOption key={opt.value} value={opt.value} label={opt.label} checked={data.taxClassification === opt.value} onChange={(v) => onChange({ ...data, taxClassification: v })} />
          ))}
        </div>
        {data.taxClassification === 'llc' && (
          <div className="mt-4">
            <Field label="LLC tax classification (C = C corp, S = S corp, P = Partnership)" id="w9_llcClass">
              <Input id="w9_llcClass" value={data.llcClassification || ''} onChange={set('llcClassification')} placeholder="C, S, or P" maxLength={1} />
            </Field>
          </div>
        )}
        {data.taxClassification === 'other' && (
          <div className="mt-4">
            <Field label="Other description" id="w9_otherDesc">
              <Input id="w9_otherDesc" value={data.otherDescription || ''} onChange={set('otherDescription')} placeholder="Describe entity type" />
            </Field>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Address</h3>
        <div className="space-y-4">
          <Field label="Street address, apt or suite number" id="w9_address" required>
            <Input id="w9_address" value={data.address || ''} onChange={set('address')} placeholder="123 Main St" />
          </Field>
          <Field label="City, state, and ZIP code" id="w9_cityStateZip" required>
            <Input id="w9_cityStateZip" value={data.cityStateZip || ''} onChange={set('cityStateZip')} placeholder="Charlotte, NC 28201" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Taxpayer Identification Number <span className="text-red-500">*</span></h3>
        <p className="text-xs text-muted-foreground mb-4">For individuals enter your SSN. For entities enter your EIN. Enter only one.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Social Security Number (SSN)" id="w9_ssn">
            <Input id="w9_ssn" value={data.ssn || ''} onChange={set('ssn')} placeholder="XXX-XX-XXXX" disabled={!!data.ein} />
          </Field>
          <Field label="Employer Identification Number (EIN)" id="w9_ein">
            <Input id="w9_ein" value={data.ein || ''} onChange={set('ein')} placeholder="XX-XXXXXXX" disabled={!!data.ssn} />
          </Field>
        </div>
        {data.ssn && data.ein && (
          <p className="text-xs text-red-500 mt-2">Please enter either SSN or EIN, not both.</p>
        )}
      </div>

      <div className="border-t pt-6">
        <p className="text-sm font-medium mb-3">Part II — Certification</p>
        <p className="text-xs text-muted-foreground mb-3">Under penalties of perjury, I certify that:</p>
        <ul className="text-xs text-muted-foreground space-y-2 mb-6 pl-4">
          <li>1. The number shown on this form is my correct taxpayer identification number.</li>
          <li>2. I am not subject to backup withholding.</li>
          <li>3. I am a U.S. citizen or other U.S. person.</li>
          <li>4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
        </ul>
        <p className="text-xs text-muted-foreground mb-4">Date: {today}</p>
        {saved ? (
          <div className="flex items-center gap-2 text-[#577C09] text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            W-9 saved successfully
          </div>
        ) : (
          <Button onClick={onSave} disabled={!canSave} className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
            Save W-9
          </Button>
        )}
      </div>
    </div>
  )
}

function NC4EZForm({ upload, setUpload, saved, onSave }) {
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file) setUpload(file)
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#E8F0D0] rounded-lg p-4">
        <p className="text-sm text-[#3D5906]">
          <span className="font-medium">What is the NC-4EZ?</span> This is the North Carolina state employee withholding certificate. It tells Livi Home Care how much NC state income tax to withhold from your paychecks.
        </p>
      </div>

      <div className="border border-border rounded-lg p-5 space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Step 1 — Download the blank form</p>
          <p className="text-xs text-muted-foreground mb-3">Download the official NC-4EZ form from the NC Department of Revenue.</p>
          <a href="https://www.ncdor.gov/nc-4ez-employees-withholding-allowance-certificate/open" target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2 border-[#577C09] text-[#577C09] hover:bg-[#E8F0D0]">
              <Download className="w-4 h-4" />
              Download NC-4EZ
            </Button>
          </a>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-1">Step 2 — Fill it out and upload</p>
          <p className="text-xs text-muted-foreground mb-3">Print, fill out, then take a clear photo or scan and upload it below.</p>
          {upload ? (
            <div className="flex items-center justify-between border border-[#577C09] bg-[#E8F0D0] rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#577C09]" />
                <span className="text-sm text-[#577C09] font-medium truncate max-w-[200px]">{upload.name}</span>
              </div>
              <button onClick={() => setUpload(null)} className="text-xs text-muted-foreground hover:text-destructive ml-4">Remove</button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
              <div className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-3 hover:border-[#577C09] hover:text-[#577C09] transition-colors w-fit">
                <Upload className="w-4 h-4" />
                Click to upload — JPG, PNG, or PDF
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        {saved ? (
          <div className="flex items-center gap-2 text-[#577C09] text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            NC-4EZ uploaded successfully
          </div>
        ) : (
          <Button onClick={onSave} disabled={!upload} className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
            Save & Continue
          </Button>
        )}
        {!upload && <p className="text-xs text-muted-foreground mt-2">Please upload your completed NC-4EZ to continue.</p>}
      </div>
    </div>
  )
}

export default function TaxFormsPage({ stepLabel, role, onNext }) {
  const isContractor = role === 'nurse'

  const steps = isContractor
    ? [
        { id: 'i9', title: 'Form I-9', subtitle: 'Employment Eligibility Verification — Section 1' },
        { id: 'w9', title: 'Form W-9', subtitle: 'Request for Taxpayer Identification Number' },
      ]
    : [
        { id: 'i9', title: 'Form I-9', subtitle: 'Employment Eligibility Verification — Section 1' },
        { id: 'w4', title: 'Form W-4', subtitle: 'Federal Employee Withholding Certificate' },
        { id: 'nc4ez', title: 'NC-4EZ', subtitle: 'North Carolina Employee Withholding Certificate' },
      ]

  const initialSaved = isContractor
    ? { i9: false, w9: false }
    : { i9: false, w4: false, nc4ez: false }

  const [currentStep, setCurrentStep] = useState(0)
  const [saved, setSaved] = useState(initialSaved)
  const [i9Data, setI9Data] = useState({})
  const [w4Data, setW4Data] = useState({})
  const [w9Data, setW9Data] = useState({})
  const [nc4ezUpload, setNc4ezUpload] = useState(null)

  const allDone = Object.values(saved).every(Boolean)

  const handleSave = (formId) => {
    setSaved(prev => ({ ...prev, [formId]: true }))
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const step = steps[currentStep]

  return (
    <div className="max-w-2xl mx-auto py-16 px-8">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-[#577C09]" />
        <span className="text-[#577C09] font-medium">{stepLabel}</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Tax Forms</h1>
      <p className="text-muted-foreground mb-6">
        Please complete all {steps.length} tax forms below. These are required for payroll setup.
      </p>

      <div className="flex gap-2 mb-8 flex-wrap">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => (saved[s.id] || i === currentStep) && setCurrentStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              i === currentStep
                ? 'bg-[#577C09] text-white border-[#577C09]'
                : saved[s.id]
                ? 'bg-[#E8F0D0] text-[#577C09] border-[#577C09] cursor-pointer'
                : 'bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed'
            }`}
          >
            {saved[s.id] ? '✓ ' : ''}{s.title}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-xl p-8 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{step.title}</h2>
          <p className="text-sm text-muted-foreground">{step.subtitle}</p>
        </div>

        {currentStep === 0 && (
          <I9Form data={i9Data} onChange={setI9Data} onSave={() => handleSave('i9')} saved={saved.i9} />
        )}
        {!isContractor && currentStep === 1 && (
          <W4Form data={w4Data} onChange={setW4Data} onSave={() => handleSave('w4')} saved={saved.w4} />
        )}
        {!isContractor && currentStep === 2 && (
          <NC4EZForm upload={nc4ezUpload} setUpload={setNc4ezUpload} saved={saved.nc4ez} onSave={() => handleSave('nc4ez')} />
        )}
        {isContractor && currentStep === 1 && (
          <W9Form data={w9Data} onChange={setW9Data} onSave={() => handleSave('w9')} saved={saved.w9} />
        )}
      </div>

      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0} className="gap-2 disabled:opacity-50">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-[#577C09]' : saved[steps[i].id] ? 'bg-[#577C09]/40' : 'bg-muted-foreground/30'}`} />
          ))}
        </div>
        <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={currentStep === steps.length - 1 || !saved[steps[currentStep].id]} className="gap-2 bg-[#577C09] hover:bg-[#3D5906] text-white disabled:opacity-50">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {!allDone && <p className="text-sm text-muted-foreground mb-4">Please complete all tax forms to continue.</p>}
      <Button onClick={onNext} disabled={!allDone} className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
        Save & Continue
      </Button>
    </div>
  )
}