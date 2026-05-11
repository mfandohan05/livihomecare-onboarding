import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ClipboardCheck } from 'lucide-react'

const sections = [
  {
    id: 'conditions',
    title: 'Care Experience — Conditions',
    description: 'Check all conditions you have experience working with.',
    items: [
      'Vision Impaired',
      'ALS (Lou Gehrig\'s Disease)',
      'Paraplegic',
      'Dementia',
      'Assisting the Blind',
      'Multiple Sclerosis',
      'Cerebral Palsy',
      'Hearing Impaired',
      'Mental Illness',
      'Parkinson\'s',
      'Traumatic Brain Injury (TBI)',
      'Death & Dying',
      'Alzheimer\'s',
      'Quadriplegic',
      'Cancer',
      'Diabetes',
      'Strokes',
    ]
  },
  {
    id: 'personalCare',
    title: 'Personal Care',
    description: 'Check all personal care tasks you have experience with.',
    items: [
      'Bed Pan',
      'Commode',
      'Adult Diapers',
      'Colostomy Bag',
      'Toileting',
      'Peri Care — Women',
      'Peri Care — Men',
    ]
  },
  {
    id: 'bathingCare',
    title: 'Bathing Care',
    description: 'Check all bathing care tasks you have experience with.',
    items: [
      'Showering',
      'Bed Bath',
      'Shower Seat',
      'Shaving Face',
      'Shaving Legs',
      'Nail Care',
      'Hair Cuts',
      'Skin Care',
    ]
  },
  {
    id: 'oralCare',
    title: 'Oral Care',
    description: 'Check all oral care tasks you have experience with.',
    items: [
      'Denture Care',
      'Tooth Brushing',
    ]
  },
  {
    id: 'vitals',
    title: 'Taking Vitals',
    description: 'Check all vitals you have experience taking.',
    items: [
      'Blood Pressure',
      'Pulse',
      'Temperature',
    ]
  },
  {
    id: 'catheters',
    title: 'Catheters',
    description: 'Check all catheter experience you have.',
    items: [
      'Foley Catheter',
    ]
  },
  {
    id: 'otherCare',
    title: 'Other Relevant Experience',
    description: 'Check all other care tasks you have experience with.',
    items: [
      'Make Occupied Bed',
      'Medication Assistance',
      'Suppository',
      'Med Box',
      'Oxygen',
      'Massage',
      'ADLs',
    ]
  },
  {
    id: 'mobility',
    title: 'Mobility Assistance',
    description: 'Check all mobility assistance tasks you have experience with.',
    items: [
      'Car Transfer',
      'Wheelchair',
      'Chair',
      'Partial Weight-Bearing',
      'Full Weight-Bearing',
      'Pivot Disc',
      'Repositioning',
      'Ambulation',
      'Slide Board',
      'Range of Motion',
      'Constraints',
      'Exercise',
      'Walking with Cane',
      'Walking with Walker',
      'Placing a Wheelchair in a Car',
      'Gait Belt',
    ]
  },
  {
    id: 'homemaker',
    title: 'Homemaker Services',
    description: 'Check all homemaker tasks you have experience with.',
    items: [
      'Laundry',
      'Bed Linen',
      'Clean Kitchen',
      'Bathroom',
      'Vacuum',
      'Dust',
      'Pet Care',
      'Trash',
      'Appointments',
      'Errands',
      'Plant Care',
      'Companionship',
      'Sports / Park Activities',
      'Heavy Cleaning',
      'Outings',
      'Meal Preparation',
      'Vegetarian Diet',
      'Balanced Diet',
      'Salt-Free Diet',
      'Ketogenic Diet',
    ]
  },
]

export default function SkillsCompetencyPage({ stepLabel, onNext, initialData, onChange }) {
  const [checked, setChecked] = useState(initialData?.checked || {})
  const [lunch, setLunch] = useState(initialData?.lunch || '')
  const [dinner, setDinner] = useState(initialData?.dinner || '')

  const toggleItem = (sectionId, item) => {
    const key = `${sectionId}__${item}`
    const updated = { ...checked, [key]: !checked[key] }
    setChecked(updated)
    onChange({ checked: updated, lunch, dinner })
  }

  const isChecked = (sectionId, item) => {
    return !!checked[`${sectionId}__${item}`]
  }

  const handleSubmit = () => {
    const result = {
      checked,
      lunch,
      dinner,
    }
    console.log(result)
    onNext()
  }

  const canContinue = lunch.trim().length > 0 && dinner.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto py-16 px-8">

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="w-5 h-5 text-[#577C09]" />
        <span className="text-[#577C09] font-medium">{stepLabel}</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Competency Checklist</h1>
      <p className="text-muted-foreground mb-8">
        Check all items you have experience with. This helps Livi Home Care match
        you with the right clients. You are not required to check everything —
        only check what you are comfortable and experienced with.
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id}>
            <h2 className="text-lg font-medium mb-1">{section.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
            <div className="grid grid-cols-2 gap-2">
              {section.items.map((item) => {
                const checked_ = isChecked(section.id, item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(section.id, item)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-colors ${checked_
                        ? 'border-[#577C09] bg-[#E8F0D0] text-[#3D5906]'
                        : 'border-border hover:border-[#577C09] hover:bg-[#E8F0D0]/30'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked_
                        ? 'bg-[#577C09] border-[#577C09]'
                        : 'border-muted-foreground'
                      }`}>
                      {checked_ && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {item}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Open Ended Questions */}
        <div>
          <h2 className="text-lg font-medium mb-1">Meal Preparation</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Please describe a nutritious meal you would prepare for a client.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe a nutritious lunch you would prepare
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={lunch}
                onChange={(e) => {
                  setLunch(e.target.value)
                  onChange({ checked, lunch: e.target.value, dinner })
                }}
                rows={4}
                placeholder="Describe the meal, ingredients, and why it is nutritious..."
                className="w-full border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#577C09] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Describe a nutritious dinner you would prepare
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={dinner}
                onChange={(e) => {
                  setDinner(e.target.value)
                  onChange({ checked, lunch, dinner: e.target.value })
                }}
                rows={4}
                placeholder="Describe the meal, ingredients, and why it is nutritious..."
                className="w-full border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#577C09] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-[#E8F0D0] rounded-lg p-4">
          <p className="text-sm text-[#3D5906]">
            <span className="font-medium">Note: </span>
            In addition to this competency assessment, each Livi Home Care caregiver
            will be trained for the client's specific needs before being assigned to them.
          </p>
        </div>

        {!canContinue && (
          <p className="text-sm text-muted-foreground">
            Please answer both meal preparation questions to continue.
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canContinue}
          className="bg-[#577C09] hover:bg-[#3D5906] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save & Continue
        </Button>

      </div>
    </div>
  )
}