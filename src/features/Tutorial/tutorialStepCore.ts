export type TutorialMode = 'freestyle' | 'ai'

export interface TutorialStep {
  id: string
  targetSelector: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action: 'next' | 'click' | 'finish' | 'choose'
  page: 'video' | 'editor'
  hideOverlay?: boolean
  autoScroll?: false | 'top'
  centeredSize?: 'intro' | 'default'
  choices?: { label: string; value: TutorialMode }[]
  spotlightPadding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  spotlightOffsetX?: number
  spotlightIncludeSelector?: string
  waitForTargetSettle?: boolean
  uiState?: {
    showClipForm?: boolean
    showSavedClip?: boolean
    isEditing?: boolean
    showClipsList?: boolean
  }
}

export const centeredStep = (
  step: Omit<TutorialStep, 'targetSelector' | 'position'>,
): TutorialStep => ({
  targetSelector: '',
  position: 'center',
  ...step,
})

export const CLIP_FORM_ONLY: TutorialStep['uiState'] = {
  showClipForm: true,
  isEditing: false,
}

export const SAVED_CLIP: TutorialStep['uiState'] = {
  showSavedClip: true,
  isEditing: true,
}

export const SAVED_CLIP_WITH_LIST: TutorialStep['uiState'] = {
  ...SAVED_CLIP,
  showClipsList: true,
}

export const FORM_AND_CLIP: TutorialStep['uiState'] = {
  showClipForm: true,
  showSavedClip: true,
  isEditing: false,
}

export const withUIState = (
  step: TutorialStep,
  uiState: TutorialStep['uiState'],
  overrides?: Partial<TutorialStep>,
): TutorialStep => ({
  ...step,
  uiState,
  ...overrides,
})

export const withUIStateDefaultScroll = (
  step: TutorialStep,
  uiState: TutorialStep['uiState'],
  overrides?: Partial<TutorialStep>,
): TutorialStep => {
  const stepWithoutAutoScroll: TutorialStep = { ...step }
  delete stepWithoutAutoScroll.autoScroll

  return {
    ...stepWithoutAutoScroll,
    uiState,
    ...overrides,
  }
}
