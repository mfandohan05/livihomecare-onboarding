import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

const Field = ({ label, id, children, required }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {children}
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

function NewCompanyDialog({ open, onClose, onCreated }) {
    const [form, setForm] = useState({ company_name: '', legal_name: '', phone: '', support_email: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

    const handleCreate = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            const company = await callStudioFunction('studio-create-company', form)
            toast.success('Company created')
            onCreated(company)
            setForm({ company_name: '', legal_name: '', phone: '', support_email: '' })
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                    <Field label="Company name" id="company_name" required>
                        <Input id="company_name" value={form.company_name} onChange={update('company_name')} required />
                    </Field>
                    <Field label="Legal name" id="legal_name">
                        <Input id="legal_name" value={form.legal_name} onChange={update('legal_name')} />
                    </Field>
                    <Field label="Phone" id="phone">
                        <Input id="phone" value={form.phone} onChange={update('phone')} />
                    </Field>
                    <Field label="Support email" id="support_email">
                        <Input id="support_email" type="email" value={form.support_email} onChange={update('support_email')} />
                    </Field>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Creating...' : 'Create company'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioCompanies() {
    const navigate = useNavigate()
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    const fetchCompanies = async () => {
        setLoading(true)
        try {
            const data = await callStudioFunction('studio-list-companies', {})
            setCompanies(data)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold">Companies</h1>
                    <p className="text-sm text-muted-foreground">Manage every company on the platform</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New company
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Legal name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Support email</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">EIN</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td>
                            </tr>
                        ) : companies.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">No companies yet.</td>
                            </tr>
                        ) : (
                            companies.map((company) => (
                                <tr
                                    key={company.company_id}
                                    onClick={() => navigate(`/studio/companies/${company.company_id}`)}
                                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {company.logo_path ? (
                                                <img
                                                    src={supabase.storage.from('company_assets').getPublicUrl(company.logo_path).data.publicUrl}
                                                    alt=""
                                                    className="w-8 h-8 rounded object-contain border border-border shrink-0"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-muted shrink-0" />
                                            )}
                                            <p className="font-medium text-sm">{company.company_name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{company.legal_name || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{company.support_email || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{company.phone || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${company.has_ein ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                            {company.has_ein ? 'Set' : 'Not set'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <NewCompanyDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreated={(company) => {
                    setDialogOpen(false)
                    navigate(`/studio/companies/${company.company_id}`)
                }}
            />
        </div>
    )
}
