import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toDateOnly } from '@/lib/documentExpiration'

function ExpirationDateForm({ initialValue, required, confirmLabel, saving, error, onConfirm, onClose }) {
  const [value, setValue] = useState(toDateOnly(initialValue) || '')
  const canSubmit = !saving && (!required || Boolean(value))

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="expiration-date-input">
          Expiration date{required ? ' (required)' : ' (optional)'}
        </Label>
        <Input
          id="expiration-date-input"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
        />
        {!required && (
          <p className="text-xs text-muted-foreground">Leave blank if this document does not expire.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          onClick={() => onConfirm(value || null)}
          disabled={!canSubmit}
          className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  )
}

export default function ExpirationDateDialog({
  open,
  title,
  description,
  initialValue,
  required,
  confirmLabel = 'Save',
  saving,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ExpirationDateForm
          initialValue={initialValue}
          required={required}
          confirmLabel={confirmLabel}
          saving={saving}
          error={error}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
