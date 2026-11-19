import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { getDocuments, uploadDocument } from '@/lib/caregiver'
import ExpirationDateDialog from '@/components/global/ExpirationDateDialog'
import { ExpirationBadge } from '@/components/admin/ExpirationBadge'
import {
  EXPIRATION_REQUIRED_TYPES,
  collapseAliasedDocuments,
  documentLabel,
  formatDateOnly,
  getExpirationStatus,
  isTrackedDocumentType,
  toDateOnly,
  toExpirationTimestamp,
} from '@/lib/documentExpiration'

const byUrgency = (a, b) => {
  const aDays = getExpirationStatus(a.expiration_date)?.daysLeft ?? Infinity
  const bDays = getExpirationStatus(b.expiration_date)?.daysLeft ?? Infinity
  return aDays - bDays
}

export default function MyDocuments() {
  const state = useOutletContext()
  const [documents, setDocuments] = useState([])
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getDocuments(state.caregiver.id).then((docs) => {
      if (!cancelled) setDocuments(docs)
    })
    return () => { cancelled = true }
  }, [state])

  const companyName = state.companyName
  const { caregiver } = state
  const trackedDocuments = collapseAliasedDocuments(
    documents.filter((doc) => isTrackedDocumentType(doc.document_type))
  ).sort(byUrgency)

  const handleConfirm = async (value) => {
    setSaving(true)
    setError(null)
    const path = await uploadDocument(
      caregiver.id,
      caregiver.company_id,
      caregiver.name,
      pending.docType,
      pending.file,
      toExpirationTimestamp(value),
    )
    if (!path) {
      setError('Upload failed. Please try again.')
      setSaving(false)
      return
    }
    setDocuments(await getDocuments(caregiver.id))
    setSaving(false)
    setPending(null)
    toast.success('Document updated')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">My Documents</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Keep your documents{companyName ? ` on file with ${companyName}` : ''} up to date. Upload a replacement and enter its new expiration date.
        </p>

          {trackedDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents with expiration dates are on file.</p>
          ) : (
            <div className="space-y-2">
              {trackedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 rounded-lg border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{documentLabel(doc.document_type)}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                    {doc.expiration_date && (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Expires {formatDateOnly(toDateOnly(doc.expiration_date))}
                        </span>
                        <ExpirationBadge expirationDate={doc.expiration_date} />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        e.target.value = ''
                        if (file) setPending({ docType: doc.document_type, file })
                      }}
                    />
                    <span className="flex items-center gap-1.5 text-sm text-[var(--primary-color)] hover:underline">
                      <Upload className="w-4 h-4" />
                      Replace
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
      </div>

      <ExpirationDateDialog
        open={Boolean(pending)}
        title={pending ? `Replace ${documentLabel(pending.docType)}` : ''}
        description="Enter the expiration date shown on your new document before uploading."
        required={pending ? EXPIRATION_REQUIRED_TYPES.includes(pending.docType) : false}
        confirmLabel="Upload"
        saving={saving}
        error={error}
        onConfirm={handleConfirm}
        onClose={() => { setPending(null); setError(null) }}
      />
    </>
  )
}
