// Mirrors interpolate() in src/pages/onboarding/onboarding-pages/OfferLetterPage.jsx —
// the exact placeholder strings that page recognizes inside content blocks and
// acknowledgment_text. Anything else typed as {{...}} is left as literal text.
export const OFFER_LETTER_PLACEHOLDERS = [
    '{{today}}',
    '{{caregiver.name}}',
    '{{caregiver.position_title}}',
    '{{caregiver.pay_rate}}',
    '{{caregiver.companion_pay_rate}}',
    '{{caregiver.employment_type}}',
    '{{caregiver.start_date_formatted}}',
]
