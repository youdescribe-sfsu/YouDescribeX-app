import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useElapsedTime } from 'use-elapsed-time'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import YouTube, { YouTubePlayer } from 'react-youtube'
import Draggable, { DraggableData } from 'react-draggable'
import '../assets/css/home.css'
import '../assets/css/timer.css'
import AudioClip from '../features/Describe/AudioClip/AudioClip'
import Notes from '../features/Describe/Notes/Notes'
import convertSecondsToCardFormat from '../shared/utils/convertSecondsToCardFormat'
import InsertPublish from '../features/Describe/InsertPublish/InsertPublish'
import ClipsNavigator from '../features/Describe/ClipsNavigator/ClipsNavigator'
import { Buttons } from '../features/Describe/Buttons/Buttons'
import Spinner from '../shared/components/Spinner/Spinner'
import useCanonicalVideoDuration from '../shared/hooks/useCanonicalVideoDuration'
import { Howl } from 'howler'
import convertClipObject, { Clip } from '../shared/utils/convertClipObject'
import {
  buildTimelineMetrics,
  clampTimelineTime,
  clampTimelineX,
  timeToTimelineX,
  timelineXToTime,
  TimelineMetrics,
} from '../shared/utils/timelineBounds'
import { Options } from 'youtube-player/dist/types'
import { userDataStore } from '@/App'
import { Id, toast } from 'react-toastify'
import Button from 'react-bootstrap/Button'
import {
  TUTORIAL_AUDIO_DESCRIPTION_ID,
  TUTORIAL_DIALOG_TIMESTAMPS,
  TUTORIAL_VIDEO_DATABASE_ID,
  TUTORIAL_VIDEO_DURATION_SECONDS,
  TUTORIAL_VIDEO_YOUTUBE_ID,
} from '../features/Tutorial/tutorialConfig'
import { tutorialEditorStore } from '../features/Tutorial/tutorialEditorStore'

type DialogTimestamp = {
  dialog_seq_no: number
  dialog_start_time: number
  dialog_duration: number
}

const DEFAULT_PLAYHEAD_WIDTH_PX = 2

interface YDXHomeProps {
  isTutorialMode?: boolean
}

const YDXHome = ({
  isTutorialMode = false,
}: YDXHomeProps): React.ReactElement => {
  const {
    audioDescriptionId: routeAudioDescriptionId,
    youtubeVideoId: routeYoutubeVideoId,
  } = useParams()
  const audioDescriptionId = isTutorialMode
    ? TUTORIAL_AUDIO_DESCRIPTION_ID
    : routeAudioDescriptionId
  const youtubeVideoId = isTutorialMode
    ? TUTORIAL_VIDEO_YOUTUBE_ID
    : routeYoutubeVideoId
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
  const playheadRef = useRef<HTMLDivElement>(null)
  const [divWidths, setDivWidths] = useState({})

  // State Variables
  const [videoId, setVideoId] = useState('') // retrieved from db, stored to fetch audio_descriptions
  // const [audioDescriptionId, setAudioDescriptionId] = useState('') // retrieved from db, stored to fetch Notes & Audio Clips
  const [notesData, setNotesData] = useState('') // retrieved from db, stored to pass on to Notes Component
  const [videoLength, setVideoLength] = useState(0) // retrieved from db, stored as a fallback if canonical YouTube metadata is unavailable
  const [backendFallbackYoutubeVideoId, setBackendFallbackYoutubeVideoId] =
    useState<string | undefined>()
  const [currentEvent, setCurrentEvent] = useState<YouTubePlayer>() //stores YouTube video's event
  const [currentState, setCurrentState] = useState(-1) // stores YouTube video's PLAYING, CUED, PAUSED, UNSTARTED, BUFFERING, ENDED state values
  const [currentTime, setCurrentTime] = useState(0.0) //stores current running time of the YouTube video
  const [timer, setTimer] = useState<NodeJS.Timer>() // stores TBD
  const [unitLength, setUnitLength] = useState(0) // stores unit length based on the video length to maintain colored div's on the timelines
  const [draggableTime, setDraggableTime] = useState({ x: 0, y: 0 }) // stores the position of the draggable bar on the #draggable-div
  const [timelineMetrics, setTimelineMetrics] =
    useState<TimelineMetrics | null>(null)
  const [videoDialogTimestamps, setVideoDialogTimestamps] = useState<
    DialogTimestamp[]
  >([]) // stores dialog-timestamps data for a video from backend db
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
  const [updatedDescriptions, setUpdatedDescriptions] = useState<{
    [key: string]: string
  }>({})
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
  //const [user, setUser] = useState(userDataStore.getState().userId)
  const user = userDataStore((state) => state.userId) || ''
  const tutorialAudioClips = tutorialEditorStore(
    (state) => state.tutorialAudioClips,
  )
  const tutorialShowClipForm = tutorialEditorStore(
    (state) => state.tutorialShowClipForm,
  )
  const tutorialNavClipIndex = tutorialEditorStore(
    (state) => state.tutorialNavClipIndex,
  )
  const setTutorialNavClipIndex = tutorialEditorStore(
    (state) => state.setTutorialNavClipIndex,
  )
  const tutorialEditComponentToggleList = tutorialEditorStore(
    (state) => state.tutorialEditComponentToggleList,
  )

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

  // ── Publish state ────────────────────────────────────────────────────────────
  const [enrollInCollabEdit, setEnrollInCollabEdit] = useState(true)

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
  const timelineMetricsRef = useRef<TimelineMetrics | null>(null)
  const savedClipRefreshRequestedRef = useRef(false)
  const selectedClipIdRef = useRef<string | null>(null)
  const isTimelineScrubbingRef = useRef(false)
  const suppressResumeAfterScrubRef = useRef(false)
  // Set before a navigation seekTo; prevents the first onStateChange/onPlay
  // from overriding the draggable position that syncTimelineTime just set.
  const navSeekPendingRef = useRef(false)
  // Records the clip start time from the last Previous/Next navigation so that
  // pressing Play after navigating seeks to the clip instead of the old position.
  const manualNavTimeRef = useRef<number | null>(null)
  // Mirror of navClipIndex kept in sync synchronously so rapid clicks read the
  // latest index even before the React state update has committed.
  const navClipIndexRef = useRef(0)
  // Ref mirror of playedClipsSet — updated synchronously on every add/clear so
  // the playback interval always reads the latest value even when React has not
  // yet committed the corresponding setPlayedClipsSet state update.
  const playedClipsSetRef = useRef<Set<string>>(new Set())
  //Yue's fix
  const hasValidAudioDescriptionId =
    !!audioDescriptionId && audioDescriptionId !== 'undefined'

  const initialUpdateDataRef = useRef(true)
  const backendFallbackDurationSeconds = isTutorialMode
    ? TUTORIAL_VIDEO_DURATION_SECONDS
    : backendFallbackYoutubeVideoId === youtubeVideoId
    ? videoLength
    : 0
  const canonicalVideoDuration = useCanonicalVideoDuration(
    isTutorialMode ? undefined : youtubeVideoId,
    backendFallbackDurationSeconds,
  )
  const canonicalDurationSeconds = canonicalVideoDuration.durationSeconds
  const hasCanonicalDuration =
    canonicalVideoDuration.status === 'resolved' && canonicalDurationSeconds > 0

  useEffect(() => {
    currentInlineACRef.current = currInlineAC
    currentExtendedACRef.current = currExtendedAC
  }, [currInlineAC, currExtendedAC])

  useEffect(() => {
    currentTimeRef.current = currentTime
    previousTimeRef.current = previousTime
  }, [currentTime, previousTime])

  useEffect(() => {
    playedClipsSetRef.current = playedClipsSet
  }, [playedClipsSet])

  useEffect(() => {
    clipIDRef.current = playedAudioClip
  }, [playedAudioClip])

  useEffect(() => {
    currentClipIndexRef.current = currentClipIndex
  }, [currentClipIndex])

  useEffect(() => {
    navClipIndexRef.current = navClipIndex
  }, [navClipIndex])

  useEffect(() => {
    timelineMetricsRef.current = timelineMetrics
  }, [timelineMetrics])

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
    if (!isTutorialMode) return

    const nextTutorialAudioClips = tutorialAudioClips.map((clip, index) => ({
      ...clip,
      clip_sequence_number: index + 1,
    }))
    const nextNavClipIndex =
      nextTutorialAudioClips.length === 0
        ? 0
        : Math.min(tutorialNavClipIndex, nextTutorialAudioClips.length - 1)

    setShowSpinner(false)
    setVideoId(TUTORIAL_VIDEO_DATABASE_ID)
    setVideoLength(TUTORIAL_VIDEO_DURATION_SECONDS)
    setBackendFallbackYoutubeVideoId(TUTORIAL_VIDEO_YOUTUBE_ID)
    setVideoDialogTimestamps([...TUTORIAL_DIALOG_TIMESTAMPS])
    setAudioClips(nextTutorialAudioClips)
    setNotesData({ notes_text: '', notes_id: '' } as any)
    setIsPublished(false)
    setCollaborativeVersion(false)
    setEditComponentToggleList(tutorialEditComponentToggleList)
    setNavClipIndex(nextNavClipIndex)
    navClipIndexRef.current = nextNavClipIndex
    selectedClipIdRef.current =
      nextTutorialAudioClips[nextNavClipIndex]?.clip_id ?? null
  }, [
    isTutorialMode,
    tutorialAudioClips,
    tutorialEditComponentToggleList,
    tutorialNavClipIndex,
  ])

  useEffect(() => {
    if (isTutorialMode) return
    if (videoId) {
      setShowSpinner(true)
      fetchDialogData()
      setShowSpinner(true)
      fetchAudioDescriptionData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  // Re-fetch clips when auth resolves after videoId is already set (login race condition)
  useEffect(() => {
    if (isTutorialMode) return
    if (user && videoId && audioClips.length === 0) {
      fetchAudioDescriptionData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function reset() {
    setSeconds(0)
    setIsActive(false)
  }

  useEffect(() => {
    //setUser(userDataStore.getState().userId || '')
    setDivWidths({
      divRef1:
        (divRef1.current?.clientWidth ?? 1) / 3 +
        (divRef1.current?.clientWidth ?? 1) / 3,
      divRef2: (divRef1.current?.clientWidth ?? 1) / 3,
      divRef3: divRef2.current?.clientWidth,
      divRef4: divRef3.current?.clientWidth,
    })
    if (!isTutorialMode) {
      setShowSpinner(true)
      fetchUserVideoData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId, isTutorialMode])

  useEffect(() => {
    const handleKeyUp = () => {
      setIsPlaying((prevIsPlaying) => !prevIsPlaying)
    }

    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timer | null = null

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1)
      }, 1000)
    } else if (!isActive && seconds !== 0) {
      if (interval !== null) clearInterval(interval)
    }
    return () => {
      if (interval !== null) clearInterval(interval)
    }
  }, [isActive, seconds])

  useEffect(() => {
    localStorage.setItem('Seconds', String(seconds))
    sessionStorage.setItem('User', user || '')
  }, [seconds, user])

  useEffect(() => {
    clipStackRef.current = clipStack
  }, [clipStack])

  useEffect(() => {
    currentEventRef.current = currentEvent
  }, [currentEvent])

  useEffect(() => {
    currentStateRef.current = currentState
  }, [currentState])

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
    if (isTutorialMode) {
      if (needRefresh) setNeedRefresh(false)
      return
    }
    if (needRefresh) {
      const isNewClipAdded = savedClipRefreshRequestedRef.current
      savedClipRefreshRequestedRef.current = false
      fetchAudioDescriptionData(isNewClipAdded, undefined, true)
      setNeedRefresh(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh])

  useEffect(() => {
    if (initialUpdateDataRef.current) {
      initialUpdateDataRef.current = false
      return
    }

    if (isTutorialMode) return

    // Any clip edit (nudge, type toggle, description save) is a deliberate user
    // action — clear the timeline-scrub lock so the YouTube iframe play button
    // is not left blocked by a stale drag state.
    isTimelineScrubbingRef.current = false
    suppressResumeAfterScrubRef.current = false

    if (videoId) {
      setShowSpinner(true)
      fetchAudioDescriptionData(false, videoId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateData])

  useEffect(() => {
    // console.log(user)
    // console.log(userDataStore.getState().userId)
    if (userDataStore.getState().userId !== sessionStorage.getItem('User')) {
      setSeconds(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncTimelineTime = useCallback(
    (time: number) => {
      const durationSeconds =
        timelineMetricsRef.current?.durationSeconds || canonicalDurationSeconds
      const clampedTime = clampTimelineTime(time, durationSeconds)

      setCurrentTime(clampedTime)
      currentTimeRef.current = clampedTime

      if (timelineMetricsRef.current) {
        setDraggableTime({
          x: timeToTimelineX(clampedTime, timelineMetricsRef.current),
          y: 0,
        })
      }

      return clampedTime
    },
    [canonicalDurationSeconds],
  )

  const measureTimelineMetrics = useCallback(() => {
    if (!hasCanonicalDuration) {
      timelineMetricsRef.current = null
      setTimelineMetrics(null)
      setUnitLength(0)
      setDraggableTime({ x: 0, y: 0 })
      return
    }

    const nextMetrics = buildTimelineMetrics(
      divRef3.current?.clientWidth || 0,
      playheadRef.current?.clientWidth || DEFAULT_PLAYHEAD_WIDTH_PX,
      canonicalDurationSeconds,
    )
    const nextUnitLength =
      nextMetrics.durationSeconds > 0
        ? nextMetrics.maxX / nextMetrics.durationSeconds
        : 0
    const clampedTime = clampTimelineTime(
      currentTimeRef.current,
      canonicalDurationSeconds,
    )

    timelineMetricsRef.current = nextMetrics
    setTimelineMetrics(nextMetrics)
    setUnitLength(nextUnitLength)
    setCurrentTime(clampedTime)
    currentTimeRef.current = clampedTime
    setDraggableTime({
      x: timeToTimelineX(clampedTime, nextMetrics),
      y: 0,
    })
  }, [canonicalDurationSeconds, hasCanonicalDuration])

  useEffect(() => {
    measureTimelineMetrics()

    if (!hasCanonicalDuration) {
      return
    }

    const handleResize = () => {
      measureTimelineMetrics()
    }

    let resizeObserver: ResizeObserver | undefined

    if (typeof ResizeObserver !== 'undefined' && divRef3.current) {
      resizeObserver = new ResizeObserver(() => {
        measureTimelineMetrics()
      })
      resizeObserver.observe(divRef3.current)
    } else {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [hasCanonicalDuration, measureTimelineMetrics])

  const fetchDialogData = () => {
    if (!videoId) return
    axios
      .get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/dialog-timestamps/get-video-dialog/${videoId}`,
      )
      .then((res) => {
        setShowSpinner(false)
        return res.data
      })
      .then((dialogData) => {
        setShowSpinner(false)
        const updatedDialogData: DialogTimestamp[] = dialogData.map(
          (dialog: any) => ({
            dialog_seq_no: dialog.dialog_sequence_num,
            dialog_start_time: dialog.dialog_start_time,
            dialog_duration: dialog.dialog_duration,
          }),
        )
        setVideoDialogTimestamps(updatedDialogData)
      })
      .catch((err) => {
        console.error('ERROR in fetchDialogData', err)
        setShowSpinner(false)
      })
  }

  const fetchUserVideoData = () => {
    if (!youtubeVideoId) return

    axios
      .get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/videos/get-by-youtubeVideo/${youtubeVideoId}`,
      )
      .then((res) => {
        setShowSpinner(false)
        const video_id = res.data.video_id
        const video_length = res.data.video_length
        console.log(
          '[fetchUserVideoData] success — video_id:',
          video_id,
          '| video_length:',
          video_length,
        )
        setVideoLength(video_length)
        setBackendFallbackYoutubeVideoId(youtubeVideoId)
        setVideoId(video_id)
      })
      .catch((err) => {
        console.error(
          '[fetchUserVideoData] FAILED —',
          err?.response?.status,
          err?.response?.data?.message || err?.message,
        )
        setShowSpinner(false)
      })
  }

  const unloadHowls = useCallback((howls: Array<Howl | undefined>) => {
    const unloadedHowls = new Set<Howl>()
    howls.forEach((howl) => {
      if (!howl || unloadedHowls.has(howl)) return
      unloadedHowls.add(howl)
      howl.pause()
      howl.seek(0)
      howl.unload()
    })
  }, [])

  const getClipStackStartIndex = useCallback(
    (clips: Clip[], targetTime: number) => {
      const startIndex = clips.findIndex(
        (clip) =>
          clip.clip_start_time >= targetTime - 1.0 ||
          (clip.clip_start_time < targetTime &&
            clip.clip_end_time > targetTime),
      )
      return startIndex === -1 ? clips.length : startIndex
    },
    [],
  )

  const primeClipAudio = useCallback((clip: Clip) => {
    if (clip.clip_audio) {
      clip.clip_audio.unload()
      clip.clip_audio = undefined
    }
    clip.clip_audio = new Howl({
      src: clip.clip_audio_path,
      html5: true,
      preload: true,
      autoplay: false,
    })
    clip.clip_audio.load()
    return clip
  }, [])

  const buildClipStackForTime = useCallback(
    (clips: Clip[], targetTime: number, stackSize: number) => {
      const startIndex = getClipStackStartIndex(clips, targetTime)
      const clipStackData: Clip[] = []
      for (
        let i = startIndex;
        i < Math.min(startIndex + stackSize, clips.length);
        i++
      ) {
        const clip = clips[i]
        if (clip) clipStackData.push(primeClipAudio(clip))
      }
      return { startIndex, clipStackData }
    },
    [getClipStackStartIndex, primeClipAudio],
  )

  const resetPlaybackStateForSavedClipRefresh = useCallback(() => {
    unloadHowls([
      ...clipStackRef.current.map((clip) => clip.clip_audio),
      currentExtendedACRef.current,
      currentInlineACRef.current,
    ])
    setCurrExtendedAC(undefined)
    setCurrInlineAC(undefined)
    setCurrentExtACPaused(false)
    setRecentAudioPlayedTime(0.0)
    setPlayedAudioClip('')
    setPlayedClipPath('')
    playedClipsSetRef.current = new Set()
    setPlayedClipsSet(new Set())
  }, [unloadHowls])

  const fetchAudioDescriptionData = (
    isNewClipAdded = false,
    passedVideoId?: string,
    shouldRefreshEditToggleList = false,
  ) => {
    const effectiveVideoId = passedVideoId || videoId
    console.log(
      '[fetchAD] called — effectiveVideoId:',
      effectiveVideoId,
      '| userId:',
      userDataStore.getState().userId,
      '| audioDescriptionId:',
      audioDescriptionId,
      '| hasValidADId:',
      hasValidAudioDescriptionId,
    )
    if (audioDescriptionId === 'undefined') {
      console.error(
        'Skipping fetchAudioDescriptionData because audioDescriptionId is the string "undefined"',
      )
      setShowSpinner(false)
      return
    }
    if (
      effectiveVideoId &&
      userDataStore.getState().userId &&
      hasValidAudioDescriptionId
    )
      axios
        .get(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-user-ad/${effectiveVideoId}&${audioDescriptionId}`,
          {
            params: { preview: 'true' },
            headers: { audiodescription: audioDescriptionId },
            withCredentials: true,
          },
        )
        .then((res) => {
          console.log(
            '[fetchAD] API success — clips count:',
            res.data?.Audio_Clips?.length,
            '| status:',
            res.status,
          )
          setShowSpinner(false)
          setIsPublished(res.data.is_published)
          return res.data
        })
        .then((data) => {
          setShowSpinner(false)
          setIsPublished(data.is_published)
          setCollaborativeVersion(data.is_collaborative_version)
          const audioClipsData: Clip[] = data.Audio_Clips.map((clip: any) =>
            convertClipObject(clip),
          )
          const notesData = data.Notes[0]
          const tempArray: { clipId: string; showEditComponent: boolean }[] = []
          const date = new Date()
          const ONE_MIN = 60 * 1000
          if (audioClipsData.length > 100) setClipStackSize(10)

          audioClipsData.forEach((clip, i) => {
            clip.clip_sequence_number = i + 1
            if (clip.clip_audio_path.startsWith('.')) {
              clip.clip_audio_path = clip.clip_audio_path.replace(
                '.',
                `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static`,
              )
            } else if (clip.clip_audio_path.startsWith('/')) {
              clip.clip_audio_path = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static${clip.clip_audio_path}`
            } else {
              clip.clip_audio_path = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/static/${clip.clip_audio_path}`
            }
            if (
              date.getTime() - new Date(clip.createdAt).getTime() <=
              ONE_MIN
            ) {
              tempArray.push({ clipId: clip.clip_id, showEditComponent: true })
            } else {
              tempArray.push({ clipId: clip.clip_id, showEditComponent: false })
            }
          })

          if (
            editComponentToggleList.length === 0 ||
            shouldRefreshEditToggleList
          ) {
            setEditComponentToggleList(tempArray)
          }
          setAudioClips([...audioClipsData])
          console.log(
            '[DELETE] new clips array:',
            audioClipsData.length,
            'currentTime:',
            currentTimeRef.current,
          )
          setNotesData(notesData)
          if (isNewClipAdded) {
            const nextClipStackSize =
              audioClipsData.length > 100 ? 10 : clipStackSize
            resetPlaybackStateForSavedClipRefresh()
            // Find the newly inserted clip by its ID before rebuilding the
            // clip stack, so we can seek to 2 s before it starts.
            const oldClipIds = new Set(audioClips.map((c) => c.clip_id))
            const newClip = audioClipsData.find(
              (c) => !oldClipIds.has(c.clip_id),
            )
            const newClipIndex = newClip
              ? audioClipsData.indexOf(newClip)
              : audioClipsData.length - 1

            const seekTime = newClip
              ? Math.max(0, newClip.clip_start_time - 0.002)
              : currentTimeRef.current
            syncTimelineTime(seekTime)
            navSeekPendingRef.current = true
            currentEventRef.current?.seekTo(seekTime, true)

            const { startIndex, clipStackData } = buildClipStackForTime(
              audioClipsData,
              seekTime,
              nextClipStackSize,
            )
            setCurrentClipIndex(startIndex)
            setClipStack(clipStackData)
            // Keep navClipIndexRef in sync immediately so rapid interactions
            // read the correct index before React commits the state update.
            navClipIndexRef.current = newClipIndex
            setNavClipIndex(newClipIndex)
            selectedClipIdRef.current =
              audioClipsData[newClipIndex]?.clip_id ?? null
            return
          }
          // After normal refresh, recalculate which clip to show by playhead
          if (audioClipsData.length > 0) {
            const t = currentTimeRef.current
            const newIdx = audioClipsData.reduce(
              (best, clip, i) => (clip.clip_start_time <= t ? i : best),
              0,
            )
            navClipIndexRef.current = newIdx
            setNavClipIndex(newIdx)
            selectedClipIdRef.current = audioClipsData[newIdx]?.clip_id ?? null
          }

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
              preload: true,
              autoplay: false,
            })
            clip.clip_audio.load()
            clipStackData.push(clip)
          }
          setClipStack(clipStackData)
        })
        .catch((err) => {
          console.error(
            '[fetchAD] API FAILED —',
            err?.response?.status,
            err?.response?.data?.message || err?.message,
          )
          setShowSpinner(false)
        })
    else {
      console.warn(
        '[fetchAD] SKIPPED — guard failed. effectiveVideoId:',
        effectiveVideoId,
        '| userId:',
        userDataStore.getState().userId,
        '| hasValidADId:',
        hasValidAudioDescriptionId,
      )
      setShowSpinner(false)
    }
  }

  const toastId = React.useRef<null | Id>(null)

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
        clip.playback_type = response.data.playback_type
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

  const fetchUndoDeletedClipData = async () => {
    const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/undo-last-deleted`
    try {
      const response = await axios.post(
        url,
        { youtubeVideoId },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
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
    }
  }

  const updateTime = (
    time: number,
    playedAudioClip: string,
    recentAudioPlayedTime: number,
    playedClipPath: string,
  ) => {
    if (isTimelineScrubbingRef.current || suppressResumeAfterScrubRef.current) {
      return
    }

    const syncedTime = syncTimelineTime(time)
    // check if the audio is not played recently. do not play it again.
    if (!navSeekPendingRef.current && recentAudioPlayedTime !== syncedTime) {
      // To Play audio files based on current time
      playAudioAtCurrentTime(syncedTime, playedAudioClip, playedClipPath)
    }
    setPreviousTime(syncedTime)
  }

  // Scroll to and highlight the currently playing audio clip card
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

  // To Play audio files based on current time
  const playAudioAtCurrentTime = async (
    updatedCurrentTime: number,
    playedAudioClip: string,
    playedClipPath: string,
  ) => {
    // 1. Initial Guards
    if (currentStateRef.current !== 1) return
    if (clipStackRef.current.length === 0) return

    // Prevent overlapping playback
    if (
      currentInlineACRef.current?.playing() ||
      currentExtendedACRef.current?.playing()
    ) {
      return
    }

    const currentClip = clipStackRef.current[0]

    // --- HELPER: UI UPDATER ---
    const updateUIForClip = (clipId: string) => {
      console.log(
        '[updateUIForClip] clipId:',
        clipId,
        'navSeekPending:',
        navSeekPendingRef.current,
      )
      const prevelement = document.querySelectorAll('.green-border')
      prevelement.forEach((elem) => elem.classList.remove('green-border'))
      scrollToAudioClipCard(clipId)
      const playingIndex = audioClips.findIndex((c) => c.clip_id === clipId)
      if (playingIndex !== -1) {
        navClipIndexRef.current = playingIndex
        setNavClipIndex(playingIndex)
        selectedClipIdRef.current = clipId
      }
    }

    // --- CASE A: INLINE CLIPS ---
    if (currentClip.playback_type === 'inline') {
      const isTimeToPlay =
        (currentClip.clip_start_time <= currentTimeRef.current &&
          currentClip.clip_end_time >= currentTimeRef.current) ||
        (currentClip.clip_start_time <= currentTimeRef.current &&
          currentClip.clip_start_time >= previousTimeRef.current)

      if (isTimeToPlay) {
        if (playedClipsSet.has(currentClip.clip_id)) {
          console.log(
            'Inline clip already played (Set check), skipping:',
            currentClip.clip_id,
          )
          return
        }

        const updatedClip = await checkPlaybackTypeBeforePlaying(currentClip)
        const currentAudio = updatedClip.clip_audio
        const seekTime = currentTimeRef.current - updatedClip.clip_start_time

        if (seekTime < 0) return
        // FIX 1: Helper to handle the "Play" logic safely without echos
        const executePlay = (audioObj: any, seek: number) => {
          // If it's already playing, don't start it again (prevents echo)
          if (audioObj.playing()) return

          // Stop any ghost instances and set state before playing
          audioObj.stop()
          audioObj.seek(seek)
          audioObj.volume(descriptionVolumeRef.current / 100)
          audioObj.play()
        }

        // FIX 2: Removed the 50ms setTimeout
        // The delay was causing the audio to start AFTER the next logic loop ran,
        // causing double-triggering.
        if (currentAudio?.state() === 'loaded') {
          executePlay(currentAudio, seekTime)
        } else {
          // Clear old listeners with .off() before adding a new one
          currentAudio?.off('load').once('load', () => {
            executePlay(currentAudio, seekTime)
          })
        }

        setCurrInlineAC(currentAudio)
        setPlayedClipsSet((prev) => new Set(prev).add(updatedClip.clip_id))
        setPlayedAudioClip(updatedClip.clip_id)
        setRecentAudioPlayedTime(currentTimeRef.current)
        updateUIForClip(updatedClip.clip_id)

        if (updatedClip.clip_audio_path !== playedClipPath) {
          setCurrentClipIndex(currentClipIndexRef.current + 1)
          setPlayedClipPath(updatedClip.clip_audio_path)

          currentAudio?.once('play', () => {
            currentAudio.volume(descriptionVolumeRef.current / 100)
          })
          currentAudio?.once('end', () => {
            setCurrInlineAC(undefined)
            currentAudio.unload()
            updateClipStackData()
            currentEventRef.current?.playVideo()
          })

          // Advance Stack
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
      } else if (currentTimeRef.current > currentClip.clip_end_time) {
        setPlayedClipsSet((prev) => new Set(prev).add(currentClip.clip_id))
        setCurrentClipIndex(currentClipIndexRef.current + 1)
        const newStack = clipStackRef.current.slice(1)
        const nextClipToAdd =
          audioClips[currentClipIndexRef.current + clipStackSize]
        if (nextClipToAdd) {
          nextClipToAdd.clip_audio = new Howl({
            src: nextClipToAdd.clip_audio_path,
            html5: true,
          })
          newStack.push(nextClipToAdd)
        }
        setClipStack(newStack)
        return
      }
    }

    // --- CASE B: EXTENDED CLIPS ---
    else if (currentClip.playback_type === 'extended') {
      const isExactStart =
        currentClip.clip_start_time <= currentTimeRef.current + 0.1 &&
        currentClip.clip_start_time >= previousTimeRef.current - 0.1

      if (isExactStart) {
        if (playedClipsSet.has(currentClip.clip_id)) {
          console.log(
            'Extended clip already played (Set check), advancing stack:',
            currentClip.clip_id,
          )
          setCurrentClipIndex(currentClipIndexRef.current + 1)
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
          return
        }

        const updatedClip = await checkPlaybackTypeBeforePlaying(currentClip)
        setCurrentClipIndex(currentClipIndexRef.current + 1)
        setPlayedClipsSet((prev) => new Set(prev).add(updatedClip.clip_id))

        if (playedAudioClip !== updatedClip.clip_id) {
          setPlayedAudioClip(updatedClip.clip_id)
          setRecentAudioPlayedTime(currentTimeRef.current)
          updateUIForClip(updatedClip.clip_id)

          if (updatedClip.clip_audio_path !== playedClipPath) {
            setPlayedClipPath(updatedClip.clip_audio_path)
            const currentAudio = updatedClip.clip_audio

            currentEvent?.pauseVideo()

            if (currentAudio?.state() === 'loaded') {
              setTimeout(() => {
                if (!currentAudio.playing()) {
                  currentAudio.play()
                  currentAudio.volume(descriptionVolumeRef.current / 100)
                }
              }, 50)
            } else {
              currentAudio?.once('load', function () {
                setTimeout(() => {
                  if (!currentAudio.playing()) {
                    currentAudio.play()
                    currentAudio.volume(descriptionVolumeRef.current / 100)
                  }
                }, 50)
              })
            }

            setCurrExtendedAC(currentAudio)

            currentAudio?.once('play', () => {
              currentAudio.volume(descriptionVolumeRef.current / 100)
            })
            currentAudio?.once('end', () => {
              setCurrExtendedAC(undefined)
              currentEventRef.current?.playVideo()
              currentAudio.unload()
              setCurrentExtACPaused(false)
            })

            // Advance Stack
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
    }

    // --- CASE C: GLOBAL SKIP DETECTION (EXTENDED) ---
    if (
      currentClip.playback_type === 'extended' &&
      !currentInlineACRef.current?.playing() &&
      !currentExtendedACRef.current?.playing() &&
      currentClip.clip_start_time < currentTimeRef.current &&
      currentTimeRef.current - currentClip.clip_start_time >= 1.0
    ) {
      console.warn('Discarding skipped extended clip:', currentClip.clip_id)
      setPlayedClipsSet((prev) => new Set(prev).add(currentClip.clip_id))
      setCurrentClipIndex(currentClipIndexRef.current + 1)
      const newStack = clipStackRef.current.slice(1)
      const newClip = audioClips[currentClipIndexRef.current + clipStackSize]
      if (newClip) {
        newClip.clip_audio = new Howl({
          src: newClip.clip_audio_path,
          html5: true,
        })
        newStack.push(newClip)
      }
      setClipStack(newStack)
      return
    }
  }

  // YouTube Player Functions
  const onStateChange = (event: any) => {
    // Snapshot the pending-nav flag; clear it once we reach the post-seek
    // state (1 = playing or 2 = paused). onPlay clears it for state 1.
    const navSeekPending = navSeekPendingRef.current
    if ((event.data === 1 || event.data === 2) && navSeekPending) {
      navSeekPendingRef.current = false
    }

    // During buffering (state 3) or right after a navigation seek (state 1/2
    // before YouTube has settled), YouTube's getCurrentTime() may still return
    // the pre-seek position. Preserve the time syncTimelineTime committed so
    // the visual playhead doesn't snap back to the old position.
    const shouldKeepScrubbedTime =
      isTimelineScrubbingRef.current ||
      suppressResumeAfterScrubRef.current ||
      event.data === 3 ||
      navSeekPending
    const currentTime = shouldKeepScrubbedTime
      ? currentTimeRef.current
      : syncTimelineTime(event.target.getCurrentTime())
    setCurrentEvent(event.target)
    currentEventRef.current = event.target
    setCurrentTime(currentTime)
    setCurrentState(event.data)

    // Grab the live, un-frozen audio objects right away
    const inlineAC = currentInlineACRef.current
    const extendedAC = currentExtendedACRef.current

    switch (event.data) {
      case 0:
        setGloballyPaused(true)
        setCurrentClipIndex(0)
        setPlayedAudioClip('')
        setPlayedClipPath('')
        playedClipsSetRef.current = new Set()
        setPlayedClipsSet(new Set())
        setRecentAudioPlayedTime(0.0)
        setCurrInlineAC(undefined)
        setCurrExtendedAC(undefined)
        setIsActive(false)
        manualNavTimeRef.current = null
        // Safely clear the exact live timer
        setTimer((prev) => {
          if (prev) clearInterval(prev)
          return undefined
        })
        console.log('Video ended, states reset')
        break

      case 1: // Playing
        if (suppressResumeAfterScrubRef.current) {
          event.target.pauseVideo()
          setGloballyPaused(true)
          setTimer((prev) => {
            if (prev) clearInterval(prev)
            return undefined
          })
          break
        }

        currentEvent?.setVolume(youTubeVolume)
        if (!isActive) setIsActive(true)

        // Handle Extended Audio
        if (extendedAC) {
          if (isCurrentExtACPaused) {
            extendedAC.play()
            currentEventRef.current?.pauseVideo()
            setCurrentExtACPaused(false)
            setGloballyPaused(false)
          } else if (extendedAC.playing()) {
            // YouTube resumed while extended clip still playing — cancel it.
            // Guard with .playing() to avoid seek(0) on an already-ended/
            // unloaded Howl, which would restart the audio unexpectedly.
            extendedAC.pause()
            extendedAC.seek(0)
            setCurrExtendedAC(undefined)
          }
        }

        // Handle Inline Audio Resuming (Bypassing Stale State)
        if (inlineAC) {
          if (!inlineAC.playing()) {
            inlineAC.play()
            inlineAC.volume(descriptionVolumeRef.current / 100)
          }
        }
        setGloballyPaused(false)
        break

      case 2: // Paused
        // Force the live Ref to pause
        if (inlineAC) {
          inlineAC.pause()
        }
        if (suppressResumeAfterScrubRef.current) {
          setGloballyPaused(true)
        }
        // Safely clear the exact live timer
        setTimer((prev) => {
          if (prev) clearInterval(prev)
          return undefined
        })
        break

      case 3: // Buffering
        // YouTube flashes State 3 when resuming.
        // Pause audio if it's playing, but DO NOT delete the clips or reset the sets here!
        if (inlineAC && inlineAC.playing()) {
          inlineAC.pause()
        }
        // Safely clear the exact live timer so the timeline doesn't drift
        setTimer((prev) => {
          if (prev) clearInterval(prev)
          return undefined
        })
        break
    }
  }

  const onReady = (event: any) => {
    setCurrentEvent(event.target)
    currentEventRef.current = event.target
  }

  const onPlay = (event: any) => {
    setCurrentEvent(event.target)
    currentEventRef.current = event.target

    if (suppressResumeAfterScrubRef.current) {
      event.target.pauseVideo()
      setGloballyPaused(true)
      return
    }

    // If a navigation seek is still pending, YouTube's getCurrentTime() may
    // not yet reflect the seek target. Use the ref value set by syncTimelineTime
    // and clear the flag so subsequent play events update normally.
    const navSeekPending = navSeekPendingRef.current
    if (navSeekPending) navSeekPendingRef.current = false

    const currentTime = navSeekPending
      ? currentTimeRef.current
      : syncTimelineTime(event.target.getCurrentTime())
    setPreviousTime(currentTime)

    // Use the functional state update to guarantee we clear the old timer
    // before starting a new one, preventing interval leaks.
    setTimer((prevTimer) => {
      if (prevTimer) clearInterval(prevTimer)
      return setInterval(
        () =>
          updateTime(
            event.target.getCurrentTime(),
            clipIDRef.current, // Use Ref to get the live clip ID
            recentAudioPlayedTime,
            playedClipPath,
          ),
        samplingRate,
      )
    })
  }

  const onPause = (event: any) => {
    event.target.pauseVideo()
  }

  const clearPlaybackTimer = () => {
    setTimer((prev) => {
      if (prev) clearInterval(prev)
      return undefined
    })
  }

  const stopScrubAudio = () => {
    if (currentInlineACRef.current) {
      currentInlineACRef.current.stop()
      setCurrInlineAC(undefined)
    }
    if (currentExtendedACRef.current) {
      currentExtendedACRef.current.stop()
      setCurrExtendedAC(undefined)
    }
  }

  const resetScrubPlaybackTracking = () => {
    setRecentAudioPlayedTime(0.0)
    setPlayedAudioClip('')
    setPlayedClipPath('')
  }

  const startProgressBar = () => {
    isTimelineScrubbingRef.current = true
    suppressResumeAfterScrubRef.current = true
    clearPlaybackTimer()
    currentEventRef.current?.pauseVideo()
    setGloballyPaused(true)
    stopScrubAudio()
    resetScrubPlaybackTracking()
  }

  // Dialog Timeline Draggable Functions
  const stopProgressBar = (position: DraggableData) => {
    if (!timelineMetricsRef.current) {
      return
    }

    const clampedX = clampTimelineX(position.x, timelineMetricsRef.current.maxX)
    const progressBarTime = timelineXToTime(
      clampedX,
      timelineMetricsRef.current,
    )
    // Keep the visible label in sync with the final drag-stop position before
    // insert-open snapshots currentTime for a new clip.
    const syncedTime = syncTimelineTime(progressBarTime)
    setPreviousTime(syncedTime)
    // Flush the memory cache when you stop dragging. Clear the ref synchronously
    // so the playback interval always reads an empty set even if YouTube's onPlay
    // fires before React commits this state update.
    playedClipsSetRef.current = new Set()
    setPlayedClipsSet(new Set())

    stopScrubAudio()
    updateClipStackData()
    isTimelineScrubbingRef.current = false
    suppressResumeAfterScrubRef.current = false
    manualNavTimeRef.current = null
    currentEventRef.current?.seekTo(syncedTime, true)

    // Sync clip card to wherever the playhead landed:
    // last clip whose start_time <= syncedTime + 0.002, else clip 0.
    if (audioClips.length > 0) {
      const landedIndex = audioClips.reduce((best, clip, i) => {
        return clip.clip_start_time <= syncedTime + 0.002 ? i : best
      }, 0)
      setNavClipIndex(landedIndex)
      navClipIndexRef.current = landedIndex
      selectedClipIdRef.current = audioClips[landedIndex]?.clip_id ?? null
    }
  }
  const dragProgressBar = (position: DraggableData) => {
    if (!timelineMetricsRef.current) {
      return
    }

    const clampedX = clampTimelineX(position.x, timelineMetricsRef.current.maxX)
    const progressBarTime = timelineXToTime(
      clampedX,
      timelineMetricsRef.current,
    )
    // JUST update the local time state so the UI moves smoothly.
    // DO NOT call seekTo() here.
    const syncedTime = syncTimelineTime(progressBarTime)
    setCurrentTime(syncedTime)

    // We keep these reset so audio doesn't trigger WHILE dragging
    resetScrubPlaybackTracking()
  }

  const updateClipStackData = useCallback(() => {
    clipStackRef.current.forEach((clip) => {
      if (clip.clip_audio) clip.clip_audio.unload()
    })
    const newClipIndex = audioClips.findIndex(
      (clip) =>
        clip.clip_start_time >= currentTimeRef.current ||
        (clip.clip_start_time < currentTimeRef.current &&
          clip.clip_end_time > currentTimeRef.current),
    )
    setCurrentClipIndex(newClipIndex)
    const clipStackData = []
    for (let i = newClipIndex; i < newClipIndex + clipStackSize; i++) {
      const clip = audioClips[i]
      if (clip) {
        clip.clip_audio = new Howl({
          src: clip.clip_audio_path,
          html5: true,
          preload: true,
          autoplay: false,
        })
        clip.clip_audio.load()
        clipStackData.push(clip)
      }
    }
    setClipStack(clipStackData)
  }, [audioClips, setCurrentClipIndex, clipStackSize])

  // toggle Show Edit Component
  // logic to show/hide the edit component and add it to a list along with clip Id
  // this hides one edit component when the other is opened

  const setEditComponentToggleFunc = (clipId: string, value: boolean) => {
    const temp = [...editComponentToggleList]
    temp.forEach((data) => {
      if (value) {
        if (data.clipId === clipId) data.showEditComponent = value
      } else {
        if (data.clipId === clipId) data.showEditComponent = value
      }
    })
    setEditComponentToggleList(temp)
  }

  // when "AudioClip <seq no>" is clicked, video is playing from that audio clip
  const handlePlayAudioClip = (clipStartTime: number) => {
    // Flush the memory cache when clicking a clip to jump
    playedClipsSetRef.current = new Set()
    setPlayedClipsSet(new Set())
    isTimelineScrubbingRef.current = false
    suppressResumeAfterScrubRef.current = false

    currentEvent?.seekTo(clipStartTime - 0.002, true)
    currentEvent?.playVideo() // if paused, video is played from that audio clip.
  }

  // ── Single-clip navigation ───────────────────────────────────────────────────
  const handleClipNavigation = (index: number) => {
    if (audioClips.length === 0) return
    const clamped = Math.max(0, Math.min(index, audioClips.length - 1))
    // Update the ref synchronously so back-to-back clicks read the latest index
    // even before React commits the setNavClipIndex state update.
    navClipIndexRef.current = clamped
    setNavClipIndex(clamped)
    if (isTutorialMode) setTutorialNavClipIndex(clamped)
    selectedClipIdRef.current = audioClips[clamped]?.clip_id ?? null
    setIsClipsListExpanded(false)
    const clipTime = audioClips[clamped]?.clip_start_time
    if (clipTime !== undefined) {
      stopScrubAudio()
      // Stop the playback interval so it cannot override the seek target
      // before onPlay restarts it at the correct position.
      clearPlaybackTimer()
      playedClipsSetRef.current = new Set()
      setPlayedClipsSet(new Set())
      // Clear the scrub-pause lock so seekTo takes effect immediately and
      // the YouTube iframe play button is not blocked by a stale drag state.
      isTimelineScrubbingRef.current = false
      suppressResumeAfterScrubRef.current = false
      const seekTime = Math.max(0, clipTime - 0.002)

      console.log(
        '[NAV] newIndex:',
        clamped,
        'targetClip:',
        audioClips[clamped],
        'seekTime:',
        seekTime,
        'currentTimeRef:',
        currentTimeRef.current,
      )

      // Step 1: re-measure first so timelineMetricsRef has fresh DOM dimensions
      // before any setDraggableTime calls are queued.
      measureTimelineMetrics()

      // Step 2: sync time — uses the freshly-updated timelineMetricsRef to queue
      // setDraggableTime({x: correct}) and update currentTimeRef.
      syncTimelineTime(seekTime)

      // Step 3: explicit setDraggableTime as the final, guaranteed write so it
      // wins React's batch regardless of ordering between the two calls above.
      // This is the variable that drives the visual red marker position.
      if (timelineMetricsRef.current) {
        setDraggableTime({
          x: timeToTimelineX(seekTime, timelineMetricsRef.current),
          y: 0,
        })
      }

      navSeekPendingRef.current = true
      currentEventRef.current?.seekTo(seekTime, true)
      updateClipStackData()
      manualNavTimeRef.current = clipTime
    }
  }

  // Clamp navClipIndex when audioClips changes (e.g. after delete)
  useEffect(() => {
    if (audioClips.length === 0) return
    setNavClipIndex((prev) => {
      const clamped = Math.min(prev, audioClips.length - 1)
      navClipIndexRef.current = clamped
      selectedClipIdRef.current = audioClips[clamped]?.clip_id ?? null
      return clamped
    })
  }, [audioClips])

  const handlePlayPause = () => {
    if (currExtendedAC) {
      if (isCurrentExtACPaused) {
        isTimelineScrubbingRef.current = false
        suppressResumeAfterScrubRef.current = false
        currExtendedAC.play()
        setCurrentExtACPaused(false)
        setGloballyPaused(false)
      } else {
        currExtendedAC.pause()
        setCurrentExtACPaused(true)
        setGloballyPaused(true)
      }
    } else if (currentState === 1) {
      currentEvent?.pauseVideo()
      setGloballyPaused(true)
    } else {
      isTimelineScrubbingRef.current = false
      suppressResumeAfterScrubRef.current = false
      if (!isActive) setIsActive(true) //if the timer is paused it will start again when the video plays
      if (manualNavTimeRef.current !== null) {
        // Seek 100ms before the clip so audio has time to load before the
        // video reaches the trigger point, preventing clipped audio starts.
        const playTime = Math.max(0, manualNavTimeRef.current - 0.1)
        manualNavTimeRef.current = null
        playedClipsSetRef.current = new Set()
        setPlayedClipsSet(new Set())
        syncTimelineTime(playTime)
        navSeekPendingRef.current = true
        currentEventRef.current?.seekTo(playTime, true)
        updateClipStackData()
        // Force a precise clip stack rebuild at playTime so extended clips are
        // included in the stack with their audio loaded before playback begins.
        const { startIndex, clipStackData } = buildClipStackForTime(
          audioClips,
          playTime,
          clipStackSize,
        )
        setCurrentClipIndex(startIndex)
        setClipStack(clipStackData)
      }
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

  // ── Publish ──────────────────────────────────────────────────────────────────
  const handlePublish = async (e: any, checkbox?: boolean) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/calculate-contributions`,
        { audioDescriptionId },
        { withCredentials: true },
      )
    } catch (err) {
      console.error(err)
      toast.error('Error calculating contribution!')
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/publish-audio-description`,
        {
          audioDescriptionId,
          youtube_id: youtubeVideoId,
          enrolled_in_collaborative_editing: enrollInCollabEdit,
        },
        { withCredentials: true },
      )
      setNeedRefresh(true)
      toast.success('Audio description published successfully!')
      window.location.href = `${window.location.origin}/video/${youtubeVideoId}?ad=${audioDescriptionId}`
    } catch (error) {
      console.error(error)
      toast.error('Error publishing audio description!')
    }
  }

  // ── Unpublish ────────────────────────────────────────────────────────────────
  const handleUnpublishClick = async (audioDescriptionId: string) => {
    if (!audioDescriptionId) {
      toast.error('Audio description ID is undefined!')
      return
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/unpublish-audio-description`,
        { audioDescriptionId, youtube_id: youtubeVideoId },
        { withCredentials: true },
      )
      setIsPublished(false)
      setNeedRefresh(true)
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
        if (updatedDescription)
          await handleClickSaveClipDescription(
            clip.clip_id,
            updatedDescription,
            clip.description_type,
          )
      }
      try {
        await axios.post(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/calculate-contributions`,
          { audioDescriptionId },
          { withCredentials: true },
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
      if (err.response) toast.error(err.response.data.message)
      else {
        console.error(err)
        toast.error('An error occurred. Please try again!!')
      }
    }
  }

  const createClipSaveHandler = (
    clipId: string,
    clipDescriptionType: string,
  ) => {
    return async (updatedClipDescriptionText: string) => {
      try {
        await handleClickSaveClipDescription(
          clipId,
          updatedClipDescriptionText,
          clipDescriptionType,
        )
        toast.success('Description Saved Successfully!')
      } catch (error) {
        console.error('Error saving clip description:', error)
        toast.error('Error saving description. Please try again.')
      }
    }
  }

  return (
    <div className="ydx-body ydx-html">
      {showSpinner ? <Spinner /> : <></>}
      <div className="container home-container">
        {/* YouTube + Controls + Notes */}
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
            playPauseDataTutorial={
              isTutorialMode ? 'play-pause-btn' : undefined
            }
            audioDuckingDataTutorial={
              isTutorialMode ? 'audio-ducking' : undefined
            }
          />
          <Notes
            currentTime={convertSecondsToCardFormat(currentTime)}
            audioDescriptionId={audioDescriptionId || ''}
            notesData={notesData}
            dataTutorial={isTutorialMode ? 'notes-area' : undefined}
            readOnly={isTutorialMode}
            disableAutoSave={isTutorialMode}
            handleVideoPause={async () => {
              const currentState = await currentEvent?.getPlayerState()
              if (currentState === 1) handlePlayPause()
            }}
          />
        </div>
        <hr className="m-2 ydx-hr" />

        {/* Dialog Timeline */}
        {hasCanonicalDuration && (
          <div
            className="timeline-section-wrapper"
            data-tutorial={isTutorialMode ? 'dialog-timeline' : undefined}
          >
            <div className="timeline-header">
              <h6 className="timeline-title">
                Dialog Timeline (
                {convertSecondsToCardFormat(canonicalDurationSeconds)}
                ):
              </h6>
              <div className="timeline-actions">
                <span className="clips-count">
                  Audio Clips Count: {audioClips.length}
                </span>
                {undoDeletedClipInfo && (
                  <Button
                    className="btn rounded btn-sm text-white bg-warning ydx-button"
                    onClick={fetchUndoDeletedClipData}
                  >
                    <i className="fa fa-undo" /> Undo Last Deleted
                  </Button>
                )}
              </div>
            </div>
            <div className="timeline-container-wrapper" ref={divRef2}>
              <div className="timeline-track-wrapper" ref={divRef3}>
                {/* Audio Clips Timeline - Consistent with Video.tsx */}
                {audioClips.map((clip) => {
                  const left = timelineMetrics
                    ? timeToTimelineX(clip.clip_start_time, timelineMetrics)
                    : 0
                  const width = timelineMetrics
                    ? timeToTimelineX(clip.clip_duration, timelineMetrics)
                    : 0
                  const isExtended = clip.playback_type === 'extended'
                  return (
                    <div
                      key={`audio-${clip.clip_id}`}
                      className="audio-clip-timeline-segment"
                      style={{
                        position: 'absolute',
                        left: `${left}px`,
                        width: isExtended ? '3px' : `${width}px`,
                        height: '20px',
                        backgroundColor: isExtended
                          ? 'var(--extended-color)'
                          : 'var(--inline-color)',
                        top: '0px',
                        zIndex: 3,
                        borderRadius: '2px',
                        opacity: 0.8,
                      }}
                      title={`${
                        clip.playback_type
                      }: ${clip.description_text?.substring(0, 50)}...`}
                    />
                  )
                })}
                {/* Dialog Timeline blue & white div's */}
                {videoDialogTimestamps.map((dialog, key) => {
                  const position = timelineMetrics
                    ? {
                        x: timeToTimelineX(
                          dialog.dialog_start_time,
                          timelineMetrics,
                        ),
                        y: 0,
                      }
                    : { x: 0, y: 0 }
                  const width = timelineMetrics
                    ? timeToTimelineX(dialog.dialog_duration, timelineMetrics)
                    : 0

                  return (
                    <Draggable
                      axis="x"
                      key={key}
                      position={position}
                      bounds="parent"
                    >
                      <div
                        className="dialog-timestamps-div"
                        style={{
                          width,
                          height: '20px',
                        }}
                      ></div>
                    </Draggable>
                  )
                })}
                {timelineMetrics && unitLength > 0 && (
                  // ProgressBar
                  <Draggable
                    axis="x"
                    bounds="parent"
                    defaultPosition={{ x: 0, y: 0 }}
                    position={draggableTime}
                    onStart={startProgressBar}
                    onDrag={(_, data) => {
                      dragProgressBar(data)
                    }}
                    onStop={(_, data) => {
                      stopProgressBar(data)
                    }}
                  >
                    <div
                      ref={playheadRef}
                      tabIndex={0}
                      className="progress-bar-div editor-progress-bar-div"
                    >
                      <p
                        className="mt-5 text-white progress-bar-time"
                        data-tutorial={
                          isTutorialMode ? 'dialog-timeline-time' : undefined
                        }
                      >
                        {convertSecondsToCardFormat(currentTime)}
                      </p>
                    </div>
                  </Draggable>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation bar: 3-column grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '8px',
            margin: '8px 0',
          }}
        >
          {/* Left: Insert buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isPublished && (
              <>
                <button
                  type="button"
                  className="btn inline-bg text-dark ydx-button"
                  data-tutorial={
                    isTutorialMode ? 'insert-inline-btn' : undefined
                  }
                  onClick={() => setHandleClicksFromParent('inline')}
                >
                  <i className="fa fa-plus" /> Insert Inline
                </button>
                <button
                  type="button"
                  className="btn extended-bg text-white ydx-button"
                  data-tutorial={
                    isTutorialMode ? 'insert-extended-btn' : undefined
                  }
                  onClick={() => setHandleClicksFromParent('extended')}
                >
                  <i className="fa fa-plus" /> Insert Extended
                </button>
              </>
            )}
          </div>

          {/* Center: Currently editing — compact button centered in remaining space */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {audioClips.length > 0 && (
              <button
                className="clip-nav-btn-blue"
                onClick={() => setIsClipsListExpanded(!isClipsListExpanded)}
                style={{ whiteSpace: 'nowrap' }}
                aria-label={`Currently editing clip ${navClipIndex + 1} of ${
                  audioClips.length
                }. Click to ${
                  isClipsListExpanded ? 'collapse' : 'expand'
                } clip list`}
                aria-expanded={isClipsListExpanded}
              >
                <i
                  className={`fa fa-${
                    isClipsListExpanded ? 'caret-down' : 'caret-right'
                  }`}
                />{' '}
                Currently editing: Clip {navClipIndex + 1} - All Clips (
                {audioClips.length} total)
              </button>
            )}
          </div>

          {/* Right: Prev/Next */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="clip-nav-btn-blue"
              style={{ backgroundColor: '#6c757d' }}
              disabled={navClipIndex === 0}
              onClick={() => handleClipNavigation(navClipIndexRef.current - 1)}
              aria-label="Go to previous clip"
            >
              ← Previous
            </button>
            <button
              className="clip-nav-btn-blue"
              disabled={navClipIndex >= audioClips.length - 1}
              onClick={() => handleClipNavigation(navClipIndexRef.current + 1)}
              aria-label="Go to next clip"
            >
              Next →
            </button>
          </div>
        </div>

        {/* InsertPublish */}
        {!isPublished && hasCanonicalDuration && (
          <InsertPublish
            handleClicksFromParent={handleClicksFromParent}
            setHandleClicksFromParent={setHandleClicksFromParent}
            userId={user || ''}
            setShowSpinner={setShowSpinner}
            youtubeVideoId={youtubeVideoId || ''}
            currentTime={currentTime}
            videoLength={canonicalDurationSeconds}
            audioDescriptionId={audioDescriptionId || ''}
            seconds={seconds}
            reset={reset}
            participantId={participant_id || ''}
            setNeedRefresh={setNeedRefresh}
            tutorialMode={isTutorialMode}
            forceShowNewACComponent={tutorialShowClipForm}
          />
        )}

        {/* ClipsNavigator dropdown */}
        <ClipsNavigator
          clips={audioClips}
          currentIndex={navClipIndex}
          onSelectClip={handleClipNavigation}
          isExpanded={isClipsListExpanded}
          setIsExpanded={setIsClipsListExpanded}
        />

        {/* Single clip view */}
        <div
          className="audio-desc-component-list"
          id="audio-list"
          ref={audioClipsListRef}
        >
          {/* Wait for the canonical duration before rendering clip editors so stale backend lengths cannot shape clip state during route changes. */}
          {hasCanonicalDuration && audioClips[navClipIndex] && (
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
              videoLength={canonicalDurationSeconds}
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
              enrollInCollabEdit={enrollInCollabEdit}
              setEnrollInCollabEdit={setEnrollInCollabEdit}
              onPublish={handlePublish}
              isTutorialMode={isTutorialMode}
            />
          )}
        </div>

        {/* Save All (published) */}
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
              <i className="fa fa-save" /> {'   '}Save All
            </button>
          </div>
        )}

        {/* Unpublish + Copy Link (published) */}
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
              onClick={() => handleUnpublishClick(audioDescriptionId!)}
            >
              <i className="fa fa-times" /> {'   '}Unpublish
            </button>
            <button
              className="btn publish-bg text-white ydx-button ml-auto cursor-pointer"
              onClick={() =>
                handleCopyClick(
                  `${window.location.origin}/video/${youtubeVideoId}?ad=${audioDescriptionId}`,
                )
              }
            >
              <i className="fa fa-copy" /> {'   '}Copy Published Link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default YDXHome
