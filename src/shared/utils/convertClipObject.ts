import { Howl } from 'howler'

export interface Clip {
  audioDescriptionAdId: string
  clip_audio?: Howl
  clip_id: string
  clip_title: string
  clip_audio_path: string
  clip_duration: number
  clip_end_time: number
  clip_sequence_number: number
  clip_start_time: number
  createdAt: string
  description_text: string
  description_type: string
  is_recorded: boolean
  playback_type: string
  updatedAt: string
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
    updatedAt: clip.updatedAt,
  }
  return newClip
}

export default convertClipObject
