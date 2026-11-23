import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const COUNTDOWN_SECONDS = 30

export default function ProfilePromptDialog({ name, onContinue, onDismiss }) {
    const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS)
    const continueRef = useRef(onContinue)

    useEffect(() => {
        continueRef.current = onContinue
    })

    useEffect(() => {
        const id = setInterval(() => setSeconds((s) => s - 1), 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        if (seconds <= 0) continueRef.current()
    }, [seconds])

    const remaining = Math.max(seconds, 0)

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onDismiss() }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>You're all set{name ? `, ${name}` : ''}!</DialogTitle>
                    <DialogDescription>
                        Continue to your profile to see the documents you've uploaded, then head to My Training to complete your assigned trainings.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Taking you to your profile automatically</span>
                        <span className="tabular-nums">{remaining}s</span>
                    </div>
                    <Progress value={(remaining / COUNTDOWN_SECONDS) * 100} className="h-2" />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onDismiss}>Stay on this page</Button>
                    <Button
                        onClick={onContinue}
                        className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white"
                    >
                        Continue to my profile
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
