import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DollarSign, Monitor, Smartphone, ChevronDown, ChevronUp } from 'lucide-react'
import image1 from '@/assets/payroll1.png'
import image2 from '@/assets/payroll2.png'
import image3 from '@/assets/payroll3.png'
import image4 from '@/assets/payroll4.png'
import image5 from '@/assets/payroll5.png'
import image6 from '@/assets/payroll6.png'
import image7 from '@/assets/payroll7.png'
import image8 from '@/assets/payroll8.png'
const sections = [
    {
        id: 'overview',
        icon: DollarSign,
        title: 'Getting Started with SurePayroll',
        steps: [
            {
                heading: 'Account Setup',
                items: [
                    'When activated for your first payroll, you will receive an email containing your temporary login credentials.',
                    'Follow the link in the email to log in. You will be prompted to change your username (optional) and then set up your password.',
                    'Please reach out to our office for assistance with unlocking and/or resetting an account password. This can happen if you make multiple failed login attempts (3 max.) or if the "forgot password" process does not work.',
                ],
            },
        ],
    },
    {
        id: 'web',
        icon: Monitor,
        title: 'Accessing via Web Browser',
        steps: [
            {
                heading: 'Login Steps',
                images: [image1, image2],
                items: [
                    <>Go to: <a className="underline" href="https://secure.surepayroll.com/SPF/Login/Auth1.aspx">https://secure.surepayroll.com/SPF/Login/Auth1.aspx</a></>,
                    'Select Employee Account.',
                    'Enter your Username and click Next.',
                    'On the pop-up screen, enter your Password and click Log In.',
                    'Verify your identity by entering the 6-digit code sent to your registered mobile number.',
                ],
            },
            {
                heading: 'What You Can Do on the Web',
                images: [image3],
                items: [
                    'View Pay Stubs & Tax Documents — access a 24/7 record of all current and historical pay stubs.',
                    'Download Pay Stubs & Tax Documents — download any pay stubs or your annual W-2 forms during tax season.',
                    'View Direct Deposit — view the bank accounts tied to your direct deposits and track how your funds are distributed.',
                    'Update Certain Personal Details — edit your account username and/or password.',
                ],
            },
        ],
    },
    {
        id: 'app',
        icon: Smartphone,
        title: 'Accessing via Mobile App',
        steps: [
            {
                heading: 'Download the App',
                images: [image4, image5],
                flex_class: 'flex-col',
                items: [
                    'Search for "SurePayroll for Employees" on the Google Play Store (Android) or Apple App Store (iOS) and install it.',
                ],
            },
            {
                heading: 'Login Steps',
                images: [image6, image7, image8],
                className: "flex-1 min-w-0",
                flex_class: 'flex-row max-w-[600px] max-w-auto justify-center',
                items: [
                    'Enter your Username and click Next.',
                    'Enter your Password and click Log In.',
                    'Touch Authentication may be required after your initial log in if enabled.',
                    'Once logged in, navigate to any section using the menu at the bottom of the screen.',
                ],
            },
            {
                heading: 'Note: Mobile App Limitations',
                items: [
                    'Downloading pay stubs and tax documents is only available via web browser — not through the mobile app.',
                    'Viewing direct deposit details is also only available via web browser.',
                ],
                warning: true,
            },
        ],
    },
]

export default function SurePayrollGuidePage({ stepLabel, onNext, initialData, onChange }) {
    const [expanded, setExpanded] = useState({ overview: true, web: false, app: false })
    const [confirmed, setConfirmed] = useState(initialData?.confirmed || false)

    const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

    const handleConfirm = () => {
        const updated = !confirmed
        setConfirmed(updated)
        onChange({ confirmed: updated })
    }

    return (
        <div className="max-w-2xl mx-auto py-8 md:py-16 px-4 md:px-8">
            <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">{stepLabel}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">SurePayroll for Employees</h1>
            <p className="text-muted-foreground mb-8">
                As a Livi Home Care employee, you will use SurePayroll to view your paycheck
                stubs and tax information. You can access your account securely 24/7 through
                any web browser or the dedicated mobile app on iOS or Android.
            </p>

            <div className="space-y-4 mb-8">
                {sections.map((section) => {
                    const Icon = section.icon
                    const isOpen = expanded[section.id]

                    return (
                        <div key={section.id} className="border border-border rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggle(section.id)}
                                className="w-full flex items-center justify-between px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#E8F0D0]">
                                        <Icon className="w-4 h-4 text-[#577C09]" />
                                    </div>
                                    <span className="font-medium text-sm">{section.title}</span>
                                </div>
                                {isOpen
                                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                            </button>

                            {isOpen && (
                                <div className="px-4 md:px-6 pb-6 space-y-6 border-t border-border pt-6">
                                    {section.steps.map((step, i) => (
                                        <div key={i}>
                                            <h3 className="text-sm font-medium mb-3">{step.heading}</h3>
                                            <ul className="space-y-2">
                                                {step.items.map((item, j) => (
                                                    <li key={j} className="text-sm leading-relaxed flex items-start gap-2">
                                                        <span
                                                            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                                                            style={{ background: step.warning ? '#8C5C2B' : '#577C09' }}
                                                        />
                                                        <span className={step.warning ? 'text-amber-800' : 'text-foreground'}>
                                                            {item}
                                                        </span>
                                                    </li>
                                                ))}
                                                {step.images && step.images.length > 0 && (
                                                    <div className={"flex gap-3 mt-4 " + step.flex_class}>
                                                        {step.images.map((img, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={img}
                                                                alt={`${step.heading} screenshot ${idx + 1}`}
                                                                className={step.className}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="border border-border rounded-xl p-4 md:p-6 mb-8">
                <button
                    onClick={handleConfirm}
                    className="flex items-start gap-3 w-full text-left"
                >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${confirmed ? 'bg-[#577C09] border-[#577C09]' : 'border-muted-foreground'}`}>
                        {confirmed && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <p className="text-sm text-foreground">
                        I understand how to access and use SurePayroll to view my pay stubs,
                        tax documents, and direct deposit information.
                    </p>
                </button>
            </div>

            {!confirmed && (
                <p className="text-sm text-muted-foreground mb-4">
                    Please confirm you have read the guide before continuing.
                </p>
            )}

            <Button
                onClick={onNext}
                disabled={!confirmed}
                className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Save & Continue
            </Button>
        </div>
    )
}