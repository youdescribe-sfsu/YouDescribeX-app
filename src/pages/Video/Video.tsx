import { translate, userDataStore } from '@/App'
import ShareBar from '@/features/Video/ShareBar/ShareBar'
import Button from '@/shared/components/Button/Button'
import Spinner from '@/shared/components/Spinner/Spinner'
import {
  apiUrl,
  audioClipsUploadsPath,
  audioDescriptionFeedbacks,
} from '@/shared/config'
import ourFetch from '@/shared/utils/ourFetch'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Id, toast } from 'react-toastify'
import YouTube from 'react-youtube'
import { Options, YouTubePlayer } from 'youtube-player/dist/types'
import './video.scss'
import { Howl } from 'howler'
import {
  Clip,
  convertClassicClipObject,
} from '@/shared/utils/convertClipObject'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import VideoPlayerControls from '@/shared/components/VideoPlayerControls/VideoPlayerControls'
import YTInfoCard from '@/features/Video/YTInfoCard/YTInfoCard'
import { convertLikesToCardFormat } from '@/shared/utils/convertLikesToCardFormat'
import { convertISO8601ToDate } from '@/shared/utils/convertISO8601ToDate'
import DescriberCard from '@/features/Video/DescriberCard/DescriberCard'
import RatingPopup from '@/features/Video/RatingPopup/RatingPopup'
import FeedbackPopup from '@/features/Video/FeedbackPopup/FeedbackPopup'
import RatingsInfoCard from '@/features/Video/RatingsInfoCard/RatingsInfoCard'
import { ProgressBar } from 'react-bootstrap'
import axios from 'axios'
import { Feedbacks, User, VideoDescriberRoot } from './video_describer'
import LanguageSelector from './LanguageSelector'
import YouTubeService from '@/shared/utils/YouTubeService'

interface IADUserId {
  [key: string]: {
    overall_rating_votes_counter: number
    overall_rating_average: number
    overall_rating_votes_sum: number
    user: User
    feedbacks: Feedbacks
    picture: string
    name: string
    collaborative_edit: boolean
    contributions: Map<string, number>
    displayContributions?: { [key: string]: number }
    prev_audio_description: string
    depth: number
  }
}

interface ApiError {
  response?: {
    status: number
    data: any
  }
  request?: any
  message?: string
}

const Video = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedADId, setSelectedADId] = useState<string>('')

  const [describerCards, setDescriberCards] = useState<ReactNode[]>([])
  const [descriptionsActive, setDescriptionsActive] = useState(true)
  const [rating, setRating] = useState<number>(0)
  // const codes = iso6391.getAllCodes()

  const languages = [
    { code: 'en-US', name: 'English (United States)' },
    // { code: 'en-GB', name: 'English (United Kingdom)' },
    // { code: 'zh-CN', name: 'Chinese (Simplified, China)' },
    // { code: 'zh-TW', name: 'Chinese (Traditional, Taiwan)' },
    // { code: 'ko-KR', name: 'Korean (South Korea)' },
    // { code: 'fr-FR', name: 'French (France)' },
    // { code: 'fr-CA', name: 'French (Canada)' },
    // { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
    // { code: 'ar-EG', name: 'Arabic (Egypt)' },
    // { code: 'ru-RU', name: 'Russian (Russia)' },
    // { code: 'de-DE', name: 'German (Germany)' },
    // { code: 'es-ES', name: 'Spanish (Spain)' },
    // { code: 'es-MX', name: 'Spanish (Mexico)' },
  ]

  // Loading Spinner
  const [showSpinner, setShowSpinner] = useState(true)

  // Data from API
  const [audioDescriptionsIds, setAudioDescriptionsIds] = useState<any[]>([])
  const [audioDescriptionsIdsUsers, setAudioDescriptionsIdsUsers] =
    useState<IADUserId | null>(null)
  const [audioDescriptionsIdsAudioClips, setAudioDescriptionsIdsAudioClips] =
    useState<any>({})

  // YouTube Video Info
  const [videoTitle, setVideoTitle] = useState('')
  const [videoAuthor, setVideoAuthor] = useState('')
  const [videoPublishedAt, setVideoPublishedAt] = useState('')
  const [, setVideoDescription] = useState('')
  const [videoViews, setVideoViews] = useState('')
  const [videoLikes, setVideoLikes] = useState('')
  const [videoDurationInSeconds, setVideoDurationInSeconds] = useState(0)
  const [playedClips, setPlayedClips] = useState<Set<string>>(new Set())
  const [sortedAudioClips, setSortedAudioClips] = useState<Clip[]>([])
  const [lastProcessedIndex, setLastProcessedIndex] = useState(-1)

  // Balancer value for volume controls
  const [descriptionVolume, setDescriptionVolume] = useState(
    parseInt(localStorage.getItem('descriptionVolume') || '50'),
  )
  const [youTubeVolume, setYouTubeVolume] = useState(
    parseInt(localStorage.getItem('youTubeVolume') || '100'),
  )
  const descriptionVolumeRef = useRef(descriptionVolume)
  const youTubeVolumeRef = useRef(youTubeVolume)
  const historyTracked = useRef(false)

  //
  // YDX STATE VARIABLES
  //
  const [audioClips, setAudioClips] = useState<Clip[]>([]) // stores list of Audio Clips data for a video from backend db
  const [currentEvent, setCurrentEvent] = useState<YouTubePlayer>() //stores YouTube video's event
  const [currentState, setCurrentState] = useState(-1) // stores YouTube video's PLAYING, CUED, PAUSED, UNSTARTED, BUFFERING, ENDED state values
  const [currentTime, setCurrentTime] = useState(0.0)
  const [timer, setTimer] = useState<NodeJS.Timer>() // stores TBD

  // store current extended & inline Audio Clips to pause/play based on the YT video current state
  const [currExtendedAC, setCurrExtendedAC] = useState<Howl>() // see onStateChange() - stop extended ac, when Video is played.
  const [currInlineAC, setCurrInlineAC] = useState<Howl>()
  const [, setCurrentExtACPaused] = useState(false) // Manages the play/pause state of an extended audio clip

  const [recentAudioPlayedTime, setRecentAudioPlayedTime] = useState(0.0) // used to store the time of a recent AD played to stop playing the same Audio twice concurrently - due to an issue found in updateTime() method because it returns the same currentTime twice or more
  const [playedAudioClip, setPlayedAudioClip] = useState('') // store clipId of the audio clip that is already played.
  const [playedClipPath, setPlayedClipPath] = useState('') // store clip_audio_path of the audio clip that is already played.

  const [isActive, setIsActive] = useState(false)
  const [samplingRate] = useState(200)

  const [previousTime, setPreviousTime] = useState(0.0)
  const [clipStack, setClipStack] = useState<Clip[]>([])
  const [clipStackSize, setClipStackSize] = useState<number>(5)
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0)
  const seekDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  const clipStackRef = useRef(clipStack)
  const clipIDRef = useRef(playedAudioClip)

  // Time Refs
  const currentTimeRef = useRef(currentTime)
  const previousTimeRef = useRef(previousTime)

  const currentClipIndexRef = useRef(currentClipIndex)

  const currentEventRef = useRef(currentEvent)
  const currentInlineACRef = useRef(currInlineAC)
  const currentExtendedACRef = useRef(currExtendedAC)

  const [previousYTTime, setPreviousYTTime] = useState(0.0)

  const [requestAiDescription, setRequestAiDescription] = useState<{
    status: string
    requested: boolean
    url?: string
    aiDescriptionId?: string
    preview?: boolean
  }>({
    status: 'notavailable',
    requested: false,
  })

  const [, setButtonLoading] = useState(false)
  const toastId = React.useRef<null | Id>(null)

  const [isAiRequestPending, setIsAiRequestPending] = useState(false)
  const [aiServiceStatus, setAiServiceStatus] = useState<
    'available' | 'unavailable' | 'unknown'
  >('unknown')

  useEffect(() => {
    const checkAiService = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/ai-service-status`,
          { withCredentials: true },
        )
        setAiServiceStatus(
          response.data.available ? 'available' : 'unavailable',
        )
      } catch (error) {
        setAiServiceStatus('unavailable')
      }
    }

    checkAiService()
  }, [])

  useEffect(() => {
    // Pause and unload current inline audio clip
    if (currentInlineACRef.current) {
      currentInlineACRef.current.pause()
      currentInlineACRef.current.unload()
    }
    // Pause and unload current extended audio clip
    if (currentExtendedACRef.current) {
      currentExtendedACRef.current.pause()
      currentExtendedACRef.current.unload()
    }

    // Clear the timer for audio clip updates
    if (timer) {
      clearInterval(timer)
    }

    // Cleanup selected audio description and its related data
    return () => {
      // Make sure to clear any intervals or timeouts as well
      if (currentInlineACRef.current) {
        currentInlineACRef.current.stop()
        setCurrInlineAC(undefined)
      }
      if (currentExtendedACRef.current) {
        currentExtendedACRef.current.stop()
        setCurrExtendedAC(undefined)
      }
      if (timer) {
        clearInterval(timer)
      }
      if (seekDebounceTimer.current) {
        clearTimeout(seekDebounceTimer.current)
      }
    }
  }, [])

  // Update Refs
  useEffect(() => {
    currentInlineACRef.current = currInlineAC
    currentExtendedACRef.current = currExtendedAC
  }, [currInlineAC, currExtendedAC])

  useEffect(() => {
    currentTimeRef.current = currentTime
    previousTimeRef.current = previousTime
  }, [currentTime, previousTime])

  useEffect(() => {
    clipIDRef.current = playedAudioClip
  }, [playedAudioClip])

  useEffect(() => {
    currentClipIndexRef.current = currentClipIndex
  }, [currentClipIndex])

  useEffect(() => {
    clipStackRef.current = clipStack
    // console.log('New Clip Stack', clipStack)
  }, [clipStack])

  useEffect(() => {
    currentEventRef.current = currentEvent
    currentEventRef.current?.setVolume(youTubeVolume)
  }, [currentEvent])

  useEffect(() => {
    if (currentInlineACRef.current?.playing()) {
      currentInlineACRef.current?.volume(descriptionVolume / 100)
    }
    if (currentExtendedACRef.current?.playing()) {
      currentExtendedACRef.current?.volume(descriptionVolume / 100)
    }
    descriptionVolumeRef.current = descriptionVolume
    localStorage.setItem('descriptionVolume', descriptionVolume.toString())
  }, [descriptionVolume])

  useEffect(() => {
    if (currentEventRef) {
      currentEventRef.current?.setVolume(youTubeVolume)
    }
    youTubeVolumeRef.current = youTubeVolume
    localStorage.setItem('youTubeVolume', youTubeVolume.toString())
  }, [youTubeVolume, currentEventRef])

  useEffect(() => {
    return () => {
      // Ensure all Howl instances are unloaded when audioClips change
      audioClips.forEach((clip) => {
        if (clip.clip_audio) {
          clip.clip_audio.unload()
        }
      })
    }
  }, [audioClips])

  useEffect(() => {
    currentEventRef.current = currentEvent
    if (currentEvent) {
      currentEvent.setVolume(youTubeVolume)
    }
  }, [currentEvent, youTubeVolume])

  //
  // END OF YDX STATE VARIABLES
  //

  // YouTube Player Options
  const opts: Options = {
    host: 'https://www.youtube-nocookie.com',
    width: '100%',
    height: '400',
    playerVars: {
      autoplay: 0,
      enablejsapi: 1,
      cc_load_policy: 1,
      controls: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      disablekb: 0,
      rel: 0,
      origin: window.location.origin,
    },
  }

  // Fetch Data on Page Load
  useEffect(() => {
    // console.log(videoId)
    if (videoId) {
      fetchVideoData()
    }
  }, [])

  useEffect(() => {
    if (
      videoId &&
      videoTitle &&
      !historyTracked.current &&
      userDataStore.getState().isSignedIn
    ) {
      saveVideoToHistory(videoId)
      historyTracked.current = true
    }
  }, [videoId, videoTitle])

  useEffect(() => {
    if (userDataStore.getState().isSignedIn) {
      const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/ai-description-status`

      axios
        .post<{
          status: string
          requested: boolean
        }>(
          url,
          {
            youtube_id: videoId,
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        .then((response) => {
          const data = response.data
          setRequestAiDescription(data)
        })
        .catch((error) => {
          if (error.response && error.response.status === 500) {
            // Handle the 500 Internal Server Error here
            const errorMessage =
              'Internal Server Error: Something went wrong on the server side.Please try again later! '
            toast.error(errorMessage)
          }
        })
    }
  }, [userDataStore.getState().isSignedIn])

  const fetchVideoData = () => {
    const url = `${apiUrl}/videos/${videoId}`
    ourFetch(url)
      .then((res) => {
        parseVideoData(res.result)
      })
      .catch((err) => {
        console.log(err)
        // navigate('/not-found')
      })
  }

  const checkPlaybackTypeBeforePlaying = async (clip: Clip): Promise<Clip> => {
    console.log(
      'Checking playback type for clip:',
      clip.clip_id,
      'current type:',
      clip.playback_type,
    )
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/get-playback-type/${clip.clip_id}`,
        { withCredentials: true },
      )

      console.log('API response for playback type:', response.data)

      if (response.data.playback_type !== clip.playback_type) {
        console.info(
          `Playback type changed for clip ${clip.clip_id}: ${clip.playback_type} -> ${response.data.playback_type}`,
        )

        // Update the clip's playback type
        clip.playback_type = response.data.playback_type

        // Also update the clip in the audio clips array to ensure consistency
        const updatedAudioClips = [...audioClips]
        const clipIndex = updatedAudioClips.findIndex(
          (c) => c.clip_id === clip.clip_id,
        )
        if (clipIndex !== -1) {
          updatedAudioClips[clipIndex].playback_type =
            response.data.playback_type
          setAudioClips(updatedAudioClips)
        }
      }

      console.log('Returning clip with playback type:', clip.playback_type)
      return clip
    } catch (error) {
      console.error('Error fetching current playback type:', error)
      return clip
    }
  }

  const parseVideoData = (videoData: VideoDescriberRoot) => {
    const adIds: string[] = []
    const adIdsUsers: IADUserId = {}
    const adIdsAudioClips: { [key: string]: any[] } = {}

    if (
      videoData.audio_descriptions &&
      videoData.audio_descriptions.length > 0
    ) {
      videoData.audio_descriptions.forEach((ad) => {
        if (ad.status !== 'published' && ad.user?.user_type !== 'AI') {
          console.log('Skipping draft audio description:', ad._id)
          return // Skip this iteration
        }

        adIds.push(ad._id)

        // Initialize adIdsUsers[ad._id] as an object if it doesn't exist
        if (!adIdsUsers[ad._id]) {
          adIdsUsers[ad._id] = {
            overall_rating_votes_counter: ad.overall_rating_votes_counter,
            overall_rating_average: ad.overall_rating_votes_average,
            overall_rating_votes_sum: ad.overall_rating_votes_sum,
            feedbacks: ad.feedbacks,
            picture: ad.user.picture,
            user: ad.user,

            name:
              ad.user?.user_type === 'AI'
                ? 'AI Description Draft'
                : ad.user?.name || 'Unknown',
            collaborative_edit: ad.collaborative_editing,
            contributions: ad.contributions,
            displayContributions: ad.displayContributions,
            prev_audio_description: ad.prev_audio_description,
            depth: ad.depth,
          }
        } else {
          adIdsUsers[ad._id].name =
            ad.user?.user_type === 'AI'
              ? 'AI Description Draft'
              : ad.user?.name || 'Unknown'
        }

        // Initialize adIdsAudioClips[adId]
        adIdsAudioClips[ad._id] = []

        if (Array.isArray(ad.audio_clips) && ad.audio_clips.length > 0) {
          ad.audio_clips.forEach((audioClip, clipIndex) => {
            if (!audioClip || typeof audioClip !== 'object') {
              return // Skip this audio clip
            }

            if (!audioClip.file_path || !audioClip.file_name) {
              return // Skip this audio clip
            }

            const filePath = audioClip.file_path.replace(/^\./, '')
            const clipUrl = `${audioClipsUploadsPath(
              `${filePath}/${audioClip.file_name}`,
            )}`

            adIdsAudioClips[ad._id].push({
              ...audioClip,
              url: clipUrl,
            })
          })
        } else {
          console.log(`No audio clips found for adId: ${ad._id}`)
        }
      })

      setAudioDescriptionsIds(adIds)
      setAudioDescriptionsIdsUsers(adIdsUsers)
      setAudioDescriptionsIdsAudioClips(adIdsAudioClips)
      setAudioDescriptionActive(adIdsUsers, adIdsAudioClips)
    } else {
      console.log('No audio descriptions available')
      getYTVideoInfo()
    }
  }

  const getHighestRatedAudioDescription = (adIdsUsers: any) => {
    let maxAvarage = 0
    let selectedId = null
    Object.keys(adIdsUsers).forEach((adId, idx) => {
      const current = adIdsUsers[adId]
      if (idx === 0) {
        selectedId = adId
        if (current.overall_rating_average) {
          maxAvarage = current.overall_rating_average
        }
      } else if (current.overall_rating_average > maxAvarage) {
        selectedId = adId
        maxAvarage = current.overall_rating_average
      }
    })
    return selectedId
  }

  const setAudioDescriptionActive = (adIdsUsers: any, adIdsAudioClips: any) => {
    let selectedAd = searchParams.get('ad')
    if (!selectedAd) {
      selectedAd = getHighestRatedAudioDescription(adIdsUsers)
    }
    // console.log('Selected AD', selectedAd)

    if (!selectedAd || !adIdsAudioClips[selectedAd]) {
      console.log('No valid audio description selected')
      getYTVideoInfo()
      return
    }

    if (
      audioDescriptionsIds?.length &&
      audioDescriptionsIds?.indexOf(selectedAd) === -1
    ) {
      // console.log('Navigating to Not Found')
      // navigate('/not-found')
    }
    setSearchParams(
      (params) => {
        if (selectedAd) params.set('ad', selectedAd)
        return params
      },
      { replace: true },
    )
    setSelectedADId(selectedAd ?? '')
    prepareAudioClips(selectedAd ?? '', adIdsAudioClips)
  }

  const prepareAudioClips = (selectedAdId: string, adIdsAudioClips: any) => {
    const selectedAudioClips = adIdsAudioClips[selectedAdId]

    const extendedClip = selectedAudioClips.find(
      (clip: { playback_type: string }) => clip.playback_type === 'extended',
    )
    if (extendedClip) {
      const testUrl = `${audioClipsUploadsPath(
        `${extendedClip.file_path.replace(/^\./, '')}/${
          extendedClip.file_name
        }`,
      )}`
      console.log('Testing extended clip URL:', testUrl)

      fetch(testUrl)
        .then((response) => {
          console.log(
            'Extended clip URL test response:',
            response.status,
            response.statusText,
          )
        })
        .catch((error) => {
          console.error('Extended clip URL test failed:', error)
        })
    }

    if (selectedAudioClips.length > 100) {
      setClipStackSize(10)
    }
    const audioClipsData: Clip[] = selectedAudioClips.map(
      (audioClip: any, index: number) => {
        const clip = convertClassicClipObject(audioClip)
        clip.clip_sequence_number = index + 1
        return clip
      },
    )

    // Add sorting and set sortedAudioClips
    const sortedClipData = audioClipsData.sort(
      (a, b) => a.clip_start_time - b.clip_start_time,
    )

    setSortedAudioClips(sortedClipData)
    setAudioClips([...sortedClipData])

    const maxStackSize =
      sortedClipData.length > 100 ? 10 : Math.min(sortedClipData.length, 5)
    const clipStackData = []
    for (let i = 0; i < maxStackSize; i++) {
      const clip = sortedClipData[i]
      if (clip) {
        clip.clip_audio = new Howl({
          src: clip.clip_audio_path,
          html5: true,
          preload: true, // Ensure preloading
          autoplay: false,
        })
        clip.clip_audio.load()

        clip.clip_audio.on('loaderror', function () {
          console.error('Audio load error:', clip.clip_id, clip.clip_audio_path)
        })
        clip.clip_audio.on('playerror', function () {
          console.error('Audio play error:', clip.clip_id, clip.clip_audio_path)
        })

        clipStackData.push(clip)
      }
    }

    setClipStack(clipStackData)
    getYTVideoInfo()
  }

  const getYTVideoInfo = () => {
    // Early check for videoId
    if (!videoId) {
      console.error('Video ID is undefined')
      setShowSpinner(false)
      return
    }

    YouTubeService.getVideoDetails(videoId)
      .then((videoDetails) => {
        if (!videoDetails || videoDetails.length === 0) {
          alert('Video Unavailable!')
          setShowSpinner(false)
          return
        }

        const videoData = videoDetails[0]

        // Use optional chaining with defaults to avoid TypeScript errors
        const videoDurationInSeconds = videoData?.contentDetails?.duration
          ? convertISO8601ToSeconds(videoData.contentDetails.duration)
          : 0

        setVideoDurationInSeconds(videoDurationInSeconds)

        // Handle all other properties safely with optional chaining
        if (videoData?.snippet?.title) {
          setVideoTitle(videoData.snippet.title)
          document.title = `YouDescribe - ${videoData.snippet.title}`
        }

        if (videoData?.snippet?.channelTitle) {
          setVideoAuthor(videoData.snippet.channelTitle)
        }

        if (videoData?.snippet?.publishedAt) {
          setVideoPublishedAt(
            convertISO8601ToDate(videoData.snippet.publishedAt),
          )
        }

        if (videoData?.statistics?.likeCount) {
          setVideoLikes(
            convertLikesToCardFormat(Number(videoData.statistics.likeCount)),
          )
        }

        if (videoData?.snippet?.description) {
          setVideoDescription(videoData.snippet.description)
        }

        if (videoData?.statistics?.viewCount) {
          setVideoViews(
            convertViewsToCardFormat(Number(videoData.statistics.viewCount)),
          )
        }

        setShowSpinner(false)
      })
      .catch((err) => {
        console.error('Unable to load the video:', err)
        toast.error(
          'Thank you for visiting YouDescribe. This video is not viewable at this time.',
        )
        setShowSpinner(false)
      })
  }

  useEffect(() => {
    if (
      clipStack.length === clipStackSize ||
      clipStack?.length === audioDescriptionsIdsAudioClips[selectedADId]?.length
    ) {
      setShowSpinner(false)
    }
  }, [audioDescriptionsIdsAudioClips, clipStack, clipStackSize, selectedADId])

  useEffect(() => {
    return () => {
      // If component unmounts before history is saved, try to save it
      if (
        !historyTracked.current &&
        videoId &&
        userDataStore.getState().isSignedIn
      ) {
        saveVideoToHistory(videoId)
      }
    }
  }, [videoId])

  //
  //
  // YDX FUNCTIONS
  //
  //
  // function to update currentime state variable & draggable bar time.
  const updateTime = (time: number) => {
    const prevTime = currentTimeRef.current // Capture BEFORE update
    setCurrentTime(time)
    playAudioAtCurrentTime(time, prevTime)
    setPreviousTime(time)
  }

  const playAudioAtCurrentTime = async (
    updatedCurrentTime: number,
    prevTime: number,
  ) => {
    if (currentState !== 1) return // Only play when video is playing

    // LAYER 1: Detection - Find clips to play
    const clipsToPlay = findClipsToPlay(updatedCurrentTime, prevTime)

    // LAYER 2: Verification - Play only unplayed clips
    for (const clip of clipsToPlay) {
      await verifyAndPlayClip(clip, updatedCurrentTime)
    }

    // Update last processed index for optimization
    updateLastProcessedIndex(updatedCurrentTime)
  }

  const findClipsToPlay = (currentTime: number, prevTime: number): Clip[] => {
    const candidates: Clip[] = []
    const TOLERANCE = 0.25 // 250ms tolerance to handle 200ms sample rate

    for (let i = 0; i < sortedAudioClips.length; i++) {
      const clip = sortedAudioClips[i]

      // Stop if we've gone too far ahead
      if (clip.clip_start_time > currentTime + 0.3) break

      // Skip already played clips early
      if (playedClips.has(clip.clip_id)) continue

      // Method 1: Direct time match
      if (Math.abs(clip.clip_start_time - currentTime) <= TOLERANCE) {
        candidates.push(clip)
      }
      // Method 2: Missed clip recovery - clip start time fell between prev and current
      else if (
        clip.clip_start_time < currentTime &&
        clip.clip_start_time >= prevTime
      ) {
        console.log(`Recovering missed clip: ${clip.clip_id}`)
        candidates.push(clip)
      }
      // Method 3: Seek detection for inline clips - currently inside clip's time range
      else if (
        clip.playback_type === 'inline' &&
        clip.clip_start_time <= currentTime &&
        clip.clip_end_time >= currentTime &&
        Math.abs(currentTime - prevTime) > 1.0
      ) {
        console.log(`Seek detected into clip: ${clip.clip_id}`)
        candidates.push(clip)
      }
    }

    return candidates
  }

  const verifyAndPlayClip = async (clip: Clip, currentTime: number) => {
    // VERIFICATION: Check if already played
    if (playedClips.has(clip.clip_id)) {
      console.log(`Preventing duplicate play: ${clip.clip_id}`)
      return
    }

    // Check and update playback type if needed
    const updatedClip = await checkPlaybackTypeBeforePlaying(clip)

    if (updatedClip.playback_type === 'extended') {
      setPlayedClips((prev) => new Set(prev).add(clip.clip_id))
      playExtendedClip(updatedClip)
    } else {
      const played = playInlineClip(updatedClip, currentTime)
      if (played) {
        setPlayedClips((prev) => new Set(prev).add(clip.clip_id))
      }
    }
  }

  const playExtendedClip = (clip: Clip) => {
    console.log(`Playing extended clip: ${clip.clip_id}`)
    currentEvent?.pauseVideo()

    if (clip.clip_audio?.state() === 'loaded') {
      setTimeout(() => {
        if (clip.clip_audio && !clip.clip_audio.playing()) {
          clip.clip_audio.play()
          clip.clip_audio.volume(descriptionVolumeRef.current / 100)
        }
      }, 50)
    } else {
      // Audio not loaded yet - wait for load
      clip.clip_audio?.once('load', () => {
        setTimeout(() => {
          if (clip.clip_audio && !clip.clip_audio.playing()) {
            clip.clip_audio.play()
            clip.clip_audio.volume(descriptionVolumeRef.current / 100)
          }
        }, 50)
      })
    }

    setCurrExtendedAC(clip.clip_audio)

    clip.clip_audio?.once('end', () => {
      setCurrExtendedAC(undefined)
      currentEvent?.playVideo()
      clip.clip_audio?.unload()
    })

    updateClipStack()
  }

  const playInlineClip = (clip: Clip, currentTime: number): boolean => {
    console.log(`Playing inline clip: ${clip.clip_id}`)

    // Calculate how far into the clip we should start
    const clipProgress = currentTime - clip.clip_start_time
    const remainingDuration = clip.clip_duration - clipProgress

    // Only play if there's meaningful content left
    if (remainingDuration < 0.5) {
      console.log(
        `Skipping clip ${clip.clip_id} - only ${remainingDuration.toFixed(
          2,
        )}s remaining`,
      )
      return false
    }

    const seekTime = Math.max(0, clipProgress)

    if (clip.clip_audio?.state() === 'loaded') {
      if (seekTime > 0 && clip.clip_audio) {
        clip.clip_audio.seek(seekTime)
      }
      setTimeout(() => {
        if (clip.clip_audio && !clip.clip_audio.playing()) {
          clip.clip_audio.play()
          clip.clip_audio.volume(descriptionVolumeRef.current / 100)
        }
      }, 50)
    } else {
      // Audio not loaded yet - wait for load
      clip.clip_audio?.once('load', () => {
        if (seekTime > 0 && clip.clip_audio) {
          clip.clip_audio.seek(seekTime)
        }
        setTimeout(() => {
          if (clip.clip_audio && !clip.clip_audio.playing()) {
            clip.clip_audio.play()
            clip.clip_audio.volume(descriptionVolumeRef.current / 100)
          }
        }, 50)
      })
    }

    setCurrInlineAC(clip.clip_audio)

    clip.clip_audio?.once('end', () => {
      setCurrInlineAC(undefined)
      clip.clip_audio?.unload()
    })

    updateClipStack()
    return true
  }

  const updateLastProcessedIndex = (currentTime: number) => {
    // Only update if we're moving forward significantly
    // This prevents aggressive skipping
    for (let i = sortedAudioClips.length - 1; i >= 0; i--) {
      const clip = sortedAudioClips[i]
      // Only mark as processed if clip has been played or is definitely past
      if (
        clip.clip_start_time <= currentTime - 0.5 &&
        playedClips.has(clip.clip_id)
      ) {
        setLastProcessedIndex(i)
        break
      }
    }
  }

  const updateClipStack = () => {
    const newClipIndex = currentClipIndexRef.current + 1
    setCurrentClipIndex(newClipIndex)

    const newClip = audioClips[newClipIndex + clipStackSize - 1]
    if (newClip && !newClip.clip_audio) {
      newClip.clip_audio = new Howl({
        src: newClip.clip_audio_path,
        html5: true,
        preload: true,
      })
    }

    setClipStack((prev) => [...prev.slice(1), newClip].filter(Boolean))
  }

  // YouTube Player Functions
  const onStateChange = (event: any) => {
    const currentTime = event.target.getCurrentTime()
    setCurrentEvent(event.target)
    setCurrentTime(currentTime)
    setCurrentState(event.data)
    switch (event.data) {
      case 0: // end of the video
        clearInterval(timer)
        break

      case 1: {
        // Playing
        // Enhanced seek detection
        const timeDiff = Math.abs(currentTime - previousYTTime)
        if (timeDiff > 0.5) {
          console.info(
            `Significant time jump detected: ${timeDiff.toFixed(2)}s`,
          )
          setPreviousYTTime(currentTime)
          updateClipStackData()

          // Reset playback tracking to allow clips to play at new position
          setRecentAudioPlayedTime(0.0)
          setPlayedAudioClip('')
          setPlayedClipPath('')
        }

        if (!isActive) setIsActive(true)

        // Restart timer if it was cleared by extended clip pause
        if (!timer && descriptionsActive) {
          setTimer(
            setInterval(() => {
              const time = currentEventRef.current?.getCurrentTime()
              if (typeof time === 'number') {
                updateTime(time)
              }
            }, samplingRate),
          )
        }

        if (currExtendedAC) {
          currExtendedAC.pause()
          currExtendedAC.seek(0)
          setCurrExtendedAC(undefined)
        }
        if (currInlineAC) {
          currInlineAC.play()
          currInlineAC.on('end', function () {
            setCurrInlineAC(undefined)
          })
        }
        clearInterval(timer)
        break
      }

      case 2: {
        // Paused
        // Enhanced seek detection
        const timeDiff = Math.abs(currentTime - previousYTTime)
        if (timeDiff > 0.5) {
          console.info(`Seek detected while paused: ${timeDiff.toFixed(2)}s`)
          setPreviousYTTime(currentTime)
          updateClipStackData()

          // Reset playback tracking
          setRecentAudioPlayedTime(0.0)
          setPlayedAudioClip('')
          setPlayedClipPath('')
        }

        // Case for Inline Audio Clips:
        // When an inline Audio Clip is playing along with the Video,
        // If user pauses the YT video, Inline Clip is still played.
        // Work around - add current inline audio clip to a state variable & check if YT state is changed to paused i.e. 2
        // if yes, stop playing the inline audio clip & set the state back to null
        if (currInlineAC) {
          // to stop playing -> pause and set time to 0
          currInlineAC.pause()
          // currInlineAC.currentTime = 0;
          // setCurrInlineAC(null);
        }
        clearInterval(timer)
        break
      }
      case 3: {
        // Buffering (seek detected)
        console.info('Buffering (on seek)')

        // Clear any pending seek operations
        if (seekDebounceTimer.current) {
          clearTimeout(seekDebounceTimer.current)
        }

        // Debounce the seek operation
        seekDebounceTimer.current = setTimeout(() => {
          const newTime = event.target.getCurrentTime()
          const oldTime = currentTimeRef.current

          console.log(
            `Seek detected: ${oldTime.toFixed(2)} -> ${newTime.toFixed(2)}`,
          )

          // Stop any currently playing clips
          if (currInlineAC) {
            currInlineAC.stop()
            setCurrInlineAC(undefined)
          }
          if (currExtendedAC) {
            currExtendedAC.stop()
            setCurrExtendedAC(undefined)
          }

          // Clear played clips based on seek direction
          setPlayedClips((prev) => {
            const newSet = new Set(prev)

            if (newTime < oldTime) {
              // Backward seek - clear clips between new and old time
              sortedAudioClips.forEach((clip) => {
                if (
                  clip.clip_start_time >= newTime &&
                  clip.clip_start_time <= oldTime
                ) {
                  newSet.delete(clip.clip_id)
                }
              })
            } else {
              // Forward seek - clear clips after new time
              sortedAudioClips.forEach((clip) => {
                if (clip.clip_start_time > newTime) {
                  newSet.delete(clip.clip_id)
                }
              })
            }

            return newSet
          })

          // Reset processing index
          const newProcessingIndex =
            sortedAudioClips.findIndex(
              (clip) => clip.clip_start_time >= newTime,
            ) - 1
          setLastProcessedIndex(Math.max(-1, newProcessingIndex))

          // Update clip stack for new position
          updateClipStackOnSeek(newTime)
        }, 100) // 100ms debounce

        clearInterval(timer)
        break
      }
    }
  }
  const onReady = (event: any) => {
    setCurrentEvent(event.target)
  }
  const onPlay = (event: any) => {
    setCurrentEvent(event.target)
    setCurrentTime(event.target.getCurrentTime())

    if (descriptionsActive) {
      setTimer(
        setInterval(() => {
          const time = event.target.getCurrentTime()
          if (typeof time === 'number') {
            updateTime(time)
          }
        }, samplingRate),
      )
    }
    if (!historyTracked.current && videoId) {
      saveVideoToHistory(videoId)
      historyTracked.current = true
    }
  }

  const onPause = (event: any) => {
    event.target.pauseVideo()
  }

  const updateClipStackData = useCallback(() => {
    // console.log('Updating Clip Stack | Current Time =', currentTimeRef.current)

    // Unload old Howl objects from previous clip stack to prevent memory leak
    clipStackRef.current.forEach((clip) => {
      if (clip.clip_audio) {
        clip.clip_audio.unload()
      }
    })

    const newClipIndex = audioClips.findIndex(
      (clip) =>
        clip.clip_start_time >= currentTimeRef.current ||
        (clip.clip_start_time < currentTimeRef.current &&
          clip.clip_end_time > currentTimeRef.current),
    )
    setCurrentClipIndex(newClipIndex)
    // console.log('Current Clip Index', newClipIndex)

    // slice audio clips from newClipIndex to newClipIndex + 5
    const clipStackData = []
    // Create Howl objects for each clip
    for (let i = newClipIndex; i < newClipIndex + clipStackSize; i++) {
      const clip = audioClips[i]
      if (clip) {
        clip.clip_audio = new Howl({
          src: clip.clip_audio_path,
          html5: true,
          preload: true, // Ensure preloading
          autoplay: false,
        })
        clip.clip_audio.load()

        clipStackData.push(clip)
      }
    }
    // Update clipStack
    setClipStack(clipStackData)
  }, [audioClips, setCurrentClipIndex])

  const updateClipStackOnSeek = (seekTime: number) => {
    // Unload old Howl objects before creating new stack
    clipStackRef.current.forEach((clip) => {
      if (clip.clip_audio) {
        clip.clip_audio.unload()
      }
    })

    // Find the nearest clip index for the seek position
    const nearestIndex = audioClips.findIndex(
      (clip) => clip.clip_start_time >= seekTime,
    )

    const startIndex = Math.max(
      0,
      nearestIndex === -1 ? audioClips.length - clipStackSize : nearestIndex,
    )

    // Unload all current clips
    clipStack.forEach((clip) => {
      if (clip.clip_audio) {
        clip.clip_audio.unload()
      }
    })

    // Load new clips starting from seek position
    const newClipStack = []
    for (
      let i = startIndex;
      i < Math.min(startIndex + clipStackSize, audioClips.length);
      i++
    ) {
      const clip = audioClips[i]
      if (clip) {
        clip.clip_audio = new Howl({
          src: clip.clip_audio_path,
          html5: true,
          preload: true,
        })
        clip.clip_audio.load()
        newClipStack.push(clip)
      }
    }

    setClipStack(newClipStack)
    setCurrentClipIndex(startIndex)

    // Reset recent audio played time to allow clips to play at new position
    setRecentAudioPlayedTime(0.0)
    setPlayedAudioClip('')
    setPlayedClipPath('')
  }

  const saveVideoToHistory = async (
    videoId: string,
    retryCount = 0,
  ): Promise<boolean> => {
    if (!userDataStore.getState().isSignedIn || !videoId) {
      return false
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/save-Visited-Videos-History`,
        {
          youtube_id: videoId,
          invalidate_cache: true,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      return response.status === 201
    } catch (error) {
      console.error('Error saving video history:', error)

      // Retry logic - attempt up to 3 retries with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s

        setTimeout(() => {
          saveVideoToHistory(videoId, retryCount + 1)
        }, delay)
      }
      return false
    }
  }

  const getPlaybackStats = () => {
    return {
      totalClips: audioClips.length,
      playedClips: playedClips.size,
      missedClips: audioClips.filter(
        (c) =>
          c.clip_start_time < currentTimeRef.current &&
          !playedClips.has(c.clip_id),
      ).length,
      lastProcessedIndex,
      currentTime: currentTimeRef.current,
      seekCount: seekDebounceTimer.current ? 'pending' : 'none',
    }
  }

  //
  //
  // END OF YDX FUNCTIONS
  //
  //

  useEffect(() => {
    const statsInterval = setInterval(() => {
      console.log('Playback Stats:', getPlaybackStats())
    }, 5000)
    return () => clearInterval(statsInterval)
  }, [playedClips, currentTimeRef.current])

  useEffect(() => {
    if (audioDescriptionsIdsUsers) {
      // console.log('Updating describer Cards')
      const describers = audioDescriptionsIdsUsers
      const describerCards: ReactNode[] = []
      let describerIds = Object.keys(describers)

      if (describerIds.length) {
        // document.getElementById('no-descriptions').style.display = 'none'
      }
      if (describerIds.length && describerIds[0] !== selectedADId) {
        const selectedIdIndex = describerIds.indexOf(selectedADId)
        describerIds = describerIds
          .splice(selectedIdIndex, 1)
          .concat(describerIds)
      }

      if (videoId && !showSpinner && videoTitle) {
        saveVideoToHistory(videoId)
      }

      describerIds.forEach((describerId, i) => {
        describerCards.push(
          <DescriberCard
            key={i}
            handleDescriberChange={handleDescriberChange}
            handleRatingPopup={handleRatingPopup}
            handleFeedbackPopup={handleFeedbackPopup}
            handleNewCollabEdit={() => handleNewCollabEdit(selectedADId)}
            describerId={describerId}
            selectedDescriberId={selectedADId}
            picture={describers[describerId].picture}
            name={describers[describerId].name}
            overall_rating_average={
              describers[describerId].overall_rating_average
            }
            handleRating={() => {
              // console.log('Handle Rating')
            }}
            videoId={videoId}
            collaborativeEdit={
              (describers[describerId].user?.user_type === 'AI' ||
                describers[describerId].collaborative_edit) &&
              (!describers[describerId].depth ||
                describers[describerId].depth < 3) &&
              checkUserCanCollaborate(describers, describerId)
            }
            contributions={describers[describerId].contributions}
            displayContributions={describers[describerId].displayContributions}
          />,
        )
      })

      setDescriberCards(describerCards)
    }
  }, [
    audioDescriptionsIdsUsers,
    selectedADId,
    videoId,
    showSpinner,
    videoTitle,
  ])

  const checkUserCanCollaborate = (
    ads: IADUserId | null,
    selectedDescriberId: string,
  ) => {
    if (!ads) return false

    const userId = userDataStore.getState().userId
    const selectedId = selectedDescriberId

    for (const describerId of Object.keys(ads)) {
      const adUserId = ads[describerId].user._id
      const prevAdId = ads[describerId].prev_audio_description

      if (adUserId === userId && prevAdId === selectedId) {
        return false
      }
    }

    return true
  }

  const upVote = () => {
    if (!userDataStore.getState().isSignedIn) {
      toast.error(translate('You have to be logged in in order to vote'))
    } else {
      const url = `${apiUrl}/wishlist/add-one-wishlist-item`
      ourFetch(url, true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youTubeId: videoId,
          userId: userDataStore.getState().userId,
          userToken: userDataStore.getState().userToken,
        }),
      })
        .then((res) => {
          toast.success(translate('Success upVote'))
        })
        .catch((err) => {
          switch (err.status) {
            case 400:
              toast.error(translate(err.message))
              break
            case 200:
              toast.success(translate(err.message))
              break
            default:
              toast.error(
                translate(
                  'It was impossible to vote. Maybe your session has expired. Try to logout and login again.',
                ),
              )
          }
        })
    }
  }

  const handleDescriberChange = (describerId: string) => {
    if (currentInlineACRef.current?.playing()) {
      currentInlineACRef.current?.pause()
    }
    if (currentExtendedACRef.current?.playing()) {
      currentExtendedACRef.current?.pause()
    }
    setCurrExtendedAC(undefined)
    setCurrInlineAC(undefined)
    currentEventRef.current?.pauseVideo()
    setSelectedADId(describerId)
    setSearchParams((params) => {
      if (describerId) params.set('ad', describerId)
      return params
    })
    setAudioDescriptionActive(
      audioDescriptionsIdsUsers,
      audioDescriptionsIdsAudioClips,
    )
  }
  const handleTurnOffDescriptions = () => {
    if (currentInlineACRef.current?.playing()) {
      currentInlineACRef.current?.pause()
    }
    if (currentExtendedACRef.current?.playing()) {
      currentExtendedACRef.current?.pause()
    }
    setCurrExtendedAC(undefined)
    setCurrInlineAC(undefined)
    currentEventRef.current?.pauseVideo()
    setDescriptionsActive(false)
  }

  const handleTurnOnDescriptions = () => {
    currentEventRef.current?.pauseVideo()
    setDescriptionsActive(true)
  }

  const handleRatingSubmit = (rating: number) => {
    if (rating === 0) toast.error('You must select a rating')
    else if (!userDataStore.getState().isSignedIn) {
      toast.error(translate('You have to be logged in in order to vote'))
    } else {
      const url = `${apiUrl}/audio-descriptions/ratings/addOne/${selectedADId}`
      setRating(rating)
      ourFetch(url, true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userDataStore.getState().userId,
          userToken: userDataStore.getState().userToken,
          rating,
        }),
      })
        .then((res) => {
          // if (rating === 5) {
          // toast.error(`You have successfully given this description a rating of ${rating}`);
          const ratingPopup = document.getElementById('rating-popup')
          const ratingSuccess = document.getElementById('rating-success')
          if (ratingPopup) {
            ratingPopup.style.display = 'none'
          }
          if (ratingSuccess) {
            ratingSuccess.style.display = 'block'
            ratingSuccess.focus()
            setTimeout(() => (ratingSuccess.style.display = 'none'), 1000)
          }

          /* start of email */
          sendOptInEmail(2, rating, [])
          /* end of email */

          // }
          // else {
          //   // this.handleFeedbackPopup();
          // }
          const describers = { ...audioDescriptionsIdsUsers }
          const selectedId = selectedADId

          if (!describers[selectedId].overall_rating_votes_sum) {
            describers[selectedId].overall_rating_votes_sum = 0
          }
          if (!describers[selectedId].overall_rating_votes_counter) {
            describers[selectedId].overall_rating_votes_counter = 0
          }
          if (!describers[selectedId].overall_rating_average) {
            describers[selectedId].overall_rating_average = 0
          }

          describers[selectedId].overall_rating_votes_sum += rating
          describers[selectedId].overall_rating_votes_counter += 1
          describers[selectedId].overall_rating_average =
            describers[selectedId].overall_rating_votes_sum /
            describers[selectedId].overall_rating_votes_counter

          setAudioDescriptionsIdsUsers(describers)
        })
        .catch((err) => {
          // console.log(err)
          toast.error(
            translate(
              'It was impossible to vote. Maybe your session has expired. Try to logout and login again.',
            ),
          )
        })
    }
  }

  const handleFeedbackSubmit = (feedback: any) => {
    const url = `${apiUrl}/audio-descriptions/ratings/addOne/${selectedADId}`
    ourFetch(url, true, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userDataStore.getState().userId,
        userToken: userDataStore.getState().userToken,
        rating: rating,
        feedback,
      }),
    })
      .then((res) => {
        const feedbackPopup = document.getElementById('feedback-popup')
        const feedbackSuccess = document.getElementById('feedback-success')
        if (feedbackPopup) {
          feedbackPopup.style.display = 'none'
        }
        if (feedbackSuccess) {
          feedbackSuccess.style.display = 'block'
          feedbackSuccess.focus()
          setTimeout(() => (feedbackSuccess.style.display = 'none'), 1000)
        }
        // toast.error('Thanks for your feedback!');

        /* start of email */
        sendOptInEmail(2, rating, feedback)
        /* end of email */
      })
      .catch((err) => {
        // console.log(err)
        toast.error(
          translate(
            'It was impossible to vote. Maybe your session has expired. Try to logout and login again.',
          ),
        )
      })
  }

  const sendOptInEmail = (optIn: number, rating = 0, feedback = []) => {
    let emailBody = ''
    if (optIn == 1) {
      emailBody = `Your audio description for ${videoTitle} has been viewed. 
      View it here:  ${window.location.href}`
    } else if (optIn == 2) {
      emailBody = `Your audio description for  ${videoTitle} has been rated as ${rating}.
      View it here: ${window.location.href}`
      emailBody +=
        feedback.length > 0 ? ', with the following comment(s):' : '.'
      feedback.forEach((index) => {
        emailBody += `\n${audioDescriptionFeedbacks[index]}`
      })
    }

    const url = `${apiUrl}/users/sendoptinemail`
    const optionObj = {
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: selectedADId,
        optin: optIn,
        emailbody: emailBody,
      }),
    }
    ourFetch(url, true, optionObj).then((response) => {
      // console.log(response)
    })
  }

  const handleRatingPopup = () => {
    if (!userDataStore.getState().isSignedIn) {
      toast.error(translate('You have to be logged in in order to vote'))
    } else {
      const ratingPopup = document.getElementById('rating-popup')
      if (ratingPopup) {
        ratingPopup.style.display = 'block'
        ratingPopup.focus()
      }
    }
  }
  const handleFeedbackPopup = () => {
    if (!userDataStore.getState().isSignedIn) {
      toast.error(
        translate('You have to be logged in in order to give feedback'),
      )
    } else {
      const feedbackPopup = document.getElementById('feedback-popup')
      if (feedbackPopup) {
        feedbackPopup.style.display = 'block'
        feedbackPopup.focus()
      }
    }
  }

  const handleRatingPopupClose = () => {
    const ratingPopup = document.getElementById('rating-popup')
    if (ratingPopup) {
      ratingPopup.style.display = 'none'
    }
  }

  const handleFeedbackPopupClose = () => {
    const feedbackPopup = document.getElementById('feedback-popup')
    if (feedbackPopup) {
      feedbackPopup.style.display = 'none'
    }
  }

  // console.log(videoDurationInSeconds)

  const getAudioSegments = () => {
    return audioClips.map((ad) => {
      return (
        <div
          key={ad.clip_id}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            backgroundColor:
              ad.playback_type === 'extended' ? '#9c27b0' : '#ffeb3b',
            left: `${(ad.clip_start_time / videoDurationInSeconds) * 100}%`,
            width:
              ad.playback_type === 'extended'
                ? `0.5%`
                : `${(ad.clip_duration / videoDurationInSeconds) * 100}%`,
          }}
        />
      )
    })
  }
  const handleNewCollabEdit = async (oldDescriberId: string) => {
    if (!userDataStore.getState().isSignedIn) {
      toast.error(
        translate('You have to be logged in in order to add a description'),
      )
    } else {
      try {
        const collabUrl = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/create-collaborative-ad`
        const response = await axios.post(
          collabUrl,
          {
            youtubeVideoId: videoId,
            oldDescriberId: oldDescriberId,
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        const data = response.data
        console.log('inside handle new collab....')

        navigate(`/editor/${data.url}`)
      } catch (error) {
        console.log(error)
        toast.error('Something went wrong, please try again later')
      }
    }
  }

  const handleAddDescription = async () => {
    // console.log(userDataStore.getState())
    if (!userDataStore.getState().isSignedIn) {
      toast.error(
        translate('You have to be logged in in order to add a description'),
      )
    } else {
      try {
        const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/create-new-user-ad`
        const response = await axios.post(
          url,
          {
            youtubeVideoId: videoId,
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        const data = response.data
        // console.log(data)
        navigate(`/editor/${data.url}`)
      } catch (error) {
        // console.log(error)
        toast.error('Something went wrong, please try again later')
      }
    }
  }

  const handleGenerateAIDescriptions = async (languageCode: string) => {
    if (!userDataStore.getState().isSignedIn) {
      toast.error(
        translate(
          'You have to be logged in in order to ask for AI Descriptions',
        ),
      )
      return
    }

    if (videoDurationInSeconds > 600) {
      toast.error(
        translate(
          'YouDescribe currently supports videos that are 10 minutes or less. Please wait for further updates.',
        ),
      )
      return
    }

    setIsAiRequestPending(true)

    try {
      if (requestAiDescription.status === 'pending') {
        const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/increase-Request-Count`
        await axios.post(
          url,
          { youtube_id: videoId },
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          },
        )

        toast.info(
          translate(
            'AI Descriptions are already being generated. You will receive an email when they are ready.',
          ),
        )
        return
      }

      const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/request-ai-descriptions-with-gpu`
      const response = await axios.post(
        url,
        {
          youtube_id: videoId,
          selectedLanguageCode: languageCode,
        },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (response.data) {
        setRequestAiDescription({
          status: 'pending',
          requested: true,
        })
        toast.success(
          'AI Descriptions have been requested successfully. You will receive an email when they are ready.',
        )
      }
    } catch (error: unknown) {
      console.error('AI Description request failed:', error)

      setRequestAiDescription({
        status: 'notavailable',
        requested: false,
      })

      const apiError = error as ApiError

      if (apiError.response) {
        switch (apiError.response.status) {
          case 400:
            toast.error(
              'Invalid request. Please check your input and try again.',
            )
            break
          case 401:
            toast.error('Please log in to request AI descriptions.')
            break
          case 429:
            toast.error('Too many requests. Please try again later.')
            break
          case 500:
            toast.error(
              'The AI description service is currently unavailable. Please try again later.',
            )
            break
          default:
            toast.error('Something went wrong. Please try again later.')
        }
      } else if (apiError.request) {
        toast.error(
          'Network error. Please check your connection and try again.',
        )
      } else {
        toast.error('An unexpected error occurred. Please try again later.')
      }
    } finally {
      setIsAiRequestPending(false)
    }
  }

  const handleRequestAIDescriptions = () => {
    if (videoDurationInSeconds > 600) {
      toast.error(
        translate(
          'YouDescribe currently supports videos that are 10 minutes or less. Please wait for further updates.',
        ),
      )
      return
    }
    // Show the language selector modal
    setShowLanguageSelector(true)
  }

  // Function to handle the confirmation of language selection
  const handleLanguageConfirm = (selectedLanguageCode: string) => {
    // Generate AI descriptions with the selected language
    handleGenerateAIDescriptions(selectedLanguageCode)
    // Close the language selector modal
    setShowLanguageSelector(false)
  }

  // Function to handle canceling language selection
  const handleLanguageCancel = () => {
    // Close the language selector modal
    setShowLanguageSelector(false)
  }
  const DescriptionButtons = () => {
    const getAiButtonText = () => {
      if (isAiRequestPending) return translate('Processing...')
      if (requestAiDescription.requested)
        return translate('AI Description Requested')
      if (aiServiceStatus === 'unavailable')
        return translate('AI Service Unavailable')
      return translate('Request AI Description')
    }

    const getAiButtonClass = () => {
      const baseClass = 'w3-block w3-margin-top ai-request-button'
      if (isAiRequestPending) return `${baseClass} w3-grey processing`
      if (aiServiceStatus === 'unavailable')
        return `${baseClass} w3-grey unavailable`
      if (requestAiDescription.requested)
        return `${baseClass} w3-brown requested`
      return `${baseClass} w3-light-blue`
    }

    if (
      requestAiDescription.status === 'completed' &&
      requestAiDescription.url
    ) {
      return (
        <div className="description-buttons">
          <Button
            title={translate('Add a new description for this video')}
            ariaLabel="Add a new description for this video"
            text={translate('Add Freestyle Description')}
            color="w3-yellow w3-block"
            onClick={handleAddDescription}
          />
        </div>
      )
    }

    return (
      <div className="description-buttons">
        <Button
          title={translate('Add a new description for this video')}
          ariaLabel="Add a new description for this video"
          text={translate('Add Freestyle Description')}
          color="w3-yellow w3-block"
          onClick={handleAddDescription}
        />

        <Button
          title={translate('Request AI Descriptions')}
          ariaLabel="Request AI Descriptions"
          text={
            isAiRequestPending ? `⭕ ${getAiButtonText()}` : getAiButtonText()
          }
          color={getAiButtonClass()}
          disabled={
            isAiRequestPending ||
            requestAiDescription.requested ||
            aiServiceStatus === 'unavailable'
          }
          onClick={handleRequestAIDescriptions}
        />

        {showLanguageSelector && (
          <LanguageSelector
            show={showLanguageSelector}
            handleClose={handleLanguageCancel}
            handleGenerateAIDescriptions={handleLanguageConfirm}
            languages={languages}
            showLanguageSelector={showLanguageSelector}
          />
        )}
      </div>
    )
  }

  return (
    <div id="video-page" className="video-page">
      <main role="main" className="video-page-main" title="Video page">
        <section id="video-area" className="video-area">
          {/* <ToastContainer /> */}
          <ShareBar videoTitle={videoTitle} />
          <div id="video" className="video">
            {showSpinner ? <Spinner /> : null}
            <YouTube
              className="rounded"
              videoId={videoId}
              opts={opts}
              onStateChange={onStateChange}
              onPlay={onPlay}
              onPause={onPause}
              onReady={onReady}
            />
          </div>
          <div className="classic-container audio-ducking-container">
            <VideoPlayerControls
              descriptionVolume={descriptionVolume}
              setDescriptionVolume={setDescriptionVolume}
              youTubeVideoVolume={youTubeVolume}
              setYouTubeVideoVolume={setYouTubeVolume}
            />
          </div>
          <div className="classic-container video-timeline" aria-hidden="true">
            <ProgressBar
              style={{
                position: 'relative',
                height: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '7px',
                overflow: 'hidden',
              }}
            >
              {getAudioSegments()}
            </ProgressBar>
            <div
              style={{
                position: 'absolute',
                top: 0,
                zIndex: 20,
                height: '28px',
                backgroundColor: 'red',
                left: `${
                  (currentTimeRef.current / videoDurationInSeconds) * 100
                }%`,
                width: '0.2%',
              }}
            />
          </div>
        </section>
        <section
          id="video-info"
          className="classic-container w3-row video-info"
        >
          <RatingPopup
            audioDescriptionId={selectedADId}
            rating={rating}
            setRating={setRating}
            handleRatingSubmit={handleRatingSubmit}
            handleRatingPopupClose={handleRatingPopupClose}
          />
          <div id="rating-success" className="rating-success" tabIndex={-1}>
            {translate('Thanks for rating this description!')}
          </div>
          <FeedbackPopup
            handleFeedbackSubmit={handleFeedbackSubmit}
            handleFeedbackPopupClose={handleFeedbackPopupClose}
          />
          <div id="feedback-success" className="feedback-success" tabIndex={-1}>
            {translate('Thank you for your feedback!')}
          </div>
          <div className="w3-col l8 m8">
            <YTInfoCard
              videoTitle={videoTitle}
              videoAuthor={videoAuthor}
              videoViews={videoViews}
              videoPublishedAt={videoPublishedAt}
              videoLikes={videoLikes}
            />
            {searchParams.get('show') && (
              <RatingsInfoCard
                selectedAudioDescriptionId={selectedADId}
                audioDescriptionsIdsUsers={audioDescriptionsIdsUsers}
              />
            )}
          </div>
          {descriptionsActive ? (
            <div
              id="describers"
              className="w3-col l4 m4 describers"
              style={{
                display: Object.keys(audioDescriptionsIdsUsers || {}).length
                  ? 'block'
                  : 'none',
              }}
            >
              <div className="w3-card-2">
                <h3 className="classic-h3">
                  {translate('Selected description')}
                </h3>
                {describerCards[0]}
                <hr aria-hidden="true" />
                <h3 className="classic-h3">
                  {translate('Other description options')}
                </h3>
                {describerCards.slice(1)}
                <Button
                  title={translate('Turn off descriptions for this video')}
                  text={translate('Turn Off Descriptions')}
                  color="w3-indigo w3-block w3-margin-top"
                  ariaLabel="Turn off descriptions for this video"
                  onClick={handleTurnOffDescriptions}
                />
                <DescriptionButtons />
              </div>
            </div>
          ) : (
            <div
              id="descriptions-off"
              className="w3-col l4 m4 descriptions-off"
            >
              <div className="w3-card-2">
                <h3 className="classic-h3">{translate('Descriptions off')}</h3>
                <Button
                  title={translate('Turn on descriptions for this video')}
                  ariaLabel="Turn on descriptions for this video"
                  text={translate('Turn on descriptions')}
                  color="w3-indigo w3-block w3-margin-top"
                  onClick={handleTurnOnDescriptions}
                />
              </div>
            </div>
          )}
          <div
            id="no-descriptions"
            className="w3-col l4 m4"
            style={{
              display: Object.keys(audioDescriptionsIdsUsers || {}).length
                ? 'none'
                : 'block',
            }}
          >
            <div className="w3-card-2">
              {requestAiDescription.status === 'available' ? (
                <h3 className="classic-h3">AI descriptions available</h3>
              ) : (
                <h3 className="classic-h3">No descriptions available</h3>
              )}
              <Button
                title={translate('Request an audio description for this video')}
                ariaLabel="Request an audio description for this video"
                text={translate('Add to WISHLIST')}
                color="w3-indigo w3-block w3-margin-top"
                onClick={() => upVote()}
              />
              <DescriptionButtons />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Video
