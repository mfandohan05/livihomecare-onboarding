import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowRight, FileText, GraduationCap } from 'lucide-react'
import { getDocuments } from '@/lib/caregiver'
import { trainingCaregiver } from '@/lib/training'
import { Button } from '@/components/ui/button'
import { documentLabel, formatDateOnly, toDateOnly } from '@/lib/documentExpiration'

const roleLabels = {
    caregiver: 'Caregiver',
    nurse_prn: 'Nurse (PRN)',
    nurse_director: 'Nurse (Director)',
    other: 'Other',
}

const prettyType = (type) => {
    const label = documentLabel(type)
    if (label !== type) return label
    return type
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function MyProfile() {
    const navigate = useNavigate()
    const state = useOutletContext()
    const [documents, setDocuments] = useState(null)
    const [trainings, setTrainings] = useState(null)

    useEffect(() => {
        let cancelled = false
        getDocuments(state.caregiver.id).then((docs) => {
            if (!cancelled) setDocuments(docs)
        })
        trainingCaregiver('list')
            .then((rows) => { if (!cancelled) setTrainings(rows) })
            .catch(() => { if (!cancelled) setTrainings([]) })
        return () => { cancelled = true }
    }, [state])

    const { caregiver, companyName } = state
    const remaining = (trainings || []).filter((t) => t.status !== 'passed').length

    return (
        <>
            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
                    <h1 className="text-xl font-semibold">{caregiver.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {[roleLabels[caregiver.role] || caregiver.role, companyName, caregiver.email].filter(Boolean).join(' · ')}
                    </p>
                </div>

                {remaining > 0 && (
                <div className="bg-[var(--secondary-bg)] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <GraduationCap className="w-5 h-5 text-[var(--primary-color)] mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-[var(--primary-color)]">Your training is ready</p>
                            <p className="text-sm text-[var(--hover-color)]">
                                You have {remaining} training{remaining === 1 ? '' : 's'} left to complete.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/my-training')}
                        className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white shrink-0"
                    >
                        Continue to My Training
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
                )}

                {caregiver.source !== 'imported' && (
                    <div className="bg-white rounded-xl border border-border p-4 sm:px-8 shadow-sm flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">Your onboarding completion certificate</p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/onboard?certificate=1')}>
                            View certificate
                        </Button>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="font-semibold">My uploaded documents</h2>
                        <Button variant="outline" size="sm" onClick={() => navigate('/my-documents')}>
                            Upload documents
                        </Button>
                    </div>
                    {documents === null ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No documents on file.</p>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 py-2.5 px-4 rounded-lg border border-border">
                                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{prettyType(doc.document_type)}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {doc.file_name}
                                            {doc.expiration_date && ` · Expires ${formatDateOnly(toDateOnly(doc.expiration_date))}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
