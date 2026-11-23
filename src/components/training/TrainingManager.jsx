import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { trainingAdmin } from '@/lib/training'

export default function TrainingManager({ companyId, basePath, backPath, backLabel }) {
    const navigate = useNavigate()
    const [trainings, setTrainings] = useState([])
    const [loading, setLoading] = useState(true)
    const [moving, setMoving] = useState(null)

    const load = async () => {
        try {
            setTrainings(await trainingAdmin('list', { companyId }))
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (companyId) load()
    }, [companyId])

    const move = async (training, direction) => {
        setMoving(training.id)
        try {
            await trainingAdmin('reorder', { companyId, id: training.id, direction })
            await load()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setMoving(null)
        }
    }

    return (
        <div>
            {backPath && (
                <button
                    onClick={() => navigate(backPath)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {backLabel}
                </button>
            )}

            <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Training</h1>
                    <p className="text-sm text-muted-foreground">Slides and quizzes employees complete after onboarding</p>
                </div>
                <Button onClick={() => navigate(`${basePath}/new`)}>
                    <Plus className="w-4 h-4" />
                    New training
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-6 py-3"><span className="sr-only">Reorder</span></th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Passing score</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Slides</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Questions</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Due</th>
                            <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
                        ) : trainings.length === 0 ? (
                            <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">No trainings yet.</td></tr>
                        ) : (
                            trainings.map((t, index) => (
                                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <button type="button" disabled={index === 0 || moving === t.id} onClick={() => move(t, 'up')} className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button type="button" disabled={index === trainings.length - 1 || moving === t.id} onClick={() => move(t, 'down')} className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-sm">{t.title}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={t.is_published ? 'text-[#577C09] font-medium' : 'text-muted-foreground'}>
                                            {t.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{t.passing_score}%</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{t.slide_count}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{t.question_count}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{t.due_days ? `${t.due_days} days` : 'None'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end">
                                            <Button variant="ghost" size="icon-sm" onClick={() => navigate(`${basePath}/${t.id}`)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
