const href = window.location.href
const apiVersion = 'v1'

// DON'T CHANGE THESE URLS!

const apiUrl = `${process.env.REACT_APP_YDX_BACKEND_URL}`
// let apiUrl = `http://localhost:8080/${apiVersion}`;
// let apiUrl = `https://test-api.youdescribe.org/${apiVersion}`;

const audioClipsUploadsPath = (clip_path: string) =>
  `${process.env.REACT_APP_REDIRECT_URL}/api/static${clip_path}`
// const audioClipsUploadsPath = `${process.env.REACT_APP_YDX_BACKEND_URL}/audio-descriptions-files`
// let audioClipsUploadsPath =
//   "https://api.youdescribe.org/audio-descriptions-files";
//let apiUrl = `http://localhost:8080/${apiVersion}`;
//let audioClipsUploadsPath = "https://api.youdescribe.org/audio-descriptions-files";
const youTubeApiUrl = process.env.REACT_APP_YOUTUBE_API_URL

// YouDescribe APIKey
const youTubeApiKey = process.env.REACT_APP_YOUTUBE_API_KEY

// YouDescribe Google Client Id
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID

// Video player setup.
const seekToPositionDelayFix = 1 // Seconds.

// Nudge increment/decrement value.
const nudgeIncrementDecrementValue = 0.15 // Seconds.

// User feedbacks data source.
const audioDescriptionFeedbacks: { [key: number]: string } = {
  1: 'Needs better audio quality',
  2: 'Needs better diction',
  3: 'Needs more inline descriptions',
  4: 'Needs more extended descriptions',
  5: 'Do not step on the dialogue',
  6: 'Needs less description',
  7: 'Needs more description',
  8: 'Description does not match video tone',
  9: 'Description has innappropriate content',
  10: 'Description given before action',
  11: 'Needs to read all onscreen text',
}

const startDateTimeStamp = 1352707200000

export {
  apiUrl,
  audioClipsUploadsPath,
  audioDescriptionFeedbacks,
  googleClientId,
  href,
  nudgeIncrementDecrementValue,
  seekToPositionDelayFix,
  startDateTimeStamp,
  youTubeApiKey,
  youTubeApiUrl,
}
