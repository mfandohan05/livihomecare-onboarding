import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { stepsByRole } from '@/data/steps'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, Eye, EyeOff, Copy, Check, Loader2, CheckCircle } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPhone } from '@/lib/formUtils'
import { logImportantAction } from '@/lib/logAction'

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
        offer_letter_other: 'Offer Letter (Custom)',
        bloodborne_certificate: 'Bloodborne Pathogens Certificate',
        drug_test_policy_signed: 'Drug Test Policy (Signed)',
        criminal_background_check_signed: 'Criminal Background Check (Signed)',
        new_hire_notification_signed: 'New Hire Notification (Signed)',
        orientation_checklist_signed: 'Orientation Checklist (Signed)',
        non_compete_signed: 'Non-Compete Agreement (Signed)',
        hep_b_declination_signed: 'Hep B Declination (Signed)',
    }
    return labels[type] || type
}

const stepFormDataKey = {
    'Welcome': null,
    'Upload Documents': 'uploads',
    'Personal Information': 'personalInfo',
    'New Hire Orientation': 'orientationQuiz',
    'Bloodborne Pathogens': 'bloodborne',
    'Competency Checklist': 'competency',
    'How to Use eRSP': 'erspGuide',
    'Forms & Agreements': 'signatures',
    'Tax Forms': null,
    'Tax Forms (W-9)': null,
    'Offer Letter': 'offerLetter',
    'Completed!': null,
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
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const competency = progress?.form_data?.compentency;
    const [regenerating, setRegenerating] = useState(false);
    const [adminName, setAdminName] = useState('')
    const [signDialogOpen, setSignDialogOpen] = useState(false)
    const [signDocumentId, setSignDocumentId] = useState(null)
    const [i9Section2Completed, setI9Section2Completed] = useState(false)
    const [i9Section2CompletedBy, setI9Section2CompletedBy] = useState(null)
    const [i9Section2CompletedAt, setI9Section2CompletedAt] = useState(null)
    const [resending, setResending] = useState(false);
    const [hasSsn, setHasSsn] = useState(false);
    const [hasBanking, setHasBanking] = useState(false);

    const { logAction } = logImportantAction(id, caregiver?.name);


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
        const { data: taxData } = await supabase
            .from('caregiver_tax_forms')
            .select('i9_section2_completed_at, i9_section2_completed_by, ssn_encrypted')
            .eq('caregiver_id', id)
            .maybeSingle();
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: adminData } = await supabase
                .from('admin_users')
                .select('name')
                .eq('id', session.user.id)
                .single()
            if (adminData) {
                setAdminName(adminData.name)
            }
        }

        const { data: bankingData } = await supabase
            .from('caregiver_banking')
            .select('id')
            .eq('caregiver_id', id)
            .maybeSingle();

        setI9Section2Completed(!!taxData?.i9_section2_completed_at)
        setI9Section2CompletedBy(taxData?.i9_section2_completed_by || null)
        setI9Section2CompletedAt(taxData?.i9_section2_completed_at || null)
        setCaregiver(caregiverData)
        setDocuments(docsData || [])
        setProgress(progressData)
        const personalInfo = progressData?.form_data?.personalInfo || {};
        setPersonalInfo(personalInfo)
        setTimeLog(timeData)
        setLoading(false)

        setHasSsn(!!taxData?.ssn_encrypted);
        setHasBanking(!!bankingData?.id);
    }

    const handleDownload = async (doc) => {
        await logAction('viewed_document', { document_type: doc.document_type })
        const generatedPdfTypes = [
            'i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed',
            'drug_test_policy_signed', 'criminal_background_check_signed',
            'new_hire_notification_signed', 'orientation_checklist_signed',
            'non_compete_signed', 'hep_b_declination_signed'
        ]

        const bucket = generatedPdfTypes.includes(doc.document_type)
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

        setShowReauth(false)
        setReauthPassword('')
        setReauthError(null)
        setReauthLoading(false)

        if (reauthTarget === 'ssn') {
            await fetchSsn()
        } else if (reauthTarget === 'banking') {
            await fetchBanking()
        }
        else if (reauthTarget === 'reset') {
            await handleResetProgress();
        }
    }
    const fetchSsn = async () => {
        await logAction('viewed_ssn')
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
        await logAction('viewed_banking')
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

    const handleResendInvite = async () => {
        setResending(true);
        await supabase.functions.invoke('send-invite-email', {
            body: { caregiverId: id }
        })
        setResending(false);
    }

    const openCaregiverView = async () => {
        const link = `${window.location.origin}/onboard/${caregiver.token}?preview=true`
        window.open(link, "popupWindow", "width=1024,height=768")
        await logAction('opened_caregiver_view');
    }

    const handleDeleteStepProgress = async (stepId) => {
        setDeletingStep(stepId)

        const roleSteps = stepsByRole[caregiver.role] || stepsByRole.caregiver
        const stepName = roleSteps.find(s => s.id === stepId)?.stepName
        const formDataKey = stepName ? stepFormDataKey[stepName] : null

        const updatedCompletedSteps = progress.completed_steps.filter(s => s !== stepId)
        const newActiveStep = stepId;

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
        await supabase
            .from('caregivers')
            .update({ status: 'in_progress' })
            .eq('id', id)
        if (stepName === 'Tax Forms' || stepName === 'Tax Forms (W-9)') {
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

        if (stepName === 'Upload Documents') {
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

        const allDocFiles = documents
            .filter(d => !['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type))
            .map(d => d.file_path)
        const taxPdfFiles = documents
            .filter(d => ['i9_completed', 'w4_completed', 'w9_completed', 'nc4ez_completed'].includes(d.document_type))
            .map(d => d.file_path)

        if (allDocFiles.length > 0) await supabase.storage.from('documents').remove(allDocFiles)
        if (taxPdfFiles.length > 0) await supabase.storage.from('generated-pdfs').remove(taxPdfFiles)

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

        await supabase
            .from('caregiver_documents')
            .delete()
            .eq('caregiver_id', id)
            .not('document_type', 'in', '("i9_completed","w4_completed","w9_completed","nc4ez_completed")')

        await supabase.from('caregiver_progress').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_time_logs').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_tax_forms').delete().eq('caregiver_id', id)
        await supabase.from('caregiver_banking').delete().eq('caregiver_id', id)
        await supabase.from('caregivers').delete().eq('id', id)

        await logAction('deleted_employee')

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
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (!caregiver) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Caregiver not found.</p>
            </div>
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
    const handleRegenerateLink = async () => {
        setRegenerating(true);
        const newToken = crypto.randomUUID()
        const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

        await supabase
            .from('caregivers')
            .update({
                token: newToken,
                link_expires_at: newExpiry,
            })
            .eq('id', id)

        await supabase.functions.invoke('send-invite-email', {
            body: { caregiverId: id }
        })

        await fetchAll()
        setRegenerating(false);
    }
    const ADMIN_SIGNABLE_DOCUMENTS = [
        {
            id: 'drug_test_policy_signed',
            label: 'Drug Test Policy & Acknowledgement',
            description: 'Sign as LHC Representative to complete the drug test policy acknowledgement.',
            requiresSection2: false,
        },
        {
            id: 'non_compete_signed',
            label: 'Non-Compete Agreement',
            description: 'Sign as an LHC Representative to complete the non-compete agreement.',
            requiresSection2: false,
        },
        {
            id: 'orientation_checklist_signed',
            label: 'Pre-Employment Orientation Checklist',
            description: 'Sign as an LHC Representative to complete the orientation checklist.',
            requiresSection2: false,
        },
        {
            id: 'i9_section2',
            label: 'Form I-9 — Section 2',
            description: 'Complete Section 2 after verifying identity documents in person.',
            requiresSection2: true,
        },
    ]

    function AdminSignDialog({ open, onClose, documentId, caregiver, adminName, onComplete, logAction }) {
        const doc = ADMIN_SIGNABLE_DOCUMENTS.find(d => d.id === documentId)
        const [submitting, setSubmitting] = useState(false)
        const [error, setError] = useState(null)

        const [docType, setDocType] = useState('listA')
        const [i9Form, setI9Form] = useState({
            firstDayOfEmployment: '',
            alternativeProcedure: false,
            additionalInfo: '',
            listADocTitle: '', listAIssuingAuthority: '', listADocNumber: '', listAExpDate: '',
            listADoc2Title: '', listADoc2IssuingAuthority: '', listADoc2Number: '',
            listBDocTitle: '', listBIssuingAuthority: '', listBDocNumber: '', listBExpDate: '',
            listCDocTitle: '', listCIssuingAuthority: '', listCDocNumber: '', listCExpDate: '',
        })

        const setI9 = (key) => (e) => setI9Form(prev => ({ ...prev, [key]: e.target.value }))

        const canSubmit = documentId === 'i9_section2'
            ? i9Form.firstDayOfEmployment && (
                docType === 'listA'
                    ? i9Form.listADocTitle && i9Form.listAIssuingAuthority
                    : i9Form.listBDocTitle && i9Form.listCDocTitle
            )
            : true

        const handleSubmit = async () => {
            setSubmitting(true)
            setError(null)
            try {
                if (documentId === 'i9_section2') {
                    const result = await supabase.functions.invoke('complete-i9-section2', {
                        body: {
                            caregiverId: caregiver.id,
                            section2Data: { ...i9Form, docType },
                            adminName
                        }
                    })
                    if (result.error) throw new Error(result.error.message)
                    await logAction('completed_i9_section2', { firstDayOfEmployment: i9Form.firstDayOfEmployment })
                } else {
                    const result = await supabase.functions.invoke('sign-admin-documents', {
                        body: {
                            caregiverId: caregiver.id,
                            documentType: documentId,
                            adminName
                        }
                    })
                    if (result.error) throw new Error(result.error.message)
                }
                onComplete()
                onClose()
            } catch (err) {
                setError(err.message)
            }
            setSubmitting(false)
        }

        if (!doc) return null

        return (
            <AlertDialog open={open} onOpenChange={onClose}>
                <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{doc.label}</AlertDialogTitle>
                        <AlertDialogDescription>{doc.description}</AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-6 pt-2">
                        {!doc.requiresSection2 && (
                            <div className="bg-muted/30 rounded-lg p-4">
                                <p className="text-sm text-muted-foreground">Signing as:</p>
                                <p className="font-medium">{adminName}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    By clicking Sign & Complete, you confirm that you have reviewed this document
                                    and are signing as the LHC Representative.
                                </p>
                            </div>
                        )}

                        {doc.requiresSection2 && (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-medium mb-2">Document type presented</p>
                                    <div className="flex gap-3">
                                        {[
                                            { value: 'listA', label: 'List A (single document)' },
                                            { value: 'listBC', label: 'List B + List C' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setDocType(opt.value)}
                                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${docType === opt.value
                                                    ? 'bg-[#577C09] text-white border-[#577C09]'
                                                    : 'border-border hover:bg-muted'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {docType === 'listA' ? (
                                    <div className="space-y-3">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">List A Document</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label>Document Title <span className="text-red-500">*</span></Label>
                                                <Input value={i9Form.listADocTitle} onChange={setI9('listADocTitle')} placeholder="e.g. U.S. Passport" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Issuing Authority <span className="text-red-500">*</span></Label>
                                                <Input value={i9Form.listAIssuingAuthority} onChange={setI9('listAIssuingAuthority')} placeholder="e.g. U.S. Dept of State" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Document Number</Label>
                                                <Input value={i9Form.listADocNumber} onChange={setI9('listADocNumber')} placeholder="Document number" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Expiration Date</Label>
                                                <Input value={i9Form.listAExpDate} onChange={setI9('listAExpDate')} placeholder="MM/DD/YYYY" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">List B Document</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label>Document Title <span className="text-red-500">*</span></Label>
                                                    <Input value={i9Form.listBDocTitle} onChange={setI9('listBDocTitle')} placeholder="e.g. Driver's License" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Issuing Authority</Label>
                                                    <Input value={i9Form.listBIssuingAuthority} onChange={setI9('listBIssuingAuthority')} placeholder="e.g. NC DMV" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Document Number</Label>
                                                    <Input value={i9Form.listBDocNumber} onChange={setI9('listBDocNumber')} placeholder="Document number" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Expiration Date</Label>
                                                    <Input value={i9Form.listBExpDate} onChange={setI9('listBExpDate')} placeholder="MM/DD/YYYY" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">List C Document</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label>Document Title <span className="text-red-500">*</span></Label>
                                                    <Input value={i9Form.listCDocTitle} onChange={setI9('listCDocTitle')} placeholder="e.g. Social Security Card" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Issuing Authority</Label>
                                                    <Input value={i9Form.listCIssuingAuthority} onChange={setI9('listCIssuingAuthority')} placeholder="e.g. SSA" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Document Number</Label>
                                                    <Input value={i9Form.listCDocNumber} onChange={setI9('listCDocNumber')} placeholder="Document number" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Expiration Date</Label>
                                                    <Input value={i9Form.listCExpDate} onChange={setI9('listCExpDate')} placeholder="N/A if none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>First Day of Employment <span className="text-red-500">*</span></Label>
                                        <Input value={i9Form.firstDayOfEmployment} onChange={setI9('firstDayOfEmployment')} placeholder="MM/DD/YYYY" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Additional Information</Label>
                                        <Input value={i9Form.additionalInfo} onChange={setI9('additionalInfo')} placeholder="Optional" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setI9Form(prev => ({ ...prev, alternativeProcedure: !prev.alternativeProcedure }))}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${i9Form.alternativeProcedure ? 'bg-[#577C09] border-[#577C09]' : 'border-muted-foreground'}`}
                                    >
                                        {i9Form.alternativeProcedure && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                    <label className="text-sm text-muted-foreground">Used an alternative procedure authorized by DHS</label>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground">Completing as:</p>
                                    <p className="font-medium">{adminName}</p>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={!canSubmit || submitting}
                                className="bg-[#577C09] hover:bg-[#3D5906] text-white disabled:opacity-50"
                            >
                                {submitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                                    : 'Sign & Complete'
                                }
                            </Button>
                            <Button variant="outline" onClick={onClose} disabled={submitting}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        )
    }

    return (
        <div>
            <AlertDialog open={showReauth} onOpenChange={setShowReauth}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{reauthTarget === 'reset' ? `Reset ${caregiver?.name}'s progress?` : 'Confirm your identity'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {reauthTarget === 'reset'
                                ? 'This will clear all completed steps, documents, time logs, and return the caregiver to the beginning of onboarding. Enter your password to confirm.'
                                : 'Enter your password to view sensitive information.'
                            }
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
                                className={`${reauthTarget === 'reset' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#577C09] hover:bg-[#3D5906]'} text-white disabled:opacity-50`}
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
            <AdminSignDialog
                open={signDialogOpen}
                onClose={() => { setSignDialogOpen(false); setSignDocumentId(null) }}
                documentId={signDocumentId}
                caregiver={caregiver}
                adminName={adminName}
                onComplete={fetchAll}
                logAction={logAction}
            />
            <button
                onClick={() => navigate('/admin/employees')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to employees
            </button>

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
                <div className="col-span-2 space-y-6">

                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Personal Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="font-medium">{caregiver.email}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{formatPhone(caregiver.phone) || '—'}</p>
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
                                    <p className="font-medium">{formatPhone(personalInfo.primaryPhone) || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Secondary Phone</p>
                                    <p className="font-medium">{formatPhone(personalInfo.secondaryPhone || '') || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Address</p>
                                    <p className="font-medium">
                                        {personalInfo.streetAddress}, {personalInfo.city}, {personalInfo.state} {personalInfo.zip}
                                    </p>
                                </div>
                            </div>

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
                                            <p className="font-medium">{formatPhone(personalInfo.primaryEmergencyPrimaryPhone || '') || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Secondary Phone</p>
                                            <p className="font-medium">{formatPhone(personalInfo.primaryEmergencySecondaryPhone || '') || '—'}</p>
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
                                            <p className="font-medium">{formatPhone(personalInfo.secondaryEmergencyPrimaryPhone || '') || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Secondary Phone</p>
                                            <p className="font-medium">{formatPhone(personalInfo.secondaryEmergencySecondaryPhone || '') || '—'}</p>
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

                    <div className="bg-white rounded-xl border border-border p-6 relative">
                        {uploadingDoc && (
                            <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading document...
                                </div>
                            </div>
                        )}
                        <h2 className="font-semibold mb-4">Documents</h2>

                        {documents.length > 0 && (
                            <div className="space-y-2 mb-6">
                                {documents.filter(doc => {
                                    if (doc.document_type === 'w4_completed') {
                                        return caregiver.role !== 'nurse_prn' && caregiver.role !== 'nurse_director'
                                    }
                                    return true;
                                }).map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium">{docLabel(doc.document_type)}</p>
                                            <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                            {['drug_test_policy_signed', 'non_compete_signed', 'orientation_checklist_signed'].includes(doc.document_type) && !doc.admin_signed_at && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                    Notice: Admin signature required
                                                </span>
                                            )}
                                            {['drug_test_policy_signed', 'non_compete_signed', 'orientation_checklist_signed'].includes(doc.document_type) && doc.admin_signed_at && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E8F0D0] text-[#577C09] shrink-0">
                                                    Admin signed
                                                </span>
                                            )}
                                            {doc.document_type === 'i9_completed' && !i9Section2Completed && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                    Notice: Section 2 required
                                                </span>
                                            )}
                                            {doc.document_type === 'i9_completed' && i9Section2Completed && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E8F0D0] text-[#577C09] shrink-0">
                                                    Section 2 complete
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="flex items-center gap-1.5 text-xs text-[#577C09] hover:underline"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View Document
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

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

                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Sign / Complete Documents</h2>
                        <div className="space-y-2">
                            {ADMIN_SIGNABLE_DOCUMENTS.map(doc => {
                                const isCompleted = doc.id === 'i9_section2'
                                    ? i9Section2Completed
                                    : documents.some(d => d.document_type === doc.id && d.admin_signed_at)

                                const caregiverDocExists = doc.id === 'i9_section2'
                                    ? documents.some(d => d.document_type === 'i9_completed')
                                    : documents.some(d => d.document_type === doc.id)

                                return (
                                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isCompleted
                                                ? <CheckCircle className="w-4 h-4 text-[#577C09] shrink-0" />
                                                : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground shrink-0" />
                                            }
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${isCompleted ? 'text-[#577C09]' : ''}`}>
                                                    {doc.label}
                                                </p>
                                                {isCompleted && doc.id !== 'i9_section2' && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Signed by {documents.find(d => d.document_type === doc.id)?.admin_signed_by} · {new Date(documents.find(d => d.document_type === doc.id)?.admin_signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                )}
                                                {isCompleted && doc.id === 'i9_section2' && i9Section2CompletedBy && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Signed by {i9Section2CompletedBy} · {new Date(i9Section2CompletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!isCompleted && caregiverDocExists && (
                                            <button
                                                onClick={() => { setSignDocumentId(doc.id); setSignDialogOpen(true) }}
                                                className="text-xs text-[#577C09] hover:underline shrink-0 ml-2"
                                            >
                                                Sign →
                                            </button>
                                        )}
                                        {!caregiverDocExists && (
                                            <span className="text-xs text-muted-foreground shrink-0 ml-2">Awaiting caregiver</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Sensitive Information</h2>
                        {!hasSsn && !hasBanking ? (
                            <p className='text-sm text-muted-foreground'>No sensitive information is available for this employee.</p>
                        ) : (
                            <div className="space-y-4">
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
                                            <p className="text-xs text-muted-foreground mt-0.5">EIN: <span className='font-mono'>{ssn.ein}</span></p>
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
                        )}

                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-sm text-red-500 hover:text-red-600 hover:underline transition-colors"
                    >
                        Delete employee profile
                    </button>
                </div>

                <div className="space-y-6">

                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Onboarding Link Management</h2>
                        {caregiver.token ? (
                            <>
                                <div className="flex items-start gap-3 flex-col">
                                    <button
                                        onClick={handleResendInvite}
                                        disabled={resending}
                                        className="flex items-center gap-2 text-sm text-[#577C09] hover:underline disabled:opacity-50"
                                    >
                                        {resending ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                                        ) : (
                                            'Resend invite email'
                                        )}
                                    </button>
                                    {caregiver.token && <button
                                        onClick={openCaregiverView}
                                        className='flex items-center gap-2 text-sm text-[#577C09] hover:underline'>
                                        Open Caregiver View
                                    </button>}
                                </div>
                                {caregiver.link_expires_at && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Expires {new Date(caregiver.link_expires_at).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                )}
                            </>
                        ) : (
                            <div>
                                <p className="text-sm text-muted-foreground mb-3">Link expired</p>
                                <button
                                    onClick={handleRegenerateLink}
                                    className="flex items-center gap-2 text-sm text-[#577C09] hover:underline"
                                    disabled={regenerating}
                                >
                                    {regenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        'Regenerate link'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Onboarding Progress</h2>
                        {progress ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Steps completed</p>
                                    <p className="text-2xl font-bold">{progress.completed_steps?.length || 0}</p>
                                </div>
                                {caregiver.status === 'completed' ? (
                                    <div className="flex items-center gap-2 text-[#577C09]">
                                        <CheckCircle className="w-4 h-4" />
                                        <p className="text-sm font-medium">Onboarding complete</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Currently on step</p>
                                        <p className="text-sm font-medium">{progress.active_step}</p>
                                    </div>
                                )}
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
                                    [...progress.completed_steps].sort((a, b) => a - b).map((stepId, index, arr) => {
                                        const isLatest = index === arr.length
                                        const roleSteps = stepsByRole[caregiver.role] || stepsByRole.caregiver
                                        const stepName = roleSteps.find(s => s.id === stepId)?.stepName || `Step ${stepId}`
                                        return (
                                            <div
                                                key={stepId}
                                                className={`flex items-center justify-between py-2 px-3 rounded-lg ${isLatest && caregiver.status !== 'completed' ? 'bg-[#577C09] text-white' : 'bg-[#E8F0D0]'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className={`w-4 h-4 ${isLatest && caregiver.status !== 'completed' ? 'text-white' : 'text-[#577C09]'}`} />
                                                    <span className={`text-sm font-medium ${isLatest && caregiver.status !== 'completed' ? 'text-white' : 'text-[#577C09]'}`}>
                                                        Step {stepId} - {stepName}
                                                    </span>
                                                    {isLatest && caregiver.status !== 'completed' && (
                                                        <span className="text-xs text-white/80">current</span>
                                                    )}
                                                </div>
                                                {managingProgress && (
                                                    <button
                                                        onClick={() => handleDeleteStepProgress(stepId)}
                                                        disabled={deletingStep === stepId}
                                                        className={`text-xs hover:underline disabled:opacity-50 ${isLatest && caregiver.status !== 'completed' ? 'text-white/80' : 'text-red-500'}`}
                                                    >
                                                        {deletingStep === stepId ? 'Removing...' : 'Remove'}
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground">No steps completed yet</p>
                                )}
                            </div>


                            {managingProgress && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Resetting progress will clear all completed steps, documents, time logs, and return the caregiver to the beginning of onboarding.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setReauthTarget('reset')
                                            setShowReauth(true)
                                        }}
                                        disabled={resetting}
                                        className="w-full py-2 px-4 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        {resetting ? 'Resetting...' : 'Reset All Progress'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-border p-6">
                        <h2 className="font-semibold mb-4">Orientation Time & Pay</h2>
                        {timeLog ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Active time</p>
                                    <p className="text-2xl font-bold">{activeTime}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Suggested orientation pay</p>
                                    <p className="text-2xl font-bold text-[#577C09]">${orientationPay}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Started</p>
                                    <p className="text-sm font-medium">
                                        {new Date(timeLog.session_start).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                    <p className="text-sm font-medium">
                                        {new Date(timeLog.session_end).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
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
        </div>
    )
}