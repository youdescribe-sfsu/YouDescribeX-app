import { useEffect } from 'react'
import type { TutorialStep } from './tutorialStepRegistry'

interface Params {
  isActive: boolean
  activeSteps: TutorialStep[]
  currentStepIndex: number
  goToStep: (index: number, source: 'page-tab') => void
}

export const useTutorialKeyboardFlow = ({
  isActive,
  activeSteps,
  currentStepIndex,
  goToStep,
}: Params) => {
  useEffect(() => {
    if (!isActive) return undefined

    const handleFocusIn = (event: FocusEvent) => {
      const element = event.target
      if (!(element instanceof Element)) return
      if (element.closest('[data-tutorial-overlay="true"]')) return

      const matchingIndex = activeSteps.findIndex((step) => {
        if (!step.targetSelector) return false
        return element.closest(step.targetSelector) !== null
      })

      if (matchingIndex < 0 || matchingIndex === currentStepIndex) return

      goToStep(matchingIndex, 'page-tab')
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [activeSteps, currentStepIndex, goToStep, isActive])
}
