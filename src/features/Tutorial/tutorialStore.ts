import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getActiveSteps, type TutorialMode } from './tutorialStepRegistry'

interface TutorialState {
  isActive: boolean
  currentStepIndex: number
  tutorialMode: TutorialMode | null

  startTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => void
  completeTutorial: () => void
  setTutorialMode: (mode: TutorialMode) => void
}

export const tutorialStore = create<TutorialState>()(
  devtools(
    (set, get) => ({
      isActive: false,
      currentStepIndex: 0,
      tutorialMode: null,

      startTutorial: () => {
        set({ isActive: true, currentStepIndex: 0, tutorialMode: null })
      },

      nextStep: () => {
        const { currentStepIndex, tutorialMode } = get()
        const steps = getActiveSteps(tutorialMode)
        const nextIndex = currentStepIndex + 1

        if (nextIndex >= steps.length) {
          get().completeTutorial()
          return
        }

        set({ currentStepIndex: nextIndex })
      },

      prevStep: () => {
        const { currentStepIndex } = get()
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 })
        }
      },

      skipTutorial: () => {
        set({ isActive: false, currentStepIndex: 0, tutorialMode: null })
      },

      completeTutorial: () => {
        set({
          isActive: false,
          currentStepIndex: 0,
          tutorialMode: null,
        })
      },

      setTutorialMode: (mode: TutorialMode) => {
        set({ tutorialMode: mode })
      },
    }),
    { name: 'tutorialStore' },
  ),
)
