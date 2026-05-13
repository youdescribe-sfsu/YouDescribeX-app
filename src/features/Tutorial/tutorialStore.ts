import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getActiveSteps, type TutorialMode } from './tutorialStepRegistry'

interface TutorialState {
  isActive: boolean
  currentStepIndex: number
  tutorialMode: TutorialMode | null
  navigationSource: 'tutorial-controls' | 'page-tab'

  startTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number, source?: 'tutorial-controls' | 'page-tab') => void
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
      navigationSource: 'tutorial-controls',

      startTutorial: () => {
        set({
          isActive: true,
          currentStepIndex: 0,
          tutorialMode: null,
          navigationSource: 'tutorial-controls',
        })
      },

      nextStep: () => {
        const { currentStepIndex, tutorialMode } = get()
        const steps = getActiveSteps(tutorialMode)
        const nextIndex = currentStepIndex + 1

        if (nextIndex >= steps.length) {
          get().completeTutorial()
          return
        }

        set({
          currentStepIndex: nextIndex,
          navigationSource: 'tutorial-controls',
        })
      },

      prevStep: () => {
        const { currentStepIndex } = get()
        if (currentStepIndex > 0) {
          set({
            currentStepIndex: currentStepIndex - 1,
            navigationSource: 'tutorial-controls',
          })
        }
      },

      goToStep: (index, source = 'tutorial-controls') => {
        const { tutorialMode } = get()
        const steps = getActiveSteps(tutorialMode)
        const lastStepIndex = steps.length - 1
        const nextIndex = Math.max(0, Math.min(index, lastStepIndex))

        set({
          currentStepIndex: nextIndex,
          navigationSource: source,
        })
      },

      skipTutorial: () => {
        set({
          isActive: false,
          currentStepIndex: 0,
          tutorialMode: null,
          navigationSource: 'tutorial-controls',
        })
      },

      completeTutorial: () => {
        set({
          isActive: false,
          currentStepIndex: 0,
          tutorialMode: null,
          navigationSource: 'tutorial-controls',
        })
      },

      setTutorialMode: (mode: TutorialMode) => {
        set({ tutorialMode: mode })
      },
    }),
    { name: 'tutorialStore' },
  ),
)
