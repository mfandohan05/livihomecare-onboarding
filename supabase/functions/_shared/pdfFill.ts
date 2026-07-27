import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

// Mirrors generate-generic-signed-document/index.ts's fillDocumentTemplate exactly, so
// Preview Fill produces byte-for-byte the same result a real caregiver would get — the
// whole point of Preview Fill is that it's not a simulation, it's the real fill logic.
export async function fillDocumentTemplate(
  templateBytes: Uint8Array,
  fieldValues: Record<string, string | boolean>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const filledFieldNames: string[] = []

  for (const [fieldName, value] of Object.entries(fieldValues)) {
    try {
      if (typeof value === 'boolean') {
        const checkbox = form.getCheckBox(fieldName)
        value ? checkbox.check() : checkbox.uncheck()
      } else {
        form.getTextField(fieldName).setText(value ?? '')
      }
      filledFieldNames.push(fieldName)
    } catch {
      console.warn(`Field "${fieldName}" not found on template — skipped`)
    }
  }

  form.updateFieldAppearances(font)

  for (const fieldName of filledFieldNames) {
    if (fieldName.toLowerCase().includes('signature')) {
      try {
        form.getTextField(fieldName).updateAppearances(italicFont)
      } catch {
        // not a text field (e.g. a checkbox) — nothing to do
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

// Mirrors resolveFieldValues in
// src/pages/onboarding/onboarding-pages/FormsApplicationsPage.jsx exactly — same source
// types, same resolution rules — so Preview Fill reflects what a real caregiver's
// submission would actually produce, not an approximation of it.
export function resolveFieldMappingValues(
  fieldMapping: Array<Record<string, unknown>>,
  caregiver: Record<string, unknown>,
  signature: string,
  context: { hepBStatus?: string; references?: Array<Record<string, string>> },
): Record<string, string | boolean> {
  const today = new Date()
  const fieldValues: Record<string, string | boolean> = {}

  for (const entry of fieldMapping || []) {
    const pdfField = entry.pdf_field as string
    const source = entry.source as string
    if (!pdfField || !source) continue

    if (source === 'static') {
      fieldValues[pdfField] = (entry.value as string) ?? ''
    } else if (source === 'caregiver_field') {
      fieldValues[pdfField] = (caregiver[entry.field as string] as string) ?? ''
    } else if (source === 'signature') {
      fieldValues[pdfField] = signature || ''
    } else if (source === 'today') {
      fieldValues[pdfField] = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    } else if (source === 'today_part') {
      const part = entry.part as string
      if (part === 'day') fieldValues[pdfField] = String(today.getDate())
      if (part === 'month_long') fieldValues[pdfField] = today.toLocaleString('en-US', { month: 'long' })
      if (part === 'year_short') fieldValues[pdfField] = String(today.getFullYear()).slice(2)
      if (part === 'year_long') fieldValues[pdfField] = String(today.getFullYear())
    } else if (source === 'formatted_date') {
      const raw = caregiver[entry.field as string] as string
      fieldValues[pdfField] = raw
        ? new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
        : ''
    } else if (source === 'checkbox_match') {
      fieldValues[pdfField] = context[entry.value_key as 'hepBStatus'] === entry.equals
    } else if (source === 'reference_field') {
      const index = entry.index as number
      fieldValues[pdfField] = context.references?.[index]?.[entry.field as string] || ''
    }
  }

  return fieldValues
}
