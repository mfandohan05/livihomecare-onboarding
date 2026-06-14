import {
  Heart,
  FolderUp,
  UserRound,
  DollarSign,
  GraduationCap,
  ClipboardCheck,
  MonitorPlay,
  ScrollText,
  FileText,
  FileSignature,
  PartyPopper,
  HeartPulse
} from "lucide-react";

const makeSteps = (stepList) =>
  stepList.map((step, index) => ({
    ...step,
    status: index === 0 ? "active" : "locked",
  }));

const nurseSteps = [
  { id: 1, stepName: "Welcome", logo: Heart },
  { id: 2, stepName: "Upload Documents", logo: FolderUp },
  { id: 3, stepName: "Personal Information", logo: UserRound },
  { id: 4, stepName: "New Hire Orientation", logo: GraduationCap },
  { id: 5, stepName: "How to Use eRSP", logo: MonitorPlay },
  { id: 6, stepName: "How to Use SurePayroll", logo: DollarSign },
  { id: 7, stepName: "Forms & Agreements", logo: ScrollText },
  { id: 8, stepName: "Tax Forms (W-9)", logo: FileText },
  { id: 9, stepName: "Offer Letter", logo: FileSignature },
  { id: 10, stepName: "Bloodborne Pathogens", logo: HeartPulse },
  { id: 11, stepName: "Completed!", logo: PartyPopper },
]

const nurseWelcomeSteps = [
  "✓ Uploading required documents (driver's license, car insurance, Social Security card, etc.)",
  "✓ Personal information & emergency contact information",
  "✓ eRSP enrollment",
  "✓ New hire orientation",
  "✓ Guide to using eRSP",
  "✓ Forms & agreements",
  "✓ Tax forms (W-9)",
  "✓ Offer letter"
]

export const stepsByRole = {
  caregiver: makeSteps([
    { id: 1, stepName: "Welcome", logo: Heart },
    { id: 2, stepName: "Upload Documents", logo: FolderUp },
    { id: 3, stepName: "Personal Information", logo: UserRound },
    { id: 4, stepName: "New Hire Orientation", logo: GraduationCap },
    { id: 5, stepName: "Competency Checklist", logo: ClipboardCheck },
    { id: 6, stepName: "How to Use eRSP", logo: MonitorPlay },
    { id: 7, stepName: "How to Use SurePayroll", logo: DollarSign },
    { id: 8, stepName: "Forms & Agreements", logo: ScrollText },
    { id: 9, stepName: "Tax Forms", logo: FileText },
    { id: 10, stepName: "Offer Letter", logo: FileSignature },
    { id: 11, stepName: "Bloodborne Pathogens", logo: HeartPulse },
    { id: 12, stepName: "Completed!", logo: PartyPopper },
  ]),

  nurse_prn: makeSteps(nurseSteps),
  nurse_director: makeSteps(nurseSteps),

  other: makeSteps([
    { id: 1, stepName: "Welcome", logo: Heart },
    { id: 2, stepName: "Upload Documents", logo: FolderUp },
    { id: 3, stepName: "Personal Information", logo: UserRound },
    { id: 4, stepName: "New Hire Orientation", logo: GraduationCap },
    { id: 5, stepName: "How to Use SurePayroll", logo: DollarSign },
    { id: 6, stepName: "Forms & Agreements", logo: ScrollText },
    { id: 7, stepName: "Tax Forms", logo: FileText },
    { id: 8, stepName: "Offer Letter", logo: FileSignature },
    { id: 9, stepName: "Bloodborne Pathogens", logo: HeartPulse },
    { id: 10, stepName: "Completed!", logo: PartyPopper },
  ]),
};

export const welcomeSteps = {
  caregiver: [
    "✓ Uploading required documents (driver's license, car insurance, Social Security card, etc.)",
    "✓ Personal information & emergency contact information",
    "✓ New hire orientation",
    "✓ Competency checklist",
    "✓ Guide to using eRSP & SurePayroll",
    "✓ Forms & agreements",
    "✓ Tax forms",
    "✓ Offer letter"
  ],
  nurse_prn: nurseWelcomeSteps,
  nurse_director: nurseWelcomeSteps,
  other: [
    "✓ Uploading required documents (driver's license, car insurance, Social Security card, etc.)",
    "✓ Personal information & emergency contact",
    "✓ New hire orientation",
    "✓ Forms & agreements",
    "✓ Guide to using SurePayroll",
    "✓ Tax forms",
    "✓ Offer letter"
  ]
};