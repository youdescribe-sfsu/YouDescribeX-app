import {
  audioDuckingStep,
  clipAiVoiceStep,
  clipControlsStep,
  clipFormIntroStep,
  clipNavButtonsStep,
  clipTimingControlsStep,
  collabCheckboxStep,
  completionStep,
  currentClipNavigatorStep,
  descriptionMethodStep,
  dialogTimelineStep,
  insertExtendedBtnStep,
  insertInlineBtnStep,
  notesAreaStep,
  playPauseBtnStep,
  publishBtnStep,
  saveBtnStep,
  savedClipsListStep,
  startTimeStep,
  textInputAreaStep,
  titleInputStep,
  typeDropdownStep,
  nudgeControlsStep,
} from './tutorialStepDefinitions'
import { getTutorialSelector, TUTORIAL_TARGETS } from './tutorialSelectors'
import {
  centeredStep,
  FORM_AND_CLIP,
  SAVED_CLIP,
  SAVED_CLIP_WITH_LIST,
  withUIState,
  withUIStateDefaultScroll,
  type TutorialStep,
} from './tutorialStepCore'

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

export const aiPostForkSteps: TutorialStep[] = [
  aiEditorIntroStep,

  withUIState(dialogTimelineStep, SAVED_CLIP, {
    id: 'ai-dialog-timeline',
    content:
      'You can view AI-generated audio descriptions. Drag the red playhead to any point on the timeline to jump and listen.',
  }),

  withUIStateDefaultScroll(playPauseBtnStep, SAVED_CLIP, {
    id: 'ai-play-pause',
  }),
  withUIState(notesAreaStep, SAVED_CLIP, { id: 'ai-notes-area' }),
  withUIState(audioDuckingStep, SAVED_CLIP, { id: 'ai-audio-ducking' }),

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

  {
    id: 'ai-clip-type',
    targetSelector: getTutorialSelector(TUTORIAL_TARGETS.aiClipType),
    title: 'Choose Description Type',
    content:
      'Change the type of the generated description to either Inline or Extended.',
    position: 'bottom',
    action: 'next',
    page: 'editor',
    autoScroll: false,
    uiState: SAVED_CLIP,
  },

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

  withUIState(currentClipNavigatorStep, SAVED_CLIP, {
    id: 'ai-clip-currently-editing',
  }),
  withUIState(savedClipsListStep, SAVED_CLIP_WITH_LIST, {
    id: 'ai-saved-clips-list',
  }),
  withUIState(clipNavButtonsStep, SAVED_CLIP, {
    id: 'ai-clip-nav-buttons',
  }),

  withUIStateDefaultScroll(collabCheckboxStep, SAVED_CLIP, {
    id: 'ai-collab',
  }),
  withUIState(publishBtnStep, SAVED_CLIP, { id: 'ai-publish' }),
  withUIState(completionStep, SAVED_CLIP, {
    id: 'ai-completion',
    action: 'finish',
  }),
]
