import { useParams } from 'react-router-dom'
import { useCompany } from '@/context/CompanyContext'
import TrainingManager from '@/components/training/TrainingManager'
import TrainingEditor from '@/components/training/TrainingEditor'

export function AdminTrainings() {
    const { companyId } = useCompany()
    return <TrainingManager companyId={companyId} basePath="/admin/training" />
}

export function AdminTrainingEditor() {
    const { companyId, loading } = useCompany()
    const { trainingId } = useParams()
    if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>
    return (
        <TrainingEditor
            key={trainingId || 'new'}
            companyId={companyId}
            trainingId={trainingId === 'new' ? null : trainingId}
            backPath="/admin/training"
        />
    )
}
