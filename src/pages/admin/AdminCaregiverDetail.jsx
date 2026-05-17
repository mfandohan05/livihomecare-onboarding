import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Upload, Eye, EyeOff, Copy, Check, Loader2, CheckCircle, Clock } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const statusColor = (status) => {
    if (status === 'completed') return 'text-[#577C09] bg-[#E8F0D0]'
    if (status === 'in_progress') return 'text-amber-700 bg-amber-50'
    return 'text-muted-foreground bg-muted'
}

const statusLabel = (status) => {
    if (status === 'completed') return 'Completed'
    if (status === 'in_progress') return 'In Progress'
    return 'Pending'
}

const roleLabel = (role) => {
    const labels = {
        caregiver: 'Caregiver',
        nurse_prn: 'Nurse (PRN)',
        nurse_director: 'Nurse (Director)',
        other: 'Other'
    }

    return labels[role] || role;
}

const docLabel = (type) => {
    const labels = {
        driversLicense: "Driver's License",
        carInsurance: 'Car Insurance',
        tbTest: 'TB Test',
        socialSecurityCard: 'Social Security Card',
        badgePhoto: 'Badge Photo',
        certifications: 'Certifications',
        nursingLicense: 'Nursing License',
        i9_completed: 'Form I-9 (Completed)',
        w4_completed: 'Form W-4 (Completed)',
        w9_completed: 'Form W-9 (Completed)',
        nc4ez_completed: 'NC-4EZ (Completed)',
        offer_letter_other: 'Offer Letter (Custom)'
    }
    return labels[type] || type
}

const stepFormDataKey = {
    1: null,
    2: 'uploads',
    3: 'personalInfo',
    4: 'erspApplication',
    5: 'orientationQuiz',
    6: 'competency',
    7: 'erspGuide',
    8: 'signatures',
    9: null,
    10: 'offerLetter',
    11: null,
}

export default function AdminCaregiverDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [caregiver, setCaregiver] = useState(null)
    const [documents, setDocuments] = useState([])
    const [progress, setProgress] = useState(null)
    const [timeLog, setTimeLog] = useState(null)
    const [loading, setLoading] = useState(true)
    const [ssn, setSsn] = useState(null)
    const [banking, setBanking] = useState(null)
    const [showSsn, setShowSsn] = useState(false)
    const [showBanking, setShowBanking] = useState(false)
    const [loadingSsn, setLoadingSsn] = useState(false)
    const [loadingBanking, setLoadingBanking] = useState(false)
    const [copied, setCopied] = useState(false)
    const [uploadingDoc, setUploadingDoc] = useState(null)
    const [showReauth, setShowReauth] = useState(false)
    const [reauthPassword, setReauthPassword] = useState('')
    const [reauthError, setReauthError] = useState(null)
    const [reauthLoading, setReauthLoading] = useState(false)
    const [reauthTarget, setReauthTarget] = useState(null)
    const [personalInfo, setPersonalInfo] = useState({})
    const [managingProgress, setManagingProgress] = useState(false)
    const [deletingStep, setDeletingStep] = useState(null)
    const [resetting, setResetting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const competency = progress?.form_data?.compentency;



    useEffect(() => {
        fetchAll()
    }, [id])

    const fetchAll = async () => {
        const [
            { data: caregiverData },
            { data: docsData },
            { data: progressData },
            { data: timeData },
        ] = await Promise.all([
            supabase.from('caregivers').select('*').eq('id', id).single(),
            supabase.from('caregiver_documents').select('*').eq('caregiver_id', id).order('created_at', { ascending: false }),
            supabase.from('caregiver_progress').select('*').eq('caregiver_id', id).maybeSingle(),
            supabase.from('caregiver_time_logs').select('*').eq('caregiver_id', id).eq('completed', true).maybeSingle(),
        ])

        setCaregiver(caregiverData)
        setDocuments(docsData || [])
        setProgress(progressData)
        const personalInfo = progressData?.form_data?.personalInfo || {};
        setPersonalInfo(personalInfo)
        setTimeLog(timeData)
        setLoading(false)
    }

    const handleDownload = async (doc) => {
        const bucket = ['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(doc.document_type)
            ? 'generated-pdfs'
            : 'documents'

        const { data } = await supabase.storage
            .from(bucket)
            .createSignedUrl(doc.file_path, 3600)

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank')
        }
    }

    const handleUpload = async (documentType, file) => {
        setUploadingDoc(documentType)
        const fileExt = file.name.split('.').pop()
        const sanitizedName = caregiver.name.replace(/[^a-zA-Z0-9]/g, '_')
        const filePath = `${id}/${sanitizedName}_${documentType}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file, { upsert: true })

        if (!uploadError) {
            await supabase
                .from('caregiver_documents')
                .upsert({
                    caregiver_id: id,
                    document_type: documentType,
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type,
                }, { onConflict: 'caregiver_id, document_type' })

            await fetchAll()
        }
        setUploadingDoc(null)
    }
    const handleReauth = async () => {
        setReauthLoading(true)
        setReauthError(null)

        const { data: { session } } = await supabase.auth.getSession()

        const { error } = await supabase.auth.signInWithPassword({
            email: session.user.email,
            password: reauthPassword
        })

        if (error) {
            setReauthError('Incorrect password')
            setReauthLoading(false)
            return
        }

        // password correct — reveal the requested data
        setShowReauth(false)
        setReauthPassword('')
        setReauthError(null)
        setReauthLoading(false)

        if (reauthTarget === 'ssn') {
            await fetchSsn()
        } else if (reauthTarget === 'banking') {
            await fetchBanking()
        }
    }
    const fetchSsn = async () => {
        setLoadingSsn(true)
        const { data: { session } } = await supabase.auth.getSession()
        const result = await supabase.functions.invoke('get-ssn', {
            body: { caregiverId: id },
            headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (result.data) setSsn(result.data)
        setShowSsn(true)
        setLoadingSsn(false)
    }
    const fetchBanking = async () => {
        setLoadingBanking(true)
        const { data: { session } } = await supabase.auth.getSession()
        const result = await supabase.functions.invoke('get-banking-info', {
            body: { caregiverId: id },
            headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (result.data) setBanking(result.data)
        setShowBanking(true)
        setLoadingBanking(false)
    }
    const handleRevealSsn = async () => {
        if (ssn) {
            setShowSsn(prev => !prev)
            return
        }

        setReauthTarget('ssn')
        setShowReauth(true)
    }

    const handleRevealBanking = async () => {
        if (banking) {
            setShowBanking(prev => !prev)
            return
        }
        setReauthTarget('banking')
        setShowReauth(true)
    }

    const copyOnboardingLink = () => {
        const link = `${window.location.origin}/onboard/${caregiver.token}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDeleteStepProgress = async (stepId) => {
        setDeletingStep(stepId)

        const updatedCompletedSteps = progress.completed_steps.filter(s => s !== stepId)
        const newActiveStep = updatedCompletedSteps.length > 0
            ? Math.min(stepId, Math.min(...updatedCompletedSteps) + 1)
            : 1

        const formDataKey = stepFormDataKey[stepId]
        let updatedFormData = { ...progress.form_data }
        if (formDataKey) updatedFormData[formDataKey] = {}

        await supabase
            .from('caregiver_progress')
            .update({
                completed_steps: updatedCompletedSteps,
                active_step: newActiveStep,
                form_data: updatedFormData,
                last_saved: new Date().toISOString()
            })
            .eq('caregiver_id', id)

        if (stepId === 9) {
            await supabase.from('caregiver_tax_forms').delete().eq('caregiver_id', id)
            await supabase
                .from('caregiver_documents')
                .delete()
                .eq('caregiver_id', id)
                .in('document_type', ['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'])

            const taxFiles = documents
                .filter(d => ['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type))
                .map(d => d.file_path)
            if (taxFiles.length > 0) await supabase.storage.from('generated-pdfs').remove(taxFiles)
        }

        if (stepId === 2) {
            const uploadedDocs = documents.filter(d =>
                !['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type)
            )
            const filePaths = uploadedDocs.map(d => d.file_path)
            if (filePaths.length > 0) await supabase.storage.from('documents').remove(filePaths)
            await supabase
                .from('caregiver_documents')
                .delete()
                .eq('caregiver_id', id)
                .not('document_type', 'in', '("i9_completed","w4_completed","w9_completed","nc4ez_completed")')
        }

        await fetchAll()
        setDeletingStep(null)
    }

    const handleResetProgress = async () => {
        setResetting(true)

        await supabase.from('caregiver_progress').delete().eq('caregiver_id', id)
        await supabase.from('caregivers').update({ status: 'pending', link_expires_at: null }).eq('id', id)
        await supabase.from('caregiver_time_logs').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_tax_forms').delete().eq('caregiver_id', id)

        const docFiles = documents
            .filter(d => !['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type))
            .map(d => d.file_path)
        const pdfFiles = documents
            .filter(d => ['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type))
            .map(d => d.file_path)

        if (docFiles.length > 0) await supabase.storage.from('documents').remove(docFiles)
        if (pdfFiles.length > 0) await supabase.storage.from('generated-pdfs').remove(pdfFiles)

        await supabase.from('caregiver_documents').delete().eq('caregiver_id', id)

        await fetchAll()
        setResetting(false)
        setManagingProgress(false)
    }

    const handleDelete = async () => {
        setDeleteLoading(true)
        setDeleteError(null)

        const { data: { session } } = await supabase.auth.getSession()
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: session.user.email,
            password: deletePassword
        })

        if (authError) {
            setDeleteError('Incorrect password')
            setDeleteLoading(false)
            return
        }

        const docFiles = documents
            .filter(d => !['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type))
            .map(d => d.file_path)
        const pdfFiles = documents
            .filter(d => ['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type))
            .map(d => d.file_path)

        if (docFiles.length > 0) await supabase.storage.from('documents').remove(docFiles)
        if (pdfFiles.length > 0) await supabase.storage.from('generated-pdfs').remove(pdfFiles)

        await supabase.from('caregiver_documents').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_progress').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_time_logs').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_tax_forms').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_banking').delete().eq('caregiver_id', id)
        await supabase.from('caregivers').delete().eq('id', id)

        navigate('/admin/employees')
    }
    const activeTime = timeLog
        ? `${Math.floor(timeLog.active_seconds / 3600)}h ${Math.floor((timeLog.active_seconds % 3600) / 60)}m`
        : null

    const orientationPay = timeLog && caregiver
        ? ((timeLog.active_seconds / 3600) * caregiver.pay_rate).toFixed(2)
        : null

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-20">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </AdminLayout>
        )
    }

    if (!caregiver) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-20">
                    <p className="text-muted-foreground">Caregiver not found.</p>
                </div>
            </AdminLayout>
        )
    }
    const isNurse = caregiver.role === 'nurse_prn' || caregiver.role === 'nurse_director'
    const uploadableDocs = isNurse
        ? ['driversLicense', 'carInsurance', 'tbTest', 'socialSecurityCard', 'badgePhoto', 'nursingLicense', 'certifications']
        : ['driversLicense', 'carInsurance', 'tbTest', 'socialSecurityCard', 'badgePhoto', 'certifications']
    const groupedSkills = Object.entries(competency?.checked || {})
        .filter(([_, checked]) => checked)
        .reduce((acc, [key]) => {
            const [category, skill] = key.split('__')
            if (!acc[category]) acc[category] = []
            acc[category].push(skill)
            return acc
        }, {})
    return (
        <AdminLayout>
            {/* Reauth Dialog */}
            <AlertDialog open={showReauth} onOpenChange={setShowReauth}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm your identity</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter your password to view sensitive information.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="reauth_password">Password</Label>
                            <Input
                                id="reauth_password"
                                type="password"
                                value={reauthPassword}
                                onChange={(e) => setReauthPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleReauth()}
                                placeholder="••••••••"
                                autoFocus
                            />
                        </div>
                        {reauthError && <p className="text-sm text-red-500">{reauthError}</p>}
                        <div className="flex gap-3">
                            <Button
                                onClick={handleReauth}
                                disabled={!reauthPassword || reauthLoading}
                                className="bg-[#577C09] hover:bg-[#3D5906] text-white disabled:opacity-50"
                            >
                                {reauthLoading ? 'Verifying...' : 'Confirm'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowReauth(false)
                                    setReauthPassword('')
                                    setReauthError(null)
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
            {/* Back button */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {caregiver?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this employee and all of their data including documents, forms, progress and time logs. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="delete_password">Enter your password to confirm</Label>
                            <Input
                                id="delete_password"
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                                placeholder="••••••••"
                                autoFocus
                            />
                        </div>
                        {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                        <div className="flex gap-3">
                            <Button
                                onClick={handleDelete}
                                disabled={!deletePassword || deleteLoading}
                                className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete Employee'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setDeletePassword('')
                                    setDeleteError(null)
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
            <button
                onClick={() => navigate('/admin/employees')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to employees
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#577C09] flex items-center justify-center text-white text-lg font-semibold">
                        {caregiver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{caregiver.name}</h1>
                        <p className="text-muted-foreground">{roleLabel(caregiver.role)} · {caregiver.position_title}</p>
                    </div>
                </div>
                <div className='flex flex-row gap-'>
                    <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${statusColor(caregiver.status)}`}>
                        {statusLabel(caregiver.status)}
                    </span>

                </div>


            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Left column */}
                <div className="col-span-2 space-y-6">

                    {/* Personal Info */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Personal Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="font-medium">{caregiver.email}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{caregiver.phone || '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Employment Type</p>
                                <p className="font-medium">{caregiver.employment_type || '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Start Date</p>
                                <p className="font-medium">
                                    {caregiver.start_date
                                        ? new Date(caregiver.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                        : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Pay Rate</p>
                                <p className="font-medium">${caregiver.pay_rate}/hr</p>
                            </div>
                            {caregiver.companion_pay_rate && (
                                <div>
                                    <p className="text-muted-foreground">Companion Pay Rate</p>
                                    <p className="font-medium">${caregiver.companion_pay_rate}/hr</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Caregiver Provided Info */}
                    {Object.keys(personalInfo).length > 0 && (
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h2 className="font-semibold mb-4">Personal Information (Caregiver Provided)</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Full Name</p>
                                    <p className="font-medium">{personalInfo.firstName} {personalInfo.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{personalInfo.email || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Primary Phone</p>
                                    <p className="font-medium">{personalInfo.primaryPhone || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Secondary Phone</p>
                                    <p className="font-medium">{personalInfo.secondaryPhone || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Address</p>
                                    <p className="font-medium">
                                        {personalInfo.streetAddress}, {personalInfo.city}, {personalInfo.state} {personalInfo.zip}
                                    </p>
                                </div>
                            </div>

                            {/* Primary Emergency Contact */}
                            {personalInfo.primaryEmergencyFirstName && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium mb-3 pb-2 border-b">Primary Emergency Contact</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Name</p>
                                            <p className="font-medium">{personalInfo.primaryEmergencyFirstName} {personalInfo.primaryEmergencyLastName}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Relationship</p>
                                            <p className="font-medium">{personalInfo.primaryEmergencyRelationship || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Primary Phone</p>
                                            <p className="font-medium">{personalInfo.primaryEmergencyPrimaryPhone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Secondary Phone</p>
                                            <p className="font-medium">{personalInfo.primaryEmergencySecondaryPhone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Email</p>
                                            <p className="font-medium">{personalInfo.primaryEmergencyEmail || '—'}</p>
                                        </div>
                                        {personalInfo.primaryEmergencyStreetAddress && (
                                            <div>
                                                <p className="text-muted-foreground">Address</p>
                                                <p className="font-medium">
                                                    {personalInfo.primaryEmergencyStreetAddress}, {personalInfo.primaryEmergencyCity}, {personalInfo.primaryEmergencyState} {personalInfo.primaryEmergencyZip}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Secondary Emergency Contact */}
                            {personalInfo.secondaryEmergencyFirstName && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium mb-3 pb-2 border-b">Secondary Emergency Contact</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Name</p>
                                            <p className="font-medium">{personalInfo.secondaryEmergencyFirstName} {personalInfo.secondaryEmergencyLastName}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Relationship</p>
                                            <p className="font-medium">{personalInfo.secondaryEmergencyRelationship || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Primary Phone</p>
                                            <p className="font-medium">{personalInfo.secondaryEmergencyPrimaryPhone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Secondary Phone</p>
                                            <p className="font-medium">{personalInfo.secondaryEmergencySecondaryPhone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Email</p>
                                            <p className="font-medium">{personalInfo.secondaryEmergencyEmail || '—'}</p>
                                        </div>
                                        {personalInfo.secondaryEmergencyStreetAddress && (
                                            <div>
                                                <p className="text-muted-foreground">Address</p>
                                                <p className="font-medium">
                                                    {personalInfo.secondaryEmergencyStreetAddress}, {personalInfo.secondaryEmergencyCity}, {personalInfo.secondaryEmergencyState} {personalInfo.secondaryEmergencyZip}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Competency Checklist */}
                    {competency && Object.keys(competency.checked || {}).length > 0 && (
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h2 className="font-semibold mb-4">Competency Checklist</h2>

                            {Object.entries(groupedSkills).map(([category, skills]) => (
                                <div key={category} className="mb-4">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 capitalize">
                                        {category.replace(/_/g, ' ')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map(skill => (
                                            <span key={skill} className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E8F0D0] text-[#577C09]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {competency.lunch && (
                                <div className="mt-4 mb-4">
                                    <p className="text-xs text-muted-foreground mb-1">Nutritious lunch they would prepare</p>
                                    <p className="text-sm bg-muted/30 rounded-lg px-4 py-3">{competency.lunch}</p>
                                </div>
                            )}
                            {competency.dinner && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Nutritious dinner they would prepare</p>
                                    <p className="text-sm bg-muted/30 rounded-lg px-4 py-3">{competency.dinner}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Documents */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Documents</h2>

                        {/* Uploaded documents */}
                        {documents.length > 0 && (
                            <div className="space-y-2 mb-6">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium">{docLabel(doc.document_type)}</p>
                                            <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="flex items-center gap-1.5 text-xs text-[#577C09] hover:underline"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload on behalf */}
                        <div>
                            <p className="text-sm font-medium mb-3">Upload on behalf of employee</p>
                            <div className="space-y-2">
                                {uploadableDocs.map((docType) => {
                                    const existing = documents.find(d => d.document_type === docType)
                                    return (
                                        <div key={docType} className="flex items-center justify-between py-2 px-3 rounded-lg border border-dashed border-border">
                                            <p className="text-sm text-muted-foreground">{docLabel(docType)}</p>
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0]
                                                        if (file) handleUpload(docType, file)
                                                    }}
                                                />
                                                {uploadingDoc === docType ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Uploading...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-[#577C09] hover:underline">
                                                        <Upload className="w-3.5 h-3.5" />
                                                        {existing ? 'Replace' : 'Upload'}
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                    )
                                })}
                                {/* Custom offer letter upload for other role */}
                                {caregiver.role === 'other' && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium mb-1">Custom Offer Letter</p>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            Upload a custom offer letter for this employee. They will see it in their portal and sign it digitally.
                                        </p>
                                        <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-dashed border-border">
                                            <p className="text-sm text-muted-foreground">Offer Letter (PDF)</p>
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0]
                                                        if (file) handleUpload('offer_letter_other', file)
                                                    }}
                                                />
                                                {uploadingDoc === 'offer_letter_other' ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Uploading...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-[#577C09] hover:underline">
                                                        <Upload className="w-3.5 h-3.5" />
                                                        {documents.find(d => d.document_type === 'offer_letter_other') ? 'Replace' : 'Upload'}
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sensitive Data */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Sensitive Information</h2>
                        <div className="space-y-4">

                            {/* SSN */}
                            <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30">
                                <div>
                                    <p className="text-sm font-medium">Social Security Number</p>
                                    {showSsn && ssn ? (
                                        <p className="text-sm font-mono mt-0.5">{ssn.ssn || '—'}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-0.5">••••••••••</p>
                                    )}
                                    {showSsn && ssn?.dob && (
                                        <p className="text-xs text-muted-foreground mt-0.5">DOB: {ssn.dob}</p>
                                    )}
                                    {showSsn && ssn?.ein && (
                                        <p className="text-xs text-muted-foreground mt-0.5">EIN: {ssn.ein}</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleRevealSsn}
                                    disabled={loadingSsn}
                                    className="flex items-center gap-1.5 text-xs text-[#577C09] hover:underline disabled:opacity-50"
                                >
                                    {loadingSsn ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : showSsn ? (
                                        <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                                    ) : (
                                        <><Eye className="w-3.5 h-3.5" /> Reveal</>
                                    )}
                                </button>
                            </div>

                            {/* Banking */}
                            <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30">
                                <div>
                                    <p className="text-sm font-medium">Direct Deposit</p>
                                    {showBanking && banking ? (
                                        <div className="mt-0.5 space-y-0.5">
                                            <p className="text-sm">{banking.bank_name}</p>
                                            <p className="text-sm font-mono">Routing: {banking.routing_number}</p>
                                            <p className="text-sm font-mono">Account: {banking.account_number}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{banking.account_type}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-0.5">••••••••••</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleRevealBanking}
                                    disabled={loadingBanking}
                                    className="flex items-center gap-1.5 text-xs text-[#577C09] hover:underline disabled:opacity-50"
                                >
                                    {loadingBanking ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : showBanking ? (
                                        <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                                    ) : (
                                        <><Eye className="w-3.5 h-3.5" /> Reveal</>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-sm text-red-500 hover:text-red-600 hover:underline transition-colors"
                    >
                        Delete employee profile
                    </button>
                </div>

                {/* Right column */}
                <div className="space-y-6">

                    {/* Onboarding Link */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Onboarding Link</h2>
                        {caregiver.token ? (
                            <>
                                <p className="text-xs text-muted-foreground mb-3 break-all">
                                    {window.location.origin}/onboard/{caregiver.token}
                                </p>
                                <button
                                    onClick={copyOnboardingLink}
                                    className="flex items-center gap-2 text-sm text-[#577C09] hover:underline"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy link'}
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Link expired</p>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Onboarding Progress</h2>
                        {progress ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Steps completed</p>
                                    <p className="text-2xl font-bold">{progress.completed_steps?.length || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Currently on step</p>
                                    <p className="text-sm font-medium">{progress.active_step}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Last saved</p>
                                    <p className="text-sm font-medium">
                                        {new Date(progress.last_saved).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Not started yet</p>
                        )}
                    </div>
                    {/* Manage Progress */}
                    {progress && (
                        <div className="bg-white rounded-xl border border-border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold">Manage Progress</h2>
                                <button
                                    onClick={() => setManagingProgress(prev => !prev)}
                                    className="text-xs text-[#577C09] hover:underline"
                                >
                                    {managingProgress ? 'Done' : 'Manage'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {progress.completed_steps?.length > 0 ? (
                                    progress.completed_steps.map((stepId) => (
                                        <div
                                            key={stepId}
                                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#E8F0D0]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-[#577C09]" />
                                                <span className="text-sm text-[#577C09] font-medium">Step {stepId}</span>
                                            </div>
                                            {managingProgress && (
                                                <button
                                                    onClick={() => handleDeleteStepProgress(stepId)}
                                                    disabled={deletingStep === stepId}
                                                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                                                >
                                                    {deletingStep === stepId ? 'Removing...' : 'Remove'}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No steps completed yet</p>
                                )}
                            </div>

                            {progress.active_step && (
                                <div className="mt-3 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm text-amber-700 font-medium">
                                            Currently on Step {progress.active_step}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {managingProgress && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Resetting progress will clear all completed steps, documents, time logs, and return the caregiver to the beginning of onboarding.
                                    </p>
                                    <button
                                        onClick={handleResetProgress}
                                        disabled={resetting}
                                        className="w-full py-2 px-4 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        {resetting ? 'Resetting...' : 'Reset All Progress'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Time & Pay */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Orientation Time & Pay</h2>
                        {timeLog ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Active time</p>
                                    <p className="text-2xl font-bold">{activeTime}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Orientation pay owed</p>
                                    <p className="text-2xl font-bold text-[#577C09]">${orientationPay}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Started</p>
                                    <p className="text-sm font-medium">
                                        {new Date(timeLog.session_start).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                    <p className="text-sm font-medium">
                                        {new Date(timeLog.session_end).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No time logged yet</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}