// The only step types OnboardingPortal.jsx actually knows how to render. It dispatches on
// an exact `step_name` string match (see renderStep()'s switch) and falls through to
// `default: return null` for anything else — a blank step for a real caregiver. This catalog
// is the single source of truth for step_key/step_name/form_data_key so Studio can never
// create a step row that silently renders nothing.
//
// form_data_key mirrors the `formData` property each step's page component actually reads/
// writes in OnboardingPortal.jsx, and that AdminCaregiverDetail.jsx's "reset step" feature
// clears by that same key — getting it wrong doesn't break rendering, but does break that
// existing admin reset action for this step.
export const ONBOARDING_STEP_TYPES = [
  { stepType: 'welcome', label: 'Welcome', step_key: 'welcome', step_name: 'Welcome', form_data_key: null },
  { stepType: 'upload_documents', label: 'Upload Documents', step_key: 'upload_documents', step_name: 'Upload Documents', form_data_key: null },
  { stepType: 'personal_information', label: 'Personal Information', step_key: 'personal_information', step_name: 'Personal Information', form_data_key: 'personalInfo' },
  { stepType: 'orientation', label: 'New Hire Orientation', step_key: 'orientation', step_name: 'New Hire Orientation', form_data_key: 'orientationQuiz' },
  { stepType: 'bloodborne_pathogens', label: 'Bloodborne Pathogens', step_key: 'bloodborne_pathogens', step_name: 'Bloodborne Pathogens', form_data_key: 'bloodborne' },
  { stepType: 'competency_checklist', label: 'Competency Checklist', step_key: 'competency_checklist', step_name: 'Competency Checklist', form_data_key: 'competency' },
  { stepType: 'ersp_guide', label: 'How to Use eRSP', step_key: 'ersp_guide', step_name: 'How to Use eRSP', form_data_key: 'erspGuide' },
  { stepType: 'surepayroll_guide', label: 'How to Use SurePayroll', step_key: 'surepayroll_guide', step_name: 'How to Use SurePayroll', form_data_key: 'surePayroll' },
  { stepType: 'forms_agreements', label: 'Forms & Agreements', step_key: 'forms_agreements', step_name: 'Forms & Agreements', form_data_key: 'signatures' },
  {
    stepType: 'tax_forms', label: 'Tax Forms', step_key: 'tax_forms', step_name: 'Tax Forms', form_data_key: null,
    variants: [
      { key: 'standard', step_name: 'Tax Forms', label: 'Standard (W-4 employees)' },
      { key: 'w9', step_name: 'Tax Forms (W-9)', label: 'Contractor (W-9)' },
    ],
  },
  { stepType: 'offer_letter', label: 'Offer Letter', step_key: 'offer_letter', step_name: 'Offer Letter', form_data_key: 'offerLetter' },
  { stepType: 'completed', label: 'Completed!', step_key: 'completed', step_name: 'Completed!', form_data_key: null },
]

export function resolveStepType(stepType: string, taxFormVariant?: string) {
  const entry = ONBOARDING_STEP_TYPES.find((t) => t.stepType === stepType)
  if (!entry) throw new Error(`Unknown step type "${stepType}"`)

  let step_name = entry.step_name
  if (entry.variants) {
    const variant = entry.variants.find((v) => v.key === (taxFormVariant || 'standard'))
    if (!variant) throw new Error(`Unknown tax form variant "${taxFormVariant}"`)
    step_name = variant.step_name
  }

  return { step_key: entry.step_key, step_name, form_data_key: entry.form_data_key }
}
