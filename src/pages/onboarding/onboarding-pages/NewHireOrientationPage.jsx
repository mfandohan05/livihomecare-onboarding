import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GraduationCap, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const sections = [
  {
    id: 1,
    title: 'Welcome & Introduction',
    slides: [
      {
        title: 'Welcome to Livi Home Care',
        content: [
          'We are so glad you have joined our team. This orientation will walk you through everything you need to know to provide outstanding care to our clients.',
          'Training includes topics required by OSHA, NC DHHS, and other regulatory agencies.',
          'Remember, this orientation is just a guide — always refer to specific policies, procedures, and regulations applicable to your role.',
          'Livi Home Care reserves the right to modify, revise, or withdraw any policies at any time without prior notice.',
        ]
      },
      {
        title: 'Our Vision',
        content: [
          'We strive to be an outstanding care provider, providing our clients with person-centered, high-class care, using every means available to achieve the best possible outcome for them.',
        ]
      },
      {
        title: 'Our Mission',
        content: [
          'At Livi Home Care, our mission is to improve the quality of life of our clients by providing high-quality services.',
          '• Assist clients to maintain their independence and quality of life in their own home.',
          '• Provide the best possible service with a friendly, caring, and compassionate approach.',
          '• Provide appropriately trained and skilled staff that fit our clients needs.',
          '• Provide continuity of care wherever possible.',
          '• Respect the dignity and privacy of our clients.',
        ]
      },
      {
        title: 'Our Values',
        content: [
          '• Commitment to care',
          '• Compassion',
          '• Respect and dignity',
          '• Collaborative working',
          '• Caring with a smile',
        ]
      },
      {
        title: 'Our Team',
        content: [
          'Service Coordinator: Sylvie',
          'Business Development & Communications Director: Morina',
          'Admin and Service Assistant: Linda',
          'Chief Accountant: Sam',
          'Registered Nurses:',
          '• Victoria – Covers I-77 North Corridor',
          '• Chidi – Covers I-77 South Corridor',
        ]
      },
    ],
    quiz: [
      {
        question: "What is Livi Home Care's mission?",
        choices: [
          "To provide the lowest cost care possible",
          "To improve the quality of life of clients by providing high-quality services",
          "To maximize the number of clients served",
          "To provide care only to clients with severe conditions"
        ],
        correct: 1
      },
      {
        question: "Which of the following is one of Livi Home Care's core values?",
        choices: [
          "Profit-driven care",
          "Competitive pricing",
          "Compassion and respect for dignity",
          "Rapid service delivery"
        ],
        correct: 2
      },
      {
        question: "Who is the Service Coordinator at Livi Home Care?",
        choices: ["Morina", "Linda", "Sylvie", "Victoria"],
        correct: 2
      }
    ]
  },
  {
    id: 2,
    title: 'Infection & Safety',
    slides: [
      {
        title: 'Infection Control',
        content: [
          'Infection: The establishment of disease-causing microorganisms in the body.',
          'Hand Hygiene:',
          '• Wash hands with soap and water for at least 20 seconds or use hand sanitizer with 60% alcohol.',
          '• Rub hands until dry.',
          'Best Practices:',
          '• Restrict contact with infected visitors.',
          '• Ensure proper ventilation and use disinfectants regularly.',
          '• Cover mouth and nose with a tissue or elbow when coughing or sneezing.',
        ]
      },
      {
        title: 'Exposure Control',
        content: [
          'Livi Home Care caregivers are expected to participate in exposure control measures to prevent or minimize the risk of exposure to infection.',
          'An exposure incident is defined as contact with blood or other potentially infectious materials on non-intact skin, eye, mouth, or mucus membrane.',
          'If an exposure occurs:',
          '• Clean the exposed area with soap and water, or flush with water if exposure occurred in the eyes.',
          '• Report the incident to your supervisor immediately.',
          '• Document the incident and any subsequent medical treatment.',
        ]
      },
      {
        title: 'Universal Precautions',
        content: [
          '• Treat all body fluids as potentially infectious.',
          '• Wash hands at the start of your shift upon entering the clients home.',
          '• Wash hands frequently: after client contact, after using the toilet, and before preparing food or medications.',
          '• Wear appropriate personal protective equipment (PPE) — gloves, masks, gowns, and eye protection.',
          'Sharps:',
          '• Do not recap or manipulate needles.',
          '• Put syringes, needles, lancets, and other sharp objects into approved sharps containers.',
        ]
      },
      {
        title: 'Cleanup Procedures',
        content: [
          '• Wear PPE before handling contaminated materials.',
          '• Use 1 part bleach to 9 parts water for disinfecting.',
          '• Use absorbent towels to clean visible spills.',
          '• Dispose of contaminated materials safely.',
          '• If sharps or broken glass are visible, use tongs or a dust pan — never bare hands.',
          'Glove Removal: touch only glove to glove and skin to skin.',
          '• Always wash your hands after removing gloves.',
        ]
      },
      {
        title: 'Safe Transfer & Back Safety',
        content: [
          'Always maintain proper posture when lifting or transferring a client.',
          'Steps:',
          '• Keep the client close to your body.',
          '• Spread feet slightly beyond shoulder width.',
          '• Bend at the knees, not at the waist.',
          '• Avoid twisting your back.',
          '• Use assistive devices when necessary.',
          'You know your body and your limitations — do not attempt a lift you feel may injure you.',
          'If a client refuses a transfer or assistive device, contact your Livi Home Care Registered Nurse for direction.',
        ]
      },
      {
        title: 'Home Safety',
        content: [
          'Before starting your shift:',
          '• Check the work area for hazards like loose cords or slippery surfaces.',
          '• Keep pathways clear and ensure nightlights are functioning.',
          'Ending your shift:',
          '• Leave all care areas clean and tidy.',
          '• Assist on-coming caregiver with two-person lifts if necessary.',
          '• Always be aware of your surroundings when walking to or from your car.',
          '• Contact your supervisor or authorities if you are in immediate danger.',
        ]
      },
      {
        title: 'Fire Safety — R.A.C.E.',
        content: [
          'The four steps in fire safety: R.A.C.E.',
          '• R — Rescue: Remove the client from immediate danger.',
          '• A — Alarm: Call for help, pull the alarm, or call 911.',
          '• C — Contain: Close doors and windows, turn off clients oxygen (O2) if applicable.',
          '• E — Extinguish or Evacuate: Use the appropriate fire extinguisher or evacuate.',
        ]
      },
    ],
    quiz: [
      {
        question: "How long should you wash your hands with soap and water?",
        choices: [
          "At least 5 seconds",
          "At least 10 seconds",
          "At least 20 seconds",
          "At least 30 seconds"
        ],
        correct: 2
      },
      {
        question: "What is the correct bleach-to-water ratio for disinfecting?",
        choices: [
          "1 part bleach to 4 parts water",
          "1 part bleach to 9 parts water",
          "2 parts bleach to 8 parts water",
          "1 part bleach to 1 part water"
        ],
        correct: 1
      },
      {
        question: "When transferring a client, you should bend at the:",
        choices: ["Waist", "Shoulders", "Knees", "Hips"],
        correct: 2
      },
      {
        question: "What does R.A.C.E stand for in fire safety?",
        choices: [
          "Run, Alert, Call, Evacuate",
          "Rescue, Alarm, Contain, Extinguish/Evacuate",
          "Remove, Assess, Contain, Escape",
          "Rescue, Alert, Call, Exit"
        ],
        correct: 1
      },
      {
        question: "What should you do if a client refuses to use an assistive device for transfer?",
        choices: [
          "Force the transfer anyway for the clients safety",
          "Skip the transfer entirely",
          "Contact Livi Home Care's Registered Nurse or designee for direction",
          "Document it and do nothing"
        ],
        correct: 2
      }
    ]
  },
  {
    id: 3,
    title: 'Health & Pathogens',
    slides: [
      {
        title: 'Hepatitis B',
        content: [
          'Hepatitis B is spread through exposure to blood or bodily fluids.',
          'There is no cure, but a vaccine is available.',
          'You are not required to get the Hepatitis B vaccine if:',
          '• You have received the vaccine in the past.',
          '• An antibody test shows you are already immune.',
          '• You have medical reasons not to receive the vaccine.',
          'Important: If you choose not to receive the vaccine, you must complete and sign the Hepatitis B Declination Form within 10 days of your first shift.',
        ]
      },
      {
        title: 'Tuberculosis (TB)',
        content: [
          'TB is spread through infected droplets from coughing or sneezing.',
          'Caregivers must complete TB skin tests or chest X-rays before working with Livi Home Care clients.',
          'If you suspect you have been exposed to a client with TB, notify your supervisor immediately.',
        ]
      },
      {
        title: 'Emergency Preparedness — Types of Emergencies',
        content: [
          'Types of Emergencies:',
          '• Medical emergencies: heart attacks, strokes.',
          '• Natural disasters: hurricanes, floods, etc.',
          '• Power outages, civil unrest, or public safety concerns.',
          '• Any event that prevents the regular delivery of care.',
          'Preparation:',
          '• Review client care plans.',
          '• Familiarize yourself with the home environment, emergency exits, and utility shut-offs.',
          '• Always keep client emergency bags stocked.',
        ]
      },
      {
        title: 'Emergency Preparedness — During & After',
        content: [
          'During an Emergency:',
          '• Stay calm — this will help your client remain calm as well.',
          '• Keep yourself and your client safe.',
          '• Move to a safe and secure area if possible.',
          '• Call 911 if your client needs immediate medical attention.',
          '• Reach out to your supervisor with an update on yourself and your client.',
          'After an Emergency:',
          '• You may be required to assist in debrief activities.',
          '• Ask your supervisor for a copy of the Emergency Preparedness Policy for more information.',
        ]
      },
    ],
    quiz: [
      {
        question: "How is Hepatitis B spread?",
        choices: [
          "Through the air when someone coughs or sneezes",
          "Through exposure to blood or bodily fluids",
          "Through contaminated food or water",
          "Through casual contact like handshakes"
        ],
        correct: 1
      },
      {
        question: "If you choose not to receive the Hepatitis B vaccine, what must you do?",
        choices: [
          "Nothing, it is completely optional",
          "Complete and sign the declination form within 10 days of your first shift",
          "Submit a written request to your supervisor",
          "Get a doctors note within 30 days"
        ],
        correct: 1
      },
      {
        question: "How is Tuberculosis spread?",
        choices: [
          "Through blood or bodily fluids",
          "Through contaminated food",
          "Through infected droplets from coughing or sneezing",
          "Through skin contact"
        ],
        correct: 2
      },
      {
        question: "During an emergency, what should you do first?",
        choices: [
          "Call your family",
          "Leave the client and find safety",
          "Stay calm and keep yourself and your client safe",
          "Wait for instructions from the office"
        ],
        correct: 2
      }
    ]
  },
  {
    id: 4,
    title: 'Client Rights & HIPAA',
    slides: [
      {
        title: 'Abuse, Neglect & Exploitation',
        content: [
          'Abuse: Physical, verbal, mental, or sexual harm.',
          'Examples: Rough handling, withholding care, isolating a client, yelling, hitting, or taking demeaning photos.',
          'Signs of abuse: Unusual bruising, unexplained injuries, sudden changes in behavior.',
          'Neglect: Failure to provide necessary services, food, or care.',
          'Examples: Ignoring bathing needs, leaving the client unsupervised in unsafe conditions.',
          'Exploitation: Improper use of power or resources for personal gain.',
          'Examples: Stealing money, forcing clients to give away assets.',
        ]
      },
      {
        title: 'Injury of Unknown Source',
        content: [
          'An injury of unknown source refers to a situation where the client sustains physical harm but it is unclear how or why.',
          'Examples:',
          '• Unexplained bruising.',
          '• Fracture of uncertain cause.',
          '• Burns without explanation.',
          '• Skin lacerations.',
          'It is the responsibility of all Livi Home Care caregivers to report any such injuries to their immediate supervisor by the end of their shift.',
        ]
      },
      {
        title: 'Client Rights',
        content: [
          'Clients have the right to:',
          '• Be treated with respect, dignity, and full recognition of their individuality and right to privacy.',
          '• Be fully informed of all their rights and responsibilities.',
          '• Accept or refuse services.',
          '• Confidentiality of their records and information.',
          '• Be informed of Livi Home Care contact number: 828-540-0112.',
          '• Be informed of the DHSR hotline: 1-800-624-3004.',
          '• Request a change of caregiver.',
        ]
      },
      {
        title: 'Advanced Directives',
        content: [
          'Advanced Directives are legal documents that allow clients to outline their preferences for medical care in the event they are unable to make decisions for themselves.',
          'Each clients Plan of Care will indicate if the client has an Advanced Directive or a DNR (Do Not Resuscitate).',
          'This information will be located in the right corner of the Plan of Care, along with the clients Disaster Priority Code.',
        ]
      },
      {
        title: 'HIPAA & Client Confidentiality',
        content: [
          'HIPAA (Health Insurance Portability and Accountability Act) is a federal law designed to protect the privacy and security of patients health information.',
          'PHI (Protected Health Information) includes:',
          '• Clients name, date of birth, social security number.',
          '• Medical record number, health insurance ID.',
          '• Physical address, email, phone number.',
          '• Medical history, diagnoses, prescriptions, lab results.',
          'Only authorized personnel should access or share PHI.',
          'Violating HIPAA can lead to legal action.',
        ]
      },
      {
        title: 'Privacy Complaints',
        content: [
          'Patients may file privacy complaints with healthcare providers, regulatory agencies, or the Office for Civil Rights (OCR).',
          'All charting and reports should be completed in the clients home.',
          'No form of PHI should be transmitted electronically unless:',
          '• You are transmitting it to another Livi Home Care employee or authorized entity.',
          '• You are using an encrypted form of communication.',
          'Important: Text messages, regular email accounts, and voicemail are NOT considered encrypted.',
        ]
      },
    ],
    quiz: [
      {
        question: "Which of the following is an example of client abuse?",
        choices: [
          "Assisting a client with bathing",
          "Rough handling or yelling at a client",
          "Documenting a clients care",
          "Reminding a client to take their medication"
        ],
        correct: 1
      },
      {
        question: "Which of the following is NOT an example of PHI?",
        choices: [
          "Clients name and date of birth",
          "Caregivers work schedule",
          "Clients medical record number",
          "Clients health insurance ID number"
        ],
        correct: 1
      },
      {
        question: "Which communication methods are NOT considered encrypted?",
        choices: [
          "Secure email portals",
          "Text messages, regular email, and voicemail",
          "Encrypted messaging apps",
          "Direct communication with authorized personnel"
        ],
        correct: 1
      },
      {
        question: "When must you report abuse, neglect, or exploitation?",
        choices: [
          "Within 48 hours",
          "At your next scheduled shift",
          "By the end of the shift when it occurred",
          "Only if you are certain it happened"
        ],
        correct: 2
      },
      {
        question: "What is an Advanced Directive?",
        choices: [
          "A training document for new caregivers",
          "A legal document outlining a clients medical care preferences if they cannot decide for themselves",
          "A form caregivers fill out after each shift",
          "A policy for handling workplace injuries"
        ],
        correct: 1
      }
    ]
  },
  {
    id: 5,
    title: 'Documentation',
    slides: [
      {
        title: 'The Importance of Documentation',
        content: [
          '"If it is not documented, it did not happen."',
          'All services provided must be recorded in the clients chart.',
          'Documentation is part of the clients medical record and is a legal document — it must be accurate.',
          'Best Practices:',
          '• Chart only accurate, day-to-day information.',
          '• Do not document personnel or staffing issues in client records.',
          '• Always use military time.',
          '• Chart only what was completed during your shift.',
          '• Use Livi Home Care approved abbreviations.',
          '• Submit documentation at the end of each shift.',
        ]
      },
      {
        title: 'Correcting Documentation Errors',
        content: [
          'Paper Documentation:',
          '• Draw a single line through the error.',
          '• Write your initials right above the error.',
          '• Do NOT use white-out, blacken out, or scribble to correct errors.',
          'Electronic Documentation (eRSP):',
          '• Notify your supervisor or the Livi Home Care Director to request authorization for correction.',
          '• Unauthorized corrections are not permitted.',
        ]
      },
      {
        title: 'Late Entries',
        content: [
          'Paper Documentation Late Entries:',
          '• Write "added information" at the beginning of the entry.',
          '• Note date and time within the charting.',
          '• Sign with your full legal signature.',
          'Electronic Documentation Late Entries (eRSP):',
          '• Seek approval from your supervisor or Livi Home Care Director before adding or modifying entries.',
          '• Unauthorized late entries are strictly prohibited.',
        ]
      },
      {
        title: 'Documentation Tampering',
        content: [
          'Tampering with documentation can lead to disciplinary actions or reporting to licensing agencies or legal authorities.',
          'Examples of tampering:',
          '• Backdating entries — changing dates and times.',
          '• Using correction fluids (white-out).',
          '• Ghost charting: documenting that you did something you did not do.',
          '• Omitting relevant details.',
          '• Falsifying signatures.',
          '• Fabricating information.',
          '• Adding comments at a later date without an addendum.',
        ]
      },
    ],
    quiz: [
      {
        question: "What does 'if it is not documented, it did not happen' mean?",
        choices: [
          "You only need to document serious incidents",
          "All services provided must be recorded in the clients chart",
          "Documentation is optional if the shift went smoothly",
          "Only nurses need to document"
        ],
        correct: 1
      },
      {
        question: "How do you correct a paper documentation error?",
        choices: [
          "Use white-out to cover the mistake",
          "Scribble over the error completely",
          "Draw a single line through the error and write your initials above it",
          "Start a new form from scratch"
        ],
        correct: 2
      },
      {
        question: "What time format should always be used when documenting?",
        choices: [
          "Standard 12-hour format (AM/PM)",
          "Military time",
          "Either format is acceptable",
          "Whatever the client prefers"
        ],
        correct: 1
      },
      {
        question: "Which of the following is considered documentation tampering?",
        choices: [
          "Drawing a single line through an error",
          "Initialing a correction",
          "Backdating entries or ghost charting",
          "Submitting documentation at end of shift"
        ],
        correct: 2
      },
      {
        question: "If you need to make a late entry in eRSP, what must you do first?",
        choices: [
          "Make the entry immediately without telling anyone",
          "Wait until your next shift to add it",
          "Seek approval from your supervisor or Livi Home Care Director",
          "Ask a coworker to add it for you"
        ],
        correct: 2
      }
    ]
  },
  {
    id: 6,
    title: 'Employee Policy',
    slides: [
      {
        title: 'Professional Appearance',
        content: [
          'Livi Home Care caregivers are expected to present themselves in a professional manner at all times.',
          '• Maintain a neat and clean appearance.',
          '• Nails should not be longer than 1/4 inch.',
          '• Wear scrubs or professional pants with a nice shirt.',
          '• No jeans, pajamas, jogging pants, or shirts with obscenities.',
          '• No open-toed shoes for safety.',
          '• Refrain from using perfumes, colognes, or scented lotions during client visits.',
        ]
      },
      {
        title: 'Attendance & Scheduling',
        content: [
          '• Report to all scheduled shifts on time or report absence at least 4 hours in advance.',
          '• More than 3 absences in a 3-month period may result in disciplinary action.',
          '• Direct scheduling with clients is not considered authorized work hours.',
          '• Any changes to shift start and end times must be approved by the Director or designee.',
          'Every Friday, a broadcast message is sent asking you to confirm your schedule for the upcoming week — respond by the deadline.',
        ]
      },
      {
        title: 'Pay & Benefits',
        content: [
          '• Pay week runs from Sunday through Saturday.',
          '• Payday is every Friday for hours worked during the previous week.',
          '• Payroll is processed through SurePayroll.',
          'Overtime & Holiday Pay:',
          '• Overtime pay is calculated at 1.5x the regular hourly rate.',
          '• Holiday pay is also compensated at 1.5x the hourly wage.',
          'Mileage Reimbursement:',
          '• Mileage is reimbursed at $0.725 per mile driven for client-related errands or transportation.',
          '• Record mileage before and after providing the service.',
          'Meal Periods & Breaks:',
          '• Shifts of 6+ hours are entitled to a paid 30-minute meal period.',
          '• For every 4 hours worked, employees may get a 15-minute break.',
        ]
      },
      {
        title: 'Timekeeping & Clock In/Out',
        content: [
          'Caregivers have two options to clock in and out: the eRSP Mobile Connect app and Telephony.',
          '• Clock in at the beginning of your shift and clock out at the end.',
          '• If you cannot clock in via eRSP, call 1-888-624-0351 from the clients phone.',
          '• You cannot use your own phone to call the 1-888 number.',
          'Unauthorized Timekeeping:',
          '• Employees are prohibited from clocking in or out for another employee.',
          '• Falsification of timekeeping records may result in termination.',
        ]
      },
      {
        title: 'Drug Testing & Supervisory Visits',
        content: [
          'Drug Testing:',
          '• All employees are subject to drug testing at random intervals.',
          '• Refusing drug testing or testing positive may result in termination.',
          '• Results are kept confidential.',
          '• If prescribed medications may cause a positive result, notify your supervisor and provide documentation.',
          'Supervisory Visits:',
          '• Every 2-3 months, a Registered Nurse will complete a supervisory visit during your shift.',
          '• Continue doing your work as usual during these visits.',
        ]
      },
      {
        title: 'Client Relationships & Communication',
        content: [
          'Gifts:',
          '• Caregivers may not accept cash, gift cards, or valuables from clients.',
          '• Small non-monetary gifts (e.g., baked goods) may be accepted with prior management approval.',
          '• Always notify management if a gift is offered.',
          'Religion & Politics:',
          '• Do not discuss religion or politics with clients.',
          'Communication:',
          '• Always respond promptly to calls or texts from the office.',
          '• If you cannot respond immediately, send a quick acknowledgment message.',
          '• Ignoring office communication is not acceptable.',
        ]
      },
      {
        title: 'Open Shifts & In-Service Training',
        content: [
          'Open Shifts:',
          '• Open shifts may offer a higher pay rate.',
          '• Assigned on a first come, first served basis.',
          '• Respond promptly to open shift broadcasts to be considered.',
          'In-Service Training:',
          '• Livi Home Care conducts an annual training needs assessment.',
          '• All staff are required to attend in-service training sessions as scheduled.',
          '• Training covers compliance, quality care, and performance evaluation.',
        ]
      },
    ],
    quiz: [
      {
        question: "How far in advance must you report an absence?",
        choices: [
          "1 hour before your shift",
          "2 hours before your shift",
          "4 hours before your shift",
          "The night before"
        ],
        correct: 2
      },
      {
        question: "What is the mileage reimbursement rate at Livi Home Care?",
        choices: [
          "$0.50 per mile",
          "$0.625 per mile",
          "$0.725 per mile",
          "$0.825 per mile"
        ],
        correct: 2
      },
      {
        question: "Which of the following gifts can a caregiver accept from a client?",
        choices: [
          "Cash",
          "Gift cards",
          "Jewelry",
          "Small homemade items with prior management approval"
        ],
        correct: 3
      },
      {
        question: "When is payday at Livi Home Care?",
        choices: [
          "Every Monday for the current week",
          "Every Friday for hours worked the previous week",
          "Every other Friday",
          "The first of every month"
        ],
        correct: 1
      },
      {
        question: "What should caregivers wear to work?",
        choices: [
          "Jeans and a t-shirt",
          "Pajamas or jogging pants",
          "Scrubs or professional pants with a nice shirt",
          "Open-toed shoes for comfort"
        ],
        correct: 2
      },
      {
        question: "What topics should caregivers avoid discussing with clients?",
        choices: [
          "The clients care plan",
          "Religion and politics",
          "The clients daily schedule",
          "Medication reminders"
        ],
        correct: 1
      }
    ]
  }
]

export default function NewHireOrientationPage({ onNext }) {
  const [currentSection, setCurrentSection] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [completedSections, setCompletedSections] = useState([])

  const section = sections[currentSection]
  const slide = section.slides[currentSlide]
  const isLastSlide = currentSlide === section.slides.length - 1
  const isLastSection = currentSection === sections.length - 1

  const overallProgress = Math.round((completedSections.length / sections.length) * 100)

  const handleNextSlide = () => {
    if (isLastSlide) {
      setShowQuiz(true)
    } else {
      setCurrentSlide(prev => prev + 1)
    }
  }

  const handlePrevSlide = () => {
    if (showQuiz) {
      setShowQuiz(false)
      setQuizAnswers({})
      setQuizSubmitted(false)
    } else if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
  }

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    if (quizSubmitted) return
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }))
  }

  const allAnswered = Object.keys(quizAnswers).length === section.quiz.length

  const score = section.quiz.reduce((acc, q, i) => {
    return acc + (quizAnswers[i] === q.correct ? 1 : 0)
  }, 0)

  const passed = score >= Math.ceil(section.quiz.length * 0.7)

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true)
  }

  const handleRetakeQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
  }

  const handleNextSection = () => {
    if (!completedSections.includes(currentSection)) {
      setCompletedSections(prev => [...prev, currentSection])
    }
    if (isLastSection) {
      onNext()
    } else {
      setCurrentSection(prev => prev + 1)
      setCurrentSlide(0)
      setShowQuiz(false)
      setQuizAnswers({})
      setQuizSubmitted(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-8">

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="w-5 h-5 text-[#577C09]" />
        <span className="text-[#577C09] font-medium">Step 5 of 11</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">New Hire Orientation</h1>
      <p className="text-muted-foreground mb-6">
        Complete all 6 sections and their quizzes to finish your orientation.
      </p>

      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{completedSections.length} of {sections.length} sections complete</span>
          <span>{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              if (completedSections.includes(i) || i === currentSection) {
                setCurrentSection(i)
                setCurrentSlide(0)
                setShowQuiz(false)
                setQuizAnswers({})
                setQuizSubmitted(false)
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              i === currentSection
                ? 'bg-[#577C09] text-white border-[#577C09]'
                : completedSections.includes(i)
                ? 'bg-[#E8F0D0] text-[#577C09] border-[#577C09]'
                : 'bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed'
            }`}
          >
            {completedSections.includes(i) ? '✓ ' : ''}{s.title}
          </button>
        ))}
      </div>

      {/* Slide View */}
      {!showQuiz && (
        <div className="border border-border rounded-xl p-8 mb-6 min-h-[320px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{slide.title}</h2>
            <span className="text-xs text-muted-foreground">
              Slide {currentSlide + 1} of {section.slides.length}
            </span>
          </div>
          <div className="space-y-3">
            {slide.content.map((line, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed ${
                  line.startsWith('•')
                    ? 'pl-4 text-muted-foreground'
                    : line.startsWith('"')
                    ? 'italic text-[#577C09] font-medium text-base'
                    : line.endsWith(':')
                    ? 'font-medium text-foreground'
                    : 'text-foreground'
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Quiz View */}
      {showQuiz && (
        <div className="border border-border rounded-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Section Quiz — {section.title}</h2>
            <span className="text-xs text-muted-foreground">{section.quiz.length} questions</span>
          </div>

          {!quizSubmitted ? (
            <div className="space-y-8">
              {section.quiz.map((q, qi) => (
                <div key={qi}>
                  <p className="font-medium text-sm mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.choices.map((choice, ci) => (
                      <button
                        key={ci}
                        onClick={() => handleAnswerSelect(qi, ci)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                          quizAnswers[qi] === ci
                            ? 'border-[#577C09] bg-[#E8F0D0] text-[#3D5906]'
                            : 'border-border hover:border-[#577C09] hover:bg-[#E8F0D0]/50'
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSubmitQuiz}
                disabled={!allAnswered}
                className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </Button>
            </div>
          ) : (
            <div>
              {/* Score */}
              <div className={`rounded-lg p-6 mb-8 text-center ${passed ? 'bg-[#E8F0D0]' : 'bg-red-50'}`}>
                <p className={`text-4xl font-bold mb-1 ${passed ? 'text-[#577C09]' : 'text-red-600'}`}>
                  {score}/{section.quiz.length}
                </p>
                <p className={`text-sm font-medium ${passed ? 'text-[#3D5906]' : 'text-red-600'}`}>
                  {passed
                    ? 'Passed — great work!'
                    : 'Not quite — review the answers below and try again'}
                </p>
              </div>

              {/* Answer Review */}
              <div className="space-y-6 mb-8">
                {section.quiz.map((q, qi) => {
                  const isCorrect = quizAnswers[qi] === q.correct
                  return (
                    <div
                      key={qi}
                      className={`rounded-lg border p-4 ${
                        isCorrect
                          ? 'border-[#577C09] bg-[#E8F0D0]/50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        {isCorrect
                          ? <CheckCircle className="w-4 h-4 text-[#577C09] mt-0.5 shrink-0" />
                          : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        }
                        <p className="font-medium text-sm">{q.question}</p>
                      </div>
                      <div className="space-y-1 pl-6">
                        {q.choices.map((choice, ci) => (
                          <p
                            key={ci}
                            className={`text-sm px-3 py-1.5 rounded ${
                              ci === q.correct
                                ? 'bg-[#577C09] text-white font-medium'
                                : ci === quizAnswers[qi] && !isCorrect
                                ? 'bg-red-200 text-red-800 line-through'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {choice}
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {!passed ? (
                <Button
                  onClick={handleRetakeQuiz}
                  className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8"
                >
                  Retake Quiz
                </Button>
              ) : (
                <Button
                  onClick={handleNextSection}
                  className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8"
                >
                  {isLastSection ? 'Complete Orientation' : 'Continue to Next Section →'}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slide Navigation */}
      {!showQuiz && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevSlide}
            disabled={currentSlide === 0}
            className="gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-1.5">
            {section.slides.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentSlide ? 'bg-[#577C09]' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNextSlide}
            className="gap-2 bg-[#577C09] hover:bg-[#3D5906] text-white"
          >
            {isLastSlide ? 'Take Quiz' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

    </div>
  )
}