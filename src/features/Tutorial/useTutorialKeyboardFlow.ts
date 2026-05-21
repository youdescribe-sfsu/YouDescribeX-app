import { useEffect } from 'react'
import type { TutorialStep } from './tutorialStepRegistry'

interface Params {
  isActive: boolean
  activeSteps: TutorialStep[]
  currentStepIndex: number
  goToStep: (index: number, source: 'page-tab') => void
}

const getClosestMatchDistance = (
  element: Element,
  selector: string,
): number | null => {
  const matchingElement = element.closest(selector)
  if (!matchingElement) return null

  let distance = 0
  let currentElement: Element | null = element

  while (currentElement && currentElement !== matchingElement) {
    distance += 1
    currentElement = currentElement.parentElement
  }

  return distance
}

const getClosestMatchingStepIndex = (
  element: Element,
  activeSteps: TutorialStep[],
): number => {
  let matchingIndex = -1
  let closestDistance = Number.POSITIVE_INFINITY

  activeSteps.forEach((step, index) => {
    if (!step.targetSelector) return

    const distance = getClosestMatchDistance(element, step.targetSelector)
    if (distance === null || distance >= closestDistance) return

    matchingIndex = index
    closestDistance = distance
  })

  return matchingIndex
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

      const matchingIndex = getClosestMatchingStepIndex(element, activeSteps)

      if (matchingIndex < 0 || matchingIndex === currentStepIndex) return

      goToStep(matchingIndex, 'page-tab')
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [activeSteps, currentStepIndex, goToStep, isActive])
}
