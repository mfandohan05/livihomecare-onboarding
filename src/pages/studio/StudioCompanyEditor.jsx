import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import StateSelect from '@/components/global/StateSelect'
import { ArrowLeft, X, Plus, Upload, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const Field = ({ label, id, children, hint }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
)

async function callStudioFunction(name, body) {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke(name, {
        body,
        headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export default function StudioCompanyEditor() {
    const { id } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [company, setCompany] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [emailDraft, setEmailDraft] = useState('')
    const [einDraft, setEinDraft] = useState('')
    const [editingEin, setEditingEin] = useState(false)

    const fetchCompany = async () => {
        setLoading(true)
        try {
            const data = await callStudioFunction('studio-get-company', { companyId: id })
            setCompany({ ...data, admin_notification_emails: data.admin_notification_emails || [] })
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompany()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const update = (key) => (e) => setCompany((prev) => ({ ...prev, [key]: e.target.value }))

    const addEmail = () => {
        const email = emailDraft.trim()
        if (!email) return
        if (company.admin_notification_emails.includes(email)) {
            setEmailDraft('')
            return
        }
        setCompany((prev) => ({ ...prev, admin_notification_emails: [...prev.admin_notification_emails, email] }))
        setEmailDraft('')
    }

    const removeEmail = (email) => {
        setCompany((prev) => ({
            ...prev,
            admin_notification_emails: prev.admin_notification_emails.filter((e) => e !== email),
        }))
    }

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingLogo(true)
        try {
            const base64 = await fileToBase64(file)
            const result = await callStudioFunction('studio-upload-logo', {
                companyId: id,
                fileBase64: base64,
                contentType: file.type,
            })
            setCompany((prev) => ({ ...prev, logo_path: result.logo_path }))
            toast.success('Logo uploaded')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setUploadingLogo(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                companyId: id,
                company_name: company.company_name,
                legal_name: company.legal_name,
                dba_name: company.dba_name,
                primary_color: company.primary_color,
                secondary_bg_color: company.secondary_bg_color,
                logo_path: company.logo_path,
                address_line1: company.address_line1,
                city: company.city,
                state: company.state,
                zip: company.zip,
                phone: company.phone,
                support_email: company.support_email,
                admin_notification_emails: company.admin_notification_emails,
            }
            if (editingEin && einDraft.trim()) {
                payload.ein = einDraft.trim()
            }

            const updated = await callStudioFunction('studio-update-company', payload)
            setCompany({ ...updated, admin_notification_emails: updated.admin_notification_emails || [] })
            setEinDraft('')
            setEditingEin(false)
            toast.success('Company saved')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <p className="text-muted-foreground text-sm">Loading...</p>
    }

    if (!company) {
        return <p className="text-muted-foreground text-sm">Company not found.</p>
    }

    const logoUrl = company.logo_path
        ? supabase.storage.from('company_assets').getPublicUrl(company.logo_path).data.publicUrl
        : null

    return (
        <div>
            <button
                onClick={() => navigate('/studio/companies')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to companies
            </button>

            <h1 className="text-xl font-semibold mb-6">{company.company_name}</h1>

            <div className="bg-white rounded-xl border border-border p-4 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Roles</p>
                    <p className="text-xs text-muted-foreground">Manage role labels and required tax forms</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/studio/companies/${id}/roles`)}>
                    Manage roles
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border p-4 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Onboarding steps</p>
                    <p className="text-xs text-muted-foreground">Order, roles, and visibility of this company's onboarding flow</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/studio/companies/${id}/steps`)}>
                    Manage steps
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border p-4 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Forms</p>
                    <p className="text-xs text-muted-foreground">Company forms, field mappings, and signable templates</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/studio/companies/${id}/forms`)}>
                    Manage forms
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border p-4 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Offer letter templates</p>
                    <p className="text-xs text-muted-foreground">Per-role offer letters, field checks, and preview fill</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/studio/companies/${id}/offer-letters`)}>
                    Manage offer letters
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border p-4 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Orientation</p>
                    <p className="text-xs text-muted-foreground">Sections, slides, and quiz questions</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/studio/companies/${id}/orientation`)}>
                    Manage orientation
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <section className="bg-white rounded-xl border border-border p-6 space-y-4">
                    <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Identity</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Company name" id="company_name">
                            <Input id="company_name" value={company.company_name || ''} onChange={update('company_name')} required />
                        </Field>
                        <Field label="Legal name" id="legal_name" hint="Used on W-4/I-9 employer fields">
                            <Input id="legal_name" value={company.legal_name || ''} onChange={update('legal_name')} />
                        </Field>
                        <Field label="DBA name" id="dba_name">
                            <Input id="dba_name" value={company.dba_name || ''} onChange={update('dba_name')} />
                        </Field>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Logo</Label>
                        <div className="flex items-center gap-4">
                            {logoUrl ? (
                                <img src={logoUrl} alt="" className="w-16 h-16 rounded object-contain border border-border" />
                            ) : (
                                <div className="w-16 h-16 rounded bg-muted border border-border" />
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                className="hidden"
                                onChange={handleLogoUpload}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                disabled={uploadingLogo}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4" />
                                {uploadingLogo ? 'Uploading...' : 'Upload logo'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Primary color" id="primary_color">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={company.primary_color || '#000000'}
                                    onChange={update('primary_color')}
                                    className="w-9 h-9 rounded border border-border shrink-0"
                                />
                                <Input id="primary_color" value={company.primary_color || ''} onChange={update('primary_color')} placeholder="#000000" />
                            </div>
                        </Field>
                        <Field label="Secondary background color" id="secondary_bg_color">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={company.secondary_bg_color || '#000000'}
                                    onChange={update('secondary_bg_color')}
                                    className="w-9 h-9 rounded border border-border shrink-0"
                                />
                                <Input id="secondary_bg_color" value={company.secondary_bg_color || ''} onChange={update('secondary_bg_color')} placeholder="#000000" />
                            </div>
                        </Field>
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-border p-6 space-y-4">
                    <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Address & contact</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Address line 1" id="address_line1">
                            <Input id="address_line1" value={company.address_line1 || ''} onChange={update('address_line1')} />
                        </Field>
                        <Field label="City" id="city">
                            <Input id="city" value={company.city || ''} onChange={update('city')} />
                        </Field>
                        <Field label="State" id="state">
                            <StateSelect id="state" value={company.state || ''} onChange={update('state')} />
                        </Field>
                        <Field label="ZIP" id="zip">
                            <Input id="zip" value={company.zip || ''} onChange={update('zip')} />
                        </Field>
                        <Field label="Phone" id="phone">
                            <Input id="phone" value={company.phone || ''} onChange={update('phone')} />
                        </Field>
                        <Field label="Support email" id="support_email">
                            <Input id="support_email" type="email" value={company.support_email || ''} onChange={update('support_email')} />
                        </Field>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Admin notification emails</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {company.admin_notification_emails.map((email) => (
                                <span key={email} className="flex items-center gap-1.5 bg-muted rounded-full pl-3 pr-1 py-1 text-sm">
                                    {email}
                                    <button
                                        type="button"
                                        onClick={() => removeEmail(email)}
                                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-background/80 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                value={emailDraft}
                                onChange={(e) => setEmailDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addEmail()
                                    }
                                }}
                                placeholder="add an email and press Enter"
                            />
                            <Button type="button" variant="outline" onClick={addEmail}>
                                <Plus className="w-4 h-4" />
                                Add
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-border p-6 space-y-4">
                    <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Employer EIN</h2>
                    <p className="text-xs text-muted-foreground">
                        The EIN is encrypted before it is ever stored. It is never displayed here, in this
                        form, or anywhere else in Studio once set — only whether one is on file.
                    </p>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${company.has_ein ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                            {company.has_ein ? 'EIN on file' : 'No EIN on file'}
                        </span>
                        {!editingEin && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingEin(true)}>
                                {company.has_ein ? 'Replace EIN' : 'Set EIN'}
                            </Button>
                        )}
                    </div>
                    {editingEin && (
                        <div className="flex items-center gap-2 max-w-sm">
                            <Input
                                type="text"
                                value={einDraft}
                                onChange={(e) => setEinDraft(e.target.value)}
                                placeholder="XX-XXXXXXX"
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setEditingEin(false)
                                    setEinDraft('')
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </section>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
