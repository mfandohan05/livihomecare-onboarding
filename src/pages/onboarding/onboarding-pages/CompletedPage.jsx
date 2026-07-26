import { PartyPopper, Heart, CheckCircle, Mail, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PDFDocument } from 'pdf-lib'

export default function CompletedPage({ caregiver, steps, companyData, getHoursWorked, updateCaregiverStatus, handleOfferLetter }) {

    const [certificateUrl, setCertificateUrl] = useState(null);

    useEffect(() => {
        generateCertificate();
        handleOfferLetter();
        return () => {
            if (certificateUrl) {
                URL.revokeObjectURL(certificateUrl)
            }
        }
    }, [])

    const generateCertificate = async () => {
        const response = await fetch('/certificate.pdf');
        const pdfBytes = await response.arrayBuffer();

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        const nameField = form.getTextField('Text1');
        nameField.setText(caregiver.name);
        form.flatten();

        const filledPdfBytes = await pdfDoc.save();
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setCertificateUrl(url);
    }

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = certificateUrl;
        a.download = `${caregiver.name.replace(/\s+/g, '_')}_Certificate.pdf`;
        a.click();
    }

    const completedStepNames = (steps || [])
        .filter(s => s.stepName !== 'Completed!')
        .map(s => s.stepName)

    const stepKeys = (steps || []).map(s => s.stepKey)
    const nextSteps = (companyData?.next_steps || []).filter(
        step => !step.requires_step || stepKeys.includes(step.requires_step)
    )

    const companyName = companyData?.company_name || 'us'
    const supportEmail = companyData?.support_email
    const supportPhone = companyData?.phone

    return (
        <div className="max-w-2xl mx-auto py-16 px-8">
            <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--secondary-bg)] flex items-center justify-center">
                        <PartyPopper className="w-8 h-8 text-[var(--primary-color)]" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-3">
                    You're all done, {caregiver.name.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground text-lg">
                    Congratulations on completing your {companyName} orientation. We're so excited to have you on the team.
                </p>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2">Your Certificate</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Congratulations on completing your onboarding!
                </p>
                {certificateUrl ? (
                    <div className="space-y-3">
                        <iframe
                            src={certificateUrl}
                            className="w-full h-[500px] rounded-xl border border-border"
                            title="Completion Certificate"
                        />
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 text-sm text-[var(--primary-color)] hover:underline my-4"
                        >
                            Download Certificate
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-[500px] rounded-xl border border-border bg-muted/30 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Generating certificate...</p>
                    </div>
                )}
            </div>

            {completedStepNames.length > 0 && (
                <div className="border border-border rounded-xl p-6 mb-6">
                    <h2 className="font-medium mb-4">What you completed</h2>
                    <div className="space-y-2">
                        {completedStepNames.map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-[var(--primary-color)] shrink-0" />
                                <span className="text-sm text-muted-foreground">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {nextSteps.length > 0 && (
                <div className="border border-border rounded-xl p-6 mb-6">
                    <h2 className="font-medium mb-4">What happens next</h2>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        {nextSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-[var(--secondary-bg)] text-[var(--primary-color)] flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                                    {i + 1}
                                </div>
                                <p>{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(supportEmail || supportPhone) && (
                <div className="bg-[var(--secondary-bg)] rounded-xl p-6 mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-4 h-4 text-[var(--primary-color)]" />
                        <p className="font-medium text-[var(--primary-color)]">Questions? We're here to help.</p>
                    </div>
                    <div className="space-y-2 text-sm text-[var(--hover-color)]">
                        {supportEmail && (
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 shrink-0" />
                                <a href={`mailto:${supportEmail}`} className="underline hover:text-[var(--primary-color)]">
                                    {supportEmail}
                                </a>
                            </div>
                        )}
                        {supportPhone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 shrink-0" />
                                <a href={`tel:${supportPhone.replace(/\D/g, '')}`} className="underline hover:text-[var(--primary-color)]">
                                    {supportPhone}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
                Thank you for your commitment to providing high-quality care to our clients. We can't do it without you.
            </p>

        </div>
    )
}