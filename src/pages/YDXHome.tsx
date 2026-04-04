import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useElapsedTime } from 'use-elapsed-time'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import YouTube, { YouTubePlayer } from 'react-youtube'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import '../assets/css/home.css'
import '../assets/css/timer.css'
import AudioClip from '../features/Describe/AudioClip/AudioClip'
import Notes from '../features/Describe/Notes/Notes'
import convertSecondsToCardFormat from '../shared/utils/convertSecondsToCardFormat'
import InsertPublish from '../features/Describe/InsertPublish/InsertPublish'
import ClipsNavigator from '../features/Describe/ClipsNavigator/ClipsNavigator'
import { Buttons } from '../features/Describe/Buttons/Buttons'
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
  const { audioDescriptionId, youtubeVideoId } = useParams()
  const participant_id = sessionStorage.getItem('id')
  const navigate = useNavigate()

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

  const divRef1 = useRef<HTMLDivElement>(null)
  const divRef2 = useRef<HTMLDivElement>(null)
  const divRef3 = useRef<HTMLDivElement>(null)
  const [divWidths, setDivWidths] = useState({})

  // State Variables
  const [videoId, setVideoId] = useState('')
  const [notesData, setNotesData] = useState('')
  const [videoLength, setVideoLength] = useState(0)
  const [draggableDivWidth, setDraggableDivWidth] = useState(0.0)
  const [currentEvent, setCurrentEvent] = useState<YouTubePlayer>()
  const [currentState, setCurrentState] = useState(-1)
  const [currentTime, setCurrentTime] = useState(0.0)
  const [timer, setTimer] = useState<NodeJS.Timer>()
  const [unitLength, setUnitLength] = useState(0)
  const [draggableTime, setDraggableTime] = useState({ x: 0, y: 0 })
  const [videoDialogTimestamps, setVideoDialogTimestamps] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPublished, setIsPublished] = useState(false)
  const [isCollaborativeVersion, setCollaborativeVersion] = useState(false)
  const [audioClips, setAudioClips] = useState<Clip[]>([])
  const audioClipsListRef = useRef<HTMLDivElement>(null)
  const [currExtendedAC, setCurrExtendedAC] = useState<Howl>()
  const [currInlineAC, setCurrInlineAC] = useState<Howl>()
  const [updateData, setUpdateData] = useState(false)
  const [recentAudioPlayedTime, setRecentAudioPlayedTime] = useState(0.0)
  const [playedAudioClip, setPlayedAudioClip] = useState('')
  const [playedClipPath, setPlayedClipPath] = useState('')
  const [playedClipsSet, setPlayedClipsSet] = useState<Set<string>>(new Set())
  const [showSpinner, setShowSpinner] = useState(false)
  const [undoDeletedClipInfo, setUndoDeletedClip] = useState(false)
  const [updatedDescriptions, setUpdatedDescriptions] = useState<{ [key: string]: string }>({})
  const [editComponentToggleList, setEditComponentToggleList] = useState<
    { clipId: string; showEditComponent: boolean }[]
  >([])
  const [handleClicksFromParent, setHandleClicksFromParent] = useState('')
  const [isCurrentExtACPaused, setCurrentExtACPaused] = useState(false)
  const [isGloballyPaused, setGloballyPaused] = useState(true)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [samplingRate, setSamplingRate] = useState(100)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previousTime, setPreviousTime] = useState(0.0)
  const [clipStack, setClipStack] = useState<Clip[]>([])
  const [clipStackSize, setClipStackSize] = useState<number>(5)
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0)

  // ── Single-clip navigation ───────────────────────────────────────────────────
  const [navClipIndex, setNavClipIndex] = useState(0)
  const [isClipsListExpanded, setIsClipsListExpanded] = useState(false)

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
  const currentTimeRef = useRef(currentTime)
  const previousTimeRef = useRef(previousTime)
  const currentClipIndexRef = useRef(currentClipIndex)
  const currentEventRef = useRef(currentEvent)
  const currentStateRef = useRef(currentState)
  const currentInlineACRef = useRef(currInlineAC)
  const currentExtendedACRef = useRef(currExtendedAC)
  const savedClipRefreshRequestedRef = useRef(false)

  useEffect(() => {
    currentInlineACRef.current = currInlineAC
    currentExtendedACRef.current = currExtendedAC
  }, [currInlineAC, currExtendedAC])

  useEffect(() => {
    currentTimeRef.current = currentTime
    previousTimeRef.current = previousTime
  }, [currentTime, previousTime])

  useEffect(() => { clipIDRef.current = playedAudioClip }, [playedAudioClip])
  useEffect(() => { currentClipIndexRef.current = currentClipIndex }, [currentClipIndex])

  useEffect(() => {
    if (currentInlineACRef.current?.playing()) currentInlineACRef.current?.volume(descriptionVolume / 100)
    if (currentExtendedACRef.current?.playing()) currentExtendedACRef.current?.volume(descriptionVolume / 100)
    descriptionVolumeRef.current = descriptionVolume
    localStorage.setItem('descriptionVolume', descriptionVolume.toString())
  }, [descriptionVolume])

  useEffect(() => {
    if (currentEventRef) currentEventRef.current?.setVolume(youTubeVolume)
    youTubeVolumeRef.current = youTubeVolume
    localStorage.setItem('youTubeVolume', youTubeVolume.toString())
  }, [youTubeVolume, currentEventRef])

  useEffect(() => {
    if (unitLength > 0 && videoId) {
      setShowSpinner(true)
      fetchDialogData()
      setShowSpinner(true)
      fetchAudioDescriptionData()
    }
  }, [unitLength, videoId])

  function reset() {
    setSeconds(0)
    setIsActive(false)
  }

  useEffect(() => {
    setUser(userDataStore.getState().userId || '')
    setDivWidths({
      divRef1: (divRef1.current?.clientWidth ?? 1) / 3 + (divRef1.current?.clientWidth ?? 1) / 3,
      divRef2: (divRef1.current?.clientWidth ?? 1) / 3,
      divRef3: divRef2.current?.clientWidth,
      divRef4: divRef3.current?.clientWidth,
    })
    setShowSpinner(true)
    fetchUserVideoData()
    document.addEventListener('keyup', () => { setIsPlaying((prev) => !prev) })
    let interval: NodeJS.Timer | null = null
    if (isActive) {
      interval = setInterval(() => { setSeconds((s) => s + 1) }, 1000)
    } else if (!isActive && seconds !== 0) {
      if (interval !== null) clearInterval(interval)
    }
    return () => { if (interval !== null) clearInterval(interval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, draggableDivWidth, unitLength, videoId, youtubeVideoId, updateData, setEditComponentToggleList])

  useEffect(() => {
    localStorage.setItem('Seconds', String(seconds))
    sessionStorage.setItem('User', user || '')
  }, [seconds, user])

  useEffect(() => { clipStackRef.current = clipStack }, [clipStack])
  useEffect(() => { currentEventRef.current = currentEvent }, [currentEvent])
  useEffect(() => { currentStateRef.current = currentState }, [currentState])

  useEffect(() => {
    const handleSavedClipRefresh = () => {
      savedClipRefreshRequestedRef.current = true
    }

    window.addEventListener('ydx:new-clip-saved', handleSavedClipRefresh)

    return () => {
      window.removeEventListener('ydx:new-clip-saved', handleSavedClipRefresh)
    }
  }, [])

  useEffect(() => {
    if (needRefresh) {
      const isNewClipAdded = savedClipRefreshRequestedRef.current
      savedClipRefreshRequestedRef.current = false
      fetchAudioDescriptionData(isNewClipAdded, undefined, true)
      setNeedRefresh(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh])

  useEffect(() => {
    if (userDataStore.getState().userId !== sessionStorage.getItem('User')) setSeconds(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const calculateDraggableDivWidth = () => {
    const currWidth = divRef3?.current?.clientWidth ?? 1
    const w = (96 * currWidth) / 100
    setDraggableDivWidth(w)
    return w
  }

  const calculateUnitLength = (videoEndTime: number, draggableDivWidth: number) => {
    setUnitLength(draggableDivWidth / videoEndTime)
  }

  const fetchDialogData = () => {
    if (!videoId) return
    axios
      .get(`${process.env.REACT_APP_YDX_BACKEND_URL}/api/dialog-timestamps/get-video-dialog/${videoId}`)
      .then((res) => { setShowSpinner(false); return res.data })
      .then((dialogData) => {
        setShowSpinner(false)
        const updatedDialogData: any[] = []
        dialogData.forEach((dialog: any) => {
          updatedDialogData.push({
            dialog_seq_no: dialog.dialog_sequence_num,
            controlledPosition: { x: dialog.dialog_start_time * unitLength, y: 0 },
            width: dialog.dialog_duration * unitLength,
          })
        })
        setVideoDialogTimestamps(updatedDialogData)
      })
      .catch((err) => { console.error('ERROR in fetchDialogData', err); setShowSpinner(true) })
  }

  const fetchUserVideoData = () => {
    axios
      .get(`${process.env.REACT_APP_YDX_BACKEND_URL}/api/videos/get-by-youtubeVideo/${youtubeVideoId}`)
      .then((res) => {
        setShowSpinner(false)
        setVideoLength(res.data.video_length)
        setVideoId(res.data.video_id)
        return { video_id: res.data.video_id, video_length: res.data.video_length }
      })
      .then(({ video_id, video_length }) => {
        setShowSpinner(false)
        const calculatedWidth = calculateDraggableDivWidth()
        calculateUnitLength(video_length, calculatedWidth)
        fetchDialogData()
        fetchAudioDescriptionData(false, video_id)
      })
      .catch((err) => { console.error('ERROR in fetchUserVideoData', err); setShowSpinner(true) })
  }

  const fetchAudioDescriptionData = (isNewClipAdded = false, passedVideoId?: string) => {
    const effectiveVideoId = passedVideoId || videoId
    if (effectiveVideoId && userDataStore.getState().userId && audioDescriptionId)
      axios
        .get(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-user-ad/${effectiveVideoId}&${audioDescriptionId}`,
          { params: { preview: 'true' }, headers: { audiodescription: audioDescriptionId }, withCredentials: true },
        )
        .then((res) => { setShowSpinner(false); setIsPublished(res.data.is_published); return res.data })
        .then((data) => {
          setShowSpinner(false)
          setIsPublished(data.is_published)
          setCollaborativeVersion(data.is_collaborative_version)
          const audioClipsData: Clip[] = data.Audio_Clips.map((clip: any) => convertClipObject(clip))
          const notesData = data.Notes[0]
          const tempArray: { clipId: string; showEditComponent: boolean }[] = []
          const date = new Date()
          const ONE_MIN = 60 * 1000
          if (audioClipsData.length > 100) setClipStackSize(10)
          audioClipsData.forEach((clip, i) => {
            clip.clip_sequence_number = i + 1
            if (clip.clip_audio_path.startsWith('.')) {
              clip.clip_audio_path = clip.clip_audio_path.replace('.', `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static`)
            } else if (clip.clip_audio_path.startsWith('/')) {
              clip.clip_audio_path = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static${clip.clip_audio_path}`
            } else {
              clip.clip_audio_path = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static/${clip.clip_audio_path}`
            }
            tempArray.push({
              clipId: clip.clip_id,
              showEditComponent: date.getTime() - new Date(clip.createdAt).getTime() <= ONE_MIN,
            })
          })
          if (editComponentToggleList.length === 0 || isNewClipAdded) setEditComponentToggleList(tempArray)
          setAudioClips([...audioClipsData])
          setNotesData(notesData)
          const maxStackSize = audioClipsData.length > 100 ? 10 : Math.min(audioClipsData.length, 5)
          const clipStackData = []
          for (let i = 0; i < maxStackSize; i++) {
            const clip = audioClipsData[i]
            clip.clip_audio = new Howl({ src: clip.clip_audio_path, html5: true, preload: true, autoplay: false })
            clip.clip_audio.load()
            clipStackData.push(clip)
          }
          setClipStack(clipStackData)
        })
        .catch((err) => { console.error('ERROR in fetchAudioDescriptionData', err); setShowSpinner(true) })
  }

  const toastId = React.useRef<null | Id>(null)

  const checkPlaybackTypeBeforePlaying = async (clip: Clip): Promise<Clip> => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/get-playback-type/${clip.clip_id}`,
        { withCredentials: true },
      )
      if (response.data.playback_type !== clip.playback_type) {
        clip.playback_type = response.data.playback_type
        const updatedAudioClips = [...audioClips]
        const idx = updatedAudioClips.findIndex((c) => c.clip_id === clip.clip_id)
        if (idx !== -1) { updatedAudioClips[idx].playback_type = response.data.playback_type; setAudioClips(updatedAudioClips) }
      }
      return clip
    } catch (error) { console.error('Error fetching current playback type:', error); return clip }
  }

  const fetchUndoDeletedClipData = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/undo-last-deleted`,
        { youtubeVideoId },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
      )
      setUndoDeletedClip(false)
      setNeedRefresh(true)
      navigate(`/editor/${response.data.clip.youtubeId}/${response.data.clip.audio_description}`)
      toast.success('Successfully retrieved and updated the last deleted clip!')
    } catch (error) {
      if (toastId.current) toast.dismiss(toastId.current)
      toast.error('Something went wrong, please try again later')
    }
  }

  const updateTime = (time: number, playedAudioClip: string, recentAudioPlayedTime: number, playedClipPath: string) => {
    setCurrentTime(time)
    setDraggableTime({ x: unitLength * time, y: 0 })
    if (recentAudioPlayedTime !== time) playAudioAtCurrentTime(time, playedAudioClip, playedClipPath)
    setPreviousTime(time)
  }

  const playAudioAtCurrentTime = async (updatedCurrentTime: number, playedAudioClip: string, playedClipPath: string) => {
    if (currentStateRef.current === 1) {
      if (clipStackRef.current.length === 0) return
      if (currentInlineACRef.current?.playing() || currentExtendedACRef.current?.playing()) return
      try {
        const updatedClip = await checkPlaybackTypeBeforePlaying(clipStackRef.current[0])

        if (updatedClip.playback_type === 'extended' && updatedClip.clip_start_time <= currentTimeRef.current && currentTimeRef.current - updatedClip.clip_start_time < 1.0) {
          if (playedClipsSet.has(updatedClip.clip_id)) {
            setCurrentClipIndex(currentClipIndexRef.current + 1)
            const newClip = audioClips[currentClipIndexRef.current + (clipStackSize - 1)]
            if (newClip) { newClip.clip_audio = new Howl({ src: newClip.clip_audio_path, html5: true }); setClipStack([...clipStackRef.current.slice(1, clipStackSize), newClip]) }
            else setClipStack([...clipStackRef.current.slice(1, clipStackSize)])
            return
          }
          setCurrentClipIndex(currentClipIndexRef.current + 1)
          setPlayedClipsSet((prev) => new Set(prev).add(updatedClip.clip_id))
          if (playedAudioClip !== updatedClip.clip_id) {
            setPlayedAudioClip(updatedClip.clip_id)
            setRecentAudioPlayedTime(currentTimeRef.current)
            if (updatedClip.clip_audio_path !== playedClipPath) {
              setPlayedClipPath(updatedClip.clip_audio_path)
              const currentAudio = updatedClip.clip_audio
              currentEvent?.pauseVideo()
              if (currentAudio?.state() === 'loaded') {
                setTimeout(() => { if (!currentAudio.playing()) { currentAudio.play(); currentAudio.volume(descriptionVolumeRef.current / 100) } }, 50)
              } else {
                currentAudio?.once('load', () => { setTimeout(() => { if (!currentAudio.playing()) { currentAudio.play(); currentAudio.volume(descriptionVolumeRef.current / 100) } }, 50) })
              }
              setCurrExtendedAC(currentAudio)
              currentAudio?.once('play', () => { currentAudio.volume(descriptionVolumeRef.current / 100) })
              currentAudio?.once('end', () => { setCurrExtendedAC(undefined); currentEventRef.current?.playVideo(); currentAudio.unload(); setCurrentExtACPaused(false) })
              const newClip = audioClips[currentClipIndexRef.current + (clipStackSize - 1)]
              if (newClip) { newClip.clip_audio = new Howl({ src: newClip.clip_audio_path, html5: true }); setClipStack([...clipStackRef.current.slice(1, clipStackSize), newClip]) }
              else setClipStack([...clipStackRef.current.slice(1, clipStackSize)])
            }
          }
        } else if (
          updatedClip.playback_type === 'inline' &&
          ((updatedClip.clip_start_time <= currentTimeRef.current && updatedClip.clip_end_time >= currentTimeRef.current) ||
            (updatedClip.clip_start_time <= currentTimeRef.current && updatedClip.clip_start_time >= previousTimeRef.current))
        ) {
          if (playedClipsSet.has(updatedClip.clip_id) || currentInlineACRef.current?.playing()) return
          const currentAudio = updatedClip.clip_audio
          const seekTime = currentTimeRef.current - updatedClip.clip_start_time
          if (seekTime < 0) return
          if (currentAudio?.state() === 'loaded') {
            currentAudio.seek(seekTime)
            setTimeout(() => { currentAudio.play(); currentAudio.volume(descriptionVolumeRef.current / 100) }, 50)
          } else {
            currentAudio?.once('load', () => { currentAudio.seek(seekTime); setTimeout(() => { currentAudio.play(); currentAudio.volume(descriptionVolumeRef.current / 100) }, 50) })
          }
          setCurrInlineAC(currentAudio)
          setPlayedClipsSet((prev) => new Set(prev).add(updatedClip.clip_id))
          setPlayedAudioClip(updatedClip.clip_id)
          setRecentAudioPlayedTime(currentTimeRef.current)
          setCurrentClipIndex(currentClipIndexRef.current + 1)
          if (updatedClip.clip_audio_path !== playedClipPath) {
            setPlayedClipPath(updatedClip.clip_audio_path)
            currentAudio?.once('play', () => { currentAudio.volume(descriptionVolumeRef.current / 100) })
            currentAudio?.once('end', () => { setCurrInlineAC(undefined); currentAudio.unload() })
            const newClip = audioClips[currentClipIndexRef.current + clipStackSize - 1]
            if (newClip) { newClip.clip_audio = new Howl({ src: newClip.clip_audio_path, html5: true }); setClipStack([...clipStackRef.current.slice(1, clipStackSize), newClip]) }
            else setClipStack([...clipStackRef.current.slice(1, clipStackSize)])
          }
        }

        if (updatedClip.playback_type === 'extended' && !currentInlineACRef.current?.playing() && !currentExtendedACRef.current?.playing() && updatedClip.clip_start_time <= currentTimeRef.current && currentTimeRef.current - updatedClip.clip_start_time >= 1.0) {
          setPlayedClipsSet((prev) => new Set(prev).add(updatedClip.clip_id))
          setCurrentClipIndex(currentClipIndexRef.current + 1)
          const newClip = audioClips[currentClipIndexRef.current + (clipStackSize - 1)]
          if (newClip) { newClip.clip_audio = new Howl({ src: newClip.clip_audio_path, html5: true }); setClipStack([...clipStackRef.current.slice(1, clipStackSize), newClip]) }
          else setClipStack([...clipStackRef.current.slice(1, clipStackSize)])
        }
      } catch (error) { console.error('Error checking playback type:', error) }
    }
  }

  const onStateChange = (event: any) => {
    setCurrentEvent(event.target)
    setCurrentTime(event.target.getCurrentTime())
    setCurrentState(event.data)
    switch (event.data) {
      case 0:
        setGloballyPaused(true); setCurrentClipIndex(0); setPlayedAudioClip(''); setPlayedClipPath('')
        setPlayedClipsSet(new Set()); setRecentAudioPlayedTime(0.0); setCurrInlineAC(undefined)
        setCurrExtendedAC(undefined); setIsActive(false); clearInterval(timer); break
      case 1:
        currentEvent?.setVolume(youTubeVolume)
        if (!isActive) setIsActive(true)
        if (currExtendedAC) { currExtendedAC.pause(); currExtendedAC.seek(0); setCurrExtendedAC(undefined) }
        if (currInlineAC) { currInlineAC.play(); currInlineAC.on('end', () => setCurrInlineAC(undefined)) }
        setGloballyPaused(false); clearInterval(timer); break
      case 2:
        if (currInlineAC) currInlineAC.pause()
        clearInterval(timer); break
      case 3:
        setPlayedClipPath(''); setPlayedAudioClip(''); setPlayedClipsSet(new Set())
        setRecentAudioPlayedTime(0.0); clearInterval(timer); setCurrExtendedAC(undefined); setCurrInlineAC(undefined); break
    }
  }

  const onReady = (event: any) => { setCurrentEvent(event.target) }
  const onPlay = (event: any) => {
    setCurrentEvent(event.target)
    setCurrentTime(event.target.getCurrentTime())
    setTimer(setInterval(() => updateTime(event.target.getCurrentTime(), playedAudioClip, recentAudioPlayedTime, playedClipPath), samplingRate))
  }
  const onPause = (event: any) => { event.target.pauseVideo() }

  const stopProgressBar = async (event: DraggableEvent, position: DraggableData) => {
    setDraggableTime({ x: position.x, y: 0 })
    currentEventRef.current?.seekTo(position.x / unitLength, true)
    setPreviousTime((await currentEventRef.current?.getCurrentTime()) ?? 0)
  }

  const dragProgressBar = async (event: DraggableEvent, position: DraggableData) => {
    setDraggableTime({ x: position.x, y: 0 })
    currentEventRef.current?.seekTo(position.x / unitLength, true)
    const t = (await currentEventRef.current?.getCurrentTime()) ?? 0
    setCurrentTime(t); setPreviousTime(t); setRecentAudioPlayedTime(0.0)
    setPlayedAudioClip(''); setPlayedClipPath(''); updateClipsDataCallback()
    if (currentExtendedACRef.current) { currentExtendedACRef.current.pause(); currentExtendedACRef.current.seek(0); currentExtendedACRef.current.unload(); setCurrExtendedAC(undefined) }
    if (currentInlineACRef.current) { currentInlineACRef.current.pause(); currentInlineACRef.current.seek(0); currentInlineACRef.current.unload(); setCurrExtendedAC(undefined) }
  }

  const updateClipStackData = useCallback(() => {
    clipStackRef.current.forEach((clip) => { if (clip.clip_audio) clip.clip_audio.unload() })
    const newClipIndex = audioClips.findIndex((clip) =>
      clip.clip_start_time >= currentTimeRef.current ||
      (clip.clip_start_time < currentTimeRef.current && clip.clip_end_time > currentTimeRef.current),
    )
    setCurrentClipIndex(newClipIndex)
    const clipStackData = []
    for (let i = newClipIndex; i < newClipIndex + clipStackSize; i++) {
      const clip = audioClips[i]
      if (clip) { clip.clip_audio = new Howl({ src: clip.clip_audio_path, html5: true, preload: true, autoplay: false }); clip.clip_audio.load(); clipStackData.push(clip) }
    }
    setClipStack(clipStackData)
  }, [audioClips, setCurrentClipIndex])

  const updateClipsDataCallback = useMemo(() => debounce(() => { updateClipStackData() }, 500), [updateClipStackData])

  const setEditComponentToggleFunc = (clipId: string, value: boolean) => {
    const temp = [...editComponentToggleList]
    temp.forEach((data) => { if (data.clipId === clipId) data.showEditComponent = value })
    setEditComponentToggleList(temp)
  }

  const handlePlayAudioClip = (clipStartTime: number) => {
    currentEvent?.seekTo(clipStartTime - 0.4, true)
    currentEvent?.playVideo()
  }

  // ── Single-clip navigation handler ──────────────────────────────────────────
  const handleClipNavigation = (index: number) => {
    if (index < 0 || index >= audioClips.length) return
    setNavClipIndex(index)
    setIsClipsListExpanded(false)
  }

  const handlePlayPause = () => {
    if (currExtendedAC) {
      if (isCurrentExtACPaused) { currExtendedAC.play(); setCurrentExtACPaused(false); setGloballyPaused(false) }
      else { currExtendedAC.pause(); setCurrentExtACPaused(true); setGloballyPaused(true) }
    } else if (currentState === 1) { currentEvent?.pauseVideo(); setGloballyPaused(true) }
    else { if (!isActive) setIsActive(true); currentEvent?.playVideo(); setGloballyPaused(false) }
  }

  const handleCopyClick = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success('Text copied to clipboard!'))
      .catch((error) => toast.error('Copy to clipboard failed: ' + error))
  }

  // ── Unpublish ────────────────────────────────────────────────────────────────
  const handleUnpublishClick = async (audioDescriptionId: string) => {
    if (!audioDescriptionId) { toast.error('Audio description ID is undefined!'); return }
    try {
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/unpublish-audio-description`,
        { audioDescriptionId, youtube_id: youtubeVideoId },
        { withCredentials: true },
      )
      setIsPublished(false); setNeedRefresh(true)
      toast.success('Audio description unpublished successfully!')
    } catch (error) { console.error('Error unpublishing:', error); toast.error('Error unpublishing audio description!') }
  }

  // ── Publish ──────────────────────────────────────────────────────────────────
  const handlePublish = async (e: any) => {
    if (!audioDescriptionId) { toast.error('Audio description ID is undefined!'); return }
    try {
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/publish-audio-description`,
        { audioDescriptionId, youtube_id: youtubeVideoId, enrollInCollabEdit: isCollaborativeVersion },
        { withCredentials: true },
      )
      setIsPublished(true); setNeedRefresh(true)
      toast.success('Audio description published successfully!')
    } catch (error) { console.error('Error publishing:', error); toast.error('Error publishing audio description!') }
  }

  const handleSaveAllClips = async () => {
    setShowSpinner(true)
    try {
      for (const clip of audioClips) {
        const updated = updatedDescriptions[clip.clip_id]
        if (updated) await handleClickSaveClipDescription(clip.clip_id, updated, clip.description_type)
      }
      try {
        await axios.post(`${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/calculate-contributions`, { audioDescriptionId }, { withCredentials: true })
        toast.success('Contributions Calculated Successfully!!')
      } catch (err) { console.error(err); toast.error('An error occurred while calculating contributions. Please try again!!') }
      toast.success('All Descriptions Saved Successfully!!')
    } catch (err) { toast.error('An error occurred while saving all descriptions. Please try again!!') }
    finally { setShowSpinner(false) }
  }

  const handleClickSaveClipDescription = async (clipId: string, updatedClipDescriptionText: string, clipDescriptionType: string | undefined) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-description/${clipId}`,
        { userId: user, youtubeVideoId, clipDescriptionText: updatedClipDescriptionText, clipDescriptionType: clipDescriptionType ?? '', audioDescriptionId },
      )
      setUpdateData(!updateData)
    } catch (err: any) {
      if (err.response) toast.error(err.response.data.message)
      else { console.error(err); toast.error('An error occurred. Please try again!!') }
    }
  }

  const createClipSaveHandler = (clipId: string, clipDescriptionType: string) => {
    return async (updatedClipDescriptionText: string) => {
      try {
        await handleClickSaveClipDescription(clipId, updatedClipDescriptionText, clipDescriptionType)
        toast.success('Description Saved Successfully!')
      } catch (error) { console.error('Error saving clip description:', error); toast.error('Error saving description. Please try again.') }
    }
  }

  return (
    <div className="ydx-body ydx-html">
      {showSpinner ? <Spinner /> : <></>}
      <div className="container home-container">

        {/* YouTube + Controls + Notes */}
        <div className="d-flex justify-content-around">
          <div className="text-white">
            <YouTube className="rounded" videoId={youtubeVideoId} opts={opts}
              onStateChange={onStateChange} onPlay={onPlay} onPause={onPause} onReady={onReady} />
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
              const s = await currentEvent?.getPlayerState()
              if (s === 1) handlePlayPause()
            }}
          />
        </div>
        <hr className="m-2 ydx-hr" />

        {/* Dialog Timeline */}
        <div className="timeline-section-wrapper">
          <div className="timeline-header">
            <h6 className="timeline-title">
              Dialog Timeline ({videoLength ? convertSecondsToCardFormat(videoLength) : 'N/A'}):
            </h6>
            <div className="timeline-actions">
              <span className="clips-count">Audio Clips Count: {audioClips.length}</span>
              {undoDeletedClipInfo && (
                <Button className="btn rounded btn-sm text-white bg-warning ydx-button" onClick={fetchUndoDeletedClipData}>
                  <i className="fa fa-undo" /> Undo Last Deleted
                </Button>
              )}
            </div>
          </div>
          {videoLength && (
            <div className="timeline-container-wrapper" ref={divRef2}>
              <div className="timeline-track-wrapper" ref={divRef3}>
                {audioClips.map((clip, key) => {
                  const isExtended = clip.playback_type === 'extended'
                  return (
                    <div key={`audio-${key}`} className="audio-clip-timeline-segment"
                      style={{ position: 'absolute', left: `${clip.clip_start_time * unitLength}px`, width: isExtended ? '3px' : `${clip.clip_duration * unitLength}px`, height: '20px', backgroundColor: isExtended ? '#9c27b0' : '#ffeb3b', top: '0px', zIndex: 3, borderRadius: '2px', opacity: 0.8 }}
                      title={`${clip.playback_type}: ${clip.description_text?.substring(0, 50)}...`}
                    />
                  )
                })}
                {videoDialogTimestamps.map((dialog, key) => (
                  <Draggable axis="x" key={key} position={dialog.controlledPosition} bounds="parent">
                    <div className="dialog-timestamps-div" style={{ width: dialog.width, height: '20px' }} />
                  </Draggable>
                ))}
                {videoLength && (
                  <Draggable axis="x" bounds="parent" defaultPosition={{ x: 0, y: 0 }} position={draggableTime}
                    onDrag={(e, data) => { dragProgressBar(e, data) }}
                    onStop={(e, data) => { stopProgressBar(e, data) }}
                  >
                    <div tabIndex={0} className="progress-bar-div">
                      <p className="mt-5 text-white progress-bar-time">{convertSecondsToCardFormat(currentTime)}</p>
                    </div>
                  </Draggable>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation bar (3-column grid for true centering) ───────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '8px',
          margin: '12px 0 8px 0',
        }}>

          {/* Left: Insert buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isPublished && (
              <>
                <button
                  type="button"
                  className="btn inline-bg text-dark ydx-button"
                  onClick={() => setHandleClicksFromParent('inline')}
                >
                  <i className="fa fa-plus" /> Insert Inline
                </button>
                <button
                  type="button"
                  className="btn extended-bg text-white ydx-button"
                  onClick={() => setHandleClicksFromParent('extended')}
                >
                  <i className="fa fa-plus" /> Insert Extended
                </button>
              </>
            )}
          </div>

          {/* Center: Currently editing — truly centered via grid */}
          {audioClips.length > 0 && (
            <button
              className="clip-nav-btn-blue"
              onClick={() => setIsClipsListExpanded(!isClipsListExpanded)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className={`fa fa-${isClipsListExpanded ? 'caret-down' : 'caret-right'}`} />
              {' '}Currently editing: Clip {navClipIndex + 1} - All Clips ({audioClips.length} total)
            </button>
          )}

          {/* Right: Previous / Next — aligned to the right */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              className="clip-nav-btn-blue"
              style={{ backgroundColor: '#6c757d' }}
              disabled={navClipIndex === 0}
              onClick={() => handleClipNavigation(navClipIndex - 1)}
            >
              ← Previous
            </button>
            <button
              className="clip-nav-btn-blue"
              disabled={navClipIndex >= audioClips.length - 1}
              onClick={() => handleClipNavigation(navClipIndex + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        {/* InsertPublish — form only, buttons hidden via CSS */}
        {!isPublished && (
          <div className="insert-publish-form-only">
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
          </div>
        )}

        {/* ClipsNavigator — collapsible clip list */}
        <ClipsNavigator
          clips={audioClips}
          currentIndex={navClipIndex}
          onSelectClip={handleClipNavigation}
          isExpanded={isClipsListExpanded}
          setIsExpanded={setIsClipsListExpanded}
        />

        {/* Single clip view */}
        <div className="audio-desc-component-list" id="audio-list" ref={audioClipsListRef} style={{ overflow: 'visible' }}>
          {audioClips[navClipIndex] && (
            <AudioClip
              key={audioClips[navClipIndex].clip_id}
              clip={audioClips[navClipIndex]}
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
              isPublished={isPublished}
              enrollInCollabEdit={isCollaborativeVersion}
              setEnrollInCollabEdit={setCollaborativeVersion}
              onPublish={handlePublish}
            />
          )}
        </div>

        {/* Save All (published) */}
        {isPublished && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', marginRight: '20px' }}>
            <button className="btn publish-bg text-white ydx-button ml-auto cursor-pointer" onClick={handleSaveAllClips}>
              <i className="fa fa-save" /> {'   '}Save All
            </button>
          </div>
        )}

        {/* Unpublish + Copy Link (published) */}
        {isPublished && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', marginRight: '20px' }}>
            <button className="btn publish-bg text-white ydx-button ml-auto cursor-pointer" style={{ marginRight: '10px' }}
              onClick={() => handleUnpublishClick(audioDescriptionId!)}>
              <i className="fa fa-times" /> {'   '}Unpublish
            </button>
            <button className="btn publish-bg text-white ydx-button ml-auto cursor-pointer"
              onClick={() => handleCopyClick(`${window.location.origin}/video/${youtubeVideoId}?ad=${audioDescriptionId}`)}>
              <i className="fa fa-copy" /> {'   '}Copy Published Link
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default YDXHome