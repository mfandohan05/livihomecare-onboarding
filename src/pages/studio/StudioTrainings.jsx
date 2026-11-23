import { useParams } from 'react-router-dom'
import TrainingManager from '@/components/training/TrainingManager'
import TrainingEditor from '@/components/training/TrainingEditor'

export function StudioTrainings() {
    const { id: companyId } = useParams()
    return (
        <TrainingManager
            companyId={companyId}
            basePath={`/studio/companies/${companyId}/training`}
            backPath={`/studio/companies/${companyId}`}
            backLabel="Back to company"
        />
    )
}

export function StudioTrainingEditor() {
    const { id: companyId, trainingId } = useParams()
    return (
        <TrainingEditor
            key={trainingId || 'new'}
            companyId={companyId}
            trainingId={trainingId === 'new' ? null : trainingId}
            backPath={`/studio/companies/${companyId}/training`}
        />
    )
}
