export const TUTORIAL_TARGETS = {
  wishlistBtn: 'wishlist-btn',
  freestyleBtn: 'freestyle-btn',
  requestAiBtn: 'request-ai-btn',
  dialogTimeline: 'dialog-timeline',
  dialogTimelineTime: 'dialog-timeline-time',
  playPauseBtn: 'play-pause-btn',
  notesArea: 'notes-area',
  audioDucking: 'audio-ducking',
  insertInlineBtn: 'insert-inline-btn',
  insertExtendedBtn: 'insert-extended-btn',
  clipFormArea: 'clip-form-area',
  titleInput: 'title-input',
  typeDropdown: 'type-dropdown',
  startTime: 'start-time',
  descriptionMethod: 'description-method',
  textInputArea: 'text-input-area',
  saveBtn: 'save-btn',
  clipControls: 'clip-controls',
  clipAiVoice: 'clip-ai-voice',
  clipTimingControls: 'clip-timing-controls',
  nudgeControls: 'nudge-controls',
  clipCurrentlyEditing: 'clip-currently-editing',
  savedClipsList: 'saved-clips-list',
  clipNavButtons: 'clip-nav-buttons',
  collabCheckbox: 'collab-checkbox',
  collabCheckboxInput: 'collab-checkbox-input',
  publishBtn: 'publish-btn',
  aiClipType: 'ai-clip-type',
} as const

export type TutorialTarget =
  (typeof TUTORIAL_TARGETS)[keyof typeof TUTORIAL_TARGETS]

export const getTutorialSelector = (target: TutorialTarget) =>
  `[data-tutorial="${target}"]`
