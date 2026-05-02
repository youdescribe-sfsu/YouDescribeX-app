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
  uiState?: {
    showClipForm?: boolean
    showSavedClip?: boolean
    isEditing?: boolean
  }
}

const centeredStep = (
  step: Omit<TutorialStep, 'targetSelector' | 'position'>,
): TutorialStep => ({
  targetSelector: '',
  position: 'center',
  ...step,
})

const CLIP_FORM_ONLY: TutorialStep['uiState'] = {
  showClipForm: true,
  isEditing: false,
}
const SAVED_CLIP: TutorialStep['uiState'] = {
  showSavedClip: true,
  isEditing: true,
}
const FORM_AND_CLIP: TutorialStep['uiState'] = {
  showClipForm: true,
  showSavedClip: true,
  isEditing: false,
}

// ─── Named step constants ───────────────────────────────────────────

// Step 1
const welcomeStep = centeredStep({
  id: 'welcome',
  title: 'Welcome to YouDescribe!',
  content:
    "Let's learn how to add audio descriptions for\nblind and low vision viewers.",
  action: 'next',
  page: 'video',
  centeredSize: 'intro',
})

// Step 2
const wishlistBtnStep: TutorialStep = {
  id: 'wishlist-btn',
  targetSelector: '[data-tutorial="wishlist-btn"]',
  title: 'Add to Wishlist',
  content: 'Add videos here to describe them later.',
  position: 'left',
  action: 'next',
  page: 'video',
}

// Step 3
const freestyleBtnStep: TutorialStep = {
  id: 'freestyle-btn',
  targetSelector: '[data-tutorial="freestyle-btn"]',
  title: 'Add Freestyle Description',
  content: 'Write descriptions from scratch with your own words.',
  position: 'left',
  action: 'next',
  page: 'video',
}

// Step 4
const requestAiBtnStep: TutorialStep = {
  id: 'request-ai-btn',
  targetSelector: '[data-tutorial="request-ai-btn"]',
  title: 'Request AI Descriptions',
  content: 'Let AI generate descriptions for you, then edit and refine them.',
  position: 'left',
  action: 'next',
  page: 'video',
}

// Step 5 — choice step
const chooseModeStep = centeredStep({
  id: 'Choose-mode',
  title: 'Select a Tutorial Mode',
  content: '',
  action: 'choose',
  page: 'video',
  centeredSize: 'intro',
  autoScroll: 'top',
  choices: [
    { label: 'Freestyle Description', value: 'freestyle' },
    { label: 'AI Description', value: 'ai' },
  ],
})

// Step 6 (freestyle)
const editorIntroStep = centeredStep({
  id: 'editor-intro',
  title: 'Freestyle Editor Overview',
  content:
    'Here you can watch the video, take notes, and add precise audio descriptions.',
  action: 'next',
  page: 'editor',
  hideOverlay: true,
  autoScroll: false,
})

// Step 7 (AI)
const dialogTimelineStep: TutorialStep = {
  id: 'dialog-timeline',
  targetSelector: '[data-tutorial="dialog-timeline"]',
  title: 'Dialog Timeline',
  content:
    'Each yellow or purple block is an AI-generated description. The red playhead shows your current position in the video.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  spotlightIncludeSelector: '[data-tutorial="dialog-timeline-time"]',
}

// Step 8
const playPauseBtnStep: TutorialStep = {
  id: 'play-pause-btn',
  targetSelector: '[data-tutorial="play-pause-btn"]',
  title: 'Play and Pause',
  content:
    'Play and pause the video here. We recommend watching it fully before adding descriptions.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
}

// Step 9
const notesAreaStep: TutorialStep = {
  id: 'notes-area',
  targetSelector: '[data-tutorial="notes-area"]',
  title: 'Take Notes',
  content:
    'Click to save timestamps while watching and draft descriptions for each moment.',
  position: 'left',
  action: 'next',
  page: 'editor',
}

// Step 10
const audioDuckingStep: TutorialStep = {
  id: 'audio-ducking',
  targetSelector: '[data-tutorial="audio-ducking"]',
  title: 'Audio Ducking',
  content:
    'Use Description Volume and Video Volume to balance clarity and original audio.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
}

// Step 11
const insertInlineBtnStep: TutorialStep = {
  id: 'insert-inline-btn',
  targetSelector: '[data-tutorial="insert-inline-btn"]',
  title: 'Insert Inline',
  content:
    'Use Inline when the video should keep playing during the description.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
  autoScroll: false,
}

// Step 12
const insertExtendedBtnStep: TutorialStep = {
  id: 'insert-extended-btn',
  targetSelector: '[data-tutorial="insert-extended-btn"]',
  title: 'Insert Extended',
  content:
    'Use Extended when the description is longer and the video should pause.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
  autoScroll: false,
}

// Step 13
const clipFormIntroStep: TutorialStep = {
  id: 'clip-form-intro',
  targetSelector: '[data-tutorial="clip-form-area"]',
  title: 'Insert Audio Clip',
  content: 'Fill out this form to save your description to the timeline.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: CLIP_FORM_ONLY,
}

// Step 14
const titleInputStep: TutorialStep = {
  id: 'title-input',
  targetSelector: '[data-tutorial="title-input"]',
  title: 'Add a Title',
  content: 'Give your audio clip a short, descriptive title.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

// Step 15
const typeDropdownStep: TutorialStep = {
  id: 'type-dropdown',
  targetSelector: '[data-tutorial="type-dropdown"]',
  title: 'Choose Type',
  content:
    "Select 'Visual' to describe on-screen action, or 'Text on Screen' to read visible text.",
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

// Step 16
const startTimeStep: TutorialStep = {
  id: 'start-time',
  targetSelector: '[data-tutorial="start-time"]',
  title: 'Start Time',
  content:
    'Sets when your clip begins. It auto-fills from your current playback position.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

// Step 17
const descriptionMethodStep: TutorialStep = {
  id: 'description-method',
  targetSelector: '[data-tutorial="description-method"]',
  title: 'Description Method',
  content:
    'Choose Text Description to use an AI voice, or Audio Recording to use your own.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

// Step 18
const textInputAreaStep: TutorialStep = {
  id: 'text-input-area',
  targetSelector: '[data-tutorial="text-input-area"]',
  title: 'Write Your Description',
  content: 'Type clear, concise descriptions of visually important content.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

// Step 19
const saveBtnStep: TutorialStep = {
  id: 'save-btn',
  targetSelector: '[data-tutorial="save-btn"]',
  title: 'Save Your Clip',
  content: 'Click Save to add this clip to the timeline.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

// Step 20
const clipControlsStep: TutorialStep = {
  id: 'clip-controls',
  targetSelector: '[data-tutorial="clip-controls"]',
  title: 'Adjust Your Clip',
  content:
    "Here you can edit your clip's content, adjust timing, or switch between Inline and Extended.",
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

// Step 21
const clipAiVoiceStep: TutorialStep = {
  id: 'clip-ai-voice',
  targetSelector: '[data-tutorial="clip-ai-voice"]',
  title: 'Audio Description Content',
  content:
    'Edit the description text, preview the audio, or record your own voice instead.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

// Step 22
const clipTimingControlsStep: TutorialStep = {
  id: 'clip-timing-controls',
  targetSelector: '[data-tutorial="clip-timing-controls"]',
  title: 'Timing Controls',
  content: 'Fine-tune start and end times for precise placement.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: SAVED_CLIP,
}

// Step 23
const nudgeControlsStep: TutorialStep = {
  id: 'nudge-controls',
  targetSelector: '[data-tutorial="nudge-controls"]',
  title: 'Nudge Timing',
  content: 'Move clips earlier or later in 0.25-second steps.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

// Step 24
const collabCheckboxStep: TutorialStep = {
  id: 'collab-checkbox',
  targetSelector: '[data-tutorial="collab-checkbox"]',
  title: 'Collaborative Editing',
  content:
    'Enable this to let other volunteers improve your work, or leave it off to work solo.',
  position: 'top',
  action: 'next',
  page: 'editor',
  spotlightIncludeSelector: '[data-tutorial="collab-checkbox-input"]',
  uiState: SAVED_CLIP,
}

// Step 26
const publishBtnStep: TutorialStep = {
  id: 'publish-btn',
  targetSelector: '[data-tutorial="publish-btn"]',
  title: 'Publish',
  content:
    'Publish when you\u2019re done to share your descriptions with the community.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

// Step 27
const completionStep = centeredStep({
  id: 'completion',
  title: "You're Ready!",
  content: 'Thank you for making videos accessible to everyone!',
  action: 'finish',
  page: 'editor',
  autoScroll: false,
  uiState: SAVED_CLIP,
})

// ─── Step arrays ────────────────────────────────────────────────────

/** Steps 1–5: shared between both tutorial paths (includes the choice step) */
const sharedSteps: TutorialStep[] = [
  welcomeStep,
  wishlistBtnStep,
  freestyleBtnStep,
  requestAiBtnStep,
  chooseModeStep,
]

/** Steps after the fork — freestyle path */
const freestylePostForkSteps: TutorialStep[] = [
  editorIntroStep,
  playPauseBtnStep,
  notesAreaStep,
  audioDuckingStep,
  insertInlineBtnStep,
  insertExtendedBtnStep,
  clipFormIntroStep,
  titleInputStep,
  typeDropdownStep,
  startTimeStep,
  descriptionMethodStep,
  textInputAreaStep,
  saveBtnStep,
  clipControlsStep,
  clipAiVoiceStep,
  clipTimingControlsStep,
  nudgeControlsStep,
  collabCheckboxStep,
  publishBtnStep,
  completionStep,
]

// ─── AI step helpers ────────────────────────────────────────────────

/** Clone a step with a new id and overridden uiState (plus any extra overrides). */
const withUIState = (
  step: TutorialStep,
  uiState: TutorialStep['uiState'],
  overrides?: Partial<TutorialStep>,
): TutorialStep => ({
  ...step,
  uiState,
  ...overrides,
})

/** Clone a step and drop inherited autoScroll so default scrolling behavior is used. */
const withUIStateDefaultScroll = (
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

// AI intro step (new — no freestyle equivalent)
const aiEditorIntroStep = centeredStep({
  id: 'ai-editor-intro',
  title: 'AI Editor Overview',
  content:
    'AI has already generated descriptions.\nReview, edit, and refine them.',
  action: 'next',
  page: 'editor',
  hideOverlay: true,
  autoScroll: false,
  centeredSize: 'intro',
  uiState: SAVED_CLIP,
})

/** Steps after the fork — AI path (reordered with correct uiState) */
const aiPostForkSteps: TutorialStep[] = [
  // AI Step 5 (UI Step 6): AI editor intro
  aiEditorIntroStep,

  // AI Step 6 (UI Step 7): Dialog timeline overview
  withUIState(dialogTimelineStep, SAVED_CLIP, {
    id: 'ai-dialog-timeline',
    content:
      'You can view AI-generated audio descriptions. Drag the red playhead to any point on the timeline to jump and listen.',
  }),

  // AI Steps 7–9 (UI Steps 8-10): Editor controls (saved clip stays visible)
  withUIStateDefaultScroll(playPauseBtnStep, SAVED_CLIP, {
    id: 'ai-play-pause',
  }),
  withUIState(notesAreaStep, SAVED_CLIP, { id: 'ai-notes-area' }),
  withUIState(audioDuckingStep, SAVED_CLIP, { id: 'ai-audio-ducking' }),

  // AI Steps 10–13 (UI Steps 11-14): Review existing clips
  withUIStateDefaultScroll(clipControlsStep, SAVED_CLIP, {
    id: 'ai-clip-controls',
    title: 'Review AI Clip',
    content:
      'You can view AI-generated clips here. Edit the content, timing, or type as needed.',
  }),
  withUIState(clipAiVoiceStep, SAVED_CLIP, {
    id: 'ai-clip-ai-voice',
    title: 'AI Description Content',
    content:
      'Edit the AI-generated text, preview the audio, or record your own voice instead.',
  }),
  withUIState(clipTimingControlsStep, SAVED_CLIP, { id: 'ai-clip-timing' }),
  withUIState(nudgeControlsStep, SAVED_CLIP, { id: 'ai-nudge-controls' }),

  // AI Step 14 (UI Step 15): Inline/Extended type selection on saved clip
  {
    id: 'ai-clip-type',
    targetSelector: '[data-tutorial="ai-clip-type"]',
    title: 'Choose Description Type',
    content:
      'Change the type of the generated description to either Inline or Extended.',
    position: 'bottom',
    action: 'next',
    page: 'editor',
    autoScroll: false,
    uiState: SAVED_CLIP,
  },

  // AI Step 15 (UI Step 16): "Add more" transition
  centeredStep({
    id: 'ai-add-more-intro',
    title: 'Add More Descriptions',
    content:
      'You can add your own descriptions alongside the AI-generated ones.',
    action: 'next',
    page: 'editor',
    hideOverlay: true,
    autoScroll: false,
    uiState: SAVED_CLIP,
  }),

  // AI Steps 16–24 (UI Steps 17-25): Add new clips (insertor + form)
  withUIStateDefaultScroll(insertInlineBtnStep, SAVED_CLIP, {
    id: 'ai-insert-inline',
  }),
  withUIState(insertExtendedBtnStep, SAVED_CLIP, { id: 'ai-insert-extended' }),
  withUIState(clipFormIntroStep, FORM_AND_CLIP, {
    id: 'ai-clip-form-intro',
    title: 'Insert Audio Clip',
    content: 'Fill out this form to save your description to the timeline.',
  }),
  withUIState(titleInputStep, FORM_AND_CLIP, { id: 'ai-title-input' }),
  withUIState(typeDropdownStep, FORM_AND_CLIP, { id: 'ai-type-dropdown' }),
  withUIState(startTimeStep, FORM_AND_CLIP, { id: 'ai-start-time' }),
  withUIState(descriptionMethodStep, FORM_AND_CLIP, { id: 'ai-desc-method' }),
  withUIState(textInputAreaStep, FORM_AND_CLIP, {
    id: 'ai-text-input',
    title: 'Write Your Description',
    content: 'Add your own description or supplement the AI-generated ones.',
  }),
  withUIState(saveBtnStep, FORM_AND_CLIP, { id: 'ai-save-btn' }),

  // AI Steps 25–27 (UI Steps 26-28): Ending
  withUIStateDefaultScroll(collabCheckboxStep, SAVED_CLIP, {
    id: 'ai-collab',
  }),
  withUIState(publishBtnStep, SAVED_CLIP, { id: 'ai-publish' }),
  withUIState(completionStep, SAVED_CLIP, {
    id: 'ai-completion',
    action: 'finish',
  }),
]

/** Full freestyle tutorial */
export const freestyleTutorialSteps: TutorialStep[] = [
  ...sharedSteps,
  ...freestylePostForkSteps,
]

/** Full AI tutorial — reordered: review clips → editor controls → add new → ending */
export const aiTutorialSteps: TutorialStep[] = [
  ...sharedSteps,
  ...aiPostForkSteps,
]

/**
 * Returns the active step array for the given tutorial mode.
 * Before a mode is chosen (null), returns the freestyle steps as default.
 */
export const getActiveSteps = (mode: TutorialMode | null): TutorialStep[] => {
  switch (mode) {
    case 'ai':
      return aiTutorialSteps
    case 'freestyle':
    default:
      return freestyleTutorialSteps
  }
}
