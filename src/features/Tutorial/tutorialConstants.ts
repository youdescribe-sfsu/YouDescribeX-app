import {
  TUTORIAL_AI_AUDIO_CLIPS,
  TUTORIAL_DIALOG_TIMESTAMPS,
  TUTORIAL_SAMPLE_DESCRIPTION,
  TUTORIAL_VIDEO_METADATA,
  TUTORIAL_VIDEO_THUMBNAIL_URL,
} from './tutorialConfig'

export const TUTORIAL_ROUTE = '/tutorial'
export const TUTORIAL_EXIT_ROUTE = '/home'

export const TUTORIAL_STORAGE_KEY = 'tutorialState'

export const noop = () => undefined

export const DEFAULT_DESCRIPTION_VOLUME = 80
export const DEFAULT_YOUTUBE_VOLUME = 30

export const MOCK_THUMBNAIL_URL = TUTORIAL_VIDEO_THUMBNAIL_URL

export const MOCK_VIDEO_METADATA = TUTORIAL_VIDEO_METADATA

export const MOCK_SAMPLE_DESCRIPTION = TUTORIAL_SAMPLE_DESCRIPTION
export const TIME_FIELD_LABELS = ['HR', 'MIN', 'SEC', 'MS'] as const

export const MOCK_TIMECODES = {
  emptyTimeline: '00:00:00:00',
  filledTimeline: '00:02:25:00',
  clipDuration: '00:00:03:40',
  clipStart: ['00', '00', '03', '92'] as const,
  clipEditStart: ['00', '00', '03', '92'] as const,
  clipEditEnd: ['00', '00', '07', '32'] as const,
} as const

export const INSTANT_SCROLL_RESET: ScrollToOptions = {
  top: 0,
  left: 0,
  behavior: 'auto',
}

const MOCK_AI_TIMELINE_WIDTH = 900
const MOCK_AI_VISIBLE_DURATION_SECONDS = 14.04

const toMockTimelinePx = (seconds: number) =>
  Number(
    (
      (seconds / MOCK_AI_VISIBLE_DURATION_SECONDS) *
      MOCK_AI_TIMELINE_WIDTH
    ).toFixed(2),
  )

/** Mock audio description markers for AI mode. Extended clips render as slim purple markers. */
export const MOCK_AI_CLIP_SEGMENTS: readonly {
  left: number
  width: number
  isPurple?: boolean
}[] = TUTORIAL_AI_AUDIO_CLIPS.map((clip) => ({
  left: toMockTimelinePx(clip.clip_start_time),
  width:
    clip.playback_type === 'extended'
      ? 4
      : Math.max(4, toMockTimelinePx(clip.clip_duration)),
  isPurple: clip.playback_type === 'extended',
}))

export const MOCK_AI_DIALOG_SEGMENTS: readonly {
  left: number
  width: number
}[] = TUTORIAL_DIALOG_TIMESTAMPS.map((dialog) => ({
  left: toMockTimelinePx(dialog.dialog_start_time),
  width: toMockTimelinePx(dialog.dialog_duration),
}))

export const MOCK_AI_CLIP_COUNT = TUTORIAL_AI_AUDIO_CLIPS.length
