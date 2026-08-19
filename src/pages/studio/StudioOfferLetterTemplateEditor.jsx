import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, X, ChevronUp, ChevronDown, Upload, RefreshCw, PlayCircle, TriangleAlert, CircleCheck } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction } from '@/lib/studio'
import { OFFER_LETTER_PLACEHOLDERS } from '@/lib/offerLetterConstants'

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

function move(list, index, dir) {
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= list.length) return list
    const copy = [...list]
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
    return copy
}

function OfferLetterContentEditor({ content, onChange }) {
    const addBlock = (type) => {
        const block = type === 'list' ? { type: 'list', items: [''] }
            : type === 'numbered_list' ? { type: 'numbered_list', items: [{ text: '', sub_items: [] }] }
                : { type, text: '' }
        onChange([...content, block])
    }
    const updateBlock = (index, updates) => onChange(content.map((b, i) => (i === index ? { ...b, ...updates } : b)))
    const removeBlock = (index) => onChange(content.filter((_, i) => i !== index))

    return (
        <div className="space-y-3">
            {content.length === 0 && <p className="text-sm text-muted-foreground">No content blocks yet.</p>}
            {content.map((block, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase text-muted-foreground">{block.type}</span>
                        <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon-xs" disabled={i === 0} onClick={() => onChange(move(content, i, 'up'))}>
                                <ChevronUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon-xs" disabled={i === content.length - 1} onClick={() => onChange(move(content, i, 'down'))}>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeBlock(i)}>
                                <X className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                        </div>
                    </div>

                    {block.type === 'list' && (
                        <div className="space-y-2">
                            {(block.items || []).map((item, j) => (
                                <div key={j} className="flex items-center gap-2">
                                    <Input value={item} onChange={(e) => {
                                        const items = [...block.items]; items[j] = e.target.value; updateBlock(i, { items })
                                    }} />
                                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => updateBlock(i, { items: block.items.filter((_, k) => k !== j) })}>
                                        <X className="w-3.5 h-3.5 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => updateBlock(i, { items: [...(block.items || []), ''] })}>
                                <Plus className="w-3.5 h-3.5" /> Add line
                            </Button>
                        </div>
                    )}

                    {block.type === 'numbered_list' && (
                        <div className="space-y-3">
                            {(block.items || []).map((item, j) => (
                                <div key={j} className="border border-dashed border-border rounded p-2 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Numbered item text"
                                            value={item.text || ''}
                                            onChange={(e) => {
                                                const items = [...block.items]; items[j] = { ...items[j], text: e.target.value }; updateBlock(i, { items })
                                            }}
                                        />
                                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => updateBlock(i, { items: block.items.filter((_, k) => k !== j) })}>
                                            <X className="w-3.5 h-3.5 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="pl-4 space-y-1.5">
                                        {(item.sub_items || []).map((sub, k) => (
                                            <div key={k} className="flex items-center gap-2">
                                                <Input
                                                    className="text-sm"
                                                    placeholder="Sub-item"
                                                    value={sub}
                                                    onChange={(e) => {
                                                        const items = [...block.items]
                                                        const subItems = [...(items[j].sub_items || [])]
                                                        subItems[k] = e.target.value
                                                        items[j] = { ...items[j], sub_items: subItems }
                                                        updateBlock(i, { items })
                                                    }}
                                                />
                                                <Button type="button" variant="ghost" size="icon-xs" onClick={() => {
                                                    const items = [...block.items]
                                                    items[j] = { ...items[j], sub_items: (items[j].sub_items || []).filter((_, m) => m !== k) }
                                                    updateBlock(i, { items })
                                                }}>
                                                    <X className="w-3 h-3 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="xs" onClick={() => {
                                            const items = [...block.items]
                                            items[j] = { ...items[j], sub_items: [...(items[j].sub_items || []), ''] }
                                            updateBlock(i, { items })
                                        }}>
                                            <Plus className="w-3 h-3" /> Add sub-item
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => updateBlock(i, { items: [...(block.items || []), { text: '', sub_items: [] }] })}>
                                <Plus className="w-3.5 h-3.5" /> Add numbered item
                            </Button>
                        </div>
                    )}

                    {block.type !== 'list' && block.type !== 'numbered_list' && (
                        block.type === 'heading' ? (
                            <Input
                                value={block.text || ''}
                                onChange={(e) => updateBlock(i, { text: e.target.value })}
                                placeholder="Heading text"
                            />
                        ) : (
                            <Textarea
                                value={block.text || ''}
                                onChange={(e) => updateBlock(i, { text: e.target.value })}
                                placeholder="Paragraph text"
                                rows={4}
                            />
                        )
                    )}
                </div>
            ))}
            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('heading')}><Plus className="w-3.5 h-3.5" /> Heading</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('text')}><Plus className="w-3.5 h-3.5" /> Paragraph</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('list')}><Plus className="w-3.5 h-3.5" /> Bulleted list</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock('numbered_list')}><Plus className="w-3.5 h-3.5" /> Numbered list</Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Any text field here supports placeholders: {OFFER_LETTER_PLACEHOLDERS.join(', ')}
            </p>
        </div>
    )
}

export default function StudioOfferLetterTemplateEditor() {
    const { id: companyId, templateId } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [roles, setRoles] = useState([])

    const [title, setTitle] = useState('')
    const [requiresAddress, setRequiresAddress] = useState(false)
    const [usesCustomPdf, setUsesCustomPdf] = useState(false)
    const [savingBasics, setSavingBasics] = useState(false)

    const [content, setContent] = useState([])
    const [savingContent, setSavingContent] = useState(false)

    const [acknowledgmentText, setAcknowledgmentText] = useState('')
    const [savingAck, setSavingAck] = useState(false)

    const [templateFields, setTemplateFields] = useState([])
    const [knownFieldsPresent, setKnownFieldsPresent] = useState([])
    const [templateExists, setTemplateExists] = useState(false)
    const [uploadingTemplate, setUploadingTemplate] = useState(false)
    const [loadingFields, setLoadingFields] = useState(false)

    const [testCaregivers, setTestCaregivers] = useState([])
    const [previewCaregiverId, setPreviewCaregiverId] = useState('')
    const [previewSignature, setPreviewSignature] = useState('')
    const [previewAddress, setPreviewAddress] = useState('')
    const [previewCity, setPreviewCity] = useState('')
    const [previewState, setPreviewState] = useState('')
    const [previewZip, setPreviewZip] = useState('')
    const [previewing, setPreviewing] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [templateResult, rolesResult] = await Promise.all([
                callStudioFunction('studio-get-offer-letter-template', { id: templateId, companyId }),
                callStudioFunction('studio-list-role-labels', { companyId }),
            ])
            setTemplate(templateResult)
            setTitle(templateResult.title)
            setRequiresAddress(templateResult.requires_address)
            setUsesCustomPdf(templateResult.uses_custom_pdf)
            setContent(templateResult.content || [])
            setAcknowledgmentText(templateResult.acknowledgment_text || '')
            setRoles(rolesResult)

            if (!templateResult.uses_custom_pdf) {
                const [fieldsResult, caregiversResult] = await Promise.all([
                    callStudioFunction('studio-list-offer-letter-template-fields', { companyId, roleKey: templateResult.role_key }),
                    callStudioFunction('studio-list-test-caregivers', { companyId }),
                ])
                setTemplateExists(fieldsResult.exists)
                setTemplateFields(fieldsResult.fields || [])
                setKnownFieldsPresent(fieldsResult.knownFieldsPresent || [])
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
    }, [templateId, companyId])

    const saveBasics = async () => {
        setSavingBasics(true)
        try {
            const updated = await callStudioFunction('studio-update-offer-letter-template', {
                id: templateId, companyId, title, requires_address: requiresAddress, uses_custom_pdf: usesCustomPdf,
            })
            setTemplate((prev) => ({ ...prev, ...updated }))
            toast.success('Saved')
            if (updated.uses_custom_pdf !== template.uses_custom_pdf) fetchAll()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingBasics(false)
        }
    }

    const saveContent = async () => {
        setSavingContent(true)
        try {
            await callStudioFunction('studio-update-offer-letter-template', { id: templateId, companyId, content })
            toast.success('Content saved')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingContent(false)
        }
    }

    const saveAcknowledgment = async () => {
        setSavingAck(true)
        try {
            await callStudioFunction('studio-update-offer-letter-template', { id: templateId, companyId, acknowledgment_text: acknowledgmentText })
            toast.success('Acknowledgment text saved')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingAck(false)
        }
    }

    const handleTemplateUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingTemplate(true)
        try {
            const base64 = await fileToBase64(file)
            const result = await callStudioFunction('studio-upload-offer-letter-template', {
                companyId, roleKey: template.role_key, fileBase64: base64, contentType: file.type,
            })
            setTemplateFields(result.fields)
            setKnownFieldsPresent(result.knownFieldsPresent)
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
            const result = await callStudioFunction('studio-list-offer-letter-template-fields', { companyId, roleKey: template.role_key })
            setTemplateExists(result.exists)
            setTemplateFields(result.fields)
            setKnownFieldsPresent(result.knownFieldsPresent || [])
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoadingFields(false)
        }
    }

    const runPreview = async () => {
        if (!previewCaregiverId) {
            toast.error('Choose a test caregiver first')
            return
        }
        setPreviewing(true)
        setPreviewUrl(null)
        try {
            const result = await callStudioFunction('studio-preview-fill-offer-letter', {
                companyId, roleKey: template.role_key, caregiverId: previewCaregiverId,
                signature: previewSignature, address: previewAddress, city: previewCity, state: previewState, zip: previewZip,
            })
            const byteChars = atob(result.pdfBase64)
            const bytes = new Uint8Array(byteChars.length)
            for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
            const blob = new Blob([bytes], { type: 'application/pdf' })
            setPreviewUrl(URL.createObjectURL(blob))
        } catch (err) {
            toast.error(err.message)
        } finally {
            setPreviewing(false)
        }
    }

    if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>
    if (!template) return <p className="text-muted-foreground text-sm">Template not found.</p>

    const missingKnownFields = templateFields.length > 0
        ? knownFieldsPresent.length === 0
        : false

    return (
        <div className="space-y-8">
            <div>
                <button
                    onClick={() => navigate(`/studio/companies/${companyId}/offer-letters`)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to offer letters
                </button>
                <h1 className="text-xl font-semibold">{template.title}</h1>
                <p className="text-sm text-muted-foreground">
                    {roles.find((r) => r.role_key === template.role_key)?.display_label || template.role_key}
                    {' '}<span className="font-mono">({template.role_key})</span>
                </p>
            </div>

            <SectionCard title="Basics">
                <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={requiresAddress} onChange={(e) => setRequiresAddress(e.target.checked)} className="w-4 h-4 rounded border-border" />
                        Requires mailing address
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={usesCustomPdf} onChange={(e) => setUsesCustomPdf(e.target.checked)} className="w-4 h-4 rounded border-border" />
                        Uses a custom, per-caregiver PDF instead
                    </label>
                </div>
                <Button onClick={saveBasics} disabled={savingBasics}>{savingBasics ? 'Saving...' : 'Save basics'}</Button>
            </SectionCard>

            {usesCustomPdf ? (
                <SectionCard title="Custom PDF mode">
                    <p className="text-sm text-muted-foreground">
                        This role's offer letter is a per-caregiver PDF uploaded individually — not a company-wide template.
                        There's nothing to configure here; content, acknowledgment text, template upload, and Preview Fill
                        below only apply when this toggle is off.
                    </p>
                </SectionCard>
            ) : (
                <>
                    <SectionCard title="Content" description="Shown to the caregiver above the signature field">
                        <OfferLetterContentEditor content={content} onChange={setContent} />
                        <Button onClick={saveContent} disabled={savingContent}>{savingContent ? 'Saving...' : 'Save content'}</Button>
                    </SectionCard>

                    <SectionCard title="Acknowledgment text" description="Shown just above the signature field">
                        <Textarea value={acknowledgmentText} onChange={(e) => setAcknowledgmentText(e.target.value)} rows={3} />
                        <p className="text-xs text-muted-foreground">Placeholders: {OFFER_LETTER_PLACEHOLDERS.join(', ')}</p>
                        <Button onClick={saveAcknowledgment} disabled={savingAck}>{savingAck ? 'Saving...' : 'Save acknowledgment text'}</Button>
                    </SectionCard>

                    <SectionCard
                        title="PDF template"
                        description={`Storage path: templates/${companyId}/offer_letter_${template.role_key}.pdf`}
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
                        {templateExists && missingKnownFields && (
                            <p className="text-xs text-amber-700 flex items-center gap-1.5">
                                <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                                None of the standard offer-letter field names (employee_name, hourly_rate, etc.) were found
                                on this file — it likely won't fill correctly.
                            </p>
                        )}
                        {templateFields.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {templateFields.map((f) => (
                                    <span key={f} className={`text-xs font-mono px-2 py-0.5 rounded ${knownFieldsPresent.includes(f) ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>{f}</span>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard title="Preview fill" description="Fill the template with a real test caregiver's data before relying on it">
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
                                {testCaregivers.length === 0 && <p className="text-xs text-muted-foreground">No caregivers exist for this company yet.</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sample signature</Label>
                                <Input value={previewSignature} onChange={(e) => setPreviewSignature(e.target.value)} />
                            </div>
                        </div>

                        {requiresAddress && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <Input placeholder="Address" value={previewAddress} onChange={(e) => setPreviewAddress(e.target.value)} className="col-span-2 sm:col-span-1" />
                                <Input placeholder="City" value={previewCity} onChange={(e) => setPreviewCity(e.target.value)} />
                                <Input placeholder="State" value={previewState} onChange={(e) => setPreviewState(e.target.value)} />
                                <Input placeholder="Zip" value={previewZip} onChange={(e) => setPreviewZip(e.target.value)} />
                            </div>
                        )}

                        <Button onClick={runPreview} disabled={previewing || !templateExists}>
                            <PlayCircle className="w-4 h-4" /> {previewing ? 'Filling...' : 'Preview fill'}
                        </Button>
                        {!templateExists && <p className="text-xs text-muted-foreground">Upload a template above first.</p>}

                        {previewUrl && (
                            <iframe title="Preview fill result" src={previewUrl} className="w-full h-[600px] rounded-lg border border-border" />
                        )}
                    </SectionCard>
                </>
            )}
        </div>
    )
}
