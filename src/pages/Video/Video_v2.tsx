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
import YouTubeService from '@/shared/utils/YouTubeService'

const Video = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedADId, setSelectedADId] = useState<string>('')

  const [describerCards, setDescriberCards] = useState<ReactNode[]>([])
  const [descriptionsActive, setDescriptionsActive] = useState(true)
  const [rating, setRating] = useState<number>(0)

  // Loading Spinner
  const [showSpinner, setShowSpinner] = useState(true)

  // Data from API
  const [audioDescriptionsIds, setAudioDescriptionsIds] = useState<any[]>([])
  const [audioDescriptionsIdsUsers, setAudioDescriptionsIdsUsers] =
    useState<any>({})
  const [audioDescriptionsIdsAudioClips, setAudioDescriptionsIdsAudioClips] =
    useState<any>({})

  // YouTube Video Info
  const [videoTitle, setVideoTitle] = useState('')
  const [videoAuthor, setVideoAuthor] = useState('')
  const [videoPublishedAt, setVideoPublishedAt] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const [videoViews, setVideoViews] = useState('')
  const [videoLikes, setVideoLikes] = useState('')
  const [videoDurationInSeconds, setVideoDurationInSeconds] = useState(0)
  const [videoDurationToDisplay, setVideoDurationToDisplay] = useState('')

  // Balancer value for volume controls
  const [descriptionVolume, setDescriptionVolume] = useState(
    parseInt(localStorage.getItem('descriptionVolume') || '50'),
  )
  const [youTubeVolume, setYouTubeVolume] = useState(
    parseInt(localStorage.getItem('youTubeVolume') || '100'),
  )
  const descriptionVolumeRef = useRef(descriptionVolume)
  const youTubeVolumeRef = useRef(youTubeVolume)

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
  const [isCurrentExtACPaused, setCurrentExtACPaused] = useState(false) // Manages the play/pause state of an extended audio clip

  const [recentAudioPlayedTime, setRecentAudioPlayedTime] = useState(0.0) // used to store the time of a recent AD played to stop playing the same Audio twice concurrently - due to an issue found in updateTime() method because it returns the same currentTime twice or more
  const [playedAudioClip, setPlayedAudioClip] = useState('') // store clipId of the audio clip that is already played.
  const [playedClipPath, setPlayedClipPath] = useState('') // store clip_audio_path of the audio clip that is already played.

  const [isActive, setIsActive] = useState(false)
  const [samplingRate, setSamplingRate] = useState(200)

  const [previousTime, setPreviousTime] = useState(0.0)
  const [clipStack, setClipStack] = useState<Clip[]>([])
  const [clipStackSize, setClipStackSize] = useState<number>(5)
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0)

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
  }>({
    status: '',
    requested: false,
  })

  const [buttonLoading, setButtonLoading] = useState(false)
  const toastId = React.useRef<null | Id>(null)

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  //
  // END OF YDX STATE VARIABLES
  //

  // YouTube Player Options
  const opts: Options = {
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
    },
  }

  // Fetch Data on Page Load
  useEffect(() => {
    // console.log(videoId)
    if (videoId) {
      fetchVideoData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            user_id: userDataStore.getState().userId,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDataStore.getState().isSignedIn])

  const fetchVideoData = () => {
    const url = `${apiUrl}/videos/${videoId}`
    ourFetch(url)
      .then((res) => {
        parseVideoData(res.result)
      })
      .catch((err) => {
        // console.log(err)
        navigate('/not-found')
      })
  }

  const parseVideoData = (videoData: any) => {
    // TODO: Add Types
    const adIds: any[] = []
    const adIdsUsers: any = {}
    const adIdsAudioClips: any = {}

    if (
      videoData?.audio_descriptions?.find(
        (ad: any) => ad.status === 'published',
      )
    ) {
      videoData.audio_descriptions.forEach((ad: any) => {
        if (ad.status === 'published') {
          adIds.push(ad._id)
          adIdsUsers[ad._id] = ad.user
          adIdsUsers[ad._id].overall_rating_votes_counter =
            ad.overall_rating_votes_counter
          adIdsUsers[ad._id].overall_rating_average = ad.overall_rating_average
          adIdsUsers[ad._id].overall_rating_votes_sum =
            ad.overall_rating_votes_sum
          adIdsUsers[ad._id].feedbacks = ad.feedbacks
          adIdsAudioClips[ad._id] = []
          if (ad.audio_clips.length > 0) {
            ad.audio_clips.forEach((audioClip: any) => {
              audioClip.url = `${audioClipsUploadsPath}${audioClip.file_path}/${audioClip.file_name}`
              adIdsAudioClips[ad._id].push(audioClip)
            })
          }
        }
      })

      setAudioDescriptionsIds(adIds)
      setAudioDescriptionsIdsUsers(adIdsUsers)
      setAudioDescriptionsIdsAudioClips(adIdsAudioClips)
      setAudioDescriptionActive(adIdsUsers, adIdsAudioClips)
    } else {
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

    if (
      audioDescriptionsIds?.length &&
      audioDescriptionsIds?.indexOf(selectedAd) === -1
    ) {
      // console.log('Navigating to Not Found')
      navigate('/not-found')
    }
    setSearchParams((params) => {
      if (selectedAd) params.set('ad', selectedAd)
      return params
    })
    setSelectedADId(selectedAd ?? '')
    prepareAudioClips(selectedAd ?? '', adIdsAudioClips)
  }

  const prepareAudioClips = (selectedAdId: string, adIdsAudioClips: any) => {
    const selectedAudioClips = adIdsAudioClips[selectedAdId]
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

    const sortedClipData = audioClipsData.sort((a, b) =>
      a.clip_start_time < b.clip_start_time ? -1 : 1,
    )

    // // console.log('Sorted Clips', sortedClipData)

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
        })
        clipStackData.push(clip)
      }
    }
    // // console.log('Clip Stack', clipStackData)
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
          console.log('Video Unavailable!')
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
    if (clipStack.length === clipStackSize) {
      setShowSpinner(false)
    } else if (
      clipStack?.length === audioDescriptionsIdsAudioClips[selectedADId]?.length
    ) {
      setShowSpinner(false)
    }
  }, [audioDescriptionsIdsAudioClips, clipStack, clipStackSize, selectedADId])

  //
  //
  // YDX FUNCTIONS
  //
  //
  // function to update currentime state variable & draggable bar time.
  const updateTime = (
    time: number,
    playedAudioClip: string,
    recentAudioPlayedTime: number,
    playedClipPath: string,
  ) => {
    setCurrentTime(time)
    // check if the audio is not played recently. do not play it again.
    if (recentAudioPlayedTime !== time) {
      // To Play audio files based on current time
      playAudioAtCurrentTime(time, playedAudioClip, playedClipPath)
    }
    setPreviousTime(time)
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

  // To Play audio files based on current time
  const playAudioAtCurrentTime = async (
    updatedCurrentTime: number,
    playedAudioClip: string,
    playedClipPath: string,
  ) => {
    // playing
    if (currentState === 1) {
      // If all clips have been played, skip check
      if (clipStackRef.current.length === 0) {
        // console.log('No Clips left to play')
        return
      }
      // If a clip is currently playing, skip check
      if (
        currentInlineACRef.current?.playing() ||
        currentExtendedACRef.current?.playing()
      ) {
        console.info('A clip is currently playing')
        return
      }
      try {
        // Get current clip and check its playback type
        const currentClip = clipStackRef.current[0]
        const updatedClip = await checkPlaybackTypeBeforePlaying(currentClip)

        // Handle EXTENDED playback first with independent condition
        if (
          updatedClip.playback_type === 'extended' &&
          updatedClip.clip_start_time <= currentTimeRef.current &&
          currentTimeRef.current - updatedClip.clip_start_time < 1.0
        ) {
          console.log('EXTENDED CLIP DETECTION TRIGGERED', {
            clipId: updatedClip.clip_id,
            clipStartTime: updatedClip.clip_start_time,
            currentTime: currentTimeRef.current,
            timeDifference:
              currentTimeRef.current - updatedClip.clip_start_time,
          })

          setCurrentClipIndex(currentClipIndexRef.current + 1)

          // Play the clip only if it wasn't played recently
          if (playedAudioClip !== updatedClip.clip_id) {
            setPlayedAudioClip(updatedClip.clip_id)
            setRecentAudioPlayedTime(currentTimeRef.current)
            const clipAudioPath = updatedClip.clip_audio_path

            if (clipAudioPath !== playedClipPath) {
              setPlayedClipPath(clipAudioPath)

              // Play extended clip
              const currentAudio = updatedClip.clip_audio
              console.log(
                'Attempting to pause YouTube video for extended clip:',
                updatedClip.clip_id,
              )
              currentEvent?.pauseVideo()
              console.log(
                'YouTube player state after pause attempt:',
                currentEvent?.getPlayerState(),
              )
              console.log(
                'Extended audio load state before play:',
                currentAudio ? currentAudio.state() : 'audio object is null',
              )

              if (currentAudio?.state() === 'loaded') {
                setTimeout(() => {
                  console.log('In timeout before playing extended clip')
                  if (!currentAudio.playing()) {
                    console.log(
                      'Attempting to play extended clip:',
                      updatedClip.clip_id,
                    )
                    currentAudio.play()
                    console.log('Extended clip play initiated')
                    currentAudio.volume(descriptionVolumeRef.current / 100)
                  } else {
                    console.log('Extended clip already playing')
                  }
                }, 50)
              } else {
                console.log('Extended audio not loaded, waiting for load event')
                currentAudio?.once('load', function () {
                  console.log('Extended audio loaded event fired')
                  setTimeout(() => {
                    if (!currentAudio.playing()) {
                      console.log('Attempting to play extended clip after load')
                      currentAudio.play()
                      console.log('Extended clip play initiated after load')
                      currentAudio.volume(descriptionVolumeRef.current / 100)
                    }
                  }, 50)
                })
              }

              setCurrExtendedAC(currentAudio)

              // Event listeners for play and end
              currentAudio?.once('play', () => {
                currentAudio.volume(descriptionVolumeRef.current / 100)
              })

              currentAudio?.once('end', () => {
                setCurrExtendedAC(undefined)
                currentEvent?.playVideo()
                currentAudio.unload()
                setCurrentExtACPaused(false)
              })

              // Load next clip into stack
              const newClip =
                audioClips[currentClipIndexRef.current + (clipStackSize - 1)]

              if (newClip) {
                newClip.clip_audio = new Howl({
                  src: newClip.clip_audio_path,
                  html5: true,
                })
                setClipStack([
                  ...clipStackRef.current.slice(1, clipStackSize),
                  newClip,
                ])
              } else {
                setClipStack([...clipStackRef.current.slice(1, clipStackSize)])
              }
            }
          }
        }
        // Handle INLINE playback
        else if (
          updatedClip.playback_type === 'inline' &&
          ((updatedClip.clip_start_time <= currentTimeRef.current &&
            updatedClip.clip_end_time >= currentTimeRef.current) ||
            (updatedClip.clip_start_time <= currentTimeRef.current &&
              updatedClip.clip_start_time >= previousTimeRef.current))
        ) {
          console.warn(
            'An inline clip is supposed to be playing right now',
            currentTimeRef.current,
          )

          // If an Inline Clip is Playing - Return
          if (currentInlineACRef.current?.playing()) {
            console.info('An inline clip is already playing')
            return
          }

          // If the clip is not playing, play it
          console.info('Playing clip by Seeking to current time')

          // Play the inline clip
          const currentAudio = updatedClip.clip_audio
          const seekTime = currentTimeRef.current - updatedClip.clip_start_time

          // Ensure seek time is within valid range
          if (seekTime < 0) {
            console.debug('Seek time is negative, skipping')
            return
          }

          console.debug(`Seeking to ${seekTime} seconds`)

          // Check if audio is loaded and play with a small buffer delay
          if (currentAudio?.state() === 'loaded') {
            currentAudio.seek(seekTime)
            // Add small delay before playing to prevent start cutoff
            setTimeout(() => {
              currentAudio.play()
              currentAudio.volume(descriptionVolumeRef.current / 100)
            }, 50)
          } else {
            // Wait for audio to load first
            currentAudio?.once('load', function () {
              currentAudio.seek(seekTime)
              setTimeout(() => {
                currentAudio.play()
                currentAudio.volume(descriptionVolumeRef.current / 100)
              }, 50)
            })
          }

          setCurrInlineAC(currentAudio)

          setPlayedAudioClip(updatedClip.clip_id)
          setRecentAudioPlayedTime(currentTimeRef.current)
          const clipAudioPath = updatedClip.clip_audio_path

          if (clipAudioPath !== playedClipPath) {
            setCurrentClipIndex(currentClipIndexRef.current + 1)
            setPlayedClipPath(clipAudioPath)

            // Event listeners for play and end
            currentAudio?.once('play', () => {
              currentAudio.volume(descriptionVolumeRef.current / 100)
            })

            currentAudio?.once('end', () => {
              setCurrInlineAC(undefined)
              currentAudio.unload()
            })

            // Load a new clip and add it to the stack
            const newClip =
              audioClips[currentClipIndexRef.current + clipStackSize - 1]

            if (newClip) {
              newClip.clip_audio = new Howl({
                src: newClip.clip_audio_path,
                html5: true,
              })
              setClipStack([
                ...clipStackRef.current.slice(1, clipStackSize),
                newClip,
              ])
            } else {
              setClipStack([...clipStackRef.current.slice(1, clipStackSize)])
            }
          }
        }

        // Check for Skips - This usually occurs when an extended clip was overlapped by an inline clip
        if (
          updatedClip.playback_type === 'extended' &&
          !currentInlineACRef.current?.playing() &&
          !currentExtendedACRef.current?.playing() &&
          updatedClip.clip_start_time <= currentTimeRef.current
        ) {
          // A skip has most likely occurred
          console.error('SKIP DETECTED - DETAILED', {
            clipId: updatedClip.clip_id,
            clipStartTime: updatedClip.clip_start_time,
            currentTime: currentTimeRef.current,
            previousTime: previousTimeRef.current,
            audioState: updatedClip.clip_audio
              ? updatedClip.clip_audio.state()
              : 'unknown',
            audioUrl: updatedClip.clip_audio_path,
            inlineClipPlaying: !!currentInlineACRef.current?.playing(),
            extendedClipPlaying: !!currentExtendedACRef.current?.playing(),
            youtubeState: currentEvent?.getPlayerState(),
          })

          // Add a new clip to the stack
          const newClip =
            audioClips[currentClipIndexRef.current + (clipStackSize - 1)]

          if (newClip) {
            newClip.clip_audio = new Howl({
              src: newClip.clip_audio_path,
              html5: true,
            })
            setClipStack([
              ...clipStackRef.current.slice(1, clipStackSize),
              newClip,
            ])
          } else {
            setClipStack([...clipStackRef.current.slice(1, clipStackSize)])
          }
        }
      } catch (error) {
        console.error('Error checking playback type:', error)
      }
    }
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
      case 1: // Playing
        // If the difference between current time and previous time is greater than 0.2 seconds, update the clip stack
        if (Math.abs(currentTime - previousYTTime) > 0.2) {
          console.info('User has potentially seeked to a different time')
          setPreviousYTTime(currentTime)
          updateClipStackData()
        }
        // Case for Extended Audio Clips:
        // When an extended Audio Clip is playing, YT video is paused
        // User plays the YT Video. Extended is still played along with the video. Overlapping with Dialogs &/ other audio clips
        // Work around - add current extended audio clip to a state variable & check if YT state is changed to playing i.e. 1
        // if yes, stop playing the extended audio clip & set the state back to null
        if (!isActive) setIsActive(true) //if the timer is paused it will start again when the video plays
        if (currExtendedAC) {
          // to stop playing -> pause and set time to 0
          currExtendedAC.pause()
          currExtendedAC.seek(0)
          setCurrExtendedAC(undefined)
        }
        if (currInlineAC) {
          // to stop playing -> pause and set time to 0
          currInlineAC.play()
          currInlineAC.on('end', function () {
            setCurrInlineAC(undefined) // setting back to null, as it is played completely.
          })
          // currInlineAC.currentTime = 0;
          // setCurrInlineAC(null);
        }
        clearInterval(timer)
        break
      case 2: // Paused
        // If the difference between current time and previous time is greater than 0.2 seconds, update the clip stack
        if (Math.abs(currentTime - previousYTTime) > 0.2) {
          console.info('User has potentially seeked to a different time')
          setPreviousYTTime(currentTime)
          updateClipStackData()
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
      case 3: // Buffering
        // onSeek - Buffering event is also called
        // so that when user wants to go back and play the same clip again, recentAudioPlayedTime will be reset to 0.
        setPlayedClipPath('')
        setPlayedAudioClip('')
        console.info('Buffering (on seek)')
        setRecentAudioPlayedTime(0.0)
        clearInterval(timer)
        updateClipStackData()
        setCurrExtendedAC(undefined)
        setCurrInlineAC(undefined)
        break
      default: // All other states
        clearInterval(timer)
        break
    }
  }
  const onReady = (event: any) => {
    setCurrentEvent(event.target)
  }
  const onPlay = (event: any) => {
    setCurrentEvent(event.target)
    setCurrentTime(event.target.getCurrentTime())
    // pass the current time & recentAudioPlayedTime - to avoid playing same clip multiple times
    if (descriptionsActive) {
      setTimer(
        setInterval(
          () =>
            updateTime(
              event.target.getCurrentTime(),
              playedAudioClip,
              recentAudioPlayedTime,
              playedClipPath,
            ),
          samplingRate,
        ),
      )
    }
  }
  const onPause = (event: any) => {
    event.target.pauseVideo()
  }

  const updateClipStackData = useCallback(() => {
    // console.log('Updating Clip Stack | Current Time =', currentTimeRef.current)

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
        })
        clipStackData.push(clip)
      }
    }
    // Update clipStack
    setClipStack(clipStackData)
  }, [audioClips, setCurrentClipIndex, clipStackSize])

  //
  //
  // END OF YDX FUNCTIONS
  //
  //

  useEffect(() => {
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

    describerIds.forEach((describerId, i) => {
      describerCards.push(
        <DescriberCard
          key={i}
          handleDescriberChange={handleDescriberChange}
          handleRatingPopup={handleRatingPopup}
          handleFeedbackPopup={handleFeedbackPopup}
          handleNewCollabEdit={handleNewCollabEdit}
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
            describers[describerId].collaborative_edit &&
            (!describers[describerId].depth ||
              describers[describerId].depth < 3) &&
            checkUserCanCollaborate(describers, describerId)
          }
          contributions={describers[describerId].contributions}
        />,
      )
    })

    setDescriberCards(describerCards)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioDescriptionsIdsUsers, selectedADId])

  const checkUserCanCollaborate = (ads: any, selectedDescriberId: string) => {
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
  const handleNewCollabEdit = async (describerId: string) => {
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
            oldDescriberId: selectedADId,
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
        const collabUrl = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/create-collaborative-ad`
        const collabResponse = await axios.post(
          collabUrl,
          {
            describerId: describerId, // Pass the describerId to the API
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        navigate(`/editor/${data.url}`)
      } catch (error) {
        // console.log(error)
        toast.error('Something went wrong, please try again later')
      }
    }
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

  const handlePreviewAudioDescription = async () => {
    try {
      setButtonLoading(true)
      if (requestAiDescription && requestAiDescription.aiDescriptionId)
        navigate(
          `/audio-description/preview/${videoId}/${requestAiDescription.aiDescriptionId}`,
        )
    } catch (error) {
      if (toastId.current) toast.dismiss(toastId.current)
      toast.error('Something went wrong, please try again later')
      // console.log(error)
    } finally {
      setButtonLoading(false)
    }
  }
  const handleGenerateAIDescriptions = async () => {
    if (!userDataStore.getState().isSignedIn) {
      toast.error(
        translate(
          'You have to be logged in in order to ask for AI Descriptions',
        ),
      )
    }
    //const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/request-ai-descriptions-with-gpu`
    const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/request-ai-descriptions-with-lana`

    try {
      setRequestAiDescription({
        status: 'pending',
        requested: true,
      })
      const response = await axios.post(
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
      const data = response.data
      toast.success('AI Descriptions have been requested')
      // console.log('data for asdasd:: ', data)
    } catch (error) {
      // console.log(error)
      setRequestAiDescription({
        status: '',
        requested: false,
      })
      toast.error('Something went wrong, please try again later')
    }
  }

  const DescriptionButtons = () => {
    // console.log('inside description buttons')
    // console.log({ re: requestAiDescription.url })
    if (requestAiDescription.url) {
      // Go to descriptions with url
      return (
        <Button
          title={translate('Go to AI descriptions')}
          ariaLabel="Go to descriptions"
          text={translate('Go to AI descriptions')}
          color="w3-lime w3-block w3-margin-top"
          onClick={() => navigate(`/editor/${requestAiDescription.url}`)}
        />
      )
    } else if (requestAiDescription.status === 'available') {
      return (
        <Button
          title={translate('Preview Available Descriptions')}
          ariaLabel="Preview Available Descriptions"
          text={translate('Preview Available Descriptions')}
          color="w3-indigo w3-block w3-margin-top"
          onClick={() => handlePreviewAudioDescription()}
          disabled={requestAiDescription.requested || buttonLoading}
        />
      )
    } else if (requestAiDescription.requested) {
      return (
        <Button
          title={translate('AI Descriptions requested')}
          ariaLabel="AI Descriptions requested"
          text={translate('AI Descriptions requested')}
          color="w3-brown w3-block w3-margin-top"
          onClick={() => handleGenerateAIDescriptions()}
          disabled={requestAiDescription.requested}
        />
      )
    } else if (!requestAiDescription.requested) {
      return (
        <>
          <Button
            title={translate('Request AI Descriptions')}
            ariaLabel="Request AI Descriptions"
            text={translate('Request AI Descriptions')}
            color="w3-light-blue w3-block w3-margin-top"
            disabled={requestAiDescription.requested}
            onClick={() => handleGenerateAIDescriptions()}
          />
        </>
      )
    } else {
      return <></>
    }
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
                display: Object.keys(audioDescriptionsIdsUsers).length
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
                  text={translate('Turn off descriptions')}
                  color="w3-indigo w3-block w3-margin-top"
                  ariaLabel="Turn off descriptions for this video"
                  onClick={handleTurnOffDescriptions}
                />
                <Button
                  title={translate('Add a new description for this video')}
                  ariaLabel="Add a new description for this video"
                  text={translate('Add Freestyle Description')}
                  color="w3-yellow w3-block w3-margin-top"
                  onClick={() => handleAddDescription()}
                  disabled={requestAiDescription.requested}
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
              display: Object.keys(audioDescriptionsIdsUsers).length
                ? 'none'
                : 'block',
            }}
          >
            <div className="w3-card-2">
              {requestAiDescription.url ? (
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
              <Button
                title={translate('Add a new description for this video')}
                text={translate('Add Freestyle Description')}
                ariaLabel="Add a new description for this video"
                color="w3-yellow w3-block w3-margin-top"
                onClick={() => handleAddDescription()}
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
