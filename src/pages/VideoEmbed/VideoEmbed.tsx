import { translate } from '@/App'
import Button from '@/shared/components/Button/Button'
import { apiUrl, audioClipsUploadsPath } from '@/shared/config'
import ourFetch from '@/shared/utils/ourFetch'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Id, ToastContainer } from 'react-toastify'
import YouTube from 'react-youtube'
import { Options, YouTubePlayer } from 'youtube-player/dist/types'
import './videoEmbed.scss'
import { Howl } from 'howler'
import {
  Clip,
  convertClassicClipObject,
} from '@/shared/utils/convertClipObject'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import VideoPlayerControls from '@/shared/components/VideoPlayerControls/VideoPlayerControls'
import { convertLikesToCardFormat } from '@/shared/utils/convertLikesToCardFormat'
import { convertISO8601ToDate } from '@/shared/utils/convertISO8601ToDate'
import { toast } from 'react-toastify'
import axios, { AxiosResponse } from 'axios'
import { Feedbacks, VideoDescriberRoot } from '../Video/video_describer'
import YouTubeService from '@/shared/utils/YouTubeService'

interface IADUserId {
  [key: string]: {
    overall_rating_votes_counter: number
    overall_rating_average: number
    overall_rating_votes_sum: number
    feedbacks: Feedbacks
    picture: string
    name: string
  }
}

const VideoEmbed = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedADId, setSelectedADId] = useState<string>('')
  const [describerCards, setDescriberCards] = useState<ReactNode[]>([])
  const [descriptionsActive, setDescriptionsActive] = useState(true)

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
  const [videoDescription, setVideoDescription] = useState('')
  const [videoViews, setVideoViews] = useState('')
  const [videoLikes, setVideoLikes] = useState('')
  const [videoDurationInSeconds, setVideoDurationInSeconds] = useState(0)

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
    preview?: boolean
  }>({
    status: 'notavailable',
    requested: false,
  })

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

  const parseVideoData = (videoData: VideoDescriberRoot) => {
    // TODO: Add Types
    const adIds: any[] = []
    const adIdsUsers: IADUserId = {}
    const adIdsAudioClips: any = {}

    if (
      videoData.audio_descriptions &&
      videoData.audio_descriptions.length > 0
    ) {
      videoData.audio_descriptions.forEach((ad) => {
        adIds.push(ad._id)

        // Initialize adIdsUsers[ad._id] as an object if it doesn't exist
        if (!adIdsUsers[ad._id]) {
          adIdsUsers[ad._id] = {
            overall_rating_votes_counter: ad.overall_rating_votes_counter,
            overall_rating_average: ad.overall_rating_votes_average,
            overall_rating_votes_sum: ad.overall_rating_votes_sum,
            feedbacks: ad.feedbacks,
            picture: ad.user.picture,
            name:
              ad.user.user_type && ad.user.user_type === 'AI'
                ? 'AI Description Draft'
                : ad.user.name,
          }
        } else {
          // If adIdsUsers[ad._id] already exists, update the name property conditionally
          adIdsUsers[ad._id].name =
            ad.user.user_type && ad.user.user_type === 'AI'
              ? 'AI Description Draft'
              : ad.user.name
        }

        // adIdsUsers[ad._id].overall_rating_votes_counter =
        //   ad.overall_rating_votes_counter;
        // adIdsUsers[ad._id].overall_rating_average = ad.overall_rating_votes_average;
        // adIdsUsers[ad._id].overall_rating_votes_sum = ad.overall_rating_votes_sum;
        // adIdsUsers[ad._id].feedbacks = ad.feedbacks as De[];
        adIdsAudioClips[ad._id] = []

        if (ad.audio_clips.length > 0) {
          ad.audio_clips.forEach((audioClip) => {
            // Check for undefined file_path or file_name and skip if missing
            if (!audioClip.file_path || !audioClip.file_name) {
              console.warn(
                `Missing file_path or file_name for audioClip:`,
                audioClip,
              )
              return // Skip this audio clip
            }

            const filePath = audioClip.file_path.replace(/^\./, '')
            audioClip.url = `${audioClipsUploadsPath(
              `${filePath}/${audioClip.file_name}`,
            )}`

            // Initialize adIdsAudioClips[ad._id] as an array if not defined
            if (!adIdsAudioClips[ad._id]) {
              adIdsAudioClips[ad._id] = []
            }

            adIdsAudioClips[ad._id].push(audioClip)
          })
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
      // navigate('/not-found')
    }
    setSearchParams((params) => {
      if (selectedAd) params.set('ad', selectedAd)
      return params
    })
    setSelectedADId(selectedAd ?? '')
    prepareAudioClips(selectedAd ?? '', adIdsAudioClips)
  }

  // Add this function after the other utility functions in Video.tsx
  const checkPlaybackTypeBeforePlaying = async (clip: Clip): Promise<Clip> => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/get-playback-type/${clip.clip_id}`,
        { withCredentials: true },
      )

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
      return clip
    } catch (error) {
      console.error('Error fetching current playback type:', error)
      return clip
    }
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
    if (
      clipStack.length === clipStackSize ||
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
    if (audioDescriptionsIdsUsers) {
      // console.log('Updating describer Cards')
      const describers = audioDescriptionsIdsUsers
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
    }
  }, [audioDescriptionsIdsUsers, selectedADId])

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

  return (
    <div className="video-embed-page">
      <main role="main" className="video-embed-page-main" title="Video page">
        <div id="video-area" className="video-embed-area">
          <div id="video" className="video-youtube">
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
          <div className="video-player">
            <VideoPlayerControls
              descriptionVolume={descriptionVolume}
              setDescriptionVolume={setDescriptionVolume}
              youTubeVideoVolume={youTubeVolume}
              setYouTubeVideoVolume={setYouTubeVolume}
            />
            <Button
              classNames="mt-5 mb-2"
              title={
                descriptionsActive
                  ? translate('Turn off descriptions for this video')
                  : translate('Turn on descriptions for this video')
              }
              text={
                descriptionsActive
                  ? translate('Turn off descriptions')
                  : translate('Turn on descriptions')
              }
              color="w3-indigo"
              ariaLabel={
                descriptionsActive
                  ? 'Turn off descriptions for this video'
                  : 'Turn on descriptions for this video'
              }
              onClick={
                descriptionsActive
                  ? handleTurnOffDescriptions
                  : handleTurnOnDescriptions
              }
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default VideoEmbed
