import type { Clip } from '@/shared/utils/convertClipObject'

export const TUTORIAL_ROUTE = '/tutorial'
export const TUTORIAL_EXIT_ROUTE = '/home'

export const INSTANT_SCROLL_RESET: ScrollToOptions = {
  top: 0,
  left: 0,
  behavior: 'auto',
}

export const TUTORIAL_VIDEO_YOUTUBE_ID = '5AwtptT8X8k'

export const isTutorialVideoId = (youtubeId?: string | null) =>
  youtubeId === TUTORIAL_VIDEO_YOUTUBE_ID

export const TUTORIAL_VIDEO_METADATA = {
  title: 'ZOOTOPIA 2 - All Trailers From The Movie (2025)',
  author: 'YouDescribe',
  views: '1.2M views',
  publishedAt: 'Feb 2025',
  likes: '45K',
} as const

export const TUTORIAL_VIDEO_DURATION_SECONDS = 145
export const TUTORIAL_AUDIO_DESCRIPTION_ID = 'tutorial-audio-description'
export const TUTORIAL_VIDEO_DATABASE_ID = 'tutorial-video'

const TUTORIAL_SAMPLE_DESCRIPTION =
  'Judy and Nick race through the streets, chasing after a fleeing vehicle.'

const TUTORIAL_CREATED_AT = '2026-01-01T00:00:00.000Z'
const TUTORIAL_READY_AUDIO_PATH =
  'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA=='

const createTutorialClip = (
  clipId: string,
  sequenceNumber: number,
  startTime: number,
  duration: number,
  descriptionText: string,
  playbackType: 'inline' | 'extended' = 'inline',
  clipTitle = `Audio Clip ${sequenceNumber}`,
): Clip => ({
  audioDescriptionAdId: TUTORIAL_AUDIO_DESCRIPTION_ID,
  playback_type: playbackType,
  clip_id: clipId,
  clip_audio_path: TUTORIAL_READY_AUDIO_PATH,
  clip_duration: duration,
  clip_title: clipTitle,
  clip_start_time: startTime,
  clip_end_time: Number((startTime + duration).toFixed(2)),
  clip_sequence_number: sequenceNumber,
  createdAt: TUTORIAL_CREATED_AT,
  description_text: descriptionText,
  description_type: 'Visual',
  is_recorded: false,
  updatedAt: TUTORIAL_CREATED_AT,
})

export const TUTORIAL_DEMO_AUDIO_CLIP = createTutorialClip(
  'tutorial-demo-clip',
  1,
  3.92,
  3.4,
  TUTORIAL_SAMPLE_DESCRIPTION,
  'inline',
  'Car Chase',
)

const createTutorialClipFromRange = (
  clipId: string,
  sequenceNumber: number,
  startTime: number,
  endTime: number,
  descriptionText: string,
  playbackType: 'inline' | 'extended' = 'inline',
  clipTitle = `${
    playbackType === 'extended' ? 'Extended' : 'Inline'
  } Clip ${sequenceNumber}`,
): Clip =>
  createTutorialClip(
    clipId,
    sequenceNumber,
    startTime,
    Number((endTime - startTime).toFixed(2)),
    descriptionText,
    playbackType,
    clipTitle,
  )

export const TUTORIAL_AI_AUDIO_CLIPS: Clip[] = [
  createTutorialClipFromRange(
    'tutorial-ai-clip-1',
    1,
    0,
    7,
    'Animal police officers of the Zootopia Police Department are listening to a briefing by Chief Bogo, the water buffalo chief.',
    'extended',
    'Police Briefing',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-2',
    2,
    3.6,
    9.15,
    'Judy, the rabbit officer, drives a pink car with Nick beside her, speeding down the road in pursuit of a white truck.',
    'extended',
    'Car Chase',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-3',
    3,
    5.67,
    13.87,
    "Judy and Nick's car crashes into a cart loaded with wool, sending fleece flying through a sheep salon. The wool covers a sheep customer mid-haircut, completely changing their style.",
    'extended',
    'Salon Crash',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-4',
    4,
    9.32,
    14.04,
    "The scene cuts back and forth between Chief Bogo's briefing and Judy and Nick carrying out the mission.",
    'extended',
    'Transition',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-5',
    5,
    19.2,
    24.8,
    'Smuggler Antony the Giant Anteater gets into his white truck and flees from Nick and Judy.',
    'inline',
    'Truck fleeing',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-6',
    6,
    31.4,
    37.6,
    'content placeholder',
    'inline',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-7',
    7,
    48.8,
    50.6,
    'content placeholder',
    'extended',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-8',
    8,
    59.4,
    67.2,
    'content placeholder',
    'inline',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-9',
    9,
    82.6,
    89.4,
    'content placeholder',
    'inline',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-10',
    10,
    108.2,
    110.1,
    'content placeholder',
    'extended',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-11',
    11,
    126.8,
    132.2,
    'content placeholder',
    'inline',
  ),
]

export const TUTORIAL_DIALOG_TIMESTAMPS = [
  { dialog_seq_no: 1, dialog_start_time: 1.0, dialog_duration: 2.0 },
  { dialog_seq_no: 2, dialog_start_time: 4.0, dialog_duration: 1.2 },
  { dialog_seq_no: 3, dialog_start_time: 6.2, dialog_duration: 2.5 },
  { dialog_seq_no: 4, dialog_start_time: 10.1, dialog_duration: 3.7 },
  { dialog_seq_no: 5, dialog_start_time: 14.8, dialog_duration: 3.4 },
  { dialog_seq_no: 6, dialog_start_time: 25.8, dialog_duration: 4.2 },
  { dialog_seq_no: 7, dialog_start_time: 39.0, dialog_duration: 7.2 },
  { dialog_seq_no: 8, dialog_start_time: 51.5, dialog_duration: 6.5 },
  { dialog_seq_no: 9, dialog_start_time: 68.5, dialog_duration: 7.7 },
  { dialog_seq_no: 10, dialog_start_time: 77.2, dialog_duration: 4.0 },
  { dialog_seq_no: 11, dialog_start_time: 90.5, dialog_duration: 9.0 },
  { dialog_seq_no: 12, dialog_start_time: 100.5, dialog_duration: 6.1 },
  { dialog_seq_no: 13, dialog_start_time: 111.5, dialog_duration: 8.0 },
  { dialog_seq_no: 14, dialog_start_time: 120.5, dialog_duration: 5.0 },
  { dialog_seq_no: 15, dialog_start_time: 133.2, dialog_duration: 8.8 },
] as const
