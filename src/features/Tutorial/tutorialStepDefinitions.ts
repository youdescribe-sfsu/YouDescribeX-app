import { getTutorialSelector, TUTORIAL_TARGETS } from './tutorialSelectors'
import {
  centeredStep,
  CLIP_FORM_ONLY,
  SAVED_CLIP,
  SAVED_CLIP_WITH_LIST,
  type TutorialStep,
} from './tutorialStepCore'

export const welcomeStep = centeredStep({
  id: 'welcome',
  title: 'Welcome to YouDescribe!',
  content:
    "Let's learn how to add audio descriptions for\nblind and low vision viewers.",
  action: 'next',
  page: 'video',
  centeredSize: 'intro',
})

export const wishlistBtnStep: TutorialStep = {
  id: 'wishlist-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.wishlistBtn),
  title: 'Add to Wishlist',
  content: 'Add videos here to describe them later.',
  position: 'left',
  action: 'next',
  page: 'video',
}

export const freestyleBtnStep: TutorialStep = {
  id: 'freestyle-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.freestyleBtn),
  title: 'Add Freestyle Description',
  content: 'Write descriptions from scratch with your own words.',
  position: 'left',
  action: 'next',
  page: 'video',
}

export const requestAiBtnStep: TutorialStep = {
  id: 'request-ai-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.requestAiBtn),
  title: 'Request AI Descriptions',
  content: 'Let AI generate descriptions for you, then edit and refine them.',
  position: 'left',
  action: 'next',
  page: 'video',
}

export const chooseModeStep = centeredStep({
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

export const editorIntroStep = centeredStep({
  id: 'editor-intro',
  title: 'Freestyle Editor Overview',
  content:
    'Here you can watch the video, take notes, and add precise audio descriptions.',
  action: 'next',
  page: 'editor',
  hideOverlay: true,
  autoScroll: false,
})

export const dialogTimelineStep: TutorialStep = {
  id: 'dialog-timeline',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.dialogTimeline),
  title: 'Dialog Timeline',
  content:
    'Each yellow or purple block is an AI-generated description. The red playhead shows your current position in the video.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  spotlightIncludeSelector: getTutorialSelector(
    TUTORIAL_TARGETS.dialogTimelineTime,
  ),
}

export const playPauseBtnStep: TutorialStep = {
  id: 'play-pause-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.playPauseBtn),
  title: 'Play and Pause',
  content:
    'Play and pause the video here. We recommend watching it fully before adding descriptions.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
}

export const notesAreaStep: TutorialStep = {
  id: 'notes-area',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.notesArea),
  title: 'Take Notes',
  content:
    'Use memos to auto-save scene timestamps and draft descriptions while watching.',
  position: 'left',
  action: 'next',
  page: 'editor',
}

export const audioDuckingStep: TutorialStep = {
  id: 'audio-ducking',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.audioDucking),
  title: 'Audio Ducking',
  content:
    'Balance Description Volume and Video Volume for clear narration and original audio.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
}

export const insertInlineBtnStep: TutorialStep = {
  id: 'insert-inline-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.insertInlineBtn),
  title: 'Insert Inline',
  content:
    'Use Inline when the video should keep playing during the description.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
  autoScroll: false,
}

export const insertExtendedBtnStep: TutorialStep = {
  id: 'insert-extended-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.insertExtendedBtn),
  title: 'Insert Extended',
  content:
    'Use Extended when the description is longer and the video should pause.',
  position: 'bottom',
  action: 'next',
  page: 'editor',
  autoScroll: false,
}

export const clipFormIntroStep: TutorialStep = {
  id: 'clip-form-intro',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.clipFormArea),
  title: 'Insert Audio Clip',
  content: 'Fill out this form to save your description to the timeline.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: CLIP_FORM_ONLY,
}

export const titleInputStep: TutorialStep = {
  id: 'title-input',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.titleInput),
  title: 'Add a Title',
  content: 'Give your audio clip a short, descriptive title.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

export const typeDropdownStep: TutorialStep = {
  id: 'type-dropdown',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.typeDropdown),
  title: 'Choose Type',
  content:
    "Select 'Visual' to describe on-screen action, or 'Text on Screen' to read visible text.",
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

export const startTimeStep: TutorialStep = {
  id: 'start-time',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.startTime),
  title: 'Start Time',
  content:
    'Sets when your clip begins. It auto-fills from your current playhead position.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

export const descriptionMethodStep: TutorialStep = {
  id: 'description-method',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.descriptionMethod),
  title: 'Description Method',
  content:
    'Choose Text Description to use an AI voice, or Audio Recording to use your own.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

export const textInputAreaStep: TutorialStep = {
  id: 'text-input-area',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.textInputArea),
  title: 'Write Your Description',
  content: 'Type clear, concise descriptions of visually important content.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

export const saveBtnStep: TutorialStep = {
  id: 'save-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.saveBtn),
  title: 'Save Your Clip',
  content: 'Click Save to add this clip to the timeline.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: CLIP_FORM_ONLY,
}

export const clipControlsStep: TutorialStep = {
  id: 'clip-controls',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.clipControls),
  title: 'Adjust Your Clip',
  content:
    "Here you can edit your clip's content, adjust timing, or switch between Inline and Extended.",
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

export const clipAiVoiceStep: TutorialStep = {
  id: 'clip-ai-voice',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.clipAiVoice),
  title: 'Audio Description Content',
  content:
    'Edit the description text, preview the audio, or record your own voice instead.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

export const clipTimingControlsStep: TutorialStep = {
  id: 'clip-timing-controls',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.clipTimingControls),
  title: 'Timing Controls',
  content: 'Fine-tune start and end times for precise placement.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: SAVED_CLIP,
}

export const nudgeControlsStep: TutorialStep = {
  id: 'nudge-controls',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.nudgeControls),
  title: 'Nudge Timing',
  content: 'Move clips earlier or later in 0.25-second steps.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

export const currentClipNavigatorStep: TutorialStep = {
  id: 'clip-currently-editing',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.clipCurrentlyEditing),
  title: 'View Saved Clips',
  content: "Click button to view the list of clips you've saved.",
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: SAVED_CLIP,
}

export const savedClipsListStep: TutorialStep = {
  id: 'saved-clips-list',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.savedClipsList),
  title: 'Saved Clips List',
  content:
    'Saved clips appear here as compact summaries. Select one to open it in the editor.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: SAVED_CLIP_WITH_LIST,
}

export const clipNavButtonsStep: TutorialStep = {
  id: 'clip-nav-buttons',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.clipNavButtons),
  title: 'Move Between Clips',
  content: 'Click Previous and Next to move between saved clips.',
  position: 'top',
  action: 'next',
  page: 'editor',
  autoScroll: false,
  uiState: SAVED_CLIP,
}

export const collabCheckboxStep: TutorialStep = {
  id: 'collab-checkbox',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.collabCheckbox),
  title: 'Collaborative Editing',
  content:
    'Enable this to let other volunteers improve your work, or leave it off to work solo.',
  position: 'top',
  action: 'next',
  page: 'editor',
  spotlightIncludeSelector: getTutorialSelector(
    TUTORIAL_TARGETS.collabCheckboxInput,
  ),
  uiState: SAVED_CLIP,
}

export const publishBtnStep: TutorialStep = {
  id: 'publish-btn',
  targetSelector: getTutorialSelector(TUTORIAL_TARGETS.publishBtn),
  title: 'Publish',
  content:
    'Publish when you\u2019re done to share your descriptions with the community.',
  position: 'top',
  action: 'next',
  page: 'editor',
  uiState: SAVED_CLIP,
}

export const completionStep = centeredStep({
  id: 'completion',
  title: "You're Ready",
  content: 'Thank you for making videos accessible to everyone!',
  action: 'finish',
  page: 'editor',
  autoScroll: false,
  uiState: SAVED_CLIP,
})

export const sharedSteps: TutorialStep[] = [
  welcomeStep,
  wishlistBtnStep,
  freestyleBtnStep,
  requestAiBtnStep,
  chooseModeStep,
]

export const freestylePostForkSteps: TutorialStep[] = [
  editorIntroStep,
  playPauseBtnStep,
  notesAreaStep,
  audioDuckingStep,
  insertInlineBtnStep,
  insertExtendedBtnStep,
  { ...clipFormIntroStep, waitForTargetSettle: true },
  titleInputStep,
  typeDropdownStep,
  startTimeStep,
  descriptionMethodStep,
  textInputAreaStep,
  saveBtnStep,
  { ...clipControlsStep, waitForTargetSettle: true },
  clipAiVoiceStep,
  clipTimingControlsStep,
  nudgeControlsStep,
  currentClipNavigatorStep,
  { ...savedClipsListStep, waitForTargetSettle: true },
  clipNavButtonsStep,
  collabCheckboxStep,
  publishBtnStep,
  completionStep,
]
