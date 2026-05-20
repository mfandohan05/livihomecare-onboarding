import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, ExternalLink, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function BloodbornePathogensPage({ stepLabel, onNext, initialData, onChange, caregiver, setPopupOpen }) {
    const [certificate, setCertificate] = useState(initialData?.certificate || null)
    const [uploading, setUploading] = useState(false)
    const [uploaded, setUploaded] = useState(initialData?.uploaded || false)

    const isMobile = !window.matchMedia('(hover: hover)').matches || window.matchMedia('(max-width: 768px)').matches

    const handleOpenTraining = () => {
        setPopupOpen(true)

        if (isMobile) {
            window.open('https://www.cpr.io/courses/bloodborne-pathogens/', '_blank')

            const handleVisibility = () => {
                if (document.visibilityState === 'visible') {
                    setPopupOpen(false)
                    document.removeEventListener('visibilitychange', handleVisibility)
                }
            }
            document.addEventListener('visibilitychange', handleVisibility)
        } else {
            const popup = window.open(
                'https://www.cpr.io/courses/bloodborne-pathogens/',
                'BloodborneTraining',
                'width=1100,height=700,scrollbars=yes,resizable=yes'
            )

            const interval = setInterval(() => {
                if (popup?.closed) {
                    setPopupOpen(false)
                    clearInterval(interval)
                }
            }, 500)
        }
    }

    const handleUpload = async (file) => {
        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const sanitizedName = caregiver.name.replace(/[^a-zA-Z0-9]/g, '_')
        const filePath = `${caregiver.id}/${sanitizedName}_bloodborne_certificate.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file, { upsert: true })

        if (!uploadError) {
            await supabase
                .from('caregiver_documents')
                .upsert({
                    caregiver_id: caregiver.id,
                    document_type: 'bloodborne_certificate',
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type,
                }, { onConflict: 'caregiver_id, document_type' })

            setCertificate(file.name)
            setUploaded(true)
            onChange({ certificate: file.name, uploaded: true })
        }
        setUploading(false)
    }

    return (
        <div className="max-w-2xl mx-auto py-8 md:py-16 px-4 md:px-8">
            <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">{stepLabel}</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">Bloodborne Pathogens Training</h1>
            <p className="text-muted-foreground mb-8">
                All new hires are required to complete Bloodborne Pathogens training and submit a certificate of completion before starting work. If you already have a valid, unexpired certificate, you can skip the training and upload it directly.
            </p>

            {/* Training link card */}
            <div className="bg-[#F4F7EC] border border-[#577C09]/20 rounded-xl p-4 md:p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#577C09] flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold mb-1">Bloodborne Pathogens Course</p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Complete the online training at cpr.io. The course takes approximately 30-60 minutes. Upon completion, download your certificate and upload it below.
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-1 mb-4 list-decimal pl-4">
                            <li>Click the button below to open the training {isMobile ? 'in a new tab' : 'in a popup'}</li>
                            <li>Complete the course and pass the assessment</li>
                            <li>Download your certificate of completion</li>
                            <li>Upload the certificate below</li>
                        </ol>
                        <button
                            onClick={handleOpenTraining}
                            className="flex items-center gap-2 bg-[#577C09] hover:bg-[#3D5906] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open Training Course
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload section */}
            <div className="bg-white border border-border rounded-xl p-4 md:p-6">
                <p className="font-medium mb-1">Upload Certificate</p>
                <p className="text-sm text-muted-foreground mb-4">
                    Already have a valid certificate? Upload it here. Accepted formats: PDF, JPG, PNG.
                </p>

                {uploaded ? (
                    <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-[#E8F0D0]">
                        <CheckCircle className="w-5 h-5 text-[#577C09] shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#577C09]">Certificate uploaded</p>
                            <p className="text-xs text-[#577C09]/70 truncate">{certificate}</p>
                        </div>
                        <label className="cursor-pointer text-xs text-[#577C09] hover:underline shrink-0">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) handleUpload(file)
                                }}
                            />
                            Replace
                        </label>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl py-10 cursor-pointer hover:border-[#577C09] hover:bg-[#F4F7EC]/50 transition-colors">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) handleUpload(file)
                            }}
                        />
                        {uploading ? (
                            <>
                                <Loader2 className="w-8 h-8 text-[#577C09] animate-spin" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="text-sm font-medium">Click to upload certificate</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, or PNG</p>
                                </div>
                            </>
                        )}
                    </label>
                )}
            </div>

            <div className="mt-8">
                <Button
                    onClick={onNext}
                    disabled={!uploaded}
                    className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save & Continue
                </Button>
                {!uploaded && (
                    <p className="text-xs text-muted-foreground mt-3">
                        You must upload your certificate before continuing.
                    </p>
                )}
            </div>
        </div>
    )
}