import { useEffect, useState } from 'react'
import { subscribeToHttpErrors } from '@/lib/errorReporter'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TriangleAlert } from 'lucide-react'

export default function ErrorDialogProvider() {
    const [error, setError] = useState(null)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        return subscribeToHttpErrors((detail) => {
            setShowDetails(false)
            setError(detail)
        })
    }, [])

    return (
        <Dialog open={!!error} onOpenChange={(o) => !o && setError(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TriangleAlert className="w-5 h-5 text-red-500 shrink-0" />
                        Uh oh...
                    </DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    {error?.functionLabel ? `Something went wrong while trying to ${error.functionLabel}.` : 'Something went wrong.'}
                </p>

                {showDetails ? (
                    <pre className="text-xs bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-60">
                        {`${error?.method} ${error?.url}\nStatus: ${error?.status ?? 'network error'} ${error?.statusText || ''}\n\n${error?.body || ''}`}
                    </pre>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowDetails(true)}
                        className="text-xs text-muted-foreground underline self-start cursor-pointer"
                    >
                        More details
                    </button>
                )}

                <DialogFooter>
                    <Button onClick={() => setError(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
