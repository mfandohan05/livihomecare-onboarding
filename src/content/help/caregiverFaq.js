// Caregiver FAQ content. Edit text here; no component code needs to change.
//
// Shape:
//   categories[]: { id, title, summary, items[] }
//   items[]:      { id, question, keywords?: string[], answer: Block[] }
//   Block:        "Paragraph text"            -> paragraph
//                 { ul: ["a", "b"] }          -> bullet list
//                 { ol: ["a", "b"] }          -> numbered list
//                 { note: "text" }            -> blue note callout
//                 { tip: "text" }             -> green tip callout
//                 { warning: "text" }         -> amber warning callout
//
// Inline: **bold** and [link text](#question-id) or [link text](https://...).
//
// Company-specific values use placeholders filled in at render time from the
// signed-in caregiver's company (see src/lib/help/placeholders.js):
//   {{company.name}}  {{company.phone}}  {{company.email}}  {{company.contact}}
// When no company is known (for example the visitor is signed out) they become
// "your employer". NEVER type a real company name, phone or email in this file.
//
// Ids are used in the page address (/help#question-id), so keep them stable.

export const caregiverFaq = {
  title: 'Help & FAQ',
  intro: 'Answers to common questions about your onboarding. Search, or pick a topic below.',

  categories: [
    {
      id: 'getting-started',
      title: 'Getting started and signing in',
      summary: 'Your link, your account, and getting back in.',
      items: [
        {
          id: 'what-to-have-ready',
          question: 'What should I have ready before I start?',
          keywords: ['documents', 'ready', 'prepare', 'need', 'bring', 'checklist'],
          answer: [
            'Have these handy. You will upload photos or scans of most of them:',
            { ul: [
              "Driver's license",
              'Social Security card, or another document from the I-9 list of acceptable documents',
              'Car insurance',
              'TB test or TB skin test results',
              'Hepatitis B vaccination record, if you have one',
              'Nursing license or CNA certification, if you are a nurse or CNA',
            ] },
            { tip: 'You can do everything on your phone. Use good light for photos.' },
          ],
        },
        {
          id: 'locked-steps',
          question: 'I cannot click a step in the menu.',
          keywords: ['locked', 'padlock', 'menu', 'sidebar', 'steps', 'skip'],
          answer: [
            'Steps unlock in order. A step with a padlock opens after you finish the one before it. You can go back to any step you have already finished.',
          ],
        },
        {
          id: 'link-not-found',
          question: 'It says "Link not found". What do I do?',
          keywords: ['expired', 'invalid', 'link', 'not working'],
          answer: [
            'Your onboarding link may have expired or may not have been copied fully. A new link stays valid for 72 hours if you have not created your account yet.',
            { ol: [
              'Check that you opened the whole link from your email. Try tapping the "Start Onboarding" button instead of copying the link.',
              'If you already created an account, go to the [sign-in page](/sign-in) and sign in with your email and password. You do not need the link again.',
              'If you have not created an account yet, ask {{company.contact}} for a new link.',
            ] },
          ],
        },
        {
          id: 'no-email',
          question: "I didn't get the email with my link.",
          keywords: ['email', 'invite', 'invitation', 'spam', 'junk'],
          answer: [
            { ol: [
              'Wait a few minutes, then check your Spam or Junk folder.',
              'Search your inbox for "Complete Your Onboarding".',
              'Make sure {{company.contact}} has your correct email address.',
              'Ask them to send the email again.',
            ] },
          ],
        },
        {
          id: 'create-account',
          question: 'How do I create my account?',
          keywords: ['password', 'sign up', 'register', 'account'],
          answer: [
            'Open the link from your email. You will see a "Create account" page with your name and email already filled in.',
            { ol: [
              'Choose a password. It must be 8 to 72 characters long.',
              'Type the same password again to confirm it.',
              'Tap **Create account & continue**.',
            ] },
            { note: 'Your email cannot be changed on this page. It is the email your employer entered for you.' },
            'If it says an account with your email already exists, [sign in](/sign-in) instead, or contact {{company.contact}}.',
          ],
        },
        {
          id: 'sign-in-again',
          question: 'How do I get back in after I leave?',
          keywords: ['sign in', 'log in', 'return', 'come back', 'resume'],
          answer: [
            'Go to the [sign-in page](/sign-in) and enter your email and password. You will return to the step you were on.',
            'Once you have an account, your emailed link only takes you to the sign-in page.',
          ],
        },
        {
          id: 'forgot-password',
          question: 'I forgot my password.',
          keywords: ['reset', 'password', 'forgot'],
          answer: [
            { ol: [
              'Go to the [sign-in page](/sign-in).',
              'Type your email in the Email box.',
              'Tap **Forgot password?**',
              'Open the email we send you and tap the link. Choose a new password (at least 8 characters).',
            ] },
            { note: 'For your privacy, the page shows the same message whether or not the email has an account. If no email arrives, check Spam or Junk, then contact {{company.contact}}.' },
            'If the reset link says it expired, go back to the sign-in page and ask for a new one.',
          ],
        },
        {
          id: 'no-onboarding-linked',
          question: 'It says "No employee onboarding is linked to this account."',
          keywords: ['linked', 'no onboarding', 'not found', 'sign in error'],
          answer: [
            'You signed in, but we could not find an onboarding that belongs to this email.',
            { ul: [
              'Make sure you are using the same email your employer used to invite you.',
              'Check for typos in the email.',
              'If it still does not work, contact {{company.contact}} and tell them the email you are using.',
            ] },
          ],
        },
        {
          id: 'progress-saving',
          question: 'Is my progress saved?',
          keywords: ['save', 'saving', 'lose', 'lost', 'autosave', 'save & continue'],
          answer: [
            'Some steps save as you go. Others save **only when you tap Save & Continue**. If you close the page before that, what you typed on that step is lost.',
            { warning: 'Always tap **Save & Continue** at the bottom of a step before you close the page.' },
            { ul: [
              '**Saved only when you tap Save & Continue:** Personal Information, Tax Forms, and the "I have read" boxes on the guide steps.',
              '**Saved as you go:** orientation, quizzes, forms you sign, and the offer letter.',
            ] },
            'Documents you upload are saved right away.',
          ],
        },
      ],
    },

    {
      id: 'documents',
      title: 'Documents and uploads',
      summary: 'What to upload and what to do if it fails.',
      items: [
        {
          id: 'wrong-upload',
          question: 'I uploaded the wrong file.',
          keywords: ['wrong', 'replace', 'remove', 'mistake', 'delete'],
          answer: [
            'On the Upload Documents step, tap **Remove** under the file, then upload the correct one. If you already moved on, contact {{company.contact}} and say which document to replace.',
          ],
        },
        {
          id: 'accepted-files',
          question: 'What kinds of files can I upload?',
          keywords: ['file type', 'jpg', 'png', 'pdf', 'photo', 'picture', 'scan', 'format'],
          answer: [
            'You can upload a **photo (JPG or PNG)** or a **PDF**.',
            { tip: 'Use good light, lay the document flat, and make sure all four corners and all the text are easy to read.' },
            'For your badge photo, show your face clearly. No sunglasses or hats, use a plain background, and do not use filters.',
          ],
        },
        {
          id: 'upload-failed',
          question: 'My upload failed. What can I try?',
          keywords: ['upload', 'failed', 'error', 'not uploading', 'stuck'],
          answer: [
            'If you see "Upload failed — please try again":',
            { ol: [
              'Check your internet or mobile signal.',
              'Make sure the file is a JPG, PNG or PDF.',
              'Try again. Very large photos can take longer, so wait for "Uploading..." to finish.',
              'Try a smaller photo or a PDF scan.',
              'Try a different browser, or switch between Wi-Fi and mobile data.',
            ] },
            'If it still fails, contact {{company.contact}}. Tell them which document it was.',
          ],
        },
        {
          id: 'expiration-dates',
          question: 'Why does it ask for an expiration date?',
          keywords: ['expiration', 'expires', 'date', 'driver', 'insurance', 'license'],
          answer: [
            'Some documents expire, so {{company.name}} keeps track of the date. A date is **required** for your driver\'s license, car insurance and nursing license (if you have one). For other documents it is optional.',
            'Use the date printed on your document.',
          ],
        },
        {
          id: 'what-to-upload',
          question: 'I do not have a Social Security card. What can I upload?',
          keywords: ['social security', 'i-9', 'identity', 'passport', 'id'],
          answer: [
            'You can upload another document from the official I-9 list of acceptable documents, such as a U.S. passport. The upload page has a link to the list.',
          ],
        },
      ],
    },

    {
      id: 'personal-info',
      title: 'Personal information',
      summary: 'Your details and emergency contacts.',
      items: [
        {
          id: 'address-autocomplete',
          question: "The address box isn't showing suggestions.",
          keywords: ['address', 'autocomplete', 'suggestions', 'street', 'dropdown'],
          answer: [
            'Start typing your street address, then **tap one of the suggestions** in the list. This fills in your city, state and ZIP for you. Text you type without choosing a suggestion may not be saved.',
            'If no suggestions appear:',
            { ul: [
              'Type the street number and street name only (for example, "123 Main").',
              'Check the spelling.',
              'Check your internet connection and try again.',
            ] },
            'On the offer letter, you must choose your address from the suggestions list before you can sign.',
          ],
        },
        {
          id: 'emergency-contacts',
          question: 'Who should I list as an emergency contact?',
          keywords: ['emergency', 'contact', 'relationship'],
          answer: [
            'Choose someone who can be reached quickly and who knows you well, such as a spouse, parent or sibling. A first and last name, phone number and relationship are required for the primary contact. A second contact is optional but recommended.',
          ],
        },
      ],
    },

    {
      id: 'tax-forms',
      title: 'Tax forms',
      summary: 'I-9, W-4 and other tax forms.',
      items: [
        {
          id: 'tax-forms-vary',
          question: 'Why are my tax forms different from a coworker\'s?',
          keywords: ['tax', 'w-4', 'w-9', 'i-9', 'nc-4ez', 'role', 'different', 'contractor'],
          answer: [
            'The tax forms depend on your **role**. For example, employees and independent contractors use different forms. Your employer chooses which forms each role needs.',
            'If you think you were given the wrong form, contact {{company.contact}}.',
          ],
        },
        {
          id: 'tax-save-behavior',
          question: 'Do my tax forms save automatically?',
          keywords: ['tax', 'save', 'automatic', 'lost'],
          answer: [
            { warning: 'No. For your security, tax forms do **not** save by themselves. Fill in a form, then tap its save button, and tap **Save & Continue** at the bottom when all forms are done.' },
            'After you save a form, the information is cleared from the screen to protect your privacy.',
          ],
        },
        {
          id: 'tax-change-submitted',
          question: 'I submitted a tax form. How do I change it?',
          keywords: ['change', 'edit', 'modify', 'mistake', 'redo', 're-enter', 'wrong', 'tax'],
          answer: [
            { ol: [
              'On the Tax Forms step, tap the saved form. It shows "Form submitted — Click to modify".',
              'Read the message and tap **Yes, Re-enter Form**.',
              'Fill in the whole form again from the start and save it.',
            ] },
            { note: 'For privacy, the old information is erased when you re-enter a form. You will need to type everything again.' },
          ],
        },
        {
          id: 'i9-section-2',
          question: 'What is Section 2 of the I-9?',
          keywords: ['i-9', 'section 2', 'identity', 'verify', 'in person'],
          answer: [
            'You only fill out **Section 1** of the I-9. Your employer completes Section 2 with you directly, by looking at your original identity documents. Ask {{company.contact}} when and where to bring them.',
          ],
        },
      ],
    },

    {
      id: 'forms-agreements',
      title: 'Forms and agreements',
      summary: 'Signing forms and your offer letter.',
      items: [
        {
          id: 'offer-letter',
          question: 'How do I sign my offer letter?',
          keywords: ['offer letter', 'sign', 'accept', 'address', 'pay rate'],
          answer: [
            { ol: [
              'Read the letter. Check your name, position, pay rate and start date.',
              'Type your full name as your signature.',
              'If asked, choose your address from the list of suggestions.',
              'Tap **Sign & Accept**, then **Save & Continue**.',
            ] },
            'If something in the letter looks wrong, do not sign. Contact {{company.contact}} first.',
          ],
        },
        {
          id: 'direct-deposit',
          question: 'Is it safe to enter my bank details?',
          keywords: ['direct deposit', 'bank', 'routing', 'account number', 'safe', 'secure'],
          answer: [
            'Bank details are stored encrypted. Only authorised staff at {{company.name}} can view them, and they must confirm their password first. The signed form does not show your account numbers.',
            'Double-check the routing and account numbers. The form may mention a fee if the details are wrong.',
          ],
        },
        {
          id: 'references',
          question: 'Who can I list as a professional reference?',
          keywords: ['reference', 'professional', 'supervisor', 'previous employer'],
          answer: [
            'List people who know your work, such as a past supervisor or colleague. Enter their name, organization, how you know them and a phone number.',
          ],
        },
        {
          id: 'how-to-sign',
          question: 'How do I sign a form?',
          keywords: ['sign', 'signature', 'type name', 'e-sign', 'agreement'],
          answer: [
            { ol: [
              'Read the form.',
              'Type your full name in the signature box.',
              'Tap **Sign & Continue**.',
            ] },
            'Typing your name is a legally binding electronic signature. The date is filled in for you.',
          ],
        },
      ],
    },

    {
      id: 'orientation-training',
      title: 'Orientation and training',
      summary: 'Quizzes, guides, and how your time is recorded.',
      items: [
        {
          id: 'quiz-how-it-works',
          question: 'How do the orientation sections and quizzes work?',
          keywords: ['orientation', 'slides', 'quiz', 'section', 'pass'],
          answer: [
            { ol: [
              'Read the slides and tap **Next**.',
              'After the last slide, tap **Take Quiz**.',
              'Answer every question, then tap **Submit Quiz**.',
              'If you pass, tap **Continue to Next Section**.',
            ] },
            'Your progress saves as you go, so you can come back later.',
          ],
        },
        {
          id: 'guide-steps',
          question: 'What are the eRSP and SurePayroll steps?',
          keywords: ['ersp', 'surepayroll', 'clock in', 'pay stub', 'guide', 'checkbox'],
          answer: [
            'These are guides. Read them, tick the box that says you understand, and tap **Save & Continue**.',
            { warning: 'These steps save only when you tap **Save & Continue**.' },
          ],
        },
        {
          id: 'bloodborne',
          question: 'How do I finish the Bloodborne Pathogens step?',
          keywords: ['bloodborne', 'pathogens', 'certificate', 'course', 'training'],
          answer: [
            { ol: [
              'Tap **Open Training Course** and complete the course and test.',
              'Get your certificate.',
              'Come back and upload it (PDF, JPG or PNG).',
              'Tap **Save & Continue**.',
            ] },
            'If you already have a valid certificate, you can upload that. Ask {{company.contact}} about any cost or reimbursement.',
          ],
        },
        {
          id: 'quiz-retake',
          question: 'I did not pass an orientation quiz.',
          keywords: ['quiz', 'fail', 'failed', 'retake', 'pass', 'score'],
          answer: [
            'You can try again. Review the answers shown, tap **Retake Quiz**, and answer the questions again.',
          ],
        },
        {
          id: 'inactivity-timer',
          question: 'What does "Recording paused — no activity" mean?',
          keywords: ['timer', 'time', 'recording', 'inactive', 'idle', 'paused', 'hours', 'pay'],
          answer: [
            'While you work on onboarding, the time you spend is recorded. If you do not move your mouse, type, tap or scroll for **2 minutes**, recording pauses. It starts again when you come back.',
            { ul: [
              'Switching to another tab or window also pauses recording on this page.',
              'Keep only one onboarding tab open.',
            ] },
            'Ask {{company.contact}} how orientation time is handled.',
          ],
        },
      ],
    },

    {
      id: 'finishing-up',
      title: 'Finishing up',
      summary: 'What happens after you finish, and My Documents.',
      items: [
        {
          id: 'certificate',
          question: 'Where is my certificate?',
          keywords: ['certificate', 'download', 'pdf', 'completion'],
          answer: [
            'It is on the last page, "You\'re all done". Tap **Download Certificate** to save it. It is not kept as a document in My Documents, so download it before you leave.',
          ],
        },
        {
          id: 'after-finishing',
          question: 'What happens after I finish?',
          keywords: ['finish', 'done', 'complete', 'completed', 'certificate', 'next steps'],
          answer: [
            'When you reach the last step you will see a "You\'re all done" page with your certificate. You can download the certificate right there.',
            'Your employer is told that you finished and will review your paperwork. They will contact you about what comes next.',
          ],
        },
        {
          id: 'my-documents',
          question: 'Where do I find My Documents?',
          keywords: ['my documents', 'replace', 'expired', 'update document', 'reminder'],
          answer: [
            'After you finish onboarding, [sign in](/sign-in) with your email and password. You will go straight to **My Documents**.',
            'There you can replace documents that are expiring. Tap **Replace**, choose the new file, and enter its new expiration date.',
            'You will get reminder emails when a document is close to expiring.',
          ],
        },
      ],
    },

    {
      id: 'privacy',
      title: 'Privacy and security',
      summary: 'What we collect and who can see it.',
      items: [
        {
          id: 'shared-computer',
          question: 'Is it safe to use a shared or public computer?',
          keywords: ['shared', 'public', 'library', 'computer', 'safe'],
          answer: [
            'It is best to use your own phone or computer. Some of what you type may stay on that device. If you must use a shared one, sign out and close the browser when you finish.',
          ],
        },
        {
          id: 'what-is-collected',
          question: 'What personal information is collected, and who can see it?',
          keywords: ['privacy', 'ssn', 'social security', 'bank', 'data', 'who can see', 'security', 'encrypted'],
          answer: [
            'Onboarding collects the details your employer needs to hire and pay you. This can include your contact details, emergency contacts, identity and license documents, signed forms, tax information (such as your Social Security number) and bank details for direct deposit.',
            { ul: [
              'Your information is seen by authorised staff at {{company.name}} only.',
              'Sensitive items, such as your Social Security number and bank details, are stored encrypted. Staff must enter their password again to view them, and each view is recorded.',
              'Your information is not shown to other companies.',
            ] },
            { tip: 'Use your own phone or computer if you can. If you must use a shared one, sign out and close the browser when you are done.' },
          ],
        },
      ],
    },

    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      summary: 'Buttons that will not work and error screens.',
      items: [
        {
          id: 'nothing-happens',
          question: 'I tapped a button and nothing happened.',
          keywords: ['stuck', 'frozen', 'not working', 'loading', 'spinner', 'slow'],
          answer: [
            { ol: [
              'Wait a few seconds. A spinner means it is saving.',
              'Check your internet connection.',
              'Refresh the page. Anything you did not save on a Save & Continue step may need to be entered again.',
              'If it still does not work, contact {{company.contact}}.',
            ] },
          ],
        },
        {
          id: 'greyed-out-button',
          question: 'My Save & Continue button is greyed out.',
          keywords: ['disabled', 'grey', 'gray', 'greyed', 'button', 'cannot click', 'missing', 'continue'],
          answer: [
            'The button turns on when everything required on that step is done. Look on the page for red messages or empty required items. Common reasons:',
            { ul: [
              '**Upload Documents:** a required document or an expiration date is missing, or a file is still uploading.',
              '**Personal Information:** a required field (marked with *) is empty.',
              '**Guide steps:** the "I have read" box is not ticked.',
              '**Forms & Agreements:** a form is not signed yet.',
              '**Tax Forms:** a form has not been saved yet.',
              '**Offer Letter:** the letter is not signed yet.',
              '**Bloodborne Pathogens:** the certificate has not been uploaded.',
            ] },
          ],
        },
        {
          id: 'uh-oh-error',
          question: 'I see an "Uh oh..." message.',
          keywords: ['uh oh', 'error', 'went wrong', 'something went wrong', 'problem', 'crash'],
          answer: [
            'This means something went wrong on our side or with your connection.',
            { ol: [
              'Tap **Close** and try again.',
              'Check your internet connection.',
              'If it keeps happening, tap **More details** on the message.',
              'Contact {{company.contact}} and tell them: which step you were on, what you tapped, the time, and the text shown under "More details".',
            ] },
            { note: 'Do not share your password with anyone, including in a message about the error.' },
          ],
        },
        {
          id: 'blank-page',
          question: 'A step looks empty or says it is not available yet.',
          keywords: ['blank', 'empty', 'not available', 'contact administrator', 'missing step'],
          answer: [
            'Some steps need your employer to finish setting them up. If a page says to contact your administrator, or looks empty, contact {{company.contact}} and tell them which step it is.',
          ],
        },
      ],
    },
  ],
}

// Which FAQ category each onboarding step's "Need help with this step?" link opens.
// Keys are the step names used in the app; values are category ids above.
export const stepHelpTopics = {
  'Welcome': 'getting-started',
  'Upload Documents': 'documents',
  'Personal Information': 'personal-info',
  'New Hire Orientation': 'orientation-training',
  'Competency Checklist': 'orientation-training',
  'How to Use eRSP': 'orientation-training',
  'How to Use SurePayroll': 'orientation-training',
  'Bloodborne Pathogens': 'orientation-training',
  'Forms & Agreements': 'forms-agreements',
  'Tax Forms': 'tax-forms',
  'Tax Forms (W-9)': 'tax-forms',
  'Offer Letter': 'forms-agreements',
  'Completed!': 'finishing-up',
}

// Contact block shown at the bottom of the FAQ.
export const stillNeedHelp = {
  title: 'Still need help?',
  withContact: 'Contact {{company.name}} and mention the step you are on.',
  generic: 'Contact your employer and tell them which step you are on. They can help or send you a new link.',
}
