import { translate } from '@/App'
import ShareBar from '@/features/Video/ShareBar/ShareBar'
import Button from '@/shared/components/Button/Button'
import Spinner from '@/shared/components/Spinner/Spinner'
import {
  apiUrl,
  audioClipsUploadsPath,
  youTubeApiKey,
  youTubeApiUrl,
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
import { ToastContainer } from 'react-toastify'
import YouTube from 'react-youtube'
import { Options, YouTubePlayer } from 'youtube-player/dist/types'
import './video.scss'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Howl } from 'howler'
import convertClipObject, {
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

interface YDXVideoState {
  clipID: string
  currentTime: number
  previousTime: number
  currentClipIndex: number
  setClipID: (clipID: string) => void
  setStoreCurrentTime: (time: number) => void
  setStorePreviousTime: (time: number) => void
  setCurrentClipIndex: (newIndex: number) => void
}

const useVideoStore = create<YDXVideoState>()(
  devtools((set) => ({
    clipID: '',
    currentTime: 0.0,
    previousTime: 0.0,
    currentClipIndex: 0,
    setClipID: (clipID: string) =>
      set((state) => ({ ...state, clipID: clipID })),
    setStoreCurrentTime: (time: number) =>
      set((state) => ({ ...state, currentTime: time })),
    setStorePreviousTime: (time: number) =>
      set((state) => ({ ...state, previousTime: time })),
    setCurrentClipIndex: (newIndex: number) =>
      set((state) => ({ ...state, currentClipIndex: newIndex })),
  })),
)

const Video = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedADId, setSelectedADId] = useState<string>('')

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
  const [descriptionVolume, setDescriptionVolume] = useState(50)
  const [youTubeVolume, setYouTubeVolume] = useState(50)

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
  const [samplingRate, setSamplingRate] = useState(100)

  // Zustand State
  const [previousTime, setPreviousTime] = useState(0.0)
  const [clipStack, setClipStack] = useState<Clip[]>([])
  const [clipStackSize, setClipStackSize] = useState<number>(5)

  const clipStackRef = useRef(clipStack)

  const setClipID = useVideoStore((state) => state.setClipID)
  const clipIDRef = useRef(useVideoStore.getState().clipID)

  const currentTimeRef = useRef(useVideoStore.getState().currentTime)
  const setStoreCurrentTime = useVideoStore(
    (state) => state.setStoreCurrentTime,
  )

  const previousTimeRef = useRef(useVideoStore.getState().previousTime)
  const setStorePreviousTime = useVideoStore(
    (state) => state.setStorePreviousTime,
  )

  const currentClipIndexRef = useRef(useVideoStore.getState().currentClipIndex)
  const setCurrentClipIndex = useVideoStore(
    (state) => state.setCurrentClipIndex,
  )

  const currentInlineACRef = useRef(currInlineAC)
  const currentExtendedACRef = useRef(currExtendedAC)

  const currentEventRef = useRef(currentEvent)

  const [previousYTTime, setPreviousYTTime] = useState(0.0)

  // Update Refs

  useEffect(
    () =>
      useVideoStore.subscribe((state) => {
        clipIDRef.current = state.clipID
        currentTimeRef.current = state.currentTime
        previousTimeRef.current = state.previousTime
        currentClipIndexRef.current = state.currentClipIndex
      }),
    [],
  )

  useEffect(() => {
    clipStackRef.current = clipStack
  }, [clipStack])

  useEffect(() => {
    currentEventRef.current = currentEvent
  }, [currentEvent])

  useEffect(() => {
    currentInlineACRef.current = currInlineAC
    currentExtendedACRef.current = currExtendedAC
  }, [currInlineAC, currExtendedAC])

  useEffect(() => {
    if (currentInlineACRef.current?.playing()) {
      currentInlineACRef.current?.volume(descriptionVolume / 100)
    }
    if (currentExtendedACRef.current?.playing()) {
      currentExtendedACRef.current?.volume(descriptionVolume / 100)
    }
  }, [descriptionVolume])

  useEffect(() => {
    if (currentEventRef && currentInlineACRef.current?.playing()) {
      currentEventRef.current?.setVolume(youTubeVolume)
    }
  }, [youTubeVolume])
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
    if (videoId) {
      fetchVideoData()
    }
  }, [])

  const fetchVideoData = () => {
    const url = `${apiUrl}/videos/${videoId}`
    ourFetch(url)
      .then((res) => {
        parseVideoData(res.result)
      })
      .catch((err) => {
        console.log(err)
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
    console.log('Selected AD', selectedAd)

    if (
      audioDescriptionsIds?.length &&
      audioDescriptionsIds?.indexOf(selectedAd) === -1
    ) {
      console.log('Navigating to Not Found')
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

    // console.log('Sorted Clips', sortedClipData)

    setAudioClips([...sortedClipData])
    const maxStackSize = sortedClipData.length > 100 ? 10 : 5
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
    // console.log('6 -> getYTVideoInfo');
    const url = `${youTubeApiUrl}/videos?id=${videoId}&part=contentDetails,snippet,statistics&forUsername=iamOTHER&key=${youTubeApiKey}`

    // Use custom fetch for cross-browser compatability
    ourFetch(url)
      .then((data: any) => {
        const videoDurationInSeconds = convertISO8601ToSeconds(
          data.items[0].contentDetails.duration,
        )
        setVideoTitle(data.items[0].snippet.title)
        setVideoAuthor(data.items[0].snippet.channelTitle)
        // TODO: Add Helper Function
        setVideoPublishedAt(
          convertISO8601ToDate(data.items[0].snippet.publishedAt),
        )
        setVideoLikes(
          convertLikesToCardFormat(data.items[0].statistics.likeCount),
        )
        setVideoDescription(data.items[0].snippet.description)
        setVideoViews(
          convertViewsToCardFormat(data.items[0].statistics.viewCount),
        )
        setVideoDurationInSeconds(videoDurationInSeconds)
        // TODO: Add Helper Function
        // setVideoDurationToDisplay(
        //   convertSecondsToEditorFormat(videoDurationInSeconds),
        // )
        document.title = `YouDescribe - ${data.items[0].snippet.title}`
        setShowSpinner(false)
      })
      .catch((err) => {
        console.log('Unable to load the video you are trying to edit.', err)
        alert(
          'Thank you for visiting YouDescribe. This video is not viewable at this time due to YouTube API key limits. Our key is reset by Google at midnight Pacific time.',
        )
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
    setStoreCurrentTime(time)
    // check if the audio is not played recently. do not play it again.
    if (recentAudioPlayedTime !== time) {
      // To Play audio files based on current time
      playAudioAtCurrentTime(time, playedAudioClip, playedClipPath)
    }
    setPreviousTime(time)
    setStorePreviousTime(time)
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

      // If an inline clip is supposed to be playing right now but the user has either skipped to a time in the middle of the clip
      // Or there was an overlap which caused the start time of the clip to be skipped
      // Play the clip by seeking to the current time
      if (
        clipStackRef.current[0].clip_start_time <= currentTimeRef.current &&
        clipStackRef.current[0].clip_end_time >= currentTimeRef.current
      ) {
        console.warn('An inline clip is supposed to be playing right now')
        if (currentInlineACRef.current?.playing()) {
          console.info('An inline clip is already playing')
          return
        }
        console.info('Playing inline clip by Seeking to current time')
        // Play Inline Clip
        const currentFilteredClip = clipStackRef.current[0]
        setCurrentClipIndex(currentClipIndexRef.current + 1)
        setPlayedAudioClip(currentFilteredClip.clip_id)
        //  update recentAudioPlayedTime - which stores the time at which an audio has been played - to stop playing the same audio twice concurrently
        setRecentAudioPlayedTime(currentTimeRef.current)
        const clipAudioPath = currentFilteredClip.clip_audio_path
        // play along with the video if the clip is an inline clip
        if (currentFilteredClip.playback_type === 'inline') {
          if (clipAudioPath !== playedClipPath) {
            setPlayedClipPath(clipAudioPath)
            // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
            const currentAudio = currentFilteredClip.clip_audio
            if (
              currentAudio?.playing() ||
              currentFilteredClip.clip_id === clipIDRef.current
            ) {
              return
            }
            currentAudio?.seek(
              currentTimeRef.current - currentFilteredClip.clip_start_time,
            )
            currentAudio?.play()
            // see onStateChange() - storing current inline clip.
            setCurrInlineAC(currentAudio)
            // Old YouTube Volume
            const oldVolume = await currentEvent?.getVolume()
            // ended event listener, to set the currInlineAC back to null
            currentAudio?.once('play', function () {
              setClipID(currentFilteredClip.clip_id)
              // Audio Ducking
              currentAudio.volume(descriptionVolume / 100)
              currentEvent?.setVolume(youTubeVolume)
            })
            currentAudio?.on('end', function () {
              setCurrInlineAC(undefined)
              // Restore old volume
              currentEvent?.setVolume(oldVolume ?? 100)
              // Unload current clip
              currentAudio.unload()
              // Load a new clip and add it to the stack
              const newClip =
                audioClips[currentClipIndexRef.current + clipStackSize - 1]
              console.log('New CLIP => ', newClip)
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
            })
          } else {
            if (
              clipAudioPath !== playedClipPath &&
              currentTimeRef.current <=
                currentFilteredClip.clip_start_time + 1.0
            ) {
              // Play extended clip if overlap is less than 1 second
              setPlayedClipPath(clipAudioPath)
              // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
              const currentAudio = currentFilteredClip.clip_audio
              currentEvent?.pauseVideo()
              if (!currentAudio?.playing()) {
                currentAudio?.play()
              }
              // see onStateChange() - storing current Extended Clip
              setCurrExtendedAC(currentAudio)
              currentAudio?.once('play', function () {
                currentAudio.volume(descriptionVolume / 100)
              })
              // youtube video should be played after the clip has finished playing
              // eslint-disable-next-line no-loop-func
              currentAudio?.on('end', function () {
                setCurrExtendedAC(undefined) // setting back to null, as it is played completely.
                currentEvent?.playVideo()
                // Unload current clip
                currentAudio.unload()
                setCurrentExtACPaused(false) // reset the play/pause state
                // Add a new clip to the stack
                const newClip = audioClips[currentClipIndexRef.current + 4]
                console.log('New CLIP => ', newClip)
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
                  setClipStack([
                    ...clipStackRef.current.slice(1, clipStackSize),
                  ])
                }
              })
            }
          }
        }
      }
      // Case for playing inline and extended clips when the player come across their start or end times
      // Compare current window with clip at current clip index
      if (
        clipStackRef.current[0].clip_start_time <= currentTimeRef.current &&
        clipStackRef.current[0].clip_start_time >= previousTimeRef.current
      ) {
        console.log('Current Clip Stack', clipStackRef.current)

        const currentFilteredClip = clipStackRef.current[0]
        setCurrentClipIndex(currentClipIndexRef.current + 1) // Update current clip index
        // Play the clip only if it wasn't played recently
        if (playedAudioClip !== currentFilteredClip.clip_id) {
          setPlayedAudioClip(currentFilteredClip.clip_id)
          //  update recentAudioPlayedTime - which stores the time at which an audio has been played - to stop playing the same audio twice concurrently
          setRecentAudioPlayedTime(currentTimeRef.current)
          const clipAudioPath = currentFilteredClip.clip_audio_path
          // play along with the video if the clip is an inline clip
          if (currentFilteredClip.playback_type === 'inline') {
            if (clipAudioPath !== playedClipPath) {
              setPlayedClipPath(clipAudioPath)
              // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
              const currentAudio = currentFilteredClip.clip_audio
              if (
                currentAudio?.playing() ||
                currentFilteredClip.clip_id === clipIDRef.current
              ) {
                return
              }
              currentAudio?.play()
              // see onStateChange() - storing current inline clip.
              setCurrInlineAC(currentAudio)
              // Old YouTube Volume
              const oldVolume = await currentEvent?.getVolume()
              // ended event listener, to set the currInlineAC back to null
              currentAudio?.once('play', function () {
                setClipID(currentFilteredClip.clip_id)
                // Audio Ducking
                currentAudio.volume(descriptionVolume / 100)
                currentEvent?.setVolume(youTubeVolume)
              })
              currentAudio?.on('end', function () {
                setCurrInlineAC(undefined)
                // Restore old volume
                currentEvent?.setVolume(oldVolume ?? 100)
                // Unload current clip
                currentAudio.unload()
                // Load a new clip and add it to the stack
                const newClip =
                  audioClips[currentClipIndexRef.current + clipStackSize - 1]
                console.log('New CLIP => ', newClip)
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
                  setClipStack([
                    ...clipStackRef.current.slice(1, clipStackSize),
                  ])
                }
              })
            }
          }
          // play after pausing the youtube video if the clip is an extended clip
          else if (currentFilteredClip.playback_type === 'extended') {
            if (clipAudioPath !== playedClipPath) {
              setPlayedClipPath(clipAudioPath)
              // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
              const currentAudio = currentFilteredClip.clip_audio
              currentEvent?.pauseVideo()
              currentAudio?.volume(descriptionVolume / 100)
              if (!currentAudio?.playing()) {
                currentAudio?.play()
              }
              // see onStateChange() - storing current Extended Clip
              setCurrExtendedAC(currentAudio)
              currentAudio?.once('play', function () {
                currentAudio.volume(descriptionVolume / 100)
              })
              // youtube video should be played after the clip has finished playing
              // eslint-disable-next-line no-loop-func
              currentAudio?.on('end', function () {
                setCurrExtendedAC(undefined) // setting back to null, as it is played completely.
                currentEvent?.playVideo()
                // Unload current clip
                currentAudio.unload()
                setCurrentExtACPaused(false) // reset the play/pause state
                // Add a new clip to the stack
                const newClip =
                  audioClips[currentClipIndexRef.current + clipStackSize - 1]
                console.log('New CLIP => ', newClip)
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
                  setClipStack([
                    ...clipStackRef.current.slice(1, clipStackSize),
                  ])
                }
              })
            }
          }
        }
      }
    }
  }

  // YouTube Player Functions
  const onStateChange = (event: any) => {
    const currentTime = event.target.getCurrentTime()
    setCurrentEvent(event.target)
    setCurrentTime(currentTime)
    setStoreCurrentTime(currentTime)
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
        setClipID('')
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
    setStoreCurrentTime(event.target.getCurrentTime())
    // pass the current time & recentAudioPlayedTime - to avoid playing same clip multiple times
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
  const onPause = (event: any) => {
    event.target.pauseVideo()
  }

  const updateClipStackData = useCallback(() => {
    console.log('Updating Clip Stack | Current Time =', currentTimeRef.current)

    const newClipIndex = audioClips.findIndex(
      (clip) =>
        clip.clip_start_time >= currentTimeRef.current ||
        (clip.clip_start_time < currentTimeRef.current &&
          clip.clip_end_time > currentTimeRef.current),
    )
    setCurrentClipIndex(newClipIndex)

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
  }, [audioClips, setCurrentClipIndex])

  //
  //
  // END OF YDX FUNCTIONS
  //
  //

  const getDescriberCards = () => {
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
          handleDescriberChange={() => {
            console.log('Handle Describer change')
          }}
          handleRatingPopup={() => {
            console.log('Handle Rating Popup')
          }}
          describerId={describerId}
          selectedDescriberId={selectedADId}
          picture={describers[describerId].picture}
          name={describers[describerId].name}
          overall_rating_average={
            describers[describerId].overall_rating_average
          }
          handleRating={() => {
            console.log('Handle Rating')
          }}
        />,
      )
    })

    return describerCards
  }

  return (
    <div id="video-page" className="video-page">
      <main role="main" className="video-page-main" title="Video page">
        <section id="video-area" className="video-area">
          <ToastContainer />
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
          <VideoPlayerControls
            descriptionVolume={descriptionVolume}
            setDescriptionVolume={setDescriptionVolume}
            youTubeVideoVolume={youTubeVolume}
            setYouTubeVideoVolume={setYouTubeVolume}
          />
        </section>
        <section
          id="video-info"
          className="classic-container w3-row video-info"
        >
          {/* <RatingPopup
            translate={this.props.translate}
            handleRatingSubmit={this.handleRatingSubmit}
            handleRatingPopupClose={this.handleRatingPopupClose}
          /> */}
          <div id="rating-success" className="rating-success" tabIndex={-1}>
            {translate('Thanks for rating this description!')}
          </div>
          {/* <FeedbackPopup
            translate={this.props.translate}
            handleFeedbackSubmit={this.handleFeedbackSubmit}
            handleFeedbackPopupClose={this.handleFeedbackPopupClose}
          /> */}
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
            {/* {this.props.location.query.show && (
              <RatingsInfoCard
                translate={this.props.translate}
                selectedAudioDescriptionId={
                  this.state.selectedAudioDescriptionId
                }
                audioDescriptionsIdsUsers={this.state.audioDescriptionsIdsUsers}
              />
            )} */}
          </div>
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
              {getDescriberCards()[0]}
              <hr aria-hidden="true" />
              <h3 className="classic-h3">
                {translate('Other description options')}
              </h3>
              {/* {describerCards.slice(1)} */}
              <Button
                title={translate('Turn off descriptions for this video')}
                text={translate('Turn off descriptions')}
                color="w3-indigo w3-block w3-margin-top"
                ariaLabel="Turn off descriptions for this video"
                // onClick={() => this.handleTurnOffDescriptions()}
              />
              <Button
                title={translate('Add a new description for this video')}
                ariaLabel="Add a new description for this video"
                text={translate('Add description')}
                color="w3-indigo w3-block w3-margin-top"
                // onClick={() => this.handleAddDescription()}
              />
            </div>
          </div>
          <div id="descriptions-off" className="w3-col l4 m4 descriptions-off">
            <div className="w3-card-2">
              <h3 className="classic-h3">{translate('Descriptions off')}</h3>
              <Button
                title={translate('Turn on descriptions for this video')}
                ariaLabel="Turn on descriptions for this video"
                text={translate('Turn on descriptions')}
                color="w3-indigo w3-block w3-margin-top"
                // onClick={() => this.handleTurnOnDescriptions()}
              />
            </div>
          </div>
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
              <h3 className="classic-h3">No descriptions available</h3>
              <Button
                title={translate('Request an audio description for this video')}
                ariaLabel="Request an audio description for this video"
                text={translate('Add to wish list')}
                color="w3-indigo w3-block w3-margin-top"
                // onClick={() => this.upVote()}
              />
              <Button
                title={translate('Add a new description for this video')}
                text={translate('Add description')}
                ariaLabel="Add a new description for this video"
                color="w3-indigo w3-block w3-margin-top"
                // onClick={() => this.handleAddDescription()}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Video
