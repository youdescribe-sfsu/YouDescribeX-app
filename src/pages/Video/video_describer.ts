export interface VideoDescriberRoot {
  _id: string
  audio_descriptions: AudioDescription[]
  category: string
  category_id: number
  custom_tags: any[]
  description: string
  duration: number
  tags: string[]
  title: string
  updated_at: string
  views: number
  youtube_id: string
  youtube_status: string
  created_at: string
  __v: number
}

export interface AudioDescription {
  _id: string
  admin_review: boolean
  audio_clips: AudioClip[]
  created_at: string
  language: string
  legacy_notes: string
  overall_rating_votes_average: number
  overall_rating_votes_counter: number
  overall_rating_votes_sum: number
  status: string
  updated_at: string
  user: User
  video: string
  views: number
  collaborative_editing: boolean
  __v: number
  feedbacks: Feedbacks
  contributions: Map<string, number>
  displayContributions?: { [key: string]: number }
  prev_audio_description: string
  depth: number
}

export interface AudioClip {
  _id: string
  audio_description: string
  created_at: string
  description_type: string
  description_text: string
  duration: number
  end_time: number
  file_mime_type: string
  file_name: string
  file_path: string
  file_size_bytes: number
  is_recorded: boolean
  label: string
  playback_type: string
  start_time: number
  transcript: any[]
  updated_at: string
  user: string
  video: string
  __v: number
  url: string
}

export interface User {
  _id: string
  email: string
  name: string
  given_name?: string
  picture: string
  locale?: string
  google_user_id: string
  last_login: string
  token: string
  __v: number
  updated_at: string
  admin?: number
  useYdx?: boolean
  user_type: string
  admin_level?: number
  opt_in?: boolean
}

export interface Feedbacks {
  '0': number
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
  '6': number
  '7': number
  '8': number
  '9': number
  '10': number
  '11': number
  'Needs better diction': number
}
