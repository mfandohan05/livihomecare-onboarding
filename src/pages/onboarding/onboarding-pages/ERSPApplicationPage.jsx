import { Button } from '@/components/ui/button'
import { ClipboardList } from 'lucide-react'

export default function ERSPApplicationPage({ onNext }) {
    return (
        <div className="max-w-4xl mx-auto py-16 px-8">
            <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-5 h-5 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">Step 4 of 11</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">eRSP Enrollment</h1>
            <p className="text-muted-foreground mb-2">
                eRSP is the caregiver management system used by Livi Home Care. 
                You'll use it to clock in and out of shifts, view your schedule, 
                log care notes, and communicate with your supervisor.
            </p>
            <p className="text-muted-foreground mb-8">
                Please complete the enrollment form below to create your caregiver account. 
                Once submitted, Livi Home Care will activate your account before your first shift.
            </p>

            <div className="w-full border border-border rounded-lg overflow-hidden mb-8">
                <iframe
                    src="https://livihomecare.ersp.biz/index.cfm?event=Apply.index"
                    className="w-full"
                    style={{ height: '700px' }}
                    title="eRSP Caregiver Enrollment"
                />
            </div>

            <div className="bg-[#E8F0D0] rounded-lg p-4 mb-8">
                <p className="text-sm text-[#3D5906]">
                    <span className="font-medium">Already submitted?</span> If you've completed the form above, click continue to move on to the next step. Livi Home Care will follow up with your login credentials before your first shift.
                </p>
            </div>

            <Button
                onClick={onNext}
                className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8"
            >
                I've Completed the Form — Continue
            </Button>
        </div>
    )
}