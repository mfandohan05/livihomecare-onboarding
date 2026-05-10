export const mockEmployeeData = [
    {
        id: "5469071d-74f9-471e-a3f3-b59def463c40",
        token: "5469071d-74f9-471e-a3f3-b59def463c40",
        name: 'Maria Santos',
        email: 'msantos@livihomecare.com',
        role: 'caregiver',
        jobDescription: 'In-Home Aide',
        hireDate: '2026-05-10',
        status: 'in_progress',
        progress: {
            activeStep: 1,
            completedSteps: []
        }
    },
    {
        id: "337b24c7-bde8-4c62-ba13-ce94b05d8260",
        token: "337b24c7-bde8-4c62-ba13-ce94b05d8260",
        name: "James Carter, RN",
        email: "jcarter@livihomecare.com",
        role: 'nurse',
        jobDescripion: 'Registered Nurse (RN)',
        hireDate: '2026-05-09',
        status: 'pending',
        progress: {
            activeStep: 1,
            completedSteps: []
        }
    },
    {
        id: "e588583a-f616-4f6b-b4a0-69abb23aded6",
        token: "e588583a-f616-4f6b-b4a0-69abb23aded6",
        name: "Sam Thompson",
        email: "sthompson@livihomecare.com",
        jobDescripion: "Office Staff / Other",
        role: 'other',
        hireDate: '2026-05-01',
        status: 'pending',
        progress: {
            activeStep: 1,
            completedSteps: []
        }
    }
];

export const getCaregiverByToken = (token) => {
  return mockEmployeeData.find(c => c.token === token) || null
}