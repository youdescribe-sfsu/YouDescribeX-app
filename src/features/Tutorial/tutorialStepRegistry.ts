import { aiPostForkSteps } from './tutorialAiStepSequence'
import { freestylePostForkSteps, sharedSteps } from './tutorialStepDefinitions'
import type { TutorialMode, TutorialStep } from './tutorialStepCore'

export type { TutorialMode, TutorialStep } from './tutorialStepCore'

export const freestyleTutorialSteps: TutorialStep[] = [
  ...sharedSteps,
  ...freestylePostForkSteps,
]

export const aiTutorialSteps: TutorialStep[] = [
  ...sharedSteps,
  ...aiPostForkSteps,
]

export const getActiveSteps = (mode: TutorialMode | null): TutorialStep[] => {
  switch (mode) {
    case 'ai':
      return aiTutorialSteps
    case 'freestyle':
    default:
      return freestyleTutorialSteps
  }
}
