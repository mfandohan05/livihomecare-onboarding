import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FolderUp, CreditCard, Car, Stethoscope, IdCard, Camera, CheckCircle, Upload, Award, Loader2 } from 'lucide-react'
import { uploadDocument, getDocuments } from '@/lib/caregiver'

export default function UploadDocumentsPage({ stepLabel, onNext, role, caregiver }) {

  const baseDocs = [
    {
      id: 'driversLicense',
      label: "Driver's License",
      icon: CreditCard,
      required: true,
      description: "Front of your valid driver's license"
    },
    {
      id: 'carInsurance',
      label: "Car Insurance",
      icon: Car,
      required: true,
      description: "Current insurance card or declaration page"
    },
    {
      id: 'tbTest',
      label: "TB Test / TB Skin Test",
      icon: Stethoscope,
      required: true,
      description: "Results from your TB test or skin test"
    },
    {
      id: 'socialSecurityCard',
      label: <span>Social Security Card/Other I-9 Identity Documentation</span>,
      icon: IdCard,
      required: true,
      description: "Photo or scan of your Social Security card or other documentation"
    },
    {
      id: 'badgePhoto',
      label: "Badge Photo",
      icon: Camera,
      required: true,
      description: "A clear, recent photo of yourself for your employee badge"
    },
  ]

  const optionalDocs = {
    id: 'certifications',
    label: "Certifications",
    icon: Award,
    required: false,
    description: "CNA, HHA, CPR, or any other relevant certifications (if applicable)"
  }

  const nursingLicenseDocument = {
    id: 'nursingLicense',
    label: 'Nursing License',
    icon: Award,
    required: true,
    description: "Your current RN license issued by the NC Board of Nursing"
  }

  const requiredDocs = role === 'nurse'
    ? [...baseDocs, nursingLicenseDocument, optionalDocs]
    : [...baseDocs, optionalDocs]

  const [uploads, setUploads] = useState({})
  const [uploading, setUploading] = useState({}) 
  const [errors, setErrors] = useState({}) 
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      const docs = await getDocuments(caregiver.id)
      const restored = {}
      docs.forEach(doc => {
        restored[doc.document_type] = {
          name: doc.file_name,
          path: doc.file_path
        }
      })
      setUploads(restored)
      setLoadingDocs(false)
    }
    fetchDocs()
  }, [caregiver.id])

  if (loadingDocs) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#577C09]" />
      </div>
    )
  }

  const handleFileChange = async (docId, e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(prev => ({ ...prev, [docId]: true }))
    setErrors(prev => ({ ...prev, [docId]: null }))

    const filePath = await uploadDocument(caregiver.id, caregiver.name, docId, file)

    if (filePath) {
      setUploads(prev => ({ ...prev, [docId]: { name: file.name, path: filePath } }))
    } else {
      setErrors(prev => ({ ...prev, [docId]: 'Upload failed — please try again' }))
    }

    setUploading(prev => ({ ...prev, [docId]: false }))
  }

  const handleRemove = (docId) => {
    setUploads(prev => {
      const updated = { ...prev }
      delete updated[docId]
      return updated
    })
  }

  const requiredIds = requiredDocs.filter(d => d.required).map(d => d.id)
  const allRequiredUploaded = requiredIds.every(id => uploads[id])
  const anyUploading = Object.values(uploading).some(Boolean)

  return (
    <div className="max-w-2xl mx-auto py-16 px-8">
      <div className="flex items-center gap-2 mb-2">
        <FolderUp className="w-5 h-5 text-[#577C09]" />
        <span className="text-[#577C09] font-medium">{stepLabel}</span>
      </div>

      <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
      <p className="text-muted-foreground mb-8">
        Please upload clear photos or scans of each document below.
        All documents marked as required must be uploaded before continuing. <br />
        If you do not have a Social Security card, you may upload any document from the <a className="underline" href="https://www.uscis.gov/i-9-central/form-i-9-acceptable-documents">I-9 List of Acceptable Documents</a> instead — such as a U.S. Passport, Permanent Resident Card, or Employment Authorization Document.
      </p>

      <div className="space-y-4 mb-8">
        {requiredDocs.map((doc) => {
          const Icon = doc.icon
          const uploaded = uploads[doc.id]
          const isUploading = uploading[doc.id]
          const error = errors[doc.id]

          return (
            <div
              key={doc.id}
              className={`border rounded-lg p-4 transition-colors ${
                uploaded
                  ? 'border-[#577C09] bg-[#E8F0D0]'
                  : error
                  ? 'border-red-300 bg-red-50'
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-md ${uploaded ? 'bg-[#577C09]' : 'bg-muted'}`}>
                  <Icon className={`w-5 h-5 ${uploaded ? 'text-white' : 'text-muted-foreground'}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{doc.label}</span>
                    {doc.required ? (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                    {uploaded && (
                      <CheckCircle className="w-4 h-4 text-[#577C09] ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{doc.description}</p>

                  {isUploading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading...
                    </div>
                  ) : uploaded ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#577C09] font-medium truncate max-w-[200px]">
                        {uploaded.name}
                      </span>
                      <button
                        onClick={() => handleRemove(doc.id)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileChange(doc.id, e)}
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-md px-3 py-2 hover:border-[#577C09] hover:text-[#577C09] transition-colors w-fit">
                          <Upload className="w-3 h-3" />
                          <span>Click to upload — JPG, PNG or PDF</span>
                        </div>
                      </label>
                      {error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!allRequiredUploaded && (
        <p className="text-sm text-muted-foreground mb-4">
          Please upload all required documents to continue.
        </p>
      )}

      <Button
        onClick={onNext}
        disabled={!allRequiredUploaded || anyUploading}
        className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {anyUploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </span>
        ) : 'Save & Continue'}
      </Button>
    </div>
  )
}