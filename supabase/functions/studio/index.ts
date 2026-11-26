import createCompany from './handlers/create-company.ts'
import createCompanyAdmin from './handlers/create-company-admin.ts'
import createCompanyForm from './handlers/create-company-form.ts'
import createOfferLetterTemplate from './handlers/create-offer-letter-template.ts'
import createOnboardingStep from './handlers/create-onboarding-step.ts'
import createOrientationQuizQuestion from './handlers/create-orientation-quiz-question.ts'
import createOrientationSection from './handlers/create-orientation-section.ts'
import createOrientationSlide from './handlers/create-orientation-slide.ts'
import createRoleLabel from './handlers/create-role-label.ts'
import deleteCompanyAdmin from './handlers/delete-company-admin.ts'
import deleteCompanyForm from './handlers/delete-company-form.ts'
import deleteOfferLetterTemplate from './handlers/delete-offer-letter-template.ts'
import deleteOnboardingStep from './handlers/delete-onboarding-step.ts'
import deleteOrientationQuizQuestion from './handlers/delete-orientation-quiz-question.ts'
import deleteOrientationSection from './handlers/delete-orientation-section.ts'
import deleteOrientationSlide from './handlers/delete-orientation-slide.ts'
import deleteRoleLabel from './handlers/delete-role-label.ts'
import getCompany from './handlers/get-company.ts'
import getCompanyForm from './handlers/get-company-form.ts'
import getOfferLetterTemplate from './handlers/get-offer-letter-template.ts'
import getOrientationSectionDetail from './handlers/get-orientation-section-detail.ts'
import listCompanies from './handlers/list-companies.ts'
import listCompanyAdmins from './handlers/list-company-admins.ts'
import listCompanyForms from './handlers/list-company-forms.ts'
import listFormTemplateFields from './handlers/list-form-template-fields.ts'
import listOfferLetterTemplateFields from './handlers/list-offer-letter-template-fields.ts'
import listOfferLetterTemplates from './handlers/list-offer-letter-templates.ts'
import listOnboardingSteps from './handlers/list-onboarding-steps.ts'
import listOrientationSections from './handlers/list-orientation-sections.ts'
import listRoleLabels from './handlers/list-role-labels.ts'
import listTestCaregivers from './handlers/list-test-caregivers.ts'
import previewFillForm from './handlers/preview-fill-form.ts'
import previewFillOfferLetter from './handlers/preview-fill-offer-letter.ts'
import reorderCompanyForm from './handlers/reorder-company-form.ts'
import reorderOnboardingStep from './handlers/reorder-onboarding-step.ts'
import reorderOrientationQuizQuestion from './handlers/reorder-orientation-quiz-question.ts'
import reorderOrientationSection from './handlers/reorder-orientation-section.ts'
import reorderOrientationSlide from './handlers/reorder-orientation-slide.ts'
import updateCompany from './handlers/update-company.ts'
import updateCompanyAdmin from './handlers/update-company-admin.ts'
import updateCompanyForm from './handlers/update-company-form.ts'
import updateOfferLetterTemplate from './handlers/update-offer-letter-template.ts'
import updateOnboardingStep from './handlers/update-onboarding-step.ts'
import updateOrientationQuizQuestion from './handlers/update-orientation-quiz-question.ts'
import updateOrientationSection from './handlers/update-orientation-section.ts'
import updateOrientationSlide from './handlers/update-orientation-slide.ts'
import updateRoleLabel from './handlers/update-role-label.ts'
import uploadFormTemplate from './handlers/upload-form-template.ts'
import uploadLogo from './handlers/upload-logo.ts'
import uploadOfferLetterTemplate from './handlers/upload-offer-letter-template.ts'
import whoami from './handlers/whoami.ts'
import { studioCorsHeaders } from '../_shared/platformAdmin.ts'

const handlers: Record<string, (req: Request) => Promise<Response>> = {
  'create-company': createCompany,
  'create-company-admin': createCompanyAdmin,
  'create-company-form': createCompanyForm,
  'create-offer-letter-template': createOfferLetterTemplate,
  'create-onboarding-step': createOnboardingStep,
  'create-orientation-quiz-question': createOrientationQuizQuestion,
  'create-orientation-section': createOrientationSection,
  'create-orientation-slide': createOrientationSlide,
  'create-role-label': createRoleLabel,
  'delete-company-admin': deleteCompanyAdmin,
  'delete-company-form': deleteCompanyForm,
  'delete-offer-letter-template': deleteOfferLetterTemplate,
  'delete-onboarding-step': deleteOnboardingStep,
  'delete-orientation-quiz-question': deleteOrientationQuizQuestion,
  'delete-orientation-section': deleteOrientationSection,
  'delete-orientation-slide': deleteOrientationSlide,
  'delete-role-label': deleteRoleLabel,
  'get-company': getCompany,
  'get-company-form': getCompanyForm,
  'get-offer-letter-template': getOfferLetterTemplate,
  'get-orientation-section-detail': getOrientationSectionDetail,
  'list-companies': listCompanies,
  'list-company-admins': listCompanyAdmins,
  'list-company-forms': listCompanyForms,
  'list-form-template-fields': listFormTemplateFields,
  'list-offer-letter-template-fields': listOfferLetterTemplateFields,
  'list-offer-letter-templates': listOfferLetterTemplates,
  'list-onboarding-steps': listOnboardingSteps,
  'list-orientation-sections': listOrientationSections,
  'list-role-labels': listRoleLabels,
  'list-test-caregivers': listTestCaregivers,
  'preview-fill-form': previewFillForm,
  'preview-fill-offer-letter': previewFillOfferLetter,
  'reorder-company-form': reorderCompanyForm,
  'reorder-onboarding-step': reorderOnboardingStep,
  'reorder-orientation-quiz-question': reorderOrientationQuizQuestion,
  'reorder-orientation-section': reorderOrientationSection,
  'reorder-orientation-slide': reorderOrientationSlide,
  'update-company': updateCompany,
  'update-company-admin': updateCompanyAdmin,
  'update-company-form': updateCompanyForm,
  'update-offer-letter-template': updateOfferLetterTemplate,
  'update-onboarding-step': updateOnboardingStep,
  'update-orientation-quiz-question': updateOrientationQuizQuestion,
  'update-orientation-section': updateOrientationSection,
  'update-orientation-slide': updateOrientationSlide,
  'update-role-label': updateRoleLabel,
  'upload-form-template': uploadFormTemplate,
  'upload-logo': uploadLogo,
  'upload-offer-letter-template': uploadOfferLetterTemplate,
  'whoami': whoami,
}

Deno.serve((req) => {
  const action = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? ''
  const handler = handlers[action]
  if (!handler) {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })
    return new Response(
      JSON.stringify({ error: 'Unknown studio action' }),
      { status: 404, headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  return handler(req)
})
