import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { getDocuments, uploadDocument } from '@/lib/caregiver'
import ExpirationDateDialog from '@/components/global/ExpirationDateDialog'
import { ExpirationBadge } from '@/components/admin/ExpirationBadge'
import {
  EXPIRATION_REQUIRED_TYPES,
  aliasesOf,
  documentLabel,
  formatDateOnly,
  isTrackedDocumentType,
  toDateOnly,
  toExpirationTimestamp,
} from '@/lib/documentExpiration'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const NURSE_ROLES = ['nurse_prn', 'nurse_director']

const DOCUMENT_TYPES = [
  { type: 'driversLicense', label: "Driver's License" },
  { type: 'carInsurance', label: 'Car Insurance' },
  { type: 'nursingLicense', label: 'Nursing License', nurseOnly: true },
  { type: 'tbTest', label: 'TB Test' },
  { type: 'bloodborne_certificate', label: 'Bloodborne Pathogens Certificate' },
  { type: 'certifications', label: 'Certifications' },
  { type: 'socialSecurityCard', label: 'Social Security Card / Other Supporting I-9 Documentation' },
  { type: 'badgePhoto', label: 'Badge Photo' },
  { type: 'resume', label: 'Resume' },
]

export default function MyDocuments() {
  const state = useOutletContext()
  const [documents, setDocuments] = useState([])
  const [pending, setPending] = useState(null)
  const [uploadingType, setUploadingType] = useState(null)
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
  const isNurse = NURSE_ROLES.includes(caregiver.role)
  const options = DOCUMENT_TYPES.filter((option) => !option.nurseOnly || isNurse)

  const existingDocument = (type) => documents.find((doc) => aliasesOf(type).includes(doc.document_type))

  const save = async (docType, file, expiration) => {
    const path = await uploadDocument(
      caregiver.id,
      caregiver.company_id,
      caregiver.name,
      docType,
      file,
      expiration,
    )
    if (path) setDocuments(await getDocuments(caregiver.id))
    return Boolean(path)
  }

  const handlePicked = async (type, file) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error('That file is too large. Please keep it under 10 MB.')
      return
    }

    if (isTrackedDocumentType(type)) {
      setPending({ docType: type, file })
      return
    }

    setUploadingType(type)
    const saved = await save(type, file, null)
    setUploadingType(null)
    if (saved) toast.success('Document uploaded')
    else toast.error('Upload failed. Please try again.')
  }

  const handleConfirm = async (value) => {
    setSaving(true)
    setError(null)
    const saved = await save(pending.docType, pending.file, toExpirationTimestamp(value))
    setSaving(false)

    if (!saved) {
      setError('Upload failed. Please try again.')
      return
    }
    toast.success(existingDocument(pending.docType) ? 'Document updated' : 'Document uploaded')
    setPending(null)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">My Documents</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your documents{companyName ? ` to ${companyName}` : ''} and keep them up to date. You can add a new document or replace one that is already on file.
        </p>

        <div className="space-y-2">
          {options.map(({ type, label }) => {
            const doc = existingDocument(type)
            const uploading = uploadingType === type

            return (
              <div
                key={type}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 rounded-lg border border-border"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {doc ? doc.file_name : 'Not uploaded yet'}
                  </p>
                  {doc?.expiration_date && isTrackedDocumentType(type) && (
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Expires {formatDateOnly(toDateOnly(doc.expiration_date))}
                      </span>
                      <ExpirationBadge expirationDate={doc.expiration_date} />
                    </div>
                  )}
                </div>
                <label className={`shrink-0 ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files[0]
                      e.target.value = ''
                      if (file) handlePicked(type, file)
                    }}
                  />
                  <span className="flex items-center gap-1.5 text-sm text-[var(--primary-color)] hover:underline">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : doc ? 'Replace' : 'Upload'}
                  </span>
                </label>
              </div>
            )
          })}
        </div>
      </div>

      <ExpirationDateDialog
        open={Boolean(pending)}
        title={pending ? `${existingDocument(pending.docType) ? 'Replace' : 'Upload'} ${documentLabel(pending.docType)}` : ''}
        description="Enter the expiration date shown on your document before uploading."
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
