import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react"

function WelcomePage({ caregiver, onNext }) {
    return (
        <div className="max-w-2xl mx-auto py-16 px-8">
            <div className="flex items-center gap-2 mb-2">
                <Heart className="w-6 h-6 text-(--brand-color)" />
                <span className="text-(--brand-color) font-medium">Livi Home Care</span>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">Welcome, {caregiver.name}!</h1>

            <p className="text-muted-foreground text-lg mb-6">
                We're so glad to have you on the team. This orientation will walk you
                through everything you need to know before your first day. It should
                take about <span className="text-foreground font-medium">2-3 hours</span> to complete.
            </p>

            <div className="bg-[#E8F0D0] rounded-lg p-6 mb-8">
                <p className="text-sm font-medium text-[#577C09] mb-3">
                    Here's what you'll cover:
                </p>
                <ul className="space-y-2 text-sm text-[#3D5906]">
                    <li>✓ Uploading required documents (driver's license, car insurance, Social Security card, etc.)</li>
                    <li>✓ Personal information & emergency contact</li>
                    <li>✓ eRSP employment application</li>
                    <li>✓ New hire orientation</li>
                    <li>✓ Skills competency checklist</li>
                    <li>✓ Guide to using eRSP</li>
                    <li>✓ Forms & agreements</li>
                    <li>✓ Tax forms</li>
                    <li>✓ Offer letter</li>
                </ul>
            </div>

            <p className="text-sm text-muted-foreground mb-8">
                Your progress is saved automatically; you can close this tab and
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