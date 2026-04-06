import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getActiveSteps, type TutorialMode } from './tutorialSteps'
import { TUTORIAL_STORAGE_KEY } from './tutorialConstants'

interface PersistedTutorialState {
  hasCompleted: boolean
}

const loadCompletionState = (): boolean => {
  try {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (!saved) {
      return false
    }

    const parsed = JSON.parse(saved) as Partial<PersistedTutorialState>
    return parsed.hasCompleted === true
  } catch {
    return false
  }
}

const saveCompletionState = (hasCompleted: boolean) => {
  try {
    const state: PersistedTutorialState = { hasCompleted }
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // silently fail
  }
}

interface TutorialState {
  isActive: boolean
  currentStepIndex: number
  hasCompleted: boolean
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
      hasCompleted: loadCompletionState(),
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
          hasCompleted: true,
          tutorialMode: null,
        })
        saveCompletionState(true)
      },

      setTutorialMode: (mode: TutorialMode) => {
        set({ tutorialMode: mode })
      },
    }),
    { name: 'tutorialStore' },
  ),
)
