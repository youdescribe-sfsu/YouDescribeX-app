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

const VideoEmbed = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedADId, setSelectedADId] = useState<string>('')
  const [descriptionsActive, setDescriptionsActive] = useState(true)

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
    localStorage.setItem('descriptionVolume', descriptionVolume.toString())
  }, [descriptionVolume])

  useEffect(() => {
    if (currentEventRef && currentInlineACRef.current?.playing()) {
      currentEventRef.current?.setVolume(youTubeVolume)
    }
    localStorage.setItem('youTubeVolume', youTubeVolume.toString())
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
    // // console.log('6 -> getYTVideoInfo');
    const url = `${youTubeApiUrl}/videos?id=${videoId}&part=contentDetails,snippet,statistics&forUsername=iamOTHER&key=${youTubeApiKey}`

    // Use custom fetch for cross-browser compatability
    ourFetch(url)
      .then((data: any) => {
        // console.log(
        //   'Current Video Duration',
        //   data.items[0].contentDetails.duration,
        // )
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
        // console.log('Unable to load the video you are trying to edit.', err)
        toast.error(
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
    // check if the audio is not played recently. do not play it again.
    if (recentAudioPlayedTime !== time) {
      // To Play audio files based on current time
      playAudioAtCurrentTime(time, playedAudioClip, playedClipPath)
    }
    setPreviousTime(time)
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

      // If an inline clip is supposed to be playing right now but the user has either skipped to a time in the middle of the clip
      // Or there was an overlap which caused the start time of the clip to be skipped
      // Play the clip by seeking to the current time
      if (clipStackRef.current[0].playback_type === 'inline') {
        if (
          (clipStackRef.current[0].clip_start_time <= currentTimeRef.current &&
            clipStackRef.current[0].clip_end_time >= currentTimeRef.current) ||
          (clipStackRef.current[0].clip_start_time <= currentTimeRef.current &&
            clipStackRef.current[0].clip_start_time >= previousTimeRef.current)
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
          // Play Inline Clip
          const currentFilteredClip = clipStackRef.current[0]
          // console.log('Clip to be Played', currentFilteredClip)

          setPlayedAudioClip(currentFilteredClip.clip_id)
          //  update recentAudioPlayedTime - which stores the time at which an audio has been played - to stop playing the same audio twice concurrently
          setRecentAudioPlayedTime(currentTimeRef.current)
          const clipAudioPath = currentFilteredClip.clip_audio_path
          // console.log('PLaying clip', clipAudioPath)

          if (clipAudioPath !== playedClipPath) {
            // console.log('Updating Clip Index (inline clip)')
            setCurrentClipIndex(currentClipIndexRef.current + 1)
            setPlayedClipPath(clipAudioPath)
            // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
            const currentAudio = currentFilteredClip.clip_audio
            // console.log('Playing inline clip')
            if (
              currentAudio?.playing() ||
              currentInlineACRef.current?.playing()
              // currentFilteredClip.clip_id === clipIDRef.current
            ) {
              // console.log('Clip is already playing')
              return
            }
            // console.log(
            //   'Seeking to',
            //   currentTimeRef.current - currentFilteredClip.clip_start_time,
            //   'seconds',
            // )

            currentAudio?.seek(
              currentTimeRef.current - currentFilteredClip.clip_start_time,
            )
            currentAudio?.play()
            // see onStateChange() - storing current inline clip.
            setCurrInlineAC(currentAudio)

            // Load a new clip and add it to the stack
            // console.log('Current Clip Index', currentClipIndexRef.current)

            const newClip =
              audioClips[currentClipIndexRef.current + clipStackSize - 1]
            // console.log('New CLIP (seeked inline) => ', newClip)
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

            // ended event listener, to set the currInlineAC back to null
            currentAudio?.once('play', function () {
              setPlayedAudioClip(currentFilteredClip.clip_id)
              // Set AD Volume
              currentAudio.volume(descriptionVolumeRef.current / 100)
            })
            currentAudio?.once('end', function () {
              setCurrInlineAC(undefined)
              // Unload current clip
              currentAudio.unload()
            })
          }
        }
      }
      // Case for playing extended clips when the player come across their start or end times
      // Compare current window with clip at current clip index
      else {
        if (
          clipStackRef.current[0].clip_start_time <=
            currentTimeRef.current + 0.1 &&
          clipStackRef.current[0].clip_start_time >=
            previousTimeRef.current - 0.1
        ) {
          const currentFilteredClip = clipStackRef.current[0]
          // console.log('Updating Clip Index')
          setCurrentClipIndex(currentClipIndexRef.current + 1) // Update current clip index
          // Play the clip only if it wasn't played recently
          if (playedAudioClip !== currentFilteredClip.clip_id) {
            setPlayedAudioClip(currentFilteredClip.clip_id)
            //  update recentAudioPlayedTime - which stores the time at which an audio has been played - to stop playing the same audio twice concurrently
            setRecentAudioPlayedTime(currentTimeRef.current)
            const clipAudioPath = currentFilteredClip.clip_audio_path
            if (clipAudioPath !== playedClipPath) {
              setPlayedClipPath(clipAudioPath)
              // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
              const currentAudio = currentFilteredClip.clip_audio
              currentEvent?.pauseVideo()
              if (!currentAudio?.playing()) {
                currentAudio?.play()
              }
              // see onStateChange() - storing current Extended Clip
              setCurrExtendedAC(currentAudio)
              // Add a new clip to the stack
              // console.log('Current Clip Index', currentClipIndexRef.current)
              const newClip =
                audioClips[currentClipIndexRef.current + (clipStackSize - 1)]
              // console.log('New CLIP (normal extended) => ', newClip)
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
              // youtube video should be played after the clip has finished playing
              // eslint-disable-next-line no-loop-func
              currentAudio?.once('play', function () {
                currentAudio.volume(descriptionVolumeRef.current / 100)
              })
              currentAudio?.once('end', function () {
                setCurrExtendedAC(undefined) // setting back to null, as it is played completely.
                currentEvent?.playVideo()
                // Unload current clip
                currentAudio.unload()
                setCurrentExtACPaused(false) // reset the play/pause state
              })
            }
          }
        }
      }
      // Check for Skips - This usually occurs when an extended clip was overlapped by an inline clip
      if (
        clipStackRef.current[0].playback_type === 'extended' &&
        !currentInlineACRef.current?.playing() &&
        !currentExtendedACRef.current?.playing() &&
        clipStackRef.current[0].clip_start_time <= currentTimeRef.current
      ) {
        // A skip has most likely occurred
        console.error('SKIP DETECTED', clipStackRef.current[0])
        // Add a new clip to the stack
        // console.log('Current Clip Index', currentClipIndexRef.current)
        const newClip =
          audioClips[currentClipIndexRef.current + (clipStackSize - 1)]
        // console.log('New CLIP (normal extended) => ', newClip)
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
  }, [audioClips, setCurrentClipIndex])

  return (
    <div className="video-embed-page">
      <main role="main" className="video-embed-page-main" title="Video page">
        <div id="video-area" className="video-embed-area">
          {/* <ShareBar videoTitle={videoTitle} /> */}
          {/* <div id="video" className="video"> */}
          <div className="video-youtube">
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
          <div className="video-player">
            {/* <VideoPlayerControls
              descriptionVolume={descriptionVolume}
              setDescriptionVolume={setDescriptionVolume}
              youTubeVideoVolume={youTubeVolume}
              setYouTubeVideoVolume={setYouTubeVolume}
            /> */}
            <a
              id="imageLink"
              href={`http://youdescribe.org/video/${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                id="youDescribeImage"
                alt="Watch this video on YouDescribe"
                src="/assets/img/youdescribe_logo_full_(indigo_and_grey).png"
              />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

export default VideoEmbed
