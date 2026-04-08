export const TUTORIAL_ROUTE = '/tutorial'
export const TUTORIAL_EXIT_ROUTE = '/home'

export const TUTORIAL_STORAGE_KEY = 'tutorialState'

export const noop = () => undefined

export const DEFAULT_DESCRIPTION_VOLUME = 80
export const DEFAULT_YOUTUBE_VOLUME = 30

export const MOCK_THUMBNAIL_URL =
  'https://img.youtube.com/vi/5AwtptT8X8k/maxresdefault.jpg'

export const MOCK_VIDEO_METADATA = {
  title: 'ZOOTOPIA 2 - All Trailers From The Movie (2025)',
  author: 'YouDescribe',
  views: '1.2M views',
  publishedAt: 'Feb 2025',
  likes: '45K',
} as const

export const MOCK_SAMPLE_DESCRIPTION =
  'Judy and Nick race through the streets, chasing after a fleeing vehicle.'
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

/** Mock timeline segments for AI mode (8 clips: 1 purple slim at start + 7 yellow even) */
export const MOCK_AI_CLIP_SEGMENTS: readonly {
  left: number
  width: number
  isPurple?: boolean
}[] = [
  { left: 45, width: 4, isPurple: true }, // The first clip
  { left: 150, width: 60 },
  { left: 260, width: 60 },
  { left: 370, width: 60 },
  { left: 480, width: 60 },
  { left: 590, width: 60 },
  { left: 700, width: 60 },
  { left: 810, width: 60 },
] as const

export const MOCK_AI_CLIP_COUNT = MOCK_AI_CLIP_SEGMENTS.length
