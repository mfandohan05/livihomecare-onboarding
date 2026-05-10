import { PartyPopper, Heart, CheckCircle, Mail, Phone } from 'lucide-react'

const completedSteps = [
  'Document uploads',
  'Personal information & emergency contact',
  'eRSP enrollment',
  'New hire orientation',
  'Skills competency checklist',
  'Guide to eRSP',
  'Forms & agreements',
  'Tax forms',
  'Offer letter',
]

export default function CompletedPage({ caregiver = { name: 'Maria Santos' } }) {
  return (
    <div className="max-w-2xl mx-auto py-16 px-8">

      {/* Celebration header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#E8F0D0] flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-[#577C09]" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">
          You're all done, {caregiver.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Congratulations on completing your Livi Home Care orientation. We're so excited to have you on the team.
        </p>
      </div>

      {/* What you completed */}
      <div className="border border-border rounded-xl p-6 mb-6">
        <h2 className="font-medium mb-4">What you completed</h2>
        <div className="space-y-2">
          {completedSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-[#577C09] shrink-0" />
              <span className="text-sm text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What happens next */}
      <div className="border border-border rounded-xl p-6 mb-6">
        <h2 className="font-medium mb-4">What happens next</h2>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#E8F0D0] text-[#577C09] flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">1</div>
            <p>Livi Home Care will review your submitted documents and forms. This typically takes 1–2 business days.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#E8F0D0] text-[#577C09] flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">2</div>
            <p>Your eRSP caregiver account will be activated. You'll receive an email with your login credentials.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#E8F0D0] text-[#577C09] flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">3</div>
            <p>A Livi Home Care team member will reach out to complete your Form I-9 Section 2 and discuss your first assignment.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#E8F0D0] text-[#577C09] flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">4</div>
            <p>Your employee badge will be mailed to you or available for pickup at the office.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#E8F0D0] text-[#577C09] flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">5</div>
            <p>Once everything is verified, you'll be scheduled for your first shift. Your orientation payment will be issued after completing 10 shifts.</p>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-[#E8F0D0] rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-[#577C09]" />
          <p className="font-medium text-[#577C09]">Questions? We're here to help.</p>
        </div>
        <div className="space-y-2 text-sm text-[#3D5906]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0" />
            <a href="mailto:office@livihomecare.com" className="underline hover:text-[#577C09]">
              office@livihomecare.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0" />
            <a href="tel:8285400112" className="underline hover:text-[#577C09]">
              828-540-0112
            </a>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Thank you for your commitment to providing high-quality care to our clients. We can't do it without you.
      </p>

    </div>
  )
}