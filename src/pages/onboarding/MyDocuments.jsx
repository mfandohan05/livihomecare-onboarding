import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getDocuments, getMyCaregiver, uploadDocument } from '@/lib/caregiver'
import { Button } from '@/components/ui/button'
import companyLogo from '@/assets/logo.png'
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
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading' })
  const [documents, setDocuments] = useState([])
  const [companyName, setCompanyName] = useState('')
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!cancelled) setState({ status: 'signin' })
        return
      }

      const caregiver = await getMyCaregiver()
      if (!caregiver) {
        if (!cancelled) setState({ status: 'norecord' })
        return
      }
      if (caregiver.status !== 'completed') {
        if (!cancelled) setState({ status: 'onboarding' })
        return
      }

      const [docs, { data: branding }] = await Promise.all([
        getDocuments(caregiver.id),
        supabase
          .from('company_branding')
          .select('company_name, primary_color, secondary_bg_color, hover_color')
          .eq('company_id', caregiver.company_id)
          .single(),
      ])

      if (cancelled) return
      if (branding) {
        setCompanyName(branding.company_name || '')
        document.documentElement.style.setProperty('--primary-color', branding.primary_color)
        document.documentElement.style.setProperty('--secondary-bg', branding.secondary_bg_color)
        document.documentElement.style.setProperty('--hover-color', branding.hover_color)
      }
      setDocuments(docs)
      setState({ status: 'ready', caregiver })
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (state.status === 'signin') return <Navigate to="/sign-in" replace />
  if (state.status === 'onboarding') return <Navigate to="/onboard" replace />

  if (state.status === 'norecord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <h1 className="text-2xl font-bold mb-2">No employee record found</h1>
          <p className="text-muted-foreground">
            This account isn't linked to an employee. If you think this is a mistake, please contact your employer.
          </p>
        </div>
      </div>
    )
  }

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <img src={companyLogo} alt="Ready, Set, Onboard!" className="w-[200px]" />
        </div>

        <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-xl font-semibold">My Documents</h1>
            <Button variant="outline" size="sm" onClick={handleSignOut}>Sign out</Button>
          </div>
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
    </div>
  )
}
