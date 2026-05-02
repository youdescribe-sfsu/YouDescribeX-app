import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Clip } from '@/shared/utils/convertClipObject'
import {
  TUTORIAL_AI_AUDIO_CLIPS,
  TUTORIAL_DEMO_AUDIO_CLIP,
} from './tutorialConfig'
import type { TutorialMode, TutorialStep } from './tutorialSteps'

type TutorialEditorUiState = TutorialStep['uiState']

interface TutorialEditComponentToggle {
  clipId: string
  showEditComponent: boolean
}

interface TutorialEditorState {
  tutorialAudioClips: Clip[]
  tutorialShowClipForm: boolean
  tutorialIsEditing: boolean
  tutorialNavClipIndex: number
  tutorialEditComponentToggleList: TutorialEditComponentToggle[]

  syncFromTutorialStep: (
    mode: TutorialMode | null,
    uiState?: TutorialEditorUiState,
  ) => void
  resetTutorialEditor: () => void
  setTutorialNavClipIndex: (index: number) => void
}

const getTutorialAudioClips = (
  mode: TutorialMode | null,
  uiState?: TutorialEditorUiState,
): Clip[] => {
  if (!uiState?.showSavedClip) return []
  if (mode === 'ai') return [...TUTORIAL_AI_AUDIO_CLIPS]
  return [TUTORIAL_DEMO_AUDIO_CLIP]
}

const getTutorialEditComponentToggleList = (
  clips: Clip[],
): TutorialEditComponentToggle[] =>
  clips.map((clip) => ({
    clipId: clip.clip_id,
    showEditComponent: true,
  }))

const getClampedNavClipIndex = (index: number, clips: Clip[]) => {
  if (clips.length === 0) return 0
  return Math.max(0, Math.min(index, clips.length - 1))
}

const initialTutorialEditorState = {
  tutorialAudioClips: [],
  tutorialShowClipForm: false,
  tutorialIsEditing: false,
  tutorialNavClipIndex: 0,
  tutorialEditComponentToggleList: [],
}

export const tutorialEditorStore = create<TutorialEditorState>()(
  devtools(
    (set, get) => ({
      ...initialTutorialEditorState,

      syncFromTutorialStep: (mode, uiState) => {
        const tutorialAudioClips = getTutorialAudioClips(mode, uiState)

        set({
          tutorialAudioClips,
          tutorialShowClipForm: uiState?.showClipForm === true,
          tutorialIsEditing: uiState?.isEditing === true,
          tutorialNavClipIndex: getClampedNavClipIndex(
            get().tutorialNavClipIndex,
            tutorialAudioClips,
          ),
          tutorialEditComponentToggleList:
            getTutorialEditComponentToggleList(tutorialAudioClips),
        })
      },

      resetTutorialEditor: () => {
        set(initialTutorialEditorState)
      },

      setTutorialNavClipIndex: (index) => {
        set((state) => ({
          tutorialNavClipIndex: getClampedNavClipIndex(
            index,
            state.tutorialAudioClips,
          ),
        }))
      },
    }),
    { name: 'tutorialEditorStore' },
  ),
)
