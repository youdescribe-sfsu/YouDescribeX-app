import { aiPostForkSteps } from './tutorialAiSteps'
import { freestylePostForkSteps, sharedSteps } from './tutorialBaseSteps'
import type { TutorialMode, TutorialStep } from './tutorialStepModel'

export type { TutorialMode, TutorialStep } from './tutorialStepModel'

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
