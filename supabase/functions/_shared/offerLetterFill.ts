import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

// The exact fixed field names generate-offer-letter/index.ts tries against every offer
// letter template. Unlike company_forms, offer letters have no admin-configurable
// field_mapping — the PDF field names are hardcoded in that function. This list exists so
// Studio can show which of these a given template actually has (the upload-time and
// preview-fill checks), not to make anything configurable.
export const OFFER_LETTER_FIELD_NAMES = [
  'employee_name', 'employee_name_greeting', 'employee_signature', 'employee_date',
  'contractor_name', 'contractor_name_greeting', 'contractor_name_print', 'contractor_name_intro',
  'contractor_signature', 'contractor_date',
  'position', 'start_date', 'effective_date', 'letter_date',
  'hourly_rate', 'live_in_hourly_rate', 'companion_rate', 'mileage_rate',
  'position_intro', 'position_title', 'position_accept',
  'address', 'city', 'state', 'zip',
]

// Mirrors fillOfferLetterTemplate in generate-offer-letter/index.ts exactly, so Preview
// Fill produces the same result a real caregiver signing would get.
export async function fillOfferLetterTemplate(
  templateBytes: Uint8Array,
  caregiver: Record<string, unknown>,
  signature: string,
  extra: { address?: string; city?: string; state?: string; zip?: string },
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  const filledFieldNames: string[] = []

  const trySet = (fieldName: string, value: string) => {
    try {
      form.getTextField(fieldName).setText(value ?? '')
      filledFieldNames.push(fieldName)
    } catch {
      // field not present on this template — expected for most templates, most fields
    }
  }

  trySet('employee_name', caregiver.name as string)
  trySet('employee_name_greeting', caregiver.name as string)
  trySet('employee_signature', signature)
  trySet('employee_date', today)

  trySet('contractor_name', caregiver.name as string)
  trySet('contractor_name_greeting', caregiver.name as string)
  trySet('contractor_name_print', caregiver.name as string)
  trySet('contractor_name_intro', caregiver.name as string)
  trySet('contractor_signature', signature)
  trySet('contractor_date', today)

  trySet('position', (caregiver.position_title as string) || '')

  trySet('start_date', (caregiver.start_date as string) || '')
  trySet('effective_date', (caregiver.start_date as string) || '')
  trySet('letter_date', today)
  trySet('hourly_rate', caregiver.pay_rate?.toString() || '')
  trySet('live_in_hourly_rate', caregiver.companion_pay_rate?.toString() || '')
  trySet('companion_rate', caregiver.companion_pay_rate?.toString() || '')
  trySet('mileage_rate', caregiver.mileage_rate?.toString() || '')

  const positionIntro = caregiver.position_title
    ? `${caregiver.position_title}${caregiver.employment_type ? ` (${caregiver.employment_type})` : ''}`
    : ''
  trySet('position_intro', positionIntro)
  trySet('position_title', (caregiver.position_title as string) || '')
  trySet('position_accept', (caregiver.position_title as string) || '')

  trySet('address', extra.address || '')
  trySet('city', extra.city || '')
  trySet('state', extra.state || '')
  trySet('zip', extra.zip || '')

  form.updateFieldAppearances(font)

  for (const fieldName of filledFieldNames) {
    if (fieldName.toLowerCase().includes('signature')) {
      try {
        form.getTextField(fieldName).updateAppearances(await pdfDoc.embedFont(StandardFonts.HelveticaOblique))
      } catch {
        // not a text field
      }
    }
  }

  return await pdfDoc.save()
}

export async function listTemplateFieldNames(templateBytes: Uint8Array): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  return form.getFields().map((f) => f.getName())
}
