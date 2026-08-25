const href = window.location.href
const apiVersion = 'v1'

// DON'T CHANGE THESE URLS!

const apiUrl = `${process.env.REACT_APP_YDX_BACKEND_URL}/api`
// let apiUrl = `http://localhost:8080/${apiVersion}`;
// let apiUrl = `https://test-api.youdescribe.org/${apiVersion}`;

const audioClipsUploadsPath = (clip_path: string) =>
  `${process.env.REACT_APP_REDIRECT_URL}/api/static${clip_path}`
// const audioClipsUploadsPath = `${process.env.REACT_APP_YDX_BACKEND_URL}/audio-descriptions-files`
// let audioClipsUploadsPath =
//   "https://api.youdescribe.org/audio-descriptions-files";
//let apiUrl = `http://localhost:8080/${apiVersion}`;
//let audioClipsUploadsPath = "https://api.youdescribe.org/audio-descriptions-files";
const youTubeApiUrl =
  process.env.REACT_APP_YOUTUBE_API_URL ||
  'https://www.googleapis.com/youtube/v3'

// YouDescribe APIKey
const youTubeApiKey = process.env.REACT_APP_YOUTUBE_API_KEY
//   'AIzaSyBQFD0fJoEO2l8g0OIrqbtjj2qXXVNO__U'

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

// xiao 0824:
// YouDescribeX Chrome extension listings.
// Picked at runtime from the hostname; anything unrecognised falls back to prod.
const chromeWebStoreUrlProd =
  'https://chromewebstore.google.com/detail/youdescribex-wishlist/nejfnjbfpjcbmpkeoffgpmmmjcgnemid'
const chromeWebStoreUrlDev =
  'https://chromewebstore.google.com/detail/youdescribex-wishlist-dev/mndhjjobpcbmghiopgaffclnlbpjjhkn'

const chromeWebStoreUrl =
  process.env.REACT_APP_ENVIRONMENT === 'production'
    ? chromeWebStoreUrlProd
    : chromeWebStoreUrlDev


const startDateTimeStamp = 1352707200000

export {
  apiUrl,
  audioClipsUploadsPath,
  audioDescriptionFeedbacks,
  chromeWebStoreUrl, // YouDescribeX Chrome extension URL
  googleClientId,
  href,
  nudgeIncrementDecrementValue,
  seekToPositionDelayFix,
  startDateTimeStamp,
  youTubeApiUrl,
  youTubeApiKey,
}
