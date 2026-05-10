import { useEffect, useCallback } from 'react'

const SENSITIVE_KEYS = ['i9Data', 'w4Data', 'directDeposit']

export function useSaveProgress(token, activeStep, steps, formData) {
  const save = useCallback(() => {
    if (!token) {
        return;
    }

    const safeFormData = Object.fromEntries(
      Object.entries(formData).filter(([key]) => !SENSITIVE_KEYS.includes(key))
    )

    const progress = {
      activeStep,
      completedSteps: steps
        .filter(s => s.status === 'completed')
        .map(s => s.id),
      formData: safeFormData,
      lastSaved: new Date().toISOString(),
    }

    localStorage.setItem(`onboarding_${token}`, JSON.stringify(progress))
  }, [token, activeStep, steps, formData])

  useEffect(() => {
    const timer = setTimeout(() => {
      save()
    }, 500)
    return () => clearTimeout(timer)
  }, [save])
}

export function loadProgress(token) {
  if (!token) return null
  try {
    const saved = localStorage.getItem(`onboarding_${token}`)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}