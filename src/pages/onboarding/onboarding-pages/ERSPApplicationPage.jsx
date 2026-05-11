import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ClipboardList, ExternalLink } from 'lucide-react'

export default function ERSPApplicationPage({ stepLabel, onNext, initialData, onChange }) {
    const [popupOpened, setPopupOpened] = useState(initialData?.popupOpened || false)
    const [popupClosed, setPopupClosed] = useState(initialData?.popupClosed || false)
    const popupRef = useRef(null)
    const pollRef = useRef(null)

    const openPopup = () => {
        const popup = window.open(
            'https://livihomecare.ersp.biz/index.cfm?event=Apply.index',
            'eRSP Enrollment',
            'width=900,height=700,scrollbars=yes,resizable=yes'
        )
        popupRef.current = popup
        setPopupOpened(true)
        setPopupClosed(false)
        onChange({ popupOpened: true, popupClosed: false })

        pollRef.current = setInterval(() => {
            if (popup.closed) {
                setPopupClosed(true)
                onChange({ popupOpened: true, popupClosed: true })
                clearInterval(pollRef.current)
            }
        }, 1000)
    }
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [])

    return (
        <div className="max-w-2xl mx-auto py-16 px-8">
            <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-5 h-5 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">{stepLabel}</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">Employee Profile / Enrollment</h1>
            <p className="text-muted-foreground mb-2">
                eRSP is the caregiver management system used by Livi Home Care.
                You'll use it to clock in and out of shifts, view your schedule,
                log care notes, and communicate with your supervisor.
            </p>
            <p className="text-muted-foreground mb-8">
                Please complete the enrollment form to create your caregiver account.
                Once submitted, Livi Home Care will activate your account before your first shift.
            </p>

            <div className="border border-border rounded-lg p-6 mb-6 flex items-center justify-between gap-4">
                <div>
                    <p className="font-medium mb-1">eRSP Caregiver Enrollment Form</p>
                    <p className="text-sm text-muted-foreground">
                        {!popupOpened && 'Opens in a popup — come back here when done'}
                        {popupOpened && !popupClosed && 'Form is open in another window...'}
                        {popupClosed && 'Form completed — you can continue'}
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2 border-[#577C09] text-[#577C09] hover:bg-[#E8F0D0] shrink-0 "
                    onClick={openPopup}
                    disabled={popupOpened && !popupClosed}
                >
                    {popupClosed ? 'Reopen Form' : 'Open Form'}
                    <ExternalLink className="w-4 h-4" />
                </Button>
            </div>

            <div className="bg-[#E8F0D0] rounded-lg p-4 mb-8">
                <p className="text-sm text-[#3D5906]">
                    <span className="font-medium">Heads up — </span>
                    the enrollment form will open in a popup window. Complete the form there and then return to this page to continue your orientation.
                </p>
            </div>

            <Button
                onClick={onNext}
                disabled={!popupClosed}
                className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:bg-gray-500 disabled:text-black disabled:cursor-not-allowed"
            >
                I've Completed the Form — Continue
            </Button>
        </div>
    )
}