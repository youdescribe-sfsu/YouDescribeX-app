import type { Clip } from '@/shared/utils/convertClipObject'

export const TUTORIAL_VIDEO_YOUTUBE_ID = '5AwtptT8X8k'
export const TUTORIAL_VIDEO_PAGE_PATH = `/video/${TUTORIAL_VIDEO_YOUTUBE_ID}`
export const TUTORIAL_VIDEO_THUMBNAIL_URL = `https://img.youtube.com/vi/${TUTORIAL_VIDEO_YOUTUBE_ID}/maxresdefault.jpg`

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

export const TUTORIAL_SAMPLE_DESCRIPTION =
  'Judy and Nick race through the streets, chasing after a fleeing vehicle.'

const TUTORIAL_CREATED_AT = '2026-01-01T00:00:00.000Z'

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
  clip_audio_path: '',
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
)

const createTutorialClipFromRange = (
  clipId: string,
  sequenceNumber: number,
  startTime: number,
  endTime: number,
  descriptionText: string,
  playbackType: 'inline' | 'extended' = 'inline',
): Clip =>
  createTutorialClip(
    clipId,
    sequenceNumber,
    startTime,
    Number((endTime - startTime).toFixed(2)),
    descriptionText,
    playbackType,
    `Extended Clip ${sequenceNumber}`,
  )

export const TUTORIAL_AI_AUDIO_CLIPS: Clip[] = [
  createTutorialClipFromRange(
    'tutorial-ai-clip-1',
    1,
    0,
    7,
    'Animal police officers of the Zootopia Police Department are listening to a briefing by Chief Bogo, the water buffalo chief.',
    'extended',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-2',
    2,
    3.6,
    9.15,
    'Judy, the rabbit officer, drives a pink car with Nick beside her, speeding down the road in pursuit of a white truck.',
    'extended',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-3',
    3,
    5.67,
    13.87,
    "Judy and Nick's car crashes into a cart loaded with wool, sending fleece flying through a sheep salon. The wool covers a sheep customer mid-haircut, completely changing their style.",
    'extended',
  ),
  createTutorialClipFromRange(
    'tutorial-ai-clip-4',
    4,
    9.32,
    14.04,
    "The scene cuts back and forth between Chief Bogo's briefing and Judy and Nick carrying out the mission.",
    'extended',
  ),
]

export const TUTORIAL_DIALOG_TIMESTAMPS = [
  { dialog_seq_no: 1, dialog_start_time: 0.08, dialog_duration: 3.44 },
  { dialog_seq_no: 2, dialog_start_time: 3.68, dialog_duration: 1.91 },
  { dialog_seq_no: 3, dialog_start_time: 5.75, dialog_duration: 3.49 },
  { dialog_seq_no: 4, dialog_start_time: 9.4, dialog_duration: 4.64 },
] as const
