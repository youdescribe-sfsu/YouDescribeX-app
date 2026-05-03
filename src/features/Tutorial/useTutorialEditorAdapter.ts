import { useEffect } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type { Clip } from '@/shared/utils/convertClipObject'
import {
  TUTORIAL_DIALOG_TIMESTAMPS,
  TUTORIAL_VIDEO_DATABASE_ID,
  TUTORIAL_VIDEO_DURATION_SECONDS,
  TUTORIAL_VIDEO_YOUTUBE_ID,
} from './tutorialConfig'
import { tutorialEditorStore } from './tutorialEditorStore'
import type { TutorialMode } from './tutorialStepModel'

type TutorialDialogTimestamp = {
  dialog_seq_no: number
  dialog_start_time: number
  dialog_duration: number
}

type TutorialEditComponentToggle = {
  clipId: string
  showEditComponent: boolean
}

interface UseTutorialEditorAdapterParams {
  isTutorialMode: boolean
  tutorialMode: TutorialMode | null
  setShowSpinner: Dispatch<SetStateAction<boolean>>
  setVideoId: Dispatch<SetStateAction<string>>
  setVideoLength: Dispatch<SetStateAction<number>>
  setBackendFallbackYoutubeVideoId: Dispatch<SetStateAction<string | undefined>>
  setVideoDialogTimestamps: (timestamps: TutorialDialogTimestamp[]) => void
  setAudioClips: Dispatch<SetStateAction<Clip[]>>
  setNotesData: Dispatch<SetStateAction<unknown>>
  setIsPublished: Dispatch<SetStateAction<boolean>>
  setCollaborativeVersion: Dispatch<SetStateAction<boolean>>
  setEditComponentToggleList: Dispatch<
    SetStateAction<TutorialEditComponentToggle[]>
  >
  setNavClipIndex: Dispatch<SetStateAction<number>>
  setIsClipsListExpanded: Dispatch<SetStateAction<boolean>>
  navClipIndexRef: MutableRefObject<number>
  selectedClipIdRef: MutableRefObject<string | null>
}

interface UseTutorialEditorAdapterResult {
  tutorialShowClipForm: boolean
  tutorialShowClipsList: boolean
  setTutorialNavClipIndex: (index: number) => void
}

export const useTutorialEditorAdapter = ({
  isTutorialMode,
  tutorialMode,
  setShowSpinner,
  setVideoId,
  setVideoLength,
  setBackendFallbackYoutubeVideoId,
  setVideoDialogTimestamps,
  setAudioClips,
  setNotesData,
  setIsPublished,
  setCollaborativeVersion,
  setEditComponentToggleList,
  setNavClipIndex,
  setIsClipsListExpanded,
  navClipIndexRef,
  selectedClipIdRef,
}: UseTutorialEditorAdapterParams): UseTutorialEditorAdapterResult => {
  const tutorialAudioClips = tutorialEditorStore(
    (state) => state.tutorialAudioClips,
  )
  const tutorialShowClipForm = tutorialEditorStore(
    (state) => state.tutorialShowClipForm,
  )
  const tutorialShowClipsList = tutorialEditorStore(
    (state) => state.tutorialShowClipsList,
  )
  const tutorialNavClipIndex = tutorialEditorStore(
    (state) => state.tutorialNavClipIndex,
  )
  const setTutorialNavClipIndex = tutorialEditorStore(
    (state) => state.setTutorialNavClipIndex,
  )
  const tutorialEditComponentToggleList = tutorialEditorStore(
    (state) => state.tutorialEditComponentToggleList,
  )

  useEffect(() => {
    if (!isTutorialMode) return

    const nextTutorialAudioClips = tutorialAudioClips.map((clip, index) => ({
      ...clip,
      clip_sequence_number: index + 1,
    }))
    const nextNavClipIndex =
      nextTutorialAudioClips.length === 0
        ? 0
        : Math.min(tutorialNavClipIndex, nextTutorialAudioClips.length - 1)

    setShowSpinner(false)
    setVideoId(TUTORIAL_VIDEO_DATABASE_ID)
    setVideoLength(TUTORIAL_VIDEO_DURATION_SECONDS)
    setBackendFallbackYoutubeVideoId(TUTORIAL_VIDEO_YOUTUBE_ID)
    setVideoDialogTimestamps(
      tutorialMode === 'ai' ? [...TUTORIAL_DIALOG_TIMESTAMPS] : [],
    )
    setAudioClips(nextTutorialAudioClips)
    setNotesData({ notes_text: '', notes_id: '' })
    setIsPublished(false)
    setCollaborativeVersion(false)
    setEditComponentToggleList(tutorialEditComponentToggleList)
    setNavClipIndex(nextNavClipIndex)
    setIsClipsListExpanded(tutorialShowClipsList)
    navClipIndexRef.current = nextNavClipIndex
    selectedClipIdRef.current =
      nextTutorialAudioClips[nextNavClipIndex]?.clip_id ?? null
  }, [
    isTutorialMode,
    navClipIndexRef,
    selectedClipIdRef,
    setAudioClips,
    setBackendFallbackYoutubeVideoId,
    setCollaborativeVersion,
    setEditComponentToggleList,
    setIsClipsListExpanded,
    setIsPublished,
    setNavClipIndex,
    setNotesData,
    setShowSpinner,
    setVideoDialogTimestamps,
    setVideoId,
    setVideoLength,
    tutorialAudioClips,
    tutorialEditComponentToggleList,
    tutorialMode,
    tutorialNavClipIndex,
    tutorialShowClipsList,
  ])

  return {
    tutorialShowClipForm,
    tutorialShowClipsList,
    setTutorialNavClipIndex,
  }
}
