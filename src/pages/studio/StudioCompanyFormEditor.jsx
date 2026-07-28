import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, X, ChevronUp, ChevronDown, Upload, RefreshCw, PlayCircle, TriangleAlert, CircleCheck } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction, FORM_TYPE_LABELS, FIELD_MAPPING_TYPES } from '@/lib/studio'

const SOURCE_OPTIONS = [
    { value: 'static', label: 'Static value' },
    { value: 'caregiver_field', label: 'Caregiver field' },
    { value: 'signature', label: 'Signature (typed on this form)' },
    { value: 'today', label: "Today's date" },
    { value: 'today_part', label: "Part of today's date" },
    { value: 'formatted_date', label: 'Formatted caregiver date field' },
    { value: 'checkbox_match', label: 'Checkbox — matches a value' },
    { value: 'reference_field', label: 'Reference field' },
]

const CAREGIVER_FIELDS = [
    'name', 'email', 'phone', 'role', 'position_title', 'employment_type',
    'pay_rate', 'companion_pay_rate', 'mileage_rate', 'status',
    'job_description', 'job_duties', 'gender', 'employee_id',
]
const CAREGIVER_DATE_FIELDS = ['start_date', 'hire_date']
const TODAY_PARTS = [
    { value: 'day', label: 'Day (e.g. 5)' },
    { value: 'month_long', label: 'Month, full name (e.g. March)' },
    { value: 'year_short', label: 'Year, 2-digit (e.g. 26)' },
    { value: 'year_long', label: 'Year, 4-digit (e.g. 2026)' },
]
const REFERENCE_FIELDS = ['name', 'company', 'relationship', 'phone', 'email']

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

const SectionCard = ({ title, description, children, action }) => (
    <section className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div>
                <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{title}</h2>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            {action}
        </div>
        {children}
    </section>
)

function ContentBlocksEditor({ content, onChange }) {
    const addBlock = (type) => {
        const block = type === 'list' ? { type: 'list', items: [''] } : { type, text: '' }
        onChange([...content, block])
    }
    const updateBlock = (index, updates) => {
        onChange(content.map((b, i) => (i === index ? { ...b, ...updates } : b)))
    }
    const removeBlock = (index) => onChange(content.filter((_, i) => i !== index))
    const move = (index, dir) => {
        const target = dir === 'up' ? index - 1 : index + 1
        if (target < 0 || target >= content.length) return
        const copy = [...content]
        ;[copy[index], copy[target]] = [copy[target], copy[index]]
        onChange(copy)
    }

    return (
        <div className="space-y-3">
            {content.length === 0 && <p className="text-sm text-muted-foreground">No content blocks yet.</p>}
            {content.map((block, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase text-muted-foreground">{block.type}</span>
                        <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon-xs" disabled={i === 0} onClick={() => move(i, 'up')}>
                                <ChevronUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon-xs" disabled={i === content.length - 1} onClick={() => move(i, 'down')}>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeBlock(i)}>
                                <X className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                        </div>
                    </div>
                    {block.type === 'list' ? (
                        <div className="space-y-2">
                            {(block.items || []).map((item, j) => (
                                <div key={j} className="flex items-center gap-2">
                                    <Input
                                        value={item}
                                        onChange={(e) => {
                                            const items = [...block.items]
                                            items[j] = e.target.value
                                            updateBlock(i, { items })
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => updateBlock(i, { items: block.items.filter((_, k) => k !== j) })}
                                    >
                                        <X className="w-3.5 h-3.5 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => updateBlock(i, { items: [...(block.items || []), ''] })}>
                                <Plus className="w-3.5 h-3.5" />
                                Add line
                            </Button>
                        </div>
                    ) : (
                        <Input
                            value={block.text || ''}
                            onChange={(e) => updateBlock(i, { text: e.target.value })}
                            placeholder={block.type === 'heading' ? 'Heading text' : 'Paragraph text'}
                        />
                    )}
                </div>
            ))}
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('heading')}>
                    <Plus className="w-3.5 h-3.5" /> Heading
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('text')}>
                    <Plus className="w-3.5 h-3.5" /> Paragraph
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('list')}>
                    <Plus className="w-3.5 h-3.5" /> List
                </Button>
            </div>
        </div>
    )
}

function StringListEditor({ items, onChange, placeholder }) {
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        value={item}
                        placeholder={placeholder}
                        onChange={(e) => onChange(items.map((it, j) => (j === i ? e.target.value : it)))}
                    />
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => {
                        const copy = [...items]
                        ;[copy[i - 1], copy[i]] = [copy[i], copy[i - 1]]
                        onChange(copy)
                    }}>
                        <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === items.length - 1} onClick={() => {
                        const copy = [...items]
                        ;[copy[i], copy[i + 1]] = [copy[i + 1], copy[i]]
                        onChange(copy)
                    }}>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                        <X className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ''])}>
                <Plus className="w-3.5 h-3.5" /> Add line
            </Button>
        </div>
    )
}

function HepBOptionsEditor({ options, onChange }) {
    const update = (i, updates) => onChange(options.map((o, j) => (j === i ? { ...o, ...updates } : o)))
    return (
        <div className="space-y-2">
            {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input className="w-40" placeholder="value (e.g. vaccinated)" value={opt.value || ''} onChange={(e) => update(i, { value: e.target.value })} />
                    <Input placeholder="label shown to caregiver" value={opt.label || ''} onChange={(e) => update(i, { label: e.target.value })} />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(options.filter((_, j) => j !== i))}>
                        <X className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...options, { value: '', label: '' }])}>
                <Plus className="w-3.5 h-3.5" /> Add option
            </Button>
        </div>
    )
}

function FieldMappingRow({ entry, onChange, onRemove, templateFields, hepbOptions }) {
    const set = (updates) => onChange({ ...entry, ...updates })

    return (
        <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="space-y-1">
                        <Label className="text-xs">PDF field name</Label>
                        {templateFields.length > 0 ? (
                            <Select value={entry.pdf_field || ''} onValueChange={(v) => set({ pdf_field: v })}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Choose a field" /></SelectTrigger>
                                <SelectContent position="popper">
                                    {templateFields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                value={entry.pdf_field || ''}
                                onChange={(e) => set({ pdf_field: e.target.value })}
                                placeholder="Upload a template to pick from real field names"
                            />
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Source</Label>
                        <Select value={entry.source || ''} onValueChange={(v) => set({ source: v })}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a source" /></SelectTrigger>
                            <SelectContent position="popper">
                                {SOURCE_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} className="mt-5">
                    <X className="w-4 h-4 text-red-500" />
                </Button>
            </div>

            {entry.source === 'static' && (
                <div className="space-y-1">
                    <Label className="text-xs">Static value</Label>
                    <Input value={entry.value || ''} onChange={(e) => set({ value: e.target.value })} />
                </div>
            )}

            {entry.source === 'caregiver_field' && (
                <div className="space-y-1">
                    <Label className="text-xs">Caregiver column</Label>
                    <Select value={entry.field || ''} onValueChange={(v) => set({ field: v })}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Choose a column" /></SelectTrigger>
                        <SelectContent position="popper">
                            {CAREGIVER_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {entry.source === 'today_part' && (
                <div className="space-y-1">
                    <Label className="text-xs">Which part</Label>
                    <Select value={entry.part || ''} onValueChange={(v) => set({ part: v })}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Choose a part" /></SelectTrigger>
                        <SelectContent position="popper">
                            {TODAY_PARTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {entry.source === 'formatted_date' && (
                <div className="space-y-1">
                    <Label className="text-xs">Caregiver date column</Label>
                    <Select value={entry.field || ''} onValueChange={(v) => set({ field: v })}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Choose a date column" /></SelectTrigger>
                        <SelectContent position="popper">
                            {CAREGIVER_DATE_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {entry.source === 'checkbox_match' && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Value key</Label>
                        <Select value={entry.value_key || 'hepBStatus'} onValueChange={(v) => set({ value_key: v })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="hepBStatus">hepBStatus</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Equals</Label>
                        {hepbOptions.length > 0 ? (
                            <Select value={entry.equals || ''} onValueChange={(v) => set({ equals: v })}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Choose a value" /></SelectTrigger>
                                <SelectContent position="popper">
                                    {hepbOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label || o.value}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input value={entry.equals || ''} onChange={(e) => set({ equals: e.target.value })} />
                        )}
                    </div>
                </div>
            )}

            {entry.source === 'reference_field' && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Reference index</Label>
                        <Select value={String(entry.index ?? 0)} onValueChange={(v) => set({ index: Number(v) })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent position="popper">
                                {[0, 1, 2, 3].map((i) => <SelectItem key={i} value={String(i)}>Reference {i + 1}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Field</Label>
                        <Select value={entry.field || ''} onValueChange={(v) => set({ field: v })}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a field" /></SelectTrigger>
                            <SelectContent position="popper">
                                {REFERENCE_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function StudioCompanyFormEditor() {
    const { id: companyId, formId } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [form, setForm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [roles, setRoles] = useState([])

    const [title, setTitle] = useState('')
    const [visibleToRoles, setVisibleToRoles] = useState([])
    const [requiresSignature, setRequiresSignature] = useState(true)
    const [adminSignable, setAdminSignable] = useState(false)
    const [savingBasics, setSavingBasics] = useState(false)

    const [content, setContent] = useState([])
    const [savingContent, setSavingContent] = useState(false)

    const [config, setConfig] = useState({})
    const [savingConfig, setSavingConfig] = useState(false)

    const [templateFields, setTemplateFields] = useState([])
    const [templateExists, setTemplateExists] = useState(false)
    const [uploadingTemplate, setUploadingTemplate] = useState(false)
    const [loadingFields, setLoadingFields] = useState(false)

    const [testCaregivers, setTestCaregivers] = useState([])
    const [previewCaregiverId, setPreviewCaregiverId] = useState('')
    const [previewSignature, setPreviewSignature] = useState('')
    const [previewHepBStatus, setPreviewHepBStatus] = useState('')
    const [previewReferences, setPreviewReferences] = useState({})
    const [previewing, setPreviewing] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewFieldValues, setPreviewFieldValues] = useState(null)

    const usesFieldMapping = form && FIELD_MAPPING_TYPES.includes(form.form_type)
    const fieldMapping = config.field_mapping || []
    const usedReferenceIndexes = [...new Set(fieldMapping.filter((e) => e.source === 'reference_field').map((e) => e.index ?? 0))]
    const usesCheckboxMatch = fieldMapping.some((e) => e.source === 'checkbox_match')

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [formResult, rolesResult] = await Promise.all([
                callStudioFunction('studio-get-company-form', { id: formId, companyId }),
                callStudioFunction('studio-list-role-labels', { companyId }),
            ])
            setForm(formResult)
            setTitle(formResult.title)
            setVisibleToRoles(formResult.visible_to_roles || [])
            setRequiresSignature(formResult.requires_signature)
            setAdminSignable(formResult.admin_signable)
            setContent(formResult.content || [])
            setConfig(formResult.config || {})
            setRoles(rolesResult)

            if (FIELD_MAPPING_TYPES.includes(formResult.form_type)) {
                const [fieldsResult, caregiversResult] = await Promise.all([
                    callStudioFunction('studio-list-form-template-fields', { companyId, formKey: formResult.form_key }),
                    callStudioFunction('studio-list-test-caregivers', { companyId }),
                ])
                setTemplateExists(fieldsResult.exists)
                setTemplateFields(fieldsResult.fields || [])
                setTestCaregivers(caregiversResult)
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId, companyId])

    const toggleRole = (roleKey) => {
        setVisibleToRoles((prev) => (prev.includes(roleKey) ? prev.filter((r) => r !== roleKey) : [...prev, roleKey]))
    }

    const saveBasics = async () => {
        setSavingBasics(true)
        try {
            const updated = await callStudioFunction('studio-update-company-form', {
                id: formId, companyId, title, visible_to_roles: visibleToRoles,
                requires_signature: requiresSignature, admin_signable: adminSignable,
            })
            setForm((prev) => ({ ...prev, ...updated }))
            toast.success('Saved')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingBasics(false)
        }
    }

    const saveContent = async () => {
        setSavingContent(true)
        try {
            await callStudioFunction('studio-update-company-form', { id: formId, companyId, content })
            toast.success('Content saved')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingContent(false)
        }
    }

    const saveConfig = async () => {
        setSavingConfig(true)
        try {
            await callStudioFunction('studio-update-company-form', { id: formId, companyId, config })
            toast.success('Configuration saved')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingConfig(false)
        }
    }

    const handleTemplateUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingTemplate(true)
        try {
            const base64 = await fileToBase64(file)
            const result = await callStudioFunction('studio-upload-form-template', {
                companyId, formKey: form.form_key, fileBase64: base64, contentType: file.type,
            })
            setTemplateFields(result.fields)
            setTemplateExists(true)
            if (result.fields.length === 0) {
                toast.warning('Uploaded, but no fillable fields were found — this may be a flattened or non-fillable PDF')
            } else {
                toast.success(`Uploaded — found ${result.fields.length} fillable field(s)`)
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setUploadingTemplate(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const refreshFields = async () => {
        setLoadingFields(true)
        try {
            const result = await callStudioFunction('studio-list-form-template-fields', { companyId, formKey: form.form_key })
            setTemplateExists(result.exists)
            setTemplateFields(result.fields)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoadingFields(false)
        }
    }

    const addMappingRow = () => {
        setConfig((prev) => ({ ...prev, field_mapping: [...(prev.field_mapping || []), { pdf_field: '', source: '' }] }))
    }
    const updateMappingRow = (index, updated) => {
        setConfig((prev) => ({
            ...prev,
            field_mapping: prev.field_mapping.map((e, i) => (i === index ? updated : e)),
        }))
    }
    const removeMappingRow = (index) => {
        setConfig((prev) => ({ ...prev, field_mapping: prev.field_mapping.filter((_, i) => i !== index) }))
    }

    const runPreview = async () => {
        if (!previewCaregiverId) {
            toast.error('Choose a test caregiver first')
            return
        }
        setPreviewing(true)
        setPreviewUrl(null)
        setPreviewFieldValues(null)
        try {
            const references = usedReferenceIndexes.map((idx) => previewReferences[idx] || {})
            const result = await callStudioFunction('studio-preview-fill-form', {
                companyId,
                formKey: form.form_key,
                fieldMapping,
                caregiverId: previewCaregiverId,
                signature: previewSignature,
                hepBStatus: previewHepBStatus,
                references,
            })
            const byteChars = atob(result.pdfBase64)
            const bytes = new Uint8Array(byteChars.length)
            for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
            const blob = new Blob([bytes], { type: 'application/pdf' })
            setPreviewUrl(URL.createObjectURL(blob))
            setPreviewFieldValues(result.fieldValues)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setPreviewing(false)
        }
    }

    if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>
    if (!form) return <p className="text-muted-foreground text-sm">Form not found.</p>

    return (
        <div className="space-y-8">
            <div>
                <button
                    onClick={() => navigate(`/studio/companies/${companyId}/forms`)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to forms
                </button>
                <h1 className="text-xl font-semibold">{form.title}</h1>
                <p className="text-sm text-muted-foreground font-mono">{form.form_key} · {FORM_TYPE_LABELS[form.form_type] || form.form_type}</p>
            </div>

            <SectionCard title="Basics">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Visible to roles</Label>
                    <div className="flex flex-wrap gap-3">
                        {roles.map((role) => (
                            <label key={role.role_key} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={visibleToRoles.includes(role.role_key)} onChange={() => toggleRole(role.role_key)} className="w-4 h-4 rounded border-border" />
                                {role.display_label}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={requiresSignature} onChange={(e) => setRequiresSignature(e.target.checked)} className="w-4 h-4 rounded border-border" />
                        Requires signature
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={adminSignable} onChange={(e) => setAdminSignable(e.target.checked)} className="w-4 h-4 rounded border-border" />
                        Admin-signable
                    </label>
                    {adminSignable && (
                        <p className="text-xs text-amber-700 flex items-center gap-1.5">
                            <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                            The template should also include rep_name, rep_title, rep_signature, and rep_date fields for the
                            admin countersign step to work.
                        </p>
                    )}
                </div>
                <Button onClick={saveBasics} disabled={savingBasics}>{savingBasics ? 'Saving...' : 'Save basics'}</Button>
            </SectionCard>

            {form.form_type === 'signature_only' && (
                <SectionCard title="Content" description="Shown to the caregiver above the signature field">
                    <ContentBlocksEditor content={content} onChange={setContent} />
                    <Button onClick={saveContent} disabled={savingContent}>{savingContent ? 'Saving...' : 'Save content'}</Button>
                </SectionCard>
            )}

            {form.form_type === 'hepb_status' && (
                <SectionCard title="Hep B questionnaire" description="Intro text and vaccine-status options shown to the caregiver">
                    <div className="space-y-1.5">
                        <Label>Intro lines</Label>
                        <StringListEditor items={config.intro || []} onChange={(intro) => setConfig((p) => ({ ...p, intro }))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Status options</Label>
                        <HepBOptionsEditor options={config.options || []} onChange={(options) => setConfig((p) => ({ ...p, options }))} />
                    </div>
                </SectionCard>
            )}

            {!usesFieldMapping && (
                <SectionCard title="Configuration">
                    <p className="text-sm text-amber-700 flex items-center gap-1.5">
                        <TriangleAlert className="w-4 h-4 shrink-0" />
                        This form type's configuration isn't editable in Studio yet.
                    </p>
                    <pre className="text-xs bg-muted/30 rounded-lg p-3 overflow-x-auto">{JSON.stringify({ content: form.content, config: form.config }, null, 2)}</pre>
                </SectionCard>
            )}

            {usesFieldMapping && (
                <>
                    <SectionCard
                        title="PDF template"
                        description={`Storage path: templates/${companyId}/${form.form_key}.pdf`}
                        action={
                            <Button type="button" variant="outline" size="sm" onClick={refreshFields} disabled={loadingFields}>
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </Button>
                        }
                    >
                        <div className="flex items-center gap-3">
                            {templateExists ? (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                    <CircleCheck className="w-3.5 h-3.5" /> Template uploaded — {templateFields.length} field(s) found
                                </span>
                            ) : (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">No template uploaded</span>
                            )}
                            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleTemplateUpload} />
                            <Button type="button" variant="outline" size="sm" disabled={uploadingTemplate} onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-3.5 h-3.5" /> {uploadingTemplate ? 'Uploading...' : 'Upload template'}
                            </Button>
                        </div>
                        {templateExists && templateFields.length === 0 && (
                            <p className="text-xs text-amber-700 flex items-center gap-1.5">
                                <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                                No fillable fields found on the currently uploaded file — it may have been flattened or
                                exported without form fields.
                            </p>
                        )}
                        {templateFields.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {templateFields.map((f) => (
                                    <span key={f} className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">{f}</span>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard title="Field mapping" description="How caregiver/form data fills each PDF field">
                        <div className="space-y-3">
                            {fieldMapping.map((entry, i) => (
                                <FieldMappingRow
                                    key={i}
                                    entry={entry}
                                    onChange={(updated) => updateMappingRow(i, updated)}
                                    onRemove={() => removeMappingRow(i)}
                                    templateFields={templateFields}
                                    hepbOptions={config.options || []}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={addMappingRow}>
                                <Plus className="w-3.5 h-3.5" /> Add mapped field
                            </Button>
                            <Button onClick={saveConfig} disabled={savingConfig}>{savingConfig ? 'Saving...' : 'Save field mapping'}</Button>
                        </div>
                    </SectionCard>

                    <SectionCard title="Preview fill" description="Fill the template with a real test caregiver's data using the mapping above — before saving it">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Test caregiver</Label>
                                <Select
                                    value={previewCaregiverId}
                                    onValueChange={(v) => {
                                        setPreviewCaregiverId(v)
                                        const cg = testCaregivers.find((c) => c.id === v)
                                        if (cg && !previewSignature) setPreviewSignature(cg.name)
                                    }}
                                >
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose a caregiver" /></SelectTrigger>
                                    <SelectContent position="popper">
                                        {testCaregivers.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.role}, {c.status})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {testCaregivers.length === 0 && (
                                    <p className="text-xs text-muted-foreground">No caregivers exist for this company yet.</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sample signature</Label>
                                <Input value={previewSignature} onChange={(e) => setPreviewSignature(e.target.value)} />
                            </div>
                        </div>

                        {usesCheckboxMatch && (
                            <div className="space-y-1.5">
                                <Label>Sample Hep B status</Label>
                                {(config.options || []).length > 0 ? (
                                    <Select value={previewHepBStatus} onValueChange={setPreviewHepBStatus}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Choose a status" /></SelectTrigger>
                                        <SelectContent position="popper">
                                            {config.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label || o.value}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input value={previewHepBStatus} onChange={(e) => setPreviewHepBStatus(e.target.value)} />
                                )}
                            </div>
                        )}

                        {usedReferenceIndexes.map((idx) => (
                            <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Sample reference {idx + 1}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {REFERENCE_FIELDS.map((f) => (
                                        <Input
                                            key={f}
                                            placeholder={f}
                                            value={previewReferences[idx]?.[f] || ''}
                                            onChange={(e) => setPreviewReferences((prev) => ({ ...prev, [idx]: { ...prev[idx], [f]: e.target.value } }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        <Button onClick={runPreview} disabled={previewing || !templateExists}>
                            <PlayCircle className="w-4 h-4" /> {previewing ? 'Filling...' : 'Preview fill'}
                        </Button>
                        {!templateExists && <p className="text-xs text-muted-foreground">Upload a template above first.</p>}

                        {previewUrl && (
                            <div className="space-y-3">
                                <iframe title="Preview fill result" src={previewUrl} className="w-full h-[600px] rounded-lg border border-border" />
                                {previewFieldValues && (
                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-muted-foreground">Field values used</summary>
                                        <pre className="bg-muted/30 rounded-lg p-3 mt-2 overflow-x-auto">{JSON.stringify(previewFieldValues, null, 2)}</pre>
                                    </details>
                                )}
                            </div>
                        )}
                    </SectionCard>
                </>
            )}
        </div>
    )
}
