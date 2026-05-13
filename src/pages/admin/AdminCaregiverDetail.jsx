import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Upload, Eye, EyeOff, Copy, Check, Loader2 } from 'lucide-react'
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
    }
    return labels[type] || type
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
        setTimeLog(timeData)
        setLoading(false)
    }

    const handleDownload = async (doc) => {
        const { data } = await supabase.storage
            .from(doc.file_path.startsWith(id) ? 'generated-pdfs' : 'documents')
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

    const uploadableDocs = caregiver.role === 'nurse'
        ? ['driversLicense', 'carInsurance', 'tbTest', 'socialSecurityCard', 'badgePhoto', 'nursingLicense', 'certifications']
        : ['driversLicense', 'carInsurance', 'tbTest', 'socialSecurityCard', 'badgePhoto', 'certifications']

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
                        <p className="text-muted-foreground capitalize">{caregiver.role} · {caregiver.position_title}</p>
                    </div>
                </div>
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${statusColor(caregiver.status)}`}>
                    {statusLabel(caregiver.status)}
                </span>
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