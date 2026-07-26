import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileSignature, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AddressAutocompleteField from '@/components/global/AddressAutocompleteField'

const today = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'America/New_York'
})

const getFormattedStartDate = (caregiver) => {
  if (!caregiver.start_date) return ''
  const date = new Date(caregiver.start_date)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

const interpolate = (text, caregiver) => {
  if (!text) return text
  return text
    .replaceAll('{{today}}', today)
    .replaceAll('{{caregiver.name}}', caregiver?.name || '')
    .replaceAll('{{caregiver.position_title}}', caregiver?.position_title || '')
    .replaceAll('{{caregiver.pay_rate}}', caregiver?.pay_rate ?? '')
    .replaceAll('{{caregiver.companion_pay_rate}}', caregiver?.companion_pay_rate ?? '')
    .replaceAll('{{caregiver.employment_type}}', caregiver?.employment_type || '')
    .replaceAll('{{caregiver.start_date_formatted}}', getFormattedStartDate(caregiver) || '________________')
}

const renderContentBlock = (block, i, caregiver) => {
  if (block.type === 'heading') {
    return <p key={i} className="font-medium mt-2">{interpolate(block.text, caregiver)}</p>
  }
  if (block.type === 'list') {
    return (
      <ul key={i} className="space-y-1 pl-4">
        {block.items.map((item, j) => (
          <li key={j} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] shrink-0" />
            {interpolate(item, caregiver)}
          </li>
        ))}
      </ul>
    )
  }
  if (block.type === 'numbered_list') {
    return (
      <ol key={i} className="list-decimal list-outside pl-5 space-y-2 mt-1">
        {block.items.map((item, j) => (
          <li key={j}>
            <strong>{interpolate(item.text, caregiver)}</strong>
            {item.sub_items && (
              <ul className="pl-4 mt-1 space-y-0.5 text-muted-foreground">
                {item.sub_items.map((sub, k) => <li key={k}>{interpolate(sub, caregiver)}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ol>
    )
  }
  return <p key={i}>{interpolate(block.text, caregiver)}</p>
}

function CustomPdfOfferLetter({ caregiver, companyName, signed, signature, onSignatureChange, onSign }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loadingPdf, setLoadingPdf] = useState(true)
  const [notUploaded, setNotUploaded] = useState(false)

  useEffect(() => {
    const fetchPdf = async () => {
      const { data: doc } = await supabase
        .from('caregiver_documents')
        .select('file_path')
        .eq('caregiver_id', caregiver.id)
        .eq('document_type', 'offer_letter_other')
        .maybeSingle()

      if (!doc) { setNotUploaded(true); setLoadingPdf(false); return }

      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600)

      if (data?.signedUrl) setPdfUrl(data.signedUrl)
      setLoadingPdf(false)
    }
    fetchPdf()
  }, [caregiver.id])

  if (loadingPdf) return <p className="text-sm text-muted-foreground py-4">Loading offer letter...</p>

  if (notUploaded) return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p className="text-sm text-amber-800 font-medium">Offer letter not yet available</p>
      <p className="text-xs text-amber-700 mt-1">
        {companyName} is preparing your offer letter. Please check back shortly or contact the office.
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-xl overflow-hidden" style={{ height: '500px' }}>
        <iframe src={pdfUrl} className="w-full h-full" title="Offer Letter" />
      </div>
      <div className="border-t pt-6">
        <p className="font-medium mb-4">Acknowledgment and Acceptance</p>
        <p className="text-muted-foreground text-sm mb-6">
          I have read and agree to the terms outlined in this offer letter.
        </p>
        {signed ? (
          <div className="flex items-center gap-2 text-[var(--primary-color)] font-medium">
            <CheckCircle className="w-4 h-4" />
            Offer letter signed — {today}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otherSignature">
                Full name (signature) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="otherSignature"
                placeholder={caregiver.name}
                value={signature}
                onChange={(e) => onSignatureChange(e.target.value)}
                className="font-serif italic"
              />
              <p className="text-xs text-muted-foreground">
                By typing your name, you are providing a legally binding electronic signature.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Date: {today}</p>
            <Button
              onClick={onSign}
              disabled={!signature.trim()}
              className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8 disabled:opacity-50"
            >
              Sign & Accept Offer
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OfferLetterPage({ stepLabel, caregiver, companyId, companyData, onNext, initialData, onChange, setSaving }) {
  const companyName = companyData?.company_name || 'your employer'

  const [template, setTemplate] = useState(null)
  const [loadingTemplate, setLoadingTemplate] = useState(true)

  const [signature, setSignature] = useState(initialData?.signature || '')
  const [address, setAddress] = useState(initialData?.address || '')
  const [address2, setAddress2] = useState(initialData?.address2 || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [state, setState] = useState(initialData?.state || '')
  const [zip, setZip] = useState(initialData?.zip || '')
  const [signed, setSigned] = useState(initialData?.signed || false)

  useEffect(() => {
    if (!companyId || !caregiver?.role) return

    const loadTemplate = async () => {
      setLoadingTemplate(true)
      const { data, error } = await supabase
        .from('offer_letter_templates')
        .select('title, content, requires_address, acknowledgment_text, uses_custom_pdf')
        .eq('company_id', companyId)
        .eq('role_key', caregiver.role)
        .maybeSingle()

      setTemplate(!error && data ? data : null)
      setLoadingTemplate(false)
    }

    loadTemplate()
  }, [companyId, caregiver?.role])

  const canSign = signature.trim() && (
    !template?.requires_address ? true : address.trim() && city.trim() && state.trim() && zip.trim()
  )

  const handleSign = async () => {
    setSaving(true)

    const combinedAddress = [address, address2].filter(Boolean).join(', ')

    const { error } = await supabase.functions.invoke('generate-offer-letter', {
      body: { caregiverId: caregiver.id, signature, address: combinedAddress, city, state, zip }
    })

    if (error) {
      console.error('Error generating offer letter:', error)
      setSaving(false)
      return
    }

    setSigned(true)
    onChange({ signature, address: combinedAddress, address2, city, state, zip, signed: true })
    setSaving(false)
  }

  if (loadingTemplate) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--primary-color)] mr-2" />
        <p className="text-muted-foreground">Loading offer letter...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-8 text-center">
        <p className="text-muted-foreground">No offer letter is configured for your role yet. Please contact your administrator.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-8">

      <div className="flex items-center gap-2 mb-2">
        <FileSignature className="w-5 h-5 text-[var(--primary-color)]" />
        <span className="text-[var(--primary-color)] font-medium">{stepLabel}</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">{template.title}</h1>
      <p className="text-muted-foreground mb-8">
        Please read carefully and sign at the bottom to accept your position with {companyName}.
      </p>

      <div className="border border-border rounded-xl p-8 mb-8">
        {template.uses_custom_pdf ? (
          <CustomPdfOfferLetter
            caregiver={caregiver}
            companyName={companyName}
            signed={signed}
            signature={signature}
            onSignatureChange={(val) => {
              setSignature(val)
              onChange({ signature: val, address, address2, city, state, zip, signed })
            }}
            onSign={() => {
              setSigned(true)
              onChange({ signature, address, address2, city, state, zip, signed: true })
            }}
          />
        ) : (
          <>
            <div className="space-y-5 text-sm leading-relaxed">
              {template.content.map((block, i) => renderContentBlock(block, i, caregiver))}
            </div>

            <div className="border-t pt-6 mt-6">
              <p className="font-medium mb-4">Acknowledgment and Acceptance</p>
              <p className="text-muted-foreground mb-6">
                {interpolate(template.acknowledgment_text, caregiver)}
              </p>
              {signed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[var(--primary-color)] font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Signed — {today}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Signed by: <span className="font-serif italic">{signature}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="offerSignature">
                      Full name (signature) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="offerSignature"
                      placeholder={caregiver.name}
                      value={signature}
                      onChange={(e) => {
                        setSignature(e.target.value)
                        onChange({ signature: e.target.value, address, address2, city, state, zip, signed })
                      }}
                      className="font-serif italic"
                    />
                    <p className="text-xs text-muted-foreground">
                      By typing your name, you are providing a legally binding electronic signature.
                    </p>
                  </div>
                  {template.requires_address && (
                    <>
                      <AddressAutocompleteField
                        label="Address Line 1"
                        value={address}
                        onSelect={(parsed) => {
                          const newAddress = parsed.streetAddress || address
                          const newCity = parsed.city || city
                          const newState = parsed.state || state
                          const newZip = parsed.zip || zip
                          setAddress(newAddress)
                          setCity(newCity)
                          setState(newState)
                          setZip(newZip)
                          onChange({ signature, address: newAddress, address2, city: newCity, state: newState, zip: newZip, signed })
                        }}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="offerAddress2">Address line 2</Label>
                        <Input id="offerAddress2" placeholder="Apt 4B (if applicable)" value={address2}
                          onChange={(e) => { setAddress2(e.target.value); onChange({ signature, address, address2: e.target.value, city, state, zip, signed }) }} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-1">
                          <Label htmlFor="offerCity">City <span className="text-red-500">*</span></Label>
                          <Input id="offerCity" placeholder="Charlotte" value={city}
                            onChange={(e) => { setCity(e.target.value); onChange({ signature, address, address2, city: e.target.value, state, zip, signed }) }} />
                        </div>
                        <div className="space-y-2 col-span-1">
                          <Label htmlFor="offerState">State <span className="text-red-500">*</span></Label>
                          <Input id="offerState" placeholder="NC" maxLength={2} value={state}
                            onChange={(e) => { setState(e.target.value); onChange({ signature, address, address2, city, state: e.target.value, zip, signed }) }} />
                        </div>
                        <div className="space-y-2 col-span-1">
                          <Label htmlFor="offerZip">Zip <span className="text-red-500">*</span></Label>
                          <Input id="offerZip" placeholder="28201" maxLength={5} value={zip}
                            onChange={(e) => { setZip(e.target.value); onChange({ signature, address, address2, city, state, zip: e.target.value, signed }) }} />
                        </div>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">Date: {today}</p>
                  <Button onClick={handleSign} disabled={!canSign}
                    className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                    Sign & Accept
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={!signed}
        className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save & Continue
      </Button>

    </div>
  )
}