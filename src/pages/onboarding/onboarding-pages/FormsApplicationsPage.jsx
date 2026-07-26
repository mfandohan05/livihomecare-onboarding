import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPhone } from '@/lib/formUtils'

const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York'
})

const resolveJobDescRoleKey = (caregiver) => {
    if (caregiver.role === 'nurse_prn' || caregiver.role === 'nurse_director') return 'nurse'
    return caregiver.role
}

const getJobDescription = (caregiver, form) => {
    if (caregiver.role === 'other' && caregiver.job_duties) {
        return {
            title: caregiver.job_description || 'Job Description',
            intro: '',
            sections: [{
                heading: null,
                items: caregiver.job_duties.split('\n').filter(l => l.trim()).map(l => l.trim())
            }]
        }
    }
    const roleKey = resolveJobDescRoleKey(caregiver)
    return form?.config?.by_role?.[roleKey] || null
}

const interpolate = (text, caregiver) => {
    if (!text) return text
    return text
        .replaceAll('{{today}}', today)
        .replaceAll('{{caregiver.name}}', caregiver?.name || '')
}

const renderContentBlock = (block, i, caregiver) => {
    if (block.type === 'heading') {
        return <p key={i} className="font-medium mt-2">{interpolate(block.text, caregiver)}</p>
    }
    if (block.type === 'list') {
        return (
            <ul key={i} className="space-y-1 pl-4">
                {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] shrink-0" />
                        {interpolate(item, caregiver)}
                    </li>
                ))}
            </ul>
        )
    }
    return <p key={i}>{interpolate(block.text, caregiver)}</p>
}

const SignatureField = ({ formKey, label = 'Type your full name to sign', signatures, onSign, caregiver }) => (
    <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3">
            By typing your name below, you are providing a legally binding electronic signature.
        </p>
        <div className="space-y-2">
            <Label htmlFor={`sig_${formKey}`}>{label}</Label>
            <Input
                id={`sig_${formKey}`}
                placeholder={caregiver.name}
                value={signatures[formKey] || ''}
                onChange={(e) => onSign(formKey, e.target.value)}
                className="font-serif italic"
            />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Date: {today}</p>
    </div>
)

const FormContent = ({ children, color = '#F9F9F9' }) => (
    <div
        className="rounded-lg p-5 mb-4 text-sm leading-relaxed space-y-3 border border-border"
        style={{ background: color }}
    >
        {children}
    </div>
)

const FormButton = ({ disabled, isDone, onClick }) => (
    <Button
        onClick={onClick}
        disabled={disabled}
        className="mt-4 bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {isDone ? 'Signed ✓' : 'Sign & Continue'}
    </Button>
)

const ReferenceForm = ({ references, setReferences, minRequired = 1 }) => {
    const updateRef = (index, field, value) => {
        setReferences(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
    }

    return (
        <>
            {references.map((ref, index) => {
                const isRequired = index < minRequired
                return (
                    <div
                        key={index}
                        className={`rounded-lg p-4 space-y-3 mt-3 border ${isRequired ? 'border-border' : 'border-dashed border-border'}`}
                    >
                        <p className={`text-sm font-medium ${isRequired ? '' : 'text-muted-foreground'}`}>
                            Reference {index + 1} {isRequired ? <span className="text-red-500">*</span> : <span className="text-xs">(optional)</span>}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor={`ref${index}_name`}>Full Name {isRequired && <span className="text-red-500">*</span>}</Label>
                                <Input id={`ref${index}_name`} placeholder="Jane Smith" value={ref.name} onChange={(e) => updateRef(index, 'name', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`ref${index}_company`}>Company / Organization {isRequired && <span className="text-red-500">*</span>}</Label>
                                <Input id={`ref${index}_company`} placeholder="ABC Home Care" value={ref.company} onChange={(e) => updateRef(index, 'company', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`ref${index}_relationship`}>Professional Relationship {isRequired && <span className="text-red-500">*</span>}</Label>
                                <Input id={`ref${index}_relationship`} placeholder="Former Supervisor" value={ref.relationship} onChange={(e) => updateRef(index, 'relationship', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`ref${index}_phone`}>Phone Number {isRequired && <span className="text-red-500">*</span>}</Label>
                                <Input id={`ref${index}_phone`} placeholder="(555) 000-0000" value={formatPhone(ref.phone)} onChange={(e) => updateRef(index, 'phone', e.target.value)} />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor={`ref${index}_email`}>Email Address</Label>
                                <Input id={`ref${index}_email`} placeholder="jane@example.com" value={ref.email} onChange={(e) => updateRef(index, 'email', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )
            })}
        </>
    )
}

export default function FormsApplicationsPage({ stepLabel, caregiver, companyId, onNext, initialData, onChange, onHepBChange, setSaving }) {
    const [forms, setForms] = useState([])
    const [loadingForms, setLoadingForms] = useState(true)

    const [expanded, setExpanded] = useState({})
    const [completed, setCompleted] = useState(initialData?.completed || {})
    const [signatures, setSignatures] = useState(initialData?.signatures || {})
    const [hepBStatus, setHepBStatus] = useState(initialData?.hepBStatus || '')
    const [directDeposit, setDirectDeposit] = useState({
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: '',
    })
    const [wotcAnswers, setWotcAnswers] = useState(initialData?.wotcAnswers || {})
    const [references, setReferences] = useState(initialData?.references || [
        { name: '', company: '', relationship: '', phone: '', email: '' },
        { name: '', company: '', relationship: '', phone: '', email: '' },
    ])

    useEffect(() => {
        if (!companyId || !caregiver?.role) return

        const loadForms = async () => {
            setLoadingForms(true)
            const { data, error } = await supabase
                .from('company_forms')
                .select('form_key, title, form_order, form_type, content, config, requires_signature, visible_to_roles')
                .eq('company_id', companyId)
                .order('form_order')

            if (!error && data && data.length > 0) {
                const filtered = data.filter(f => !f.visible_to_roles || f.visible_to_roles.includes(caregiver.role))
                setForms(filtered)
                setExpanded(filtered.length > 0 ? { [filtered[0].form_key]: true } : {})
            } else {
                setForms([])
            }
            setLoadingForms(false)
        }

        loadForms()
    }, [companyId, caregiver?.role])

    const toggle = (formKey) => {
        setExpanded(prev => ({ ...prev, [formKey]: !prev[formKey] }))
    }
    const updateSignature = (formKey, value) => {
        const updated = { ...signatures, [formKey]: value }
        setSignatures(updated)
        onChange({ signatures: updated, completed, wotcAnswers, references })
    }
    const updateHepBStatus = (status) => {
        setHepBStatus(status)
        onHepBChange(status)
    }

    const resolveFieldValues = (form, caregiver, signature, context = {}) => {
        const mapping = form.config?.field_mapping || []
        const today = new Date()
        const fieldValues = {}

        for (const entry of mapping) {
            const { pdf_field, source } = entry

            if (source === 'static') {
                fieldValues[pdf_field] = entry.value
            }
            else if (source === 'caregiver_field') {
                fieldValues[pdf_field] = caregiver[entry.field] ?? ''
            }
            else if (source === 'signature') {
                fieldValues[pdf_field] = signature || ''
            }
            else if (source === 'today') {
                fieldValues[pdf_field] = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
            }
            else if (source === 'today_part') {
                if (entry.part === 'day') fieldValues[pdf_field] = String(today.getDate())
                if (entry.part === 'month_long') fieldValues[pdf_field] = today.toLocaleString('en-US', { month: 'long' })
                if (entry.part === 'year_short') fieldValues[pdf_field] = String(today.getFullYear()).slice(2)
                if (entry.part === 'year_long') fieldValues[pdf_field] = String(today.getFullYear())
            }
            else if (source === 'formatted_date') {
                const raw = caregiver[entry.field]
                fieldValues[pdf_field] = raw
                    ? new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
                    : ''
            }
            else if (source === 'checkbox_match') {
                fieldValues[pdf_field] = context[entry.value_key] === entry.equals
            }
            else if (source === 'reference_field') {
                fieldValues[pdf_field] = context.references?.[entry.index]?.[entry.field] || ''
            }
        }

        return fieldValues
    }

    const markComplete = async (form) => {
        if (form.form_type === 'job_description') {
            setSaving(true)
            const jobDesc = getJobDescription(caregiver, form);
            const roleKey = resolveJobDescRoleKey(caregiver);
            await supabase.functions.invoke('generate-job-description', {
                body: {
                    caregiverId: caregiver.id,
                    signature: signatures[form.form_key],
                    jobDescription: jobDesc,
                    roleKeyOverride: roleKey,
                }
            })
            setSaving(false)
        }
        if (form.form_type === 'signature_only') {
            setSaving(true)
            const fieldValues = resolveFieldValues(form, caregiver, signatures[form.form_key], {
                hepBStatus,
                references,
            })
            await supabase.functions.invoke('generate-generic-signed-document', {
                body: {
                    caregiverId: caregiver.id,
                    documentType: form.form_key,
                    fieldValues,
                }
            })
            setSaving(false)
        }
        if (form.form_type === 'hepb_status') {
            setSaving(true)
            const fieldValues = resolveFieldValues(form, caregiver, signatures[form.form_key], {
                hepBStatus,
                references,
            })
            await supabase.functions.invoke('generate-generic-signed-document', {
                body: {
                    caregiverId: caregiver.id,
                    documentType: form.form_key,
                    fieldValues,
                }
            })
            setSaving(false)
        }
        if (form.form_type === 'wotc') {
            setSaving(true)
            await supabase.functions.invoke('generate-wotc', {
                body: {
                    caregiverId: caregiver.id,
                    wotcAnswers,
                    signature: signatures[form.form_key]
                }
            })
            setSaving(false)
        }
        if (form.form_type === 'reference_check') {
            setSaving(true)
            await supabase.functions.invoke('generate-reference-pdf', {
                body: {
                    caregiverId: caregiver.id,
                    references,
                    signature: signatures[form.form_key],
                }
            })
            setSaving(false)
        }

        const updated = { ...completed, [form.form_key]: true }
        setCompleted(updated)
        onChange({ signatures, completed: updated, wotcAnswers, references })

        const currentIndex = forms.findIndex(f => f.form_key === form.form_key)
        const nextForm = forms[currentIndex + 1]
        if (nextForm) {
            setExpanded(prev => ({ ...prev, [nextForm.form_key]: true }))
        }
    }

    const handleDirectDepositComplete = async (form) => {
        setSaving(true)
        const { error } = await supabase.functions.invoke('save-banking-info', {
            body: {
                caregiverId: caregiver.id,
                bankName: directDeposit.bankName,
                routingNumber: directDeposit.routingNumber,
                accountNumber: directDeposit.accountNumber,
                accountType: directDeposit.accountType,
            }
        })
        await supabase.functions.invoke('generate-direct-deposit', {
            body: { caregiverId: caregiver.id }
        })

        if (error) {
            console.error('Error saving banking info:', error)
            setSaving(false)
            return
        }

        await markComplete(form)
        setSaving(false)
    }

    const allCompleted = forms.length > 0 && forms.every(f => completed[f.form_key])

    if (loadingForms) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--primary-color)] mr-2" />
                <p className="text-muted-foreground">Loading forms...</p>
            </div>
        )
    }

    if (forms.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-8 text-center">
                <p className="text-muted-foreground">No forms are configured yet. Please contact your administrator.</p>
            </div>
        )
    }

    const renderFormBody = (form) => {
        if (form.form_type === 'job_description') {
            const jobDesc = getJobDescription(caregiver, form)
            if (!jobDesc) {
                return <p className="text-sm text-muted-foreground">Job description not available for your role. Please contact your administrator.</p>
            }
            return (
                <>
                    <FormContent>
                        <p className="font-medium">{jobDesc.title}</p>
                        {jobDesc.intro && <p>{jobDesc.intro}</p>}
                        {jobDesc.sections.map((section, i) => (
                            <div key={i}>
                                {section.heading && <p className="font-medium mt-2">{section.heading}</p>}
                                <ul className="space-y-1 pl-4">
                                    {section.items.map((item, j) => (
                                        <li key={j} className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </FormContent>
                    <SignatureField
                        formKey={form.form_key}
                        signatures={signatures}
                        onSign={updateSignature}
                        caregiver={caregiver}
                        label="Type your full name to acknowledge this job description"
                    />
                    <FormButton
                        isDone={completed[form.form_key]}
                        disabled={!signatures[form.form_key]?.trim() || completed[form.form_key]}
                        onClick={() => markComplete(form)}
                    />
                </>
            )
        }

        if (form.form_type === 'hepb_status') {
            const options = form.config?.options || []
            const intro = form.config?.intro || []
            return (
                <>
                    <FormContent>
                        {intro.map((line, i) => <p key={i}>{line}</p>)}
                        <p className="mt-2">Please select the option that applies to you:</p>
                    </FormContent>
                    <div className="space-y-3 mb-6">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => updateHepBStatus(option.value)}
                                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-start gap-3 ${hepBStatus === option.value
                                    ? 'border-[var(--primary-color)] bg-[var(--secondary-bg)] text-[var(--hover-color)]'
                                    : 'border-border hover:border-[var(--primary-color)] hover:bg-[var(--secondary-bg)]/30'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${hepBStatus === option.value ? 'border-[var(--primary-color)]' : 'border-muted-foreground'}`}>
                                    {hepBStatus === option.value && <div className="w-2 h-2 rounded-full bg-[var(--primary-color)]" />}
                                </div>
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <SignatureField
                        formKey={form.form_key}
                        signatures={signatures}
                        onSign={updateSignature}
                        caregiver={caregiver}
                        label="Type your full name to confirm your vaccine status"
                    />
                    <FormButton
                        isDone={completed[form.form_key]}
                        disabled={!hepBStatus || !signatures[form.form_key]?.trim() || completed[form.form_key]}
                        onClick={() => markComplete(form)}
                    />
                </>
            )
        }

        if (form.form_type === 'direct_deposit') {
            const fee = form.config?.correction_fee ?? 79
            const intro = form.config?.intro || []
            return (
                <>
                    <FormContent>
                        {intro.map((line, i) => <p key={i}>{line}</p>)}
                        <p className="mt-2 font-medium text-amber-700">
                            Important: A <strong>${fee} correction fee</strong> will be assessed if incorrect banking information results in a failed or misdirected deposit. You will also need to wait until the next scheduled payday to receive your pay.
                        </p>
                    </FormContent>
                    <div className="space-y-4 mb-6">
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input id="bankName" placeholder="e.g. Bank of America" value={directDeposit.bankName} onChange={(e) => setDirectDeposit(prev => ({ ...prev, bankName: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="routingNumber">Routing Number</Label>
                                <Input id="routingNumber" placeholder="9-digit ABA number" maxLength={9} value={directDeposit.routingNumber} onChange={(e) => setDirectDeposit(prev => ({ ...prev, routingNumber: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input id="accountNumber" placeholder="Account number" value={directDeposit.accountNumber} onChange={(e) => setDirectDeposit(prev => ({ ...prev, accountNumber: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Account Type</Label>
                            <div className="flex gap-4">
                                {['Checking', 'Savings'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setDirectDeposit(prev => ({ ...prev, accountType: type }))}
                                        className={`px-6 py-2 rounded-md border text-sm font-medium transition-colors ${directDeposit.accountType === type ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]' : 'bg-white text-foreground border-border hover:bg-muted'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <SignatureField
                        formKey={form.form_key}
                        signatures={signatures}
                        onSign={updateSignature}
                        caregiver={caregiver}
                        label="Type your full name to authorize direct deposit"
                    />
                    <FormButton
                        isDone={completed[form.form_key]}
                        disabled={
                            !directDeposit.bankName.trim() ||
                            !directDeposit.routingNumber.trim() ||
                            !directDeposit.accountNumber.trim() ||
                            !directDeposit.accountType ||
                            !signatures[form.form_key]?.trim() ||
                            completed[form.form_key]
                        }
                        onClick={() => handleDirectDepositComplete(form)}
                    />
                </>
            )
        }

        if (form.form_type === 'reference_check') {
            const minRequired = form.config?.min_references ?? 1
            const maxReferences = form.config?.max_references ?? 2
            const firstRef = references[0] || {}
            const missingRequired = !firstRef.name?.trim() || !firstRef.company?.trim() || !firstRef.relationship?.trim() || !firstRef.phone?.trim()

            return (
                <>
                    <FormContent>
                        <p className="font-medium">Professional References</p>
                        <p className="text-sm text-muted-foreground">
                            Please provide at least one professional reference. References should be former supervisors, managers, or colleagues who can speak to your work experience and character.
                        </p>
                    </FormContent>
                    <ReferenceForm references={references.slice(0, maxReferences)} setReferences={setReferences} minRequired={minRequired} />
                    <SignatureField
                        formKey={form.form_key}
                        signatures={signatures}
                        onSign={updateSignature}
                        caregiver={caregiver}
                        label="Type your full name to confirm these references are accurate"
                    />
                    <FormButton
                        isDone={completed[form.form_key]}
                        disabled={!signatures[form.form_key]?.trim() || completed[form.form_key] || missingRequired}
                        onClick={() => markComplete(form)}
                    />
                </>
            )
        }

        if (form.form_type === 'wotc') {
            const questions = form.config?.questions || []
            const intro = form.config?.intro || []
            const acknowledgment = form.config?.acknowledgment || []
            return (
                <>
                    <FormContent>
                        {intro.map((line, i) => <p key={i} className="text-sm text-muted-foreground">{line}</p>)}
                        <p className="font-medium mt-4">Voluntary Disclosure</p>
                        <p className="text-sm text-muted-foreground mb-3">Please indicate your response to each question below.</p>
                        {questions.map((question, i) => (
                            <div key={question.id} className="py-3 border-b border-border last:border-0">
                                <p className="text-sm font-medium mb-2">{i + 1}. {question.label}</p>
                                <div className="flex flex-wrap gap-4">
                                    {['Yes', 'No', 'Prefer Not to Answer', ...(question.extra ? [question.extra] : [])].map((option) => (
                                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={question.id}
                                                value={option}
                                                checked={wotcAnswers?.[question.id] === option}
                                                onChange={() => setWotcAnswers(prev => {
                                                    const updated = { ...prev, [question.id]: option }
                                                    onChange({ signatures, completed, wotcAnswers: updated, references })
                                                    return updated
                                                })}
                                                className="accent-[var(--primary-color)]"
                                            />
                                            <span className="text-sm">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {acknowledgment.length > 0 && (
                            <div className="mt-4 bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                                <p className="font-medium text-foreground">Acknowledgment</p>
                                <ul className="space-y-1 pl-4">
                                    {acknowledgment.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </FormContent>
                    <SignatureField
                        formKey={form.form_key}
                        signatures={signatures}
                        onSign={updateSignature}
                        caregiver={caregiver}
                        label="Type your full name to sign and acknowledge this disclosure"
                    />
                    <FormButton
                        isDone={completed[form.form_key]}
                        disabled={!signatures[form.form_key]?.trim() || completed[form.form_key]}
                        onClick={() => markComplete(form)}
                    />
                </>
            )
        }

        return (
            <>
                <FormContent>
                    {(form.content || []).map((block, i) => renderContentBlock(block, i, caregiver))}
                </FormContent>
                <SignatureField
                    formKey={form.form_key}
                    signatures={signatures}
                    onSign={updateSignature}
                    caregiver={caregiver}
                    label={`Type your full name to sign ${form.title}`}
                />
                <FormButton
                    isDone={completed[form.form_key]}
                    disabled={!signatures[form.form_key]?.trim() || completed[form.form_key]}
                    onClick={() => markComplete(form)}
                />
            </>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-8 md:py-16 px-4 md:px-8">

            <div className="flex items-center gap-2 mb-2">
                <ScrollText className="w-5 h-5 text-[var(--primary-color)]" />
                <span className="text-[var(--primary-color)] font-medium">{stepLabel}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Forms & Agreements</h1>
            <p className="text-muted-foreground mb-2">
                Please read and sign each form below. All forms must be completed before continuing.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
                {Object.keys(completed).length} of {forms.length} forms completed
            </p>

            <div className="space-y-4 mb-8">
                {forms.map((form, index) => {
                    const isOpen = expanded[form.form_key]
                    const isDone = completed[form.form_key]

                    return (
                        <div
                            key={form.form_key}
                            className={`border rounded-xl overflow-hidden transition-colors ${isDone ? 'border-[var(--primary-color)]' : 'border-border'}`}
                        >
                            <button
                                onClick={() => toggle(form.form_key)}
                                className="w-full flex items-center justify-between px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-medium ${isDone ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white' : 'border-muted-foreground text-muted-foreground'}`}>
                                        {isDone ? '✓' : index + 1}
                                    </div>
                                    <span className={`font-medium text-sm ${isDone ? 'text-[var(--primary-color)]' : ''}`}>
                                        {form.title}
                                    </span>
                                    {isDone && (
                                        <span className="text-xs text-[var(--primary-color)] bg-[var(--secondary-bg)] px-2 py-0.5 rounded-full">
                                            Signed
                                        </span>
                                    )}
                                </div>
                                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </button>

                            {isOpen && (
                                <div className="px-4 md:px-6 pb-6 border-t border-border pt-6">
                                    {renderFormBody(form)}
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
                className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Save & Continue
            </Button>

        </div>
    )
}