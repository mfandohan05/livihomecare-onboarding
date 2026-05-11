import { Button } from "@/components/ui/button";
import { Heart, AlertCircle } from "lucide-react"

function WelcomePage({ caregiver, onNext, welcomeSteps }) {
    return (
        <div className="max-w-2xl mx-auto py-16 px-8">
            <div className="flex items-center gap-2 mb-2">
                <Heart className="w-6 h-6 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">Livi Home Care</span>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">
                Welcome to the team, {caregiver.name.split(' ')[0]}!
            </h1>

            <p className="text-muted-foreground text-lg mb-6">
                We're so glad to have you at Livi Home Care. This onboarding will walk you
                through everything you need to complete before your first shift.
            </p>

            {/* Documents needed warning */}
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-5 mb-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 mb-2">
                            Before you begin — have these documents ready:
                        </p>
                        <ul className="space-y-1 text-sm text-amber-700">
                            {[
                                "Driver's License",
                                "Social Security Card",
                                "Car Insurance",
                                "TB Test / TB Skin Test results",
                                "Hepatitis B vaccination record (if applicable)",
                                "Nursing License or CNA Certification (nurses only)",
                            ].map((doc, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                                    {doc}
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-amber-600 mt-3">
                            You will be asked to upload these during the onboarding process. Having them ready will save you time.
                        </p>
                    </div>
                </div>
            </div>

            {/* What you'll cover */}
            <div className="bg-[#E8F0D0] rounded-lg p-6 mb-6">
                <p className="text-sm font-medium text-[#577C09] mb-3">
                    Here's what you'll cover:
                </p>
                <ul className="space-y-2 text-sm text-[#3D5906] list-none">
                    {welcomeSteps.map((step, index) => (
                        <li key={index} className="flex items-center gap-2">
                            {step}
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-[#577C09] mt-4 pt-3 border-t border-[#577C09]/20">
                    All sections must be completed before your first shift. Your onboarding time is recorded for payroll purposes and pauses automatically after 5 seconds of inactivity.
                </p>
            </div>

            <p className="text-sm text-muted-foreground mb-8">
                Your progress is saved automatically — you can close this tab and
                return anytime using your original link.
            </p>

            <Button
                onClick={onNext}
                className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 py-3"
            >
                Get Started
            </Button>
        </div>
    )
}

export default WelcomePage;