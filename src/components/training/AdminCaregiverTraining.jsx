import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import TrainingStatusBadge from '@/components/training/TrainingStatusBadge'
import { formatTrainingDate, trainingAdmin } from '@/lib/training'

export default function AdminCaregiverTraining({ caregiverId, companyId }) {
    const [rows, setRows] = useState(null)
    const [pending, setPending] = useState(null)
    const [saving, setSaving] = useState(false)

    const load = async () => {
        try {
            setRows(await trainingAdmin('caregiver-status', { companyId, caregiverId }))
        } catch (err) {
            toast.error(err.message)
            setRows([])
        }
    }

    useEffect(() => {
        if (companyId) load()
    }, [caregiverId, companyId])

    const confirm = async () => {
        setSaving(true)
        try {
            await trainingAdmin(pending.action, { companyId, caregiverId, trainingId: pending.row.training_id })
            toast.success(pending.action === 'mark-complete' ? 'Marked complete' : 'Training reset')
            setPending(null)
            await load()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Training</h2>
            {rows === null ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trainings assigned</p>
            ) : (
                <div className="space-y-2">
                    {rows.map((row) => (
                        <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border">
                            <div className="min-w-0 space-y-1">
                                <p className="text-sm font-medium">{row.title}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <TrainingStatusBadge row={row} />
                                    {row.status === 'passed' ? (
                                        <span className="text-xs text-muted-foreground">
                                            {row.marked_by_admin
                                                ? `Marked complete by ${row.marked_by_name || 'an admin'}`
                                                : `Completed${row.last_total ? ` (${row.last_score}/${row.last_total})` : ''}`}
                                            {row.completed_at && ` on ${formatTrainingDate(row.completed_at)}`}
                                        </span>
                                    ) : row.due_date ? (
                                        <span className="text-xs text-muted-foreground">Due {formatTrainingDate(row.due_date)}</span>
                                    ) : null}
                                </div>
                            </div>
                            {row.status === 'passed' ? (
                                <Button variant="outline" size="sm" onClick={() => setPending({ action: 'reset', row })}>
                                    Reset
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setPending({ action: 'mark-complete', row })}>
                                    Mark complete
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pending?.action === 'mark-complete' ? 'Mark training complete?' : 'Reset training?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pending?.action === 'mark-complete'
                                ? `This records "${pending?.row.title}" as passed for this employee without them taking it.`
                                : `This clears this employee's progress and result on "${pending?.row.title}" so they can take it again.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); confirm() }}>
                            {saving ? 'Saving...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
