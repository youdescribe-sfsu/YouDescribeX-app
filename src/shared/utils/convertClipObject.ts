import { Howl } from "howler";

export interface Clip {
  audioDescriptionAdId: string;
  clipAudio?: Howl;
  clipId: string;
  clipTitle: string;
  clipAudioPath: string;
  clipDuration: number;
  clipEndTime: number;
  clipSequenceNumber: number;
  clipStartTime: number;
  createdAt: string;
  descriptionText: string;
  descriptionType: string;
  isRecorded: boolean;
  playbackType: string;
  updatedAt: string;
}

const convertClipObject = (clip: any) => {
  const newClip: Clip = {
    audioDescriptionAdId: clip.AudioDescriptionAdId,
    clipAudio: clip.clip_audio,
    clipId: clip.clip_id,
    clipTitle: clip.clip_title,
    clipAudioPath: clip.clip_audio_path,
    clipDuration: clip.clip_duration,
    clipEndTime: clip.clip_end_time,
    clipSequenceNumber: clip.clip_sequence_number,
    clipStartTime: clip.clip_start_time,
    createdAt: clip.createdAt,
    descriptionText: clip.description_text,
    descriptionType: clip.description_type,
    isRecorded: clip.is_recorded,
    playbackType: clip.playback_type,
    updatedAt: clip.updatedAt,
  };
  return newClip;
};

export default convertClipObject;
