import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import TrainingStatusBadge from '@/components/training/TrainingStatusBadge'
import { formatTrainingDate, trainingCaregiver } from '@/lib/training'

export default function MyTraining() {
    const navigate = useNavigate()
    const [trainings, setTrainings] = useState(null)

    useEffect(() => {
        let cancelled = false
        trainingCaregiver('list')
            .then((rows) => { if (!cancelled) setTrainings(rows) })
            .catch((err) => {
                toast.error(err.message)
                if (!cancelled) setTrainings([])
            })
        return () => { cancelled = true }
    }, [])

    const passedCount = (trainings || []).filter((t) => t.status === 'passed').length

    return (
        <>
            <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-5 h-5 text-[var(--primary-color)]" />
                    <h1 className="text-xl font-semibold">My Training</h1>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                    {trainings && trainings.length > 0
                        ? `${passedCount} of ${trainings.length} trainings complete.`
                        : 'Trainings assigned to you will appear here.'}
                </p>

                {trainings === null ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : trainings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">You have no trainings assigned right now.</p>
                ) : (
                    <div className="space-y-3">
                        {trainings.map((t) => (
                            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border">
                                <div className="min-w-0 space-y-1.5">
                                    <p className="text-sm font-medium">{t.title}</p>
                                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <TrainingStatusBadge row={t} />
                                        {t.status === 'passed' && t.completed_at ? (
                                            <span className="text-xs text-muted-foreground">Completed {formatTrainingDate(t.completed_at)}</span>
                                        ) : t.due_date ? (
                                            <span className="text-xs text-muted-foreground">Due {formatTrainingDate(t.due_date)}</span>
                                        ) : null}
                                    </div>
                                </div>
                                <Button
                                    variant={t.status === 'passed' ? 'outline' : 'default'}
                                    onClick={() => navigate(`/my-training/${t.training_id}`)}
                                    className={t.status === 'passed' ? '' : 'bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white'}
                                >
                                    {t.status === 'passed' ? 'Review' : t.status === 'in_progress' ? 'Continue' : 'Start'}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
