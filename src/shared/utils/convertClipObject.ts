import { Howl } from 'howler'

export interface Clip {
  audioDescriptionAdId: string
  clip_audio?: Howl
  playback_type: string
  clip_id: string
  clip_audio_path: string
  clip_duration: number
  clip_title?: string
  clip_start_time: number
  clip_end_time: number
  clip_sequence_number: number
  clip_speed: number
  createdAt: string
  description_text?: string
  description_type?: string
  is_recorded?: boolean
  updatedAt?: string
}

const convertClipObject = (clip: any) => {
  const newClip: Clip = {
    audioDescriptionAdId: clip.AudioDescriptionAdId,
    clip_audio: clip.clip_audio,
    clip_id: clip.clip_id,
    clip_title: clip.clip_title,
    clip_audio_path: clip.clip_audio_path,
    clip_duration: clip.clip_duration,
    clip_end_time: clip.clip_end_time,
    clip_sequence_number: clip.clip_sequence_number,
    clip_start_time: clip.clip_start_time,
    createdAt: clip.createdAt,
    description_text: clip.description_text,
    description_type: clip.description_type,
    is_recorded: clip.is_recorded,
    playback_type: clip.playback_type,
    clip_speed: clip.clip_speed ?? 1,
    updatedAt: clip.updatedAt,
  }
  return newClip
}

export const convertClassicClipObject = (clip: any) => {
  const newClip: Clip = {
    audioDescriptionAdId: clip.audio_description,
    clip_audio: clip.clip_audio,
    clip_id: clip._id,
    playback_type: clip.playback_type,
    clip_audio_path: clip.url,
    clip_duration: clip.duration,
    createdAt: clip.created_at,
    clip_start_time: clip.start_time,
    clip_end_time: clip.end_time,
    clip_sequence_number: clip.clip_sequence_number ?? 0,
    clip_speed: clip.speed ?? 1,
    description_text: clip.description_text,
    description_type: clip.description_type,
    is_recorded: clip.is_recorded,
  }
  return newClip
}

/*
{
    "_id": "6404fe0719683a00242e8b7d",
    "video": "6404fe0619683a00242e8b7c",
    "audio_description": "6404fe0619683a00242e8b7b",
    "user": "6404f6f219683a00242e8b6c",
    "label": "",
    "playback_type": "inline",
    "start_time": 0.7440749542236328,
    "end_time": 55.01607495422363,
    "duration": 54.272,
    "file_name": "4kQzzhwmY1M_6404fe0719683a00242e8b7d.wav",
    "file_size_bytes": 10420268,
    "file_mime_type": "audio/wav",
    "file_path": "/current/4kQzzhwmY1M",
    "created_at": 20230305203935,
    "transcript": [],
    "__v": 0,
    "url": "https://api.youdescribe.org/audio-descriptions-files/current/4kQzzhwmY1M/4kQzzhwmY1M_6404fe0719683a00242e8b7d.wav"
}
*/

export default convertClipObject
