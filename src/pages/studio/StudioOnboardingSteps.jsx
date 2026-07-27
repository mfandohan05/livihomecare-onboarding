import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

const STEP_TYPE_CATALOG = [
    { stepType: 'welcome', label: 'Welcome', step_key: 'welcome' },
    { stepType: 'upload_documents', label: 'Upload Documents', step_key: 'upload_documents' },
    { stepType: 'personal_information', label: 'Personal Information', step_key: 'personal_information' },
    { stepType: 'orientation', label: 'New Hire Orientation', step_key: 'orientation' },
    { stepType: 'bloodborne_pathogens', label: 'Bloodborne Pathogens', step_key: 'bloodborne_pathogens' },
    { stepType: 'competency_checklist', label: 'Competency Checklist', step_key: 'competency_checklist' },
    { stepType: 'ersp_guide', label: 'How to Use eRSP', step_key: 'ersp_guide' },
    { stepType: 'surepayroll_guide', label: 'How to Use SurePayroll', step_key: 'surepayroll_guide' },
    { stepType: 'forms_agreements', label: 'Forms & Agreements', step_key: 'forms_agreements' },
    {
        stepType: 'tax_forms', label: 'Tax Forms', step_key: 'tax_forms',
        variants: [
            { key: 'standard', label: 'Standard (W-4 employees)', step_name: 'Tax Forms' },
            { key: 'w9', label: 'Contractor (W-9)', step_name: 'Tax Forms (W-9)' },
        ],
    },
    { stepType: 'offer_letter', label: 'Offer Letter', step_key: 'offer_letter' },
    { stepType: 'completed', label: 'Completed!', step_key: 'completed' },
]

const catalogByStepKey = (stepKey) => STEP_TYPE_CATALOG.find((t) => t.step_key === stepKey)

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

function StepDialog({ open, onClose, onSaved, companyId, editingStep, existingStepKeys, roles }) {
    const [stepType, setStepType] = useState('')
    const [taxFormVariant, setTaxFormVariant] = useState('standard')
    const [visibleToRoles, setVisibleToRoles] = useState([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (editingStep) {
            const entry = catalogByStepKey(editingStep.step_key)
            setStepType(entry?.stepType || '')
            if (entry?.variants) {
                const variant = entry.variants.find((v) => v.step_name === editingStep.step_name)
                setTaxFormVariant(variant?.key || 'standard')
            }
            setVisibleToRoles(editingStep.visible_to_roles || [])
        } else {
            setStepType('')
            setTaxFormVariant('standard')
            setVisibleToRoles([])
        }
        setError(null)
    }, [editingStep, open])

    const availableTypes = editingStep
        ? STEP_TYPE_CATALOG
        : STEP_TYPE_CATALOG.filter((t) => !existingStepKeys.includes(t.step_key))

    const selectedEntry = STEP_TYPE_CATALOG.find((t) => t.stepType === stepType)

    const toggleRole = (roleKey) => {
        setVisibleToRoles((prev) =>
            prev.includes(roleKey) ? prev.filter((r) => r !== roleKey) : [...prev, roleKey]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (visibleToRoles.length === 0) {
            setError('Select at least one role')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const result = editingStep
                ? await callStudioFunction('studio-update-onboarding-step', {
                    id: editingStep.id,
                    companyId,
                    taxFormVariant,
                    visible_to_roles: visibleToRoles,
                })
                : await callStudioFunction('studio-create-onboarding-step', {
                    companyId,
                    stepType,
                    taxFormVariant,
                    visible_to_roles: visibleToRoles,
                })
            toast.success(editingStep ? 'Step updated' : 'Step added')
            onSaved(result, !!editingStep)
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
                    <DialogTitle>{editingStep ? 'Edit step' : 'Add step'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Step type</Label>
                        {editingStep ? (
                            <p className="text-sm font-medium py-2">{catalogByStepKey(editingStep.step_key)?.label}</p>
                        ) : (
                            <Select value={stepType} onValueChange={setStepType} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose a step type" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {availableTypes.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">All step types already added</div>
                                    ) : (
                                        availableTypes.map((t) => (
                                            <SelectItem key={t.stepType} value={t.stepType}>{t.label}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {selectedEntry?.variants && (
                        <div className="space-y-1.5">
                            <Label>Tax form variant</Label>
                            <div className="space-y-2">
                                {selectedEntry.variants.map((v) => (
                                    <label key={v.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="radio"
                                            name="taxFormVariant"
                                            checked={taxFormVariant === v.key}
                                            onChange={() => setTaxFormVariant(v.key)}
                                        />
                                        {v.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label>Visible to roles</Label>
                        <div className="flex flex-wrap gap-3">
                            {roles.map((role) => (
                                <label key={role.role_key} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visibleToRoles.includes(role.role_key)}
                                        onChange={() => toggleRole(role.role_key)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    {role.display_label}
                                </label>
                            ))}
                        </div>
                        {roles.length === 0 && (
                            <p className="text-xs text-muted-foreground">No roles defined for this company yet — add one first.</p>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving || (!editingStep && !stepType)}>
                            {saving ? 'Saving...' : editingStep ? 'Save changes' : 'Add step'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioOnboardingSteps() {
    const { id: companyId } = useParams()
    const navigate = useNavigate()
    const [steps, setSteps] = useState([])
    const [roles, setRoles] = useState([])
    const [inProgressCount, setInProgressCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingStep, setEditingStep] = useState(null)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [reordering, setReordering] = useState(null)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [stepsResult, rolesResult] = await Promise.all([
                callStudioFunction('studio-list-onboarding-steps', { companyId }),
                callStudioFunction('studio-list-role-labels', { companyId }),
            ])
            setSteps(stepsResult.steps)
            setInProgressCount(stepsResult.in_progress_caregiver_count)
            setRoles(rolesResult)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [companyId])

    const roleLabel = (roleKey) => roles.find((r) => r.role_key === roleKey)?.display_label || roleKey

    const openCreate = () => {
        setEditingStep(null)
        setDialogOpen(true)
    }

    const openEdit = (step) => {
        setEditingStep(step)
        setDialogOpen(true)
    }

    const handleSaved = (result, wasEdit) => {
        setDialogOpen(false)
        if (wasEdit) {
            setSteps((prev) => prev.map((s) => (s.id === result.id ? result : s)))
        } else {
            setSteps((prev) => [...prev, result].sort((a, b) => a.step_order - b.step_order))
        }
    }

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await callStudioFunction('studio-delete-onboarding-step', { id: pendingDelete.id, companyId })
            setSteps((prev) => prev.filter((s) => s.id !== pendingDelete.id))
            toast.success('Step deleted')
            setPendingDelete(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const move = async (step, direction) => {
        setReordering(step.id)
        try {
            const updated = await callStudioFunction('studio-reorder-onboarding-step', {
                companyId,
                stepId: step.id,
                direction,
            })
            setSteps(updated)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setReordering(null)
        }
    }

    return (
        <div>
            <button
                onClick={() => navigate(`/studio/companies/${companyId}`)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to company
            </button>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold">Onboarding steps</h1>
                    <p className="text-sm text-muted-foreground">Order, roles, and visibility of this company's onboarding flow</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add step
                </Button>
            </div>

            {inProgressCount > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                    <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        {inProgressCount} caregiver{inProgressCount === 1 ? ' is' : 's are'} currently mid-onboarding at this
                        company. Their saved progress refers to steps by position (1st, 2nd, 3rd...), not by name — adding,
                        removing, or reordering steps changes what those positions mean and can desync an in-progress
                        caregiver's saved place in the flow.
                    </p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-6 py-3"><span className="sr-only">Reorder</span></th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Step</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Visible to</th>
                            <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td>
                            </tr>
                        ) : steps.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">No steps yet.</td>
                            </tr>
                        ) : (
                            steps.map((step, index) => (
                                <tr key={step.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                type="button"
                                                disabled={index === 0 || reordering === step.id}
                                                onClick={() => move(step, 'up')}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === steps.length - 1 || reordering === step.id}
                                                onClick={() => move(step, 'down')}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-sm">{catalogByStepKey(step.step_key)?.label || step.step_name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{step.step_key}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {(step.visible_to_roles || []).map((r) => (
                                                <span key={r} className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {roleLabel(r)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(step)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => setPendingDelete(step)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <StepDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={handleSaved}
                companyId={companyId}
                editingStep={editingStep}
                existingStepKeys={steps.map((s) => s.step_key)}
                roles={roles}
            />

            <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete "{pendingDelete && (catalogByStepKey(pendingDelete.step_key)?.label || pendingDelete.step_name)}"?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the step from this company's onboarding flow immediately. This can't be undone.
                            {inProgressCount > 0 && ' Caregivers currently mid-onboarding may see their step numbering shift.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
