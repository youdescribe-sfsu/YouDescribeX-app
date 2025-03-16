import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useElapsedTime } from 'use-elapsed-time'
import {
  useParams,
  useNavigate,
} from 'react-router-dom' /* to use params on the url */
import axios from 'axios'
import YouTube, { YouTubePlayer } from 'react-youtube'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import '../assets/css/home.css'
import '../assets/css/timer.css'
import AudioClip from '../features/Describe/AudioClip/AudioClip'
import Notes from '../features/Describe/Notes/Notes'
import convertSecondsToCardFormat from '../shared/utils/convertSecondsToCardFormat'
import InsertPublish from '../features/Describe/InsertPublish/InsertPublish'
import Buttons from '../features/Describe/Buttons/Buttons'
import Spinner from '../shared/components/Spinner/Spinner'
import { Howl } from 'howler'
import { debounce } from 'debounce'
import { useMemo } from 'react'
import convertClipObject, { Clip } from '../shared/utils/convertClipObject'
import { Options } from 'youtube-player/dist/types'
import { userDataStore } from '@/App'
import { Id, toast } from 'react-toastify'
import Button from 'react-bootstrap/Button'

const YDXHome = (): React.ReactElement => {
  /* to use params on the url and get userId & youtubeVideoId */
  const { audioDescriptionId, youtubeVideoId } = useParams()
  const participant_id = sessionStorage.getItem('id')
  const navigate = useNavigate()
  /* Options for YouTube video API */
  const opts: Options = {
    height: '265',
    width: '500',
    playerVars: {
      autoplay: 0,
      enablejsapi: 1,
      cc_load_policy: 1,
      controls: 0,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
    },
  }
  // use a reference for the #draggable-div to get the width and use in calculateDraggableDivWidth()
  const divRef1 = useRef<HTMLDivElement>(null)
  const divRef2 = useRef<HTMLDivElement>(null)
  const divRef3 = useRef<HTMLDivElement>(null)
  const [divWidths, setDivWidths] = useState({})

  // State Variables
  const [videoId, setVideoId] = useState('') // retrieved from db, stored to fetch audio_descriptions
  // const [audioDescriptionId, setAudioDescriptionId] = useState('') // retrieved from db, stored to fetch Notes & Audio Clips
  const [notesData, setNotesData] = useState('') // retrieved from db, stored to pass on to Notes Component
  const [videoLength, setVideoLength] = useState(0) // retrieved from db, stored to display as a label for the dialog timeline
  const [draggableDivWidth, setDraggableDivWidth] = useState(0.0) //stores width of #draggable-div
  const [currentEvent, setCurrentEvent] = useState<YouTubePlayer>() //stores YouTube video's event
  const [currentState, setCurrentState] = useState(-1) // stores YouTube video's PLAYING, CUED, PAUSED, UNSTARTED, BUFFERING, ENDED state values
  const [currentTime, setCurrentTime] = useState(0.0) //stores current running time of the YouTube video
  const [timer, setTimer] = useState<NodeJS.Timer>() // stores TBD
  const [unitLength, setUnitLength] = useState(0) // stores unit length based on the video length to maintain colored div's on the timelines
  const [draggableTime, setDraggableTime] = useState({ x: -3, y: 0 }) // stores the position of the draggable bar on the #draggable-div
  const [videoDialogTimestamps, setVideoDialogTimestamps] = useState<any[]>([]) // stores dialog-timestamps data for a video from backend db
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPublished, setIsPublished] = useState(true) // holds the published state of the Video & Audio Description
  const [isCollaborativeVersion, setCollaborativeVersion] = useState(false) // holds the Collaborative Version state of the Video & Audio Description
  const [audioClips, setAudioClips] = useState<Clip[]>([]) // stores list of Audio Clips data for a video from backend db
  const audioClipsListRef = useRef<HTMLDivElement>(null)
  // store current extended & inline Audio Clips to pause/play based on the YT video current state
  const [currExtendedAC, setCurrExtendedAC] = useState<Howl>() // see onStateChange() - stop extended ac, when Video is played.
  const [currInlineAC, setCurrInlineAC] = useState<Howl>() // see onStateChange() - stop Inline ac, when Video is paused.

  const [updateData, setUpdateData] = useState(false) // passed to child components to use in the dependency array so that data is fetched again after this variable is modified

  const [recentAudioPlayedTime, setRecentAudioPlayedTime] = useState(0.0) // used to store the time of a recent AD played to stop playing the same Audio twice concurrently - due to an issue found in updateTime() method because it returns the same currentTime twice or more
  const [playedAudioClip, setPlayedAudioClip] = useState('') // store clipId of the audio clip that is already played.
  const [playedClipPath, setPlayedClipPath] = useState('') // store clip_audio_path of the audio clip that is already played.
  // Spinner div
  const [showSpinner, setShowSpinner] = useState(false)
  const [undoDeletedClipInfo, setUndoDeletedClip] = useState(false)
  const [updatedDescriptions, setUpdatedDescriptions] = useState<{
    [key: string]: string
  }>({})

  // logic to show/hide the edit component and add it to a list along with clip Id
  // this hides one edit component when the other is opened
  const [editComponentToggleList, setEditComponentToggleList] = useState<
    { clipId: string; showEditComponent: boolean }[]
  >([])

  // handle clicks of new Inline & New Extended buttons placed beside Notes
  // pass as props to ButtonsComponent & InsertPublishComponent'
  const [handleClicksFromParent, setHandleClicksFromParent] = useState('')

  const [isCurrentExtACPaused, setCurrentExtACPaused] = useState(false) // Manages the play/pause state of an extended audio clip
  const [isGloballyPaused, setGloballyPaused] = useState(true) // Manages the global play/pause state

  const [isPlaying, setIsPlaying] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { elapsedTime } = useElapsedTime({ isPlaying })

  const storedValueAsNumber = Number(localStorage.getItem('Seconds'))
  const [seconds, setSeconds] = useState(
    Number.isInteger(storedValueAsNumber) ? storedValueAsNumber : 0,
  )
  const [isActive, setIsActive] = useState(false)
  const [user, setUser] = useState(userDataStore.getState().userId)

  const [needRefresh, setNeedRefresh] = useState(false)
  // const [clipDeleted, setClipDeleted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [samplingRate, setSamplingRate] = useState(100)

  // Previous time variable - Holds the value of previous time
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previousTime, setPreviousTime] = useState(0.0)
  const [clipStack, setClipStack] = useState<Clip[]>([])
  const [clipStackSize, setClipStackSize] = useState<number>(5)
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0)

  // Balancer value for volume controls
  const [descriptionVolume, setDescriptionVolume] = useState(
    parseInt(localStorage.getItem('descriptionVolume') || '50'),
  )
  const [youTubeVolume, setYouTubeVolume] = useState(
    parseInt(localStorage.getItem('youTubeVolume') || '100'),
  )
  const descriptionVolumeRef = useRef(descriptionVolume)
  const youTubeVolumeRef = useRef(youTubeVolume)

  const clipStackRef = useRef(clipStack)
  const clipIDRef = useRef(playedAudioClip)

  // Time Refs
  const currentTimeRef = useRef(currentTime)
  const previousTimeRef = useRef(previousTime)

  const currentClipIndexRef = useRef(currentClipIndex)
  // const setCurrentClipIndex = useClipIDStore(
  //   (state) => state.setCurrentClipIndex,
  // )

  const currentEventRef = useRef(currentEvent)
  const currentInlineACRef = useRef(currInlineAC)
  const currentExtendedACRef = useRef(currExtendedAC)

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

  function reset() {
    setSeconds(0)
    setIsActive(false)
  }

  useEffect(() => {
    setUser(userDataStore.getState().userId || '')
    setDivWidths({
      divRef1:
        (divRef1.current?.clientWidth ?? 1) / 3 +
        (divRef1.current?.clientWidth ?? 1) / 3,
      divRef2: (divRef1.current?.clientWidth ?? 1) / 3,
      divRef3: divRef2.current?.clientWidth,
      divRef4: divRef3.current?.clientWidth,
    })
    setShowSpinner(true)
    // set the toggle list back to empty if we are fetching the data again
    fetchUserVideoData() // use axios to get audio descriptions for the youtubeVideoId & userId passed to the url Params

    document.addEventListener('keyup', () => {
      setIsPlaying((prevIsPlaying) => !prevIsPlaying)
    })
    let interval: NodeJS.Timer | null = null
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1)
      }, 1000)
    } else if (!isActive && seconds !== 0) {
      if (interval !== null) {
        clearInterval(interval)
      }
    }
    return () => {
      if (interval !== null) {
        clearInterval(interval)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isActive,
    draggableDivWidth,
    unitLength,
    videoId,
    youtubeVideoId,
    // changing this state variable, will fetch user data again
    updateData, // to fetch data whenever updateData state is changed.
    setEditComponentToggleList,
  ])

  useEffect(() => {
    localStorage.setItem('Seconds', String(seconds))
    sessionStorage.setItem('User', user || '')
  }, [seconds, user])

  useEffect(() => {
    clipStackRef.current = clipStack
    // console.log('New Clip Stack', clipStack)
  }, [clipStack])

  useEffect(() => {
    currentEventRef.current = currentEvent
  }, [currentEvent])

  useEffect(() => {
    if (needRefresh) {
      fetchAudioDescriptionData(true)
      setNeedRefresh(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh])

  useEffect(() => {
    // console.log(user)
    // console.log(userDataStore.getState().userId)
    if (userDataStore.getState().userId !== sessionStorage.getItem('User')) {
      setSeconds(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // for calculating the draggable-div width of the timeline
  const calculateDraggableDivWidth = () => {
    // remove the left & right margin - leaving about 96% of the total width of the draggable-div
    const currWidth = divRef3?.current?.clientWidth ?? 1
    // const currWidth = 700;
    const draggableDivWidth = (96 * currWidth) / 100
    setDraggableDivWidth(draggableDivWidth)
    // could add this to change the unit length for every window resize.. commenting this for now
    // window.addEventListener('resize', () => {
    //   const newWidth = divRef.current.clientWidth;
    //   const draggableDivWidth = (96 * newWidth) / 100;
    //   setDraggableDivWidth(draggableDivWidth);
    // });
  }
  // calculate unit length of the timeline width based on video length
  const calculateUnitLength = (videoEndTime: number) => {
    const unitLength = draggableDivWidth / videoEndTime // let unitlength = 644 / 299;
    setUnitLength(unitLength)
  }

  // use axios and get dialog timestamps for the Dialog Timeline
  const fetchDialogData = () => {
    if (!videoId) return
    axios
      .get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/dialog-timestamps/get-video-dialog/${videoId}`,
      )
      .then((res) => {
        setShowSpinner(false)
        const dialogData = res.data
        return dialogData
      })
      .then((dialogData) => {
        setShowSpinner(false)
        const updatedDialogData: any[] = []
        dialogData.forEach((dialog: any) => {
          const x = dialog.dialog_start_time * unitLength
          const width = dialog.dialog_duration * unitLength
          const dialog_start_time = {
            dialog_seq_no: dialog.dialog_sequence_num,
            // dialog_end_time: dialog.dialog_end_time,
            controlledPosition: { x: x, y: 0 },
            width: width,
          }
          updatedDialogData.push(dialog_start_time)
        })
        setVideoDialogTimestamps(updatedDialogData)
      })
      .catch((err) => {
        // console.error(err.response.data);
        console.error('ERROR in fetchDialogData', err)

        setShowSpinner(true)
      })
  }

  // fetch videoId based on the youtubeVideoId which is later used to get audioClips
  const fetchUserVideoData = () => {
    axios
      .get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/videos/get-by-youtubeVideo/${youtubeVideoId}`,
      )
      .then((res) => {
        setShowSpinner(false)
        const video_id = res.data.video_id
        const video_length = res.data.video_length
        setVideoLength(video_length)
        setVideoId(video_id)
        return video_length
      })
      .then((video_length) => {
        setShowSpinner(false)
        // order of the below function calls is important
        calculateDraggableDivWidth() // for calculating the draggable-div width of the timeline
        calculateUnitLength(video_length) // calculate unit length of the timeline width based on video length
        setShowSpinner(true)
        fetchDialogData() // use axios and get dialog timestamps for the Dialog Timeline});
        setShowSpinner(true)
        fetchAudioDescriptionData()
      })
      .catch((err) => {
        // console.error(err.response.data);
        console.error('ERROR in fetchUserVideoData', err)

        setShowSpinner(true)
      })
  }

  // use axios to get audio descriptions for the videoId (set in fetchUserVideoData()) & userId passed to the url Params
  const fetchAudioDescriptionData = (isNewClipAdded = false) => {
    //  this API fetches the audioDescription and all related AudioClips based on the UserID & VideoID
    if (videoId && userDataStore.getState().userId && audioDescriptionId)
      axios
        .get(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-user-ad/${videoId}&${audioDescriptionId}`,
          {
            headers: {
              audiodescription: audioDescriptionId,
            },
            withCredentials: true,
          },
        )
        .then((res) => {
          setShowSpinner(false)
          // console.log('Audio Description Data', res.data)
          // setAudioDescriptionId(res.data.ad_id)
          setIsPublished(res.data.is_published)
          return res.data
        })
        .then((data) => {
          console.log({ data })
          setShowSpinner(false)
          setIsPublished(data.is_published)
          setCollaborativeVersion(data.is_collaborative_version)
          // data is nested - so AudioClips data is in res.data.Audio_Clips
          const audioClipsData: Clip[] = data.Audio_Clips.map((clip: any) =>
            convertClipObject(clip),
          )
          // data is nested - so Notes data is in res.data.Notes
          const notesData = data.Notes[0]
          // update the audio path for every clip row - the path might change later- TODO: change the server IP
          const tempArray: { clipId: string; showEditComponent: boolean }[] = []
          const date = new Date()
          const ONE_MIN = 60 * 1000
          if (audioClipsData.length > 100) {
            setClipStackSize(10)
          }
          audioClipsData.forEach((clip, i) => {
            // add a sequence number for every audio clip
            // console.log(clip)
            clip.clip_sequence_number = i + 1
            if (clip.clip_audio_path.startsWith('.')) {
              // Handle paths that start with a dot (old format)
              clip.clip_audio_path = clip.clip_audio_path.replace(
                '.',
                `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static`,
              )
            } else if (clip.clip_audio_path.startsWith('/')) {
              // Handle paths that start with a forward slash (new AI format)
              clip.clip_audio_path = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static${clip.clip_audio_path}`
            } else {
              // Add default case for any other formats
              clip.clip_audio_path = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static/${clip.clip_audio_path}`
            }

            // set the showEditComponent of the new clip to true.. compare time
            if (
              date.getTime() - new Date(clip.createdAt).getTime() <=
              ONE_MIN
            ) {
              // show Edit Component
              tempArray.push({
                clipId: clip.clip_id,
                showEditComponent: true,
              })
            } else {
              // logic to show/hide the edit component and add it to a list along with clip Id
              // this hides one edit component when the other is opened
              tempArray.push({
                clipId: clip.clip_id,
                showEditComponent: false,
              })
            }
          })

          if (editComponentToggleList.length === 0 || isNewClipAdded) {
            setEditComponentToggleList(tempArray)
          }
          setAudioClips([...audioClipsData])
          // console.log(audioClipsData)
          // // console.log("Audio Clips", audioClips);
          setNotesData(notesData)
          const maxStackSize =
            audioClipsData.length > 100
              ? 10
              : Math.min(audioClipsData.length, 5)
          const clipStackData = []
          for (let i = 0; i < maxStackSize; i++) {
            const clip = audioClipsData[i]
            clip.clip_audio = new Howl({
              src: clip.clip_audio_path,
              html5: true,
              preload: true, // Ensure preloading
              autoplay: false,
            })
            clip.clip_audio.load()
            clipStackData.push(clip)
          }
          setClipStack(clipStackData)
        })
        .catch((err) => {
          // console.error(err.response.data);
          console.error('ERROR in fetchAudioDescriptionData', err)

          setShowSpinner(true)
        })
  }

  const toastId = React.useRef<null | Id>(null)

  const fetchUndoDeletedClipData = async () => {
    const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/undo-last-deleted`
    try {
      const response = await axios.post(
        url,
        {
          youtubeVideoId: youtubeVideoId,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      const data = response.data
      setUndoDeletedClip(false)
      setNeedRefresh(true)
      navigate(`/editor/${data.clip.youtubeId}/${data.clip.audio_description}`)
      toast.success('Successfully retrieved and updated the last deleted clip!')
    } catch (error) {
      if (toastId.current) toast.dismiss(toastId.current)
      toast.error('Something went wrong, please try again later')
      // console.log(error)
    }
  }

  // function to update currentime state variable & draggable bar time.
  const updateTime = (
    time: number,
    playedAudioClip: string,
    recentAudioPlayedTime: number,
    playedClipPath: string,
  ) => {
    setCurrentTime(time)
    // for updating the draggable component position based on current time
    setDraggableTime({ x: unitLength * time, y: 0 })
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
          const prevelement = document.querySelectorAll('.green-border')
          // TODO: Convert to normal for loop
          prevelement.forEach((elem) => elem.classList.remove('green-border'))

          setPlayedAudioClip(currentFilteredClip.clip_id)
          //  update recentAudioPlayedTime - which stores the time at which an audio has been played - to stop playing the same audio twice concurrently
          setRecentAudioPlayedTime(currentTimeRef.current)
          const clipAudioPath = currentFilteredClip.clip_audio_path
          if (clipAudioPath !== playedClipPath) {
            // console.log('Updating Clip Index (inline clip)')
            setCurrentClipIndex(currentClipIndexRef.current + 1)
            setPlayedClipPath(clipAudioPath)
            // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
            const currentAudio = currentFilteredClip.clip_audio

            // // console.log('Playing inline clip')
            if (
              currentAudio?.playing() ||
              currentInlineACRef.current?.playing()
              // currentFilteredClip.clip_id === clipIDRef.current
            ) {
              // console.log('Clip is already playing')
              return
            }
            // // console.log(
            // //   'Seeking to',
            // //   currentTimeRef.current - currentFilteredClip.clip_start_time,
            // //   'seconds',
            // // )
            //
            // currentAudio?.seek(
            //   currentTimeRef.current - currentFilteredClip.clip_start_time,
            // )
            // currentAudio?.play()
            // // see onStateChange() - storing current inline clip.
            // setCurrInlineAC(currentAudio)

            const seekPosition =
              currentTimeRef.current - currentFilteredClip.clip_start_time

            if (currentAudio?.state() === 'loaded') {
              currentAudio.seek(seekPosition)
              // Add small delay before playing to prevent start cutoff
              setTimeout(() => {
                currentAudio.play()
                currentAudio.volume(descriptionVolumeRef.current / 100)
                setPlayedAudioClip(currentFilteredClip.clip_id)
              }, 50)
            } else {
              // Wait for audio to load first
              currentAudio?.once('load', function () {
                currentAudio.seek(seekPosition)
                setTimeout(() => {
                  currentAudio.play()
                  currentAudio.volume(descriptionVolumeRef.current / 100)
                  setPlayedAudioClip(currentFilteredClip.clip_id)
                }, 50)
              })
            }

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
          scrollToAudioClipCard(currentFilteredClip.clip_id)
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
          const prevelement = document.querySelectorAll('.green-border')
          // TODO: Convert to normal for loop
          prevelement.forEach((elem) => elem.classList.remove('green-border'))
          // Play the clip only if it wasn't played recently
          if (playedAudioClip !== currentFilteredClip.clip_id) {
            setPlayedAudioClip(currentFilteredClip.clip_id)
            //  update recentAudioPlayedTime - which stores the time at which an audio has been played - to stop playing the same audio twice concurrently
            setRecentAudioPlayedTime(currentTimeRef.current)
            const clipAudioPath = currentFilteredClip.clip_audio_path
            if (clipAudioPath !== playedClipPath) {
              setPlayedClipPath(clipAudioPath)
              // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
              setEditComponentToggleFunc(currentFilteredClip.clip_id, true)
              const currentAudio = currentFilteredClip.clip_audio
              currentEvent?.pauseVideo()
              // Check if audio is loaded and play with a small buffer delay
              if (currentAudio?.state() === 'loaded') {
                // Add small delay before playing to prevent start cutoff
                setTimeout(() => {
                  if (!currentAudio.playing()) {
                    currentAudio.play()
                    currentAudio.volume(descriptionVolumeRef.current / 100)
                  }
                }, 50)
              } else {
                // Wait for audio to load first
                currentAudio?.once('load', function () {
                  setTimeout(() => {
                    if (!currentAudio.playing()) {
                      currentAudio.play()
                      currentAudio.volume(descriptionVolumeRef.current / 100)
                    }
                  }, 50)
                })
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
          scrollToAudioClipCard(currentFilteredClip.clip_id)
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

  const scrollToAudioClipCard = (clipId: string) => {
    const element = document.getElementById(`audio-clip-card-${clipId}`)
    if (element) {
      const list = audioClipsListRef.current
      element?.classList.add('green-border')
      if (list) {
        const listTop = list.getBoundingClientRect().top
        const elementTop = element.offsetTop + 60
        const scrollTop = elementTop - listTop - list.clientTop
        list.scrollTo({ top: scrollTop, behavior: 'smooth' })
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
      case 0: // End of the video
        setGloballyPaused(true)
        setCurrentClipIndex(0) // Reset current clip index

        setPlayedAudioClip('')
        setPlayedClipPath('')
        setRecentAudioPlayedTime(0.0)
        setCurrInlineAC(undefined)
        setCurrExtendedAC(undefined)
        setIsActive(false) // Ensure the timer is paused
        clearInterval(timer)
        console.log('Video ended, states reset')
        break
      case 1: // Playing
        // Case for Extended Audio Clips:
        // When an extended Audio Clip is playing, YT video is paused
        // User plays the YT Video. Extended is still played along with the video. Overlapping with Dialogs &/ other audio clips
        // Work around - add current extended audio clip to a state variable & check if YT state is changed to playing i.e. 1
        // if yes, stop playing the extended audio clip & set the state back to null
        currentEvent?.setVolume(youTubeVolume)
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
        setGloballyPaused(false) // reset the play/pause state
        clearInterval(timer)
        break
      case 2: // Paused
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
        setRecentAudioPlayedTime(0.0)
        clearInterval(timer)
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

  // Dialog Timeline Draggable Functions
  const stopProgressBar = async (
    event: DraggableEvent,
    position: DraggableData,
  ) => {
    setDraggableTime({ x: position.x, y: 0 })
    let progressBarTime = 0.0
    progressBarTime = position.x / unitLength
    currentEventRef.current?.seekTo(progressBarTime, true)
    const currentPlayerTime = await currentEventRef.current?.getCurrentTime()
    setPreviousTime(currentPlayerTime ?? 0)
  }
  const dragProgressBar = async (
    event: DraggableEvent,
    position: DraggableData,
  ) => {
    setDraggableTime({ x: position.x, y: 0 })
    let progressBarTime = 0.0
    progressBarTime = position.x / unitLength
    currentEventRef.current?.seekTo(progressBarTime, true)
    const currentPlayerTime = await currentEventRef.current?.getCurrentTime()
    setCurrentTime(currentPlayerTime ?? 0)
    setPreviousTime(currentPlayerTime ?? 0)
    setRecentAudioPlayedTime(0.0)
    setPlayedAudioClip('')
    setPlayedClipPath('')
    updateClipsDataCallback()
    if (currentExtendedACRef.current) {
      // to stop playing -> pause and set time to 0
      currentExtendedACRef.current.pause()
      currentExtendedACRef.current.seek(0)
      currentExtendedACRef.current.unload()
      setCurrExtendedAC(undefined)
      // currentEvent?.playVideo()
    }
    if (currentInlineACRef.current) {
      // to stop playing -> pause and set time to 0
      currentInlineACRef.current.pause()
      currentInlineACRef.current.seek(0)
      currentInlineACRef.current.unload()
      setCurrExtendedAC(undefined)
      // currentEvent?.playVideo()
    }
  }

  const updateClipStackData = useCallback(() => {
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

  const updateClipsDataCallback = useMemo(
    () =>
      debounce(() => {
        updateClipStackData()
      }, 500),
    [updateClipStackData],
  )

  // toggle Show Edit Component
  // logic to show/hide the edit component and add it to a list along with clip Id
  // this hides one edit component when the other is opened
  const setEditComponentToggleFunc = (clipId: string, value: boolean) => {
    const temp = [...editComponentToggleList]
    temp.forEach((data) => {
      if (value) {
        if (data.clipId === clipId) {
          data.showEditComponent = value
        }
      } else {
        // else case is used when false is passed to the function. If false, other edit components are not opened.
        if (data.clipId === clipId) {
          data.showEditComponent = value
        }
      }
    })
    setEditComponentToggleList(temp)
  }

  // when "AudioClip <seq no>" is clicked, video is playing from that audio clip start time
  const handlePlayAudioClip = (clipStartTime: number) => {
    currentEvent?.seekTo(clipStartTime - 0.4, true) // 0.4 is added for some buffering time
    currentEvent?.playVideo() // if paused, video is played from that audio clip.
  }

  const handlePlayPause = () => {
    if (currExtendedAC) {
      // If an extended clip exists, make it play/pause
      if (isCurrentExtACPaused) {
        currExtendedAC.play()
        setCurrentExtACPaused(false)
        setGloballyPaused(false)
      } else {
        currExtendedAC.pause()
        setCurrentExtACPaused(true)
        setGloballyPaused(true)
      }
    } else if (currentState === 1) {
      // If an extended clip does not exist make the YouTube video play/pause
      currentEvent?.pauseVideo()
      setGloballyPaused(true)
    } else {
      if (!isActive) setIsActive(true) //if the timer is paused it will start again when the video plays
      currentEvent?.playVideo()
      setGloballyPaused(false)
    }
  }

  const handleCopyClick = (textToCopy: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast.success('Text copied to clipboard!')
      })
      .catch((error) => {
        toast.error('Copy to clipboard failed: ' + error)
      })
  }

  const handleUnpublishClick = async (audioDescriptionId: string) => {
    if (!audioDescriptionId) {
      toast.error('Audio description ID is undefined!')
      return
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/unpublish-audio-description`,
        {
          audioDescriptionId: audioDescriptionId,
          youtube_id: youtubeVideoId,
        },
        {
          withCredentials: true,
        },
      )

      // Handle the response
      setIsPublished(false) // Update the published state
      setNeedRefresh(true) // Trigger a refresh if needed
      toast.success('Audio description unpublished successfully!')
    } catch (error) {
      console.error('Error unpublishing audio description:', error)
      toast.error('Error unpublishing audio description!')
    }
  }

  const handleSaveAllClips = async () => {
    setShowSpinner(true)
    try {
      for (const clip of audioClips) {
        const updatedDescription = updatedDescriptions[clip.clip_id]
        if (updatedDescription) {
          await handleClickSaveClipDescription(
            clip.clip_id,
            updatedDescription,
            clip.description_type,
          )
        }
      }

      // Calculate contributions after all clips are saved
      try {
        await axios.post(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/calculate-contributions`,
          {
            audioDescriptionId: audioDescriptionId,
          },
          {
            withCredentials: true,
          },
        )

        toast.success('Contributions Calculated Successfully!!')
      } catch (err) {
        console.error(err)
        toast.error(
          'An error occurred while calculating contributions. Please try again!!',
        )
      }

      toast.success('All Descriptions Saved Successfully!!')
    } catch (err) {
      toast.error(
        'An error occurred while saving all descriptions. Please try again!!',
      )
    } finally {
      setShowSpinner(false)
    }
  }

  // Function to save a single clip description
  const handleClickSaveClipDescription = async (
    clipId: string,
    updatedClipDescriptionText: string,
    clipDescriptionType: string | undefined,
  ) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-description/${clipId}`,
        {
          userId: user,
          youtubeVideoId,
          clipDescriptionText: updatedClipDescriptionText,
          clipDescriptionType: clipDescriptionType ?? '',
          audioDescriptionId,
        },
      )

      setUpdateData(!updateData)
    } catch (err: any) {
      if (err.response) {
        toast.error(err.response.data.message) // show toast message
      } else {
        console.error(err)
        toast.error('An error occurred. Please try again!!')
      }
    }
  }

  return (
    <div className="ydx-body ydx-html">
      {/* Spinner div - displayed based on showSpinner */}
      {showSpinner ? <Spinner /> : <></>}
      <div className="container home-container">
        {/* Youtube Iframe & Notes Component Container */}
        <div className="d-flex justify-content-around">
          <div className="text-white">
            <YouTube
              className="rounded"
              videoId={youtubeVideoId}
              opts={opts}
              onStateChange={onStateChange}
              onPlay={onPlay}
              onPause={onPause}
              onReady={onReady}
            />
          </div>
          <Buttons
            setHandleClicksFromParent={setHandleClicksFromParent}
            handlePlayPause={handlePlayPause}
            isGloballyPaused={isGloballyPaused}
            descriptionVolume={descriptionVolume}
            setDescriptionVolume={setDescriptionVolume}
            setYouTubeVolume={setYouTubeVolume}
            youTubeVolume={youTubeVolume}
          />
          <Notes
            currentTime={convertSecondsToCardFormat(currentTime)}
            audioDescriptionId={audioDescriptionId || ''}
            notesData={notesData}
            handleVideoPause={async () => {
              const currentState = await currentEvent?.getPlayerState()
              if (currentState === 1) {
                handlePlayPause()
              }
            }}
          />
        </div>
        <hr className="m-2 ydx-hr" />
        {/* Dialog Timeline */}
        <div className="row div-below-hr">
          <div className="col-3 text-white" ref={divRef1}>
            <h6 className="dialog-timeline-text text-center fw-bolder">
              Dialog Timeline (
              {videoLength ? convertSecondsToCardFormat(videoLength) : 'N/A'}):
            </h6>
          </div>
          {videoLength && ( // Only render if videoLength is present
            <div className="col-7 mt-3" ref={divRef2}>
              <div className="row mx-1 timeline-div">
                <div id="draggable-div" className="draggable-div" ref={divRef3}>
                  {/* Dialog Timeline blue & white div's */}
                  {videoDialogTimestamps.map((dialog, key) => (
                    <Draggable
                      axis="x"
                      key={key}
                      position={dialog.controlledPosition}
                      bounds="parent"
                    >
                      <div
                        className="dialog-timestamps-div"
                        style={{
                          width: dialog.width,
                          height: '20px',
                        }}
                      ></div>
                    </Draggable>
                  ))}
                  {videoLength && ( // Only render if videoLength is present
                    // ProgressBar
                    <Draggable
                      axis="x"
                      bounds="parent"
                      defaultPosition={{ x: 0, y: 0 }}
                      position={draggableTime}
                      onDrag={(e, data) => {
                        dragProgressBar(e, data)
                      }}
                      onStop={(e, data) => {
                        stopProgressBar(e, data)
                      }}
                    >
                      <div tabIndex={0} className="progress-bar-div">
                        <p className="mt-5 text-white progress-bar-time">
                          {convertSecondsToCardFormat(currentTime)}
                        </p>
                      </div>
                    </Draggable>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="col-2 mt-3">
            <p className="text-white fw-bolder text-size">
              Audio Clips Count: {audioClips.length}
            </p>
            {undoDeletedClipInfo && ( // Render the undo button if there is deleted clip info
              <Button
                className="btn rounded btn-md text-white bg-warning ydx-button"
                onClick={fetchUndoDeletedClipData}
                // disabled={isPreviewAudioDescription}
              >
                <i className="fa fa-undo" /> {'  '} Undo Last Deleted
              </Button>
            )}
          </div>
        </div>

        {/* <div className="row">
          <div className="col-3 text-white" ref={divRef1}>
            <h6 className="dialog-timeline-text text-center fw-bolder">
              Sampling Rate:
            </h6>
          </div>
          <div className="col-3 text-white">
            <select class="form-select" aria-label="Select Sampling Rate" onChange={(e) => setSamplingRate(e.target.value)} value={samplingRate}>
              <option value={200}>1/5</option>
              <option value={100}>1/10</option>
              <option value={50}>1/20</option>
              <option value={20}>1/50</option>
              <option value={10}>1/100</option>
            </select>
          </div>
        </div> */}
        {/* Map Audio Clips Component */}
        {!isPublished && (
          <InsertPublish
            handleClicksFromParent={handleClicksFromParent}
            setHandleClicksFromParent={setHandleClicksFromParent}
            userId={user || ''}
            setShowSpinner={setShowSpinner}
            youtubeVideoId={youtubeVideoId || ''}
            currentTime={currentTime}
            videoLength={videoLength}
            audioDescriptionId={audioDescriptionId || ''}
            seconds={seconds}
            reset={reset}
            participantId={participant_id || ''}
            setNeedRefresh={setNeedRefresh}
          />
        )}
        <div
          className="audio-desc-component-list"
          id="audio-list"
          ref={audioClipsListRef}
        >
          {audioClips.map((clip, key) => (
            <AudioClip
              key={key}
              clip={clip}
              userId={user || ''}
              audioDescriptionId={audioDescriptionId || ''}
              youtubeVideoId={youtubeVideoId || ''}
              unitLength={unitLength}
              currentTime={currentTime}
              currentEvent={currentEvent}
              currentState={currentState}
              updateData={updateData}
              setUpdateData={setUpdateData}
              videoLength={videoLength}
              setShowSpinner={setShowSpinner}
              editComponentToggleList={editComponentToggleList}
              setEditComponentToggleFunc={setEditComponentToggleFunc}
              divWidths={divWidths}
              handlePlayAudioClip={handlePlayAudioClip}
              fetchUserVideoData={fetchUserVideoData}
              setNeedRefresh={setNeedRefresh}
              setUndoDeletedClip={setUndoDeletedClip}
              setUpdatedDescriptions={setUpdatedDescriptions}
            />
          ))}
        </div>

        {isPublished && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '20px',
              marginRight: '20px',
            }}
          >
            <button
              className="btn publish-bg text-white ydx-button ml-auto cursor-pointer"
              onClick={handleSaveAllClips}
            >
              <i className="fa fa-save" /> {'   '}
              Save All
            </button>
          </div>
        )}
        {isPublished && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '20px',
              marginRight: '20px',
            }}
          >
            <button
              className="btn publish-bg text-white ydx-button ml-auto cursor-pointer"
              style={{ marginRight: '10px' }}
              onClick={() => {
                handleUnpublishClick(audioDescriptionId!)
              }}
            >
              <i className="fa fa-times" /> {'   '}
              Unpublish
            </button>
            <button
              className="btn publish-bg text-white ydx-button ml-auto cursor-pointer"
              onClick={() => {
                handleCopyClick(`
          ${window.location.origin}/video/${youtubeVideoId}?
          ad=${audioDescriptionId}`)
              }}
            >
              <i className="fa fa-copy" /> {'   '}
              Copy Published Link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default YDXHome
