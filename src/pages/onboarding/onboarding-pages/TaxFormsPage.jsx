import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ChevronLeft, ChevronRight, CheckCircle, Upload, Download, AlertCircle, AlertTriangle } from 'lucide-react'
import { saveTaxFormData } from '@/lib/caregiver'
import { supabase } from '@/lib/supabase'
import { formatPhone, formatDOB } from '@/lib/formUtils'
import StateSelect from '@/components/global/StateSelect'

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
        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center gap-3 ${checked
            ? 'border-[#577C09] bg-[#E8F0D0] text-[#3D5906]'
            : 'border-border hover:border-[#577C09] hover:bg-[#E8F0D0]/30'
            }`}
    >
        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${checked ? 'border-[#577C09]' : 'border-muted-foreground'
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
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[#577C09] border-[#577C09]' : 'border-muted-foreground'
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



    const alienFieldComplete = data.citizenshipStatus !== '4' || (
        data.alienNumberType && (
            (data.alienNumberType === 'uscis' && data.uscisANumberAlien) ||
            (data.alienNumberType === 'i94' && data.i94AdmissionNumber) ||
            (data.alienNumberType === 'passport' && data.foreignPassportNumber && data.countryOfIssuance)
        )
    )
    const canSave = data.lastName && data.firstName && data.address &&
        data.city && data.state && data.zip && data.dob &&
        data.email && data.phone && data.citizenshipStatus &&
        (data.citizenshipStatus === '3' || data.citizenshipStatus === '4' || data.ssn) &&
        alienFieldComplete
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Field label="Address Line 1" id="i9_address" required>
                        <Input id="i9_address" value={data.address || ''} onChange={set('address')} placeholder="123 Main St" />
                    </Field>
                    <Field label="Address Line 2" id="i9_apt">
                        <Input id="i9_apt" value={data.apt || ''} onChange={set('apt')} placeholder="Apt 4B (if applicable)" />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="City" id="i9_city" required>
                            <Input id="i9_city" value={data.city || ''} onChange={set('city')} placeholder="Charlotte" />
                        </Field>
                        <Field label="State" id="i9_state" required>
                            <StateSelect id="i9_state" value={data.state || ''}
                                onChange={(e) => onChange({ ...data, state: e.target.value })} required />
                        </Field>
                        <Field label="ZIP code" id="i9_zip" required>
                            <Input id="i9_zip" value={data.zip || ''} inputMode="numeric" placeholder="28201" maxLength={5}
                                onChange={(e) => onChange({ ...data, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
                        </Field>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Date of birth (MM/DD/YYYY)" id="i9_dob" required>
                        <Input id="i9_dob" value={data.dob || ''} inputMode="numeric"
                            onChange={(e) => onChange({ ...data, dob: formatDOB(e.target.value) })}
                            placeholder="01/15/1990" />
                    </Field>
                    <Field label="U.S. Social Security Number" id="i9_ssn" required={data.citizenshipStatus === '1' || data.citizenshipStatus === '2'}>
                        <Input id="i9_ssn" value={data.ssn || ''} onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
                            let formatted = digits;
                            if (digits.length > 5) {
                                formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
                            } else if (digits.length > 3) {
                                formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
                            }
                            onChange({ ...data, ssn: formatted })
                        }} placeholder="XXX-XX-XXXX" />
                    </Field>
                    <Field label="Email address" id="i9_email" required>
                        <Input id="i9_email" type="email" value={data.email || ''} onChange={set('email')} placeholder="maria@email.com" />
                    </Field>
                    <Field label="Telephone number" id="i9_phone" required>
                        <Input id="i9_phone" type="tel" inputMode="tel" value={data.phone || ''}
                            onChange={(e) => onChange({ ...data, phone: formatPhone(e.target.value) })}
                            placeholder="(704) 555-0123" />

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
                    <div className="mt-4 space-y-4">
                        <Field label="Expiration date (MM/DD/YYYY)" id="i9_expDate" required>
                            <Input id="i9_expDate" value={data.expDate || ''} inputMode="numeric"
                                onChange={(e) => onChange({ ...data, expDate: formatDOB(e.target.value) })}
                                placeholder="01/01/2027" />

                        </Field>

                        <div>
                            <Label>Select one of the following <span className="text-red-500">*</span></Label>
                            <div className="space-y-2 mt-2">
                                <RadioOption
                                    value="uscis"
                                    label="USCIS A-Number"
                                    checked={data.alienNumberType === 'uscis'}
                                    onChange={(v) => onChange({ ...data, alienNumberType: v })}
                                />
                                <RadioOption
                                    value="i94"
                                    label="Form I-94 Admission Number"
                                    checked={data.alienNumberType === 'i94'}
                                    onChange={(v) => onChange({ ...data, alienNumberType: v })}
                                />
                                <RadioOption
                                    value="passport"
                                    label="Foreign Passport Number and Country of Issuance"
                                    checked={data.alienNumberType === 'passport'}
                                    onChange={(v) => onChange({ ...data, alienNumberType: v })}
                                />
                            </div>
                        </div>

                        {data.alienNumberType === 'uscis' && (
                            <Field label="USCIS A-Number" id="i9_uscisAlien" required>
                                <Input id="i9_uscisAlien" value={data.uscisANumberAlien || ''} onChange={set('uscisANumberAlien')} placeholder="A123456789" />
                            </Field>
                        )}

                        {data.alienNumberType === 'i94' && (
                            <Field label="Form I-94 Admission Number" id="i9_i94" required>
                                <Input id="i9_i94" value={data.i94AdmissionNumber || ''} onChange={set('i94AdmissionNumber')} placeholder="12345678901" maxLength={11} />
                            </Field>
                        )}

                        {data.alienNumberType === 'passport' && (
                            <div className="space-y-4">
                                <Field label="Foreign Passport Number" id="i9_passport" required>
                                    <Input id="i9_passport" value={data.foreignPassportNumber || ''} onChange={set('foreignPassportNumber')} placeholder="Passport number" />
                                </Field>
                                <Field label="Country of Issuance" id="i9_country" required>
                                    <Input id="i9_country" value={data.countryOfIssuance || ''} onChange={set('countryOfIssuance')} placeholder="e.g. Mexico" />
                                </Field>
                            </div>
                        )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input id="w4_ssn" value={data.ssn || ''} placeholder="XXX-XX-XXXX" inputMode="numeric"
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
                                let formatted = digits
                                if (digits.length > 5) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
                                else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
                                onChange({ ...data, ssn: formatted })
                            }} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Social Security Number (SSN)" id="w9_ssn">
                        <Input id="w9_ssn" value={data.ssn || ''} placeholder="XXX-XX-XXXX" inputMode="numeric"
                            disabled={!!data.ein}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
                                let formatted = digits
                                if (digits.length > 5) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
                                else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
                                onChange({ ...data, ssn: formatted })
                            }} />
                    </Field>
                    <Field label="Employer Identification Number (EIN)" id="w9_ein">
                        <Input id="w9_ein" value={data.ein || ''} placeholder="XX-XXXXXXX" inputMode="numeric"
                            disabled={!!data.ssn}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
                                let formatted = digits
                                if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`
                                onChange({ ...data, ein: formatted })
                            }} />
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

function NC4EZForm({ data, onChange, onSave, saved }) {
    const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })

    const filingOptions = [
        { value: 'single', label: 'Single or Married Filing Separately' },
        { value: 'head', label: 'Head of Household' },
        { value: 'joint', label: 'Married Filing Jointly or Surviving Spouse' },
    ]

    const canSave = data.firstName && data.lastName && data.ssn &&
        data.address && data.city && data.state && data.zip &&
        data.county && data.filingStatus

    return (
        <div className="space-y-6">
            <div className="bg-[#E8F0D0] rounded-lg p-4">
                <p className="text-sm text-[#3D5906]">
                    <span className="font-medium">NC-4EZ</span> is the North Carolina state withholding certificate. It tells Livi Home Care how much NC state income tax to withhold from your paychecks.
                </p>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Personal Information</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <Field label="First name" id="nc4ez_firstName" required>
                                <Input id="nc4ez_firstName" value={data.firstName || ''} onChange={set('firstName')} placeholder="Maria" />
                            </Field>
                        </div>
                        <div className="col-span-1">
                            <Field label="M.I." id="nc4ez_mi">
                                <Input id="nc4ez_mi" value={data.middleInitial || ''} onChange={set('middleInitial')} placeholder="A" maxLength={1} />
                            </Field>
                        </div>
                        <div className="col-span-1">
                            <Field label="Last name" id="nc4ez_lastName" required>
                                <Input id="nc4ez_lastName" value={data.lastName || ''} onChange={set('lastName')} placeholder="Santos" />
                            </Field>
                        </div>
                    </div>
                    <Field label="Social Security Number" id="nc4ez_ssn" required>
                        <Input id="nc4ez_ssn" value={data.ssn || ''} onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
                            let formatted = digits
                            if (digits.length > 5) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
                            else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
                            onChange({ ...data, ssn: formatted })
                        }} placeholder="XXX-XX-XXXX" />
                    </Field>
                    <Field label="Address" id="nc4ez_address" required>
                        <Input id="nc4ez_address" value={data.address || ''} onChange={set('address')} placeholder="123 Main St" />
                    </Field>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <Field label="City" id="nc4ez_city" required>
                                <Input id="nc4ez_city" value={data.city || ''} onChange={set('city')} placeholder="Charlotte" />
                            </Field>
                        </div>
                        <div>
                            <Field label="State" id="nc4ez_state" required>
                                <StateSelect id="nc4ez_state" value={data.state || ''}
                                    onChange={(e) => onChange({ ...data, state: e.target.value })} required />
                            </Field>
                        </div>
                        <div>
                            <Field label="ZIP" id="nc4ez_zip" required>
                                <Input id="nc4ez_zip" value={data.zip || ''} inputMode="numeric" placeholder="28201" maxLength={5}
                                    onChange={(e) => onChange({ ...data, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
                            </Field>
                        </div>
                    </div>
                    <Field label="County (first 5 letters)" id="nc4ez_county" required>
                        <Input id="nc4ez_county" value={data.county || ''} onChange={set('county')} placeholder="Meckl" maxLength={5} />
                    </Field>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Filing Status <span className="text-red-500">*</span></h3>
                <div className="space-y-2">
                    {filingOptions.map((opt) => (
                        <RadioOption key={opt.value} value={opt.value} label={opt.label} checked={data.filingStatus === opt.value} onChange={(v) => onChange({ ...data, filingStatus: v })} />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Withholding</h3>
                <div className="space-y-4">
                    <Field label="Line 1 — Total number of allowances" id="nc4ez_allowances">
                        <Input id="nc4ez_allowances" value={data.allowances || ''} onChange={set('allowances')} placeholder="0" />
                    </Field>
                    <Field label="Line 2 — Additional amount to withhold each pay period ($)" id="nc4ez_additional">
                        <Input id="nc4ez_additional" value={data.additionalWithholding || ''} onChange={set('additionalWithholding')} placeholder="0" />
                    </Field>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Exemptions <span className="text-xs font-normal text-muted-foreground">(optional)</span></h3>
                <div className="space-y-3">
                    <Checkbox
                        checked={data.exempt3 || false}
                        onChange={(v) => onChange({ ...data, exempt3: v })}
                        label="Line 3 — I certify that I am exempt from NC withholding (had no tax liability last year and expect none this year)"
                    />
                    <Checkbox
                        checked={data.exempt4 || false}
                        onChange={(v) => onChange({ ...data, exempt4: v })}
                        label="Line 4 — I certify that I am exempt under the Servicemembers Civil Relief Act"
                    />
                </div>
            </div>

            <div className="border-t pt-6">
                <p className="text-xs text-muted-foreground mb-4">
                    I certify, under penalties provided by law, that I am entitled to the number of withholding allowances claimed on Line 1 above, or if claiming exemption from withholding, that I am entitled to claim the exempt status on Line 3 or 4, whichever applies.
                </p>
                <p className="text-xs text-muted-foreground mb-4">Date: {today}</p>
                {saved ? (
                    <div className="flex items-center gap-2 text-[#577C09] text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        NC-4EZ saved successfully
                    </div>
                ) : (
                    <Button onClick={onSave} disabled={!canSave} className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                        Save NC-4EZ
                    </Button>
                )}
            </div>
        </div>
    )
}

export default function TaxFormsPage({ stepLabel, role, onNext, caregiver }) {

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
    const [saved, setSaved] = useState(initialSaved);
    const [confirming, setConfirming] = useState(null);
    const [i9Data, setI9Data] = useState({})
    const [w4Data, setW4Data] = useState({})
    const [w9Data, setW9Data] = useState({})
    const [nc4ezUpload, setNc4ezUpload] = useState(null)
    const [nc4ezData, setNc4ezData] = useState({});


    useEffect(() => {
        const restoreSaved = async () => {
            const { data, error } = await supabase
                .from('caregiver_tax_forms')
                .select('*')
                .eq('caregiver_id', caregiver.id)
                .maybeSingle()

            if (error || !data) return

            const restoredSaved = isContractor ? {
                i9: !!data.i9_data && Object.keys(data.i9_data).length > 0,
                w9: !!data.w9_data && Object.keys(data.w9_data).length > 0,
            } : {
                i9: !!data.i9_data && Object.keys(data.i9_data).length > 0,
                w4: !!data.w4_data && Object.keys(data.w4_data).length > 0,
                nc4ez: !!data.nc4ez_file_path,
            }

            setSaved(restoredSaved)

            const firstUnsaved = steps.findIndex(s => !restoredSaved[s.id])
            if (firstUnsaved !== -1) {
                setCurrentStep(firstUnsaved)
            } else {
                setCurrentStep(steps.length - 1)
            }
        }
        restoreSaved()
    }, [caregiver.id])


    const allDone = Object.values(saved).every(Boolean)

    const handleSave = async (formId) => {
        if (formId === 'i9') {
            await supabase.functions.invoke('save-ssn', {
                body: {
                    caregiverId: caregiver.id,
                    ssn: i9Data.ssn?.replace(/-/g, '') || '',
                    dob: i9Data.dob || '',
                    ein: '',
                }
            })
            await supabase.functions.invoke('generate-i9', {
                body: {
                    caregiverId: caregiver.id,
                    i9Data: {
                        ...i9Data,
                        ssn: i9Data.ssn?.replace(/-/g, '') || ''
                    }
                }
            })
        }

        if (formId === 'w4') {
            await supabase.functions.invoke('save-ssn', {
                body: {
                    caregiverId: caregiver.id,
                    ssn: w4Data.ssn?.replace(/-/g, '') || '',
                    dob: '',
                    ein: '',
                }
            })

            await saveTaxFormData(caregiver.id, 'w4', w4Data)

            await supabase.functions.invoke('generate-w4', {
                body: {
                    caregiverId: caregiver.id,
                    w4Data: {
                        ...w4Data,
                        ssn: w4Data.ssn?.replace(/-/g, '') || ''
                    }
                }
            })
        }

        if (formId === 'w9') {
            await supabase.functions.invoke('save-ssn', {
                body: {
                    caregiverId: caregiver.id,
                    ssn: w9Data.ssn?.replace(/-/g, '') || '',
                    dob: '',
                    ein: w9Data.ein?.replace(/-/g, '') || '',
                }
            })
            await saveTaxFormData(caregiver.id, 'w9', w9Data)

            await supabase.functions.invoke('generate-w9', {
                body: {
                    caregiverId: caregiver.id,
                    w9Data: {
                        ...w9Data,
                        ssn: w9Data.ssn?.replace(/-/g, '') || '',
                        ein: w9Data.ein?.replace(/-/g, '') || '',
                    }
                }
            })
        }

        if (formId === 'nc4ez') {
            const nc4ezResult = await supabase.functions.invoke('generate-nc4ez', {
                body: {
                    caregiverId: caregiver.id,
                    caregiverName: caregiver.name,
                    nc4ezData: {
                        ...nc4ezData,
                        ssn: nc4ezData.ssn?.replace(/-/g, '') || ''
                    }
                }
            })

            if (nc4ezResult.error) {
                const errorText = await nc4ezResult.error.context.text();
                console.log("error: ", errorText)
            }

            // save to caregiver_documents via the edge function
            // also save record directly for restore tracking
            await supabase
                .from('caregiver_documents')
                .upsert({
                    caregiver_id: caregiver.id,
                    document_type: 'nc4ez_completed',
                    file_name: `${caregiver.name.replace(/[^a-zA-Z0-9]/g, '_')}_NC4EZ_Completed.pdf`,
                    file_path: `${caregiver.id}/${caregiver.name.replace(/[^a-zA-Z0-9]/g, '_')}_NC4EZ_Completed.pdf`,
                    mime_type: 'application/pdf',
                }, { onConflict: 'caregiver_id, document_type' })
        }

        setSaved(prev => ({ ...prev, [formId]: true }))
        setConfirming(null);
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const step = steps[currentStep]

    return (
        <div className="max-w-2xl mx-auto py-8 md:py-16 px-4 md:px-8">
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
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${i === currentStep
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

            <div className="border border-border rounded-xl p-4 md:p-8 mb-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">{step.title}</h2>
                    <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                </div>

                <div className="relative">
                    {/* blur overlay when saved */}
                    {saved[step.id] && confirming !== step.id && (
                        <div
                            className="absolute inset-0 z-10 backdrop-blur-sm bg-white/60 rounded-lg flex items-center justify-center cursor-pointer"
                            onClick={() => setConfirming(step.id)}
                        >
                            <div className="text-center px-6">
                                <CheckCircle className="w-8 h-8 text-[#577C09] mx-auto mb-2" />
                                <p className="text-sm font-medium text-[#577C09]">Form submitted</p>
                                <p className="text-xs text-muted-foreground mt-1">Click to modify</p>
                            </div>
                        </div>
                    )}

                    {/* warning dialog */}
                    {confirming === step.id && (
                        <div className="absolute inset-0 z-20 bg-white/95 rounded-lg flex items-center justify-center">
                            <div className="text-center max-w-sm px-6">
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                                </div>
                                <h3 className="font-semibold mb-2">Tax Form Already Submitted</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    You've already completed and submitted this tax form. If you continue,
                                    your data will be erased and you will have to re-enter your information
                                    for security and compliance purposes.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setConfirming(null)}
                                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSaved(prev => ({ ...prev, [step.id]: false }))
                                            setConfirming(null)
                                            if (step.id === 'i9') setI9Data({})
                                            if (step.id === 'w4') setW4Data({})
                                            if (step.id === 'w9') setW9Data({})
                                            if (step.id === 'nc4ez') setNc4ezUpload(null)
                                        }}
                                        className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                    >
                                        Yes, Re-enter Form
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 0 && (
                        <I9Form data={i9Data} onChange={setI9Data} onSave={() => handleSave('i9')} saved={saved.i9} />
                    )}
                    {!isContractor && currentStep === 1 && (
                        <W4Form data={w4Data} onChange={setW4Data} onSave={() => handleSave('w4')} saved={saved.w4} />
                    )}
                    {!isContractor && currentStep === 2 && (
                        <NC4EZForm data={nc4ezData} onChange={setNc4ezData} onSave={() => handleSave('nc4ez')} saved={saved.nc4ez} />
                    )}
                    {isContractor && currentStep === 1 && (
                        <W9Form data={w9Data} onChange={setW9Data} onSave={() => handleSave('w9')} saved={saved.w9} />
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mb-8">
                <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0} className="gap-2 disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4" />
                    <span className='hidden sm:inline'>Previous</span>
                </Button>
                <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-[#577C09]' : saved[steps[i].id] ? 'bg-[#577C09]/40' : 'bg-muted-foreground/30'}`} />
                    ))}
                </div>
                <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={currentStep === steps.length - 1 || !saved[steps[currentStep].id]} className="gap-2 bg-[#577C09] hover:bg-[#3D5906] text-white disabled:opacity-50">
                    <span className='hidden sm:inline'>Next</span>
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