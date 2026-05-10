import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MonitorPlay, Smartphone, Phone, AlertTriangle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import image1 from '@/assets/guide-1.png';
import image2 from '@/assets/guide-2.png';
import image3 from '@/assets/guide-3.png';
import image4 from '@/assets/guide-4.png';
import image5 from '@/assets/guide-5.png';
import image6 from '@/assets/guide-6.png';
import image7 from '@/assets/guide-7.png';
import image8 from '@/assets/guide-8.png';
import image9 from '@/assets/guide-9.png';
import image10 from '@/assets/guide-10.png';
import image11 from '@/assets/guide-11.png';
import image13 from '@/assets/guide-13.png';


const sections = [
    {
        id: 'app',
        icon: Smartphone,
        title: 'eRSP Mobile Connect App',
        color: '#577C09',
        steps: [
            {
                heading: 'Download the App',
                items: [
                    'Open your device\'s App Store (Apple) or Google Play Store (Android).',
                    'Search for "eRSP Mobile Connect" and download the app.',
                ]
            },
            {
                heading: 'Log Into the App',
                images: [image1, image2],
                items: [
                    'Enter the URL: livihomecare, then click "Next".',
                    'Before entering your username and password, ensure the toggle is set to "Caregiver".',
                    'Enter the username and password provided by Livi Home Care when your account was created.',
                    'Important: You must allow all permissions for location services — otherwise eRSP will not allow you to clock in or out.',
                ]
            },
            {
                heading: 'Messages',
                images: [image3, image4],
                items: [
                    'All Team Livi messages are accessible from the main screen by clicking the "Messages" button at the bottom of the screen.',
                ]
            },
        ]
    },
    {
        id: 'clockin',
        icon: CheckCircle,
        title: 'Clocking In & Completing Your Shift',
        color: '#577C09',
        steps: [
            {
                heading: 'Clocking In',
                images: [image5, image6, image7],
                items: [
                    'Upon arriving at the client\'s home, log into the eRSP Mobile Connect app.',
                    'Click on your assigned shift to access shift details including client information, maps, clock, activities, care notes, and signatures.',
                    'Tap the "Clock" icon to begin the clock-in process.',
                    'Once the GPS displays the correct location, tap "Clock In" to begin your shift.',
                    'You should see a "Successfully clocked in" message and the assignment will change to "In Progress".',
                ]
            },
            {
                heading: 'Viewing Activities (Plan of Care)',
                images: [image8, image9, image10],
                items: [
                    'When assigned a new client, always go to their "Activities" tab and review their plan of care.',
                    'After clocking in, navigate to the "Activities" tab to view the plan of care required for the visit.',
                    'Open each dropdown category and review the activities for the day.',
                    'At the end of your shift, return to the "Activities" tab and check off all completed activities.',
                    'Once all tasks are done, tap "Save" in the upper left corner.',
                    'Important: If you do not save your completed activities, you will NOT be able to clock out.',
                ]
            },
            {
                heading: 'Clocking Out',
                images: [image11, image13],
                items: [
                    'After completing and saving all activities, go to the "Caregiver Signature" tab, sign using your finger, and tap "Save".',
                    'Have the client sign in the "Client Signature" tab, then tap "Save".',
                    'If the client is unable to sign, ask their representative to sign.',
                    'If the client is in a facility, request a signature from the facility\'s staff (nurse or caregiver).',
                    'To add notes about the visit, go to the "Care Notes" section. Keep language professional — only summarize noteworthy issues or concerns.',
                    'Finally, return to the "Clock" icon and clock out. The assignment status will turn GREEN and show "Completed" when successful.',
                ]
            },
        ]
    },
    {
        id: 'telephony',
        icon: Phone,
        title: 'Backup — Telephony Clock In/Out',
        color: '#8C5C2B',
        steps: [
            {
                heading: 'When to Use Telephony',
                items: [
                    'Use Telephony only if you are having issues with the eRSP app or do not have access to it.',
                    'eRSP should always be your first choice for clocking in and out.',
                    'Instructions for Telephony are also printed on the back of your employee badge.',
                ]
            },
            {
                heading: 'Telephony Steps',
                items: [
                    'Dial 1-888-624-0351 from the CLIENT\'S phone — do not use your personal phone as it will not complete the clock in or out.',
                    'When prompted, enter your employee PIN. Your PIN is your employee ID found on the back of your badge.',
                    'Press 1 to clock in OR Press 2 to clock out.',
                    'If you are being paid mileage, enter the mileage amount and press #.',
                    'If you are not being paid mileage for the visit, press 0# to complete the process.',
                ]
            },
        ]
    },
    {
        id: 'finalresort',
        icon: AlertTriangle,
        title: 'Final Resort — Manual Backup',
        color: '#8C5C2B',
        steps: [
            {
                heading: 'If Both Methods Fail',
                items: [
                    'Send a text message to the scheduling team chat and explain all steps you took that failed.',
                    'In the same message, share your LIVE location PIN so the team can confirm you are at the client\'s location.',
                    'Repeat this step at the end of your shift if you are still unable to clock out.',
                ]
            },
            {
                heading: 'How to Share Your Live Location',
                items: [
                    <>
                        <span>Apple Devices: Go to Settings → Privacy → Location Services, or visit </span>

                        <a href="https://support.apple.com/guide/iphone/share-your-location-iph69b192bc2/ios"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#577C09] underline hover:text-[#3D5906]"
                        >
                            Apple Support.
                        </a>
                    </>,
                    <>
                        <span>Android Devices: Open Google Maps, tap your profile icon → Share location, or visit </span>

                        <a href="https://support.google.com/maps/answer/15437054?hl=en&co=GENIE.Platform%3DAndroid"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#577C09] underline hover:text-[#3D5906]"
                        >
                            the Google Maps support page.
                        </a>
                    </>,
                ]
            },
        ]
    },
]

export default function ERSPGuidePage({ stepLabel, onNext }) {
    const [expanded, setExpanded] = useState({ app: true, clockin: false, telephony: false, finalresort: false })
    const [confirmed, setConfirmed] = useState(false)

    const toggle = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="max-w-2xl mx-auto py-16 px-8">

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <MonitorPlay className="w-5 h-5 text-[#577C09]" />
                <span className="text-[#577C09] font-medium">{stepLabel}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Guide to eRSP</h1>
            <p className="text-muted-foreground mb-8">
                eRSP is the system you will use to clock in and out of every shift, view your
                schedule, complete activities, and communicate with the Livi Home Care team.
                Read through each section carefully before continuing.
            </p>

            {/* Sections */}
            <div className="space-y-4 mb-8">
                {sections.map((section) => {
                    const Icon = section.icon
                    const isOpen = expanded[section.id]

                    return (
                        <div
                            key={section.id}
                            className="border border-border rounded-xl overflow-hidden"
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => toggle(section.id)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ background: section.id === 'telephony' || section.id === 'finalresort' ? '#F2E6D9' : '#E8F0D0' }}
                                    >
                                        <Icon
                                            className="w-4 h-4"
                                            style={{ color: section.color }}
                                        />
                                    </div>
                                    <span className="font-medium text-sm">{section.title}</span>
                                </div>
                                {isOpen
                                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                            </button>

                            {/* Section Content */}
                            {isOpen && (
                                <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
                                    {section.steps.map((step, i) => (
                                        <div key={i}>
                                            <h3 className="text-sm font-medium mb-3">{step.heading}</h3>
                                            <ul className="space-y-2">
                                                {step.items.map((item, j) => (
                                                    <li
                                                        key={j}
                                                        className={`text-sm leading-relaxed flex items-start gap-2 ${typeof item === 'string' && item.startsWith('Important:')
                                                                ? 'text-[#577C09] font-medium'
                                                                : typeof item === 'string' && (item.startsWith('Apple') || item.startsWith('Android'))
                                                                    ? 'text-muted-foreground'
                                                                    : 'text-foreground'
                                                            }`}
                                                    >
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                                                            style={{ background: section.color }}
                                                        />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {step.images && step.images.length > 0 && (
                                                <div className="space-y-3 mt-4 flex flex-row">
                                                    {step.images.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img}
                                                            alt={`${step.heading} screenshot ${idx + 1}`}
                                                            className="rounded-lg border border-border object-cover h-[300px]"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Confirmation */}
            <div className="border border-border rounded-xl p-6 mb-8">
                <button
                    onClick={() => setConfirmed(prev => !prev)}
                    className="flex items-start gap-3 w-full text-left"
                >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${confirmed
                            ? 'bg-[#577C09] border-[#577C09]'
                            : 'border-muted-foreground'
                        }`}>
                        {confirmed && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <p className="text-sm text-foreground">
                        I have read and understand the eRSP clock in/out procedures, including
                        the backup Telephony method and the final resort manual backup process.
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