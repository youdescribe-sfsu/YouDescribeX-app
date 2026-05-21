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
  TUTORIAL_VIDEO_DURATION_SECONDS,
  TUTORIAL_VIDEO_YOUTUBE_ID,
} from '../features/Tutorial/tutorialConfig'
import { TUTORIAL_TARGETS } from '../features/Tutorial/tutorialSelectors'
import { useTutorialEditorAdapter } from '../features/Tutorial/useTutorialEditorAdapter'
import type { TutorialMode } from '../features/Tutorial/tutorialStepRegistry'
import { useAudioDescriptionEngine } from '../shared/hooks/useAudioDescriptionEngine' // <-- Add import
import { invalidateHomeVideoCache } from '@/pages/Home/Home'

type DialogTimestamp = {
  dialog_seq_no: number
  dialog_start_time: number
  dialog_duration: number
}

const DEFAULT_PLAYHEAD_WIDTH_PX = 2

interface YDXHomeProps {
  isTutorialMode?: boolean
  tutorialMode?: TutorialMode | null
}

const YDXHome = ({
  isTutorialMode = false,
  tutorialMode = null,
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
      controls: isTutorialMode ? 0 : 1,
      disablekb: isTutorialMode ? 1 : 0,
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
  const [notesData, setNotesData] = useState<unknown>('') // retrieved from db, stored to pass on to Notes Component
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

  const [updateData, setUpdateData] = useState(false)
  const [recentAudioPlayedTime, setRecentAudioPlayedTime] = useState(0.0)
  const [playedAudioClip, setPlayedAudioClip] = useState('')
  const [playedClipPath, setPlayedClipPath] = useState('')

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

  const {
    tutorialShowClipForm,
    tutorialShowClipsList,
    setTutorialNavClipIndex,
  } = useTutorialEditorAdapter({
    isTutorialMode,
    tutorialMode,
    setShowSpinner,
    setVideoId,
    setVideoLength,
    setBackendFallbackYoutubeVideoId,
    setVideoDialogTimestamps,
    setAudioClips,
    setNotesData,
    setIsPublished,
    setCollaborativeVersion,
    setEditComponentToggleList,
    setNavClipIndex,
    setIsClipsListExpanded,
    navClipIndexRef,
    selectedClipIdRef,
  })

  const shouldShowClipsList =
    isTutorialMode && tutorialShowClipsList ? true : isClipsListExpanded

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

  const {
    currentTimeUI,
    playedClips,
    activeClipId,
    seekTo,
    stopAllAudio,
    resetPlayedClips,
  } = useAudioDescriptionEngine(
    audioClips,
    currentEvent,
    descriptionVolume,
    !isGloballyPaused, // This controls the tick loop
  )

  useEffect(() => {
    if (activeClipId) {
      // 1. Highlight the card (scrolling logic)
      // scrollToAudioClipCard(activeClipId)

      // 2. Keep the Editor's "Currently Editing" index in sync
      const index = audioClips.findIndex((c) => c.clip_id === activeClipId)
      if (index !== -1) {
        setNavClipIndex(index)
        navClipIndexRef.current = index // Update ref too for safety
      }
    }
  }, [activeClipId, audioClips])

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
    navClipIndexRef.current = navClipIndex
  }, [navClipIndex])

  useEffect(() => {
    timelineMetricsRef.current = timelineMetrics
  }, [timelineMetrics])

  useEffect(() => {
    // Only move the playhead if we aren't currently dragging it manually
    if (timelineMetrics && !isTimelineScrubbingRef.current) {
      const newX = timeToTimelineX(currentTimeUI, timelineMetrics)
      setDraggableTime({ x: newX, y: 0 })
    }
  }, [currentTimeUI, timelineMetrics])

  useEffect(() => {
    if (currentEventRef) {
      currentEventRef.current?.setVolume(youTubeVolume)
    }
    youTubeVolumeRef.current = youTubeVolume
    localStorage.setItem('youTubeVolume', youTubeVolume.toString())
  }, [youTubeVolume, currentEventRef])

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
    // 1. Tell the engine to stop all current audio and clear Howler memory
    stopAllAudio()

    // 2. Tell the engine to reset the "already played" history
    resetPlayedClips()

    // 3. Reset local editor UI states
    setRecentAudioPlayedTime(0.0)
    setPlayedAudioClip('')
    setPlayedClipPath('')

    // Note: We no longer need to manually map and unloadHowls here
    // because the engine handles its own cleanup via stopAllAudio.
  }, [stopAllAudio, resetPlayedClips])

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
            let newIdx = 0
            const existingSelectedId = selectedClipIdRef.current
            const foundIndex = audioClipsData.findIndex(
              (c) => c.clip_id === existingSelectedId,
            )

            if (foundIndex !== -1) {
              // We found the clip they were just editing, stay on it!
              newIdx = foundIndex
            } else {
              // Fallback: look at the playhead time
              const t = currentTimeRef.current
              newIdx = audioClipsData.reduce(
                (best, clip, i) => (clip.clip_start_time <= t ? i : best),
                0,
              )
            }

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

  // YouTube Player Functions
  const onStateChange = (event: any) => {
    if (isTutorialMode) {
      setCurrentEvent(event.target)
      currentEventRef.current = event.target
      if (event.data === 1) {
        event.target.pauseVideo()
      }
      setCurrentState(event.data === 1 ? 2 : event.data)
      setGloballyPaused(true)
      setIsActive(false)
      return
    }

    // 1. Logic Guard: Handle navigation seek flags
    const navSeekPending = navSeekPendingRef.current
    if ((event.data === 1 || event.data === 2) && navSeekPending) {
      navSeekPendingRef.current = false
    }

    // 2. Logic Guard: Prevent playhead "snapping" during seek/buffer
    const shouldKeepScrubbedTime =
      isTimelineScrubbingRef.current ||
      suppressResumeAfterScrubRef.current ||
      event.data === 3 ||
      navSeekPending

    const currentTime = shouldKeepScrubbedTime
      ? currentTimeRef.current
      : syncTimelineTime(event.target.getCurrentTime())

    // 3. Update standard state
    setCurrentEvent(event.target)
    currentEventRef.current = event.target
    setCurrentTime(currentTime)
    setCurrentState(event.data)

    // 4. Integrated Engine Switch
    switch (event.data) {
      case 0: // Ended
        resetPlayedClips()
        stopAllAudio()
        setIsActive(false)
        break

      case 1: // Playing
        if (suppressResumeAfterScrubRef.current) {
          event.target.pauseVideo()
          setGloballyPaused(true)
          break
        }

        currentEvent?.setVolume(youTubeVolume)
        if (!isActive) setIsActive(true)

        // We set this to FALSE so the Engine's tick loop knows it's okay to run
        setGloballyPaused(false)
        break

      case 2: // Paused
        // We set this to TRUE to pause the Engine's tick loop
        setGloballyPaused(true)

        // Stop the old timer if you still have it,
        // though the engine mostly replaces this logic
        setTimer((prev) => {
          if (prev) clearInterval(prev)
          return undefined
        })
        break

      case 3: // Buffering / Seek
        // This is the most important engine call:
        // It resets the 'played' set so audio triggers correctly at the new time
        seekTo(event.target.getCurrentTime())
        break
    }
  }

  const onReady = (event: any) => {
    setCurrentEvent(event.target)
    currentEventRef.current = event.target

    if (isTutorialMode) {
      event.target.pauseVideo()
      event.target.getIframe?.().then((iframe: HTMLIFrameElement) => {
        iframe.setAttribute('aria-hidden', 'true')
        iframe.setAttribute('tabindex', '-1')
        iframe.setAttribute('title', 'Tutorial video playback disabled')
      })
    }
  }

  const onPlay = (event: any) => {
    setCurrentEvent(event.target)
    currentEventRef.current = event.target

    if (isTutorialMode) {
      event.target.pauseVideo()
      setCurrentState(2)
      setGloballyPaused(true)
      setIsActive(false)
      return
    }

    if (suppressResumeAfterScrubRef.current) {
      event.target.pauseVideo()
      setGloballyPaused(true)
      return
    }

    // 1. Handle Navigation Seek logic
    const navSeekPending = navSeekPendingRef.current
    if (navSeekPending) navSeekPendingRef.current = false

    const currentTime = navSeekPending
      ? currentTimeRef.current
      : syncTimelineTime(event.target.getCurrentTime())

    setPreviousTime(currentTime)

    // 2. Simply trigger the playback engine by updating the pause state
    // This is much cleaner than managing manual intervals!
    setGloballyPaused(false)
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
    // This one call replaces both manual Howler checks
    stopAllAudio()
  }

  const resetScrubPlaybackTracking = () => {
    setRecentAudioPlayedTime(0.0)
    setPlayedAudioClip('')
    setPlayedClipPath('')
  }

  const startProgressBar = () => {
    isTimelineScrubbingRef.current = true
    suppressResumeAfterScrubRef.current = true
    stopAllAudio() // Use engine stop
    currentEventRef.current?.pauseVideo()
    setGloballyPaused(true)
  }

  // Dialog Timeline Draggable Functions
  const stopProgressBar = (position: DraggableData) => {
    if (!timelineMetricsRef.current) return

    const clampedX = clampTimelineX(position.x, timelineMetricsRef.current.maxX)
    const progressBarTime = timelineXToTime(
      clampedX,
      timelineMetricsRef.current,
    )

    const syncedTime = syncTimelineTime(progressBarTime)
    setPreviousTime(syncedTime)

    // 1. Tell the engine to reset and stop any scrub-audio
    resetPlayedClips()
    stopScrubAudio()

    // 2. Standard cleanup for the YouTube player
    isTimelineScrubbingRef.current = false
    suppressResumeAfterScrubRef.current = false
    manualNavTimeRef.current = null

    // 3. Move the YouTube playhead
    currentEventRef.current?.seekTo(syncedTime, true)

    // 4. Sync the UI card
    if (audioClips.length > 0) {
      let landedIndex = audioClips.findIndex((clip) => {
        // Extended clips pause the video, so their audio duration doesn't
        // stretch across the video's timeline. Their effective end time
        // on the timeline is just their start time.
        const effectiveVideoEndTime =
          clip.playback_type === 'extended'
            ? clip.clip_start_time
            : clip.clip_end_time

        return effectiveVideoEndTime > syncedTime
      })

      // If we dragged past the very last clip entirely
      if (landedIndex === -1) {
        landedIndex = audioClips.length - 1
      }

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
    // 1. Tell the engine to reset its history and prepare for a new time
    stopAllAudio() // Kill any currently playing audio first
    resetPlayedClips()

    // 2. Synchronize the engine's internal time tracker
    // This ensures the engine doesn't think it's still at the old time
    seekTo(clipStartTime - 0.002)

    // 3. UI State cleanup
    isTimelineScrubbingRef.current = false
    suppressResumeAfterScrubRef.current = false

    // 4. Trigger YouTube
    currentEvent?.seekTo(clipStartTime - 0.002, true)
    currentEvent?.playVideo()
  }

  // ── Single-clip navigation ───────────────────────────────────────────────────
  const handleClipNavigation = (index: number) => {
    if (audioClips.length === 0) return
    const clamped = Math.max(0, Math.min(index, audioClips.length - 1))

    // 1. Update UI Selection Refs/State
    navClipIndexRef.current = clamped
    setNavClipIndex(clamped)
    if (isTutorialMode) setTutorialNavClipIndex(clamped)
    selectedClipIdRef.current = audioClips[clamped]?.clip_id ?? null
    setIsClipsListExpanded(false)

    const clipTime = audioClips[clamped]?.clip_start_time
    if (clipTime !== undefined) {
      const seekTime = Math.max(0, clipTime - 0.002)

      // 2. TELL THE ENGINE TO RESET
      stopScrubAudio() // Kills current audio via stopAllAudio()
      resetPlayedClips() // Clears memory of played clips
      seekTo(seekTime) // Updates the engine's internal previousTimeRef

      // 3. Clear Editor Locks
      isTimelineScrubbingRef.current = false
      suppressResumeAfterScrubRef.current = false

      // 4. Visual Timeline Sync (Keep this! It's for the red playhead)
      measureTimelineMetrics()
      syncTimelineTime(seekTime)
      if (timelineMetricsRef.current) {
        setDraggableTime({
          x: timeToTimelineX(seekTime, timelineMetricsRef.current),
          y: 0,
        })
      }

      // 5. Trigger YouTube Seek
      navSeekPendingRef.current = true
      currentEventRef.current?.seekTo(seekTime, true)

      // We can likely remove updateClipStackData() as the engine loop
      // will pick up the new clip at seekTime automatically.
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
    if (isTutorialMode) {
      currentEvent?.pauseVideo()
      stopAllAudio()
      setCurrentState(2)
      setGloballyPaused(true)
      setIsActive(false)
      return
    }

    // If we are currently playing (Video is state 1 or Engine is active)
    if (currentState === 1 || !isGloballyPaused) {
      // 1. Pause everything
      currentEvent?.pauseVideo()
      stopAllAudio() // Kill any active descriptions
      setGloballyPaused(true)
    } else {
      // 2. Prepare for Playback
      isTimelineScrubbingRef.current = false
      suppressResumeAfterScrubRef.current = false

      if (!isActive) setIsActive(true) // Start the work-session timer

      // 3. Handle Navigation Seek (If user clicked Prev/Next then Play)
      if (manualNavTimeRef.current !== null) {
        const playTime = Math.max(0, manualNavTimeRef.current - 0.1)
        manualNavTimeRef.current = null

        // Engine replacements for manual set clearing
        resetPlayedClips()
        seekTo(playTime)

        syncTimelineTime(playTime)
        navSeekPendingRef.current = true
        currentEventRef.current?.seekTo(playTime, true)
      }

      // 4. Play Video
      // The engine's useEffect watches isGloballyPaused and will resume audio automatically
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
      invalidateHomeVideoCache()
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
      invalidateHomeVideoCache()
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
              style={isTutorialMode ? { pointerEvents: 'none' } : undefined}
              title={
                isTutorialMode ? 'Tutorial video playback disabled' : undefined
              }
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
              isTutorialMode ? TUTORIAL_TARGETS.playPauseBtn : undefined
            }
            audioDuckingDataTutorial={
              isTutorialMode ? TUTORIAL_TARGETS.audioDucking : undefined
            }
          />
          <Notes
            currentTime={convertSecondsToCardFormat(currentTime)}
            audioDescriptionId={audioDescriptionId || ''}
            notesData={notesData}
            dataTutorial={
              isTutorialMode ? TUTORIAL_TARGETS.notesArea : undefined
            }
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
            data-tutorial={
              isTutorialMode ? TUTORIAL_TARGETS.dialogTimeline : undefined
            }
          >
            <div className="timeline-header">
              <h6 className="timeline-title">
                Dialog Timeline (
                {convertSecondsToCardFormat(canonicalDurationSeconds)}
                ):
              </h6>
              <div className="timeline-actions">
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
                    // Use the draggableTime state which we will now sync with the engine
                    position={draggableTime}
                    onStart={startProgressBar}
                    onDrag={(_, data) => dragProgressBar(data)}
                    onStop={(_, data) => stopProgressBar(data)}
                  >
                    <div ref={playheadRef} className="progress-bar-div">
                      <p
                        className="mt-5 text-white progress-bar-time"
                        data-tutorial={
                          isTutorialMode
                            ? TUTORIAL_TARGETS.dialogTimelineTime
                            : undefined
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
                  className="btn inline-bg text-dark ydx-button ydx-toolbar-button"
                  data-tutorial={
                    isTutorialMode
                      ? TUTORIAL_TARGETS.insertInlineBtn
                      : undefined
                  }
                  onClick={() => setHandleClicksFromParent('inline')}
                >
                  <i className="fa fa-plus" /> Insert Inline
                </button>
                <button
                  type="button"
                  className="btn extended-bg text-white ydx-button ydx-toolbar-button"
                  data-tutorial={
                    isTutorialMode
                      ? TUTORIAL_TARGETS.insertExtendedBtn
                      : undefined
                  }
                  onClick={() => setHandleClicksFromParent('extended')}
                >
                  <i className="fa fa-plus" /> Insert Extended
                </button>
              </>
            )}
          </div>

          {/* Center: saved clips toggle — compact button centered in remaining space */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {audioClips.length > 0 && (
              <button
                className="btn clip-nav-btn-blue saved-clips-toggle-btn ydx-button ydx-toolbar-button"
                data-tutorial={
                  isTutorialMode
                    ? TUTORIAL_TARGETS.clipCurrentlyEditing
                    : undefined
                }
                onClick={() => setIsClipsListExpanded(!isClipsListExpanded)}
                style={{ whiteSpace: 'nowrap' }}
                aria-label={`View saved audio clips list, ${
                  audioClips.length
                } total. Click to ${
                  shouldShowClipsList ? 'collapse' : 'expand'
                } saved audio clips list`}
                aria-expanded={shouldShowClipsList}
              >
                <i
                  className={`fa fa-${
                    shouldShowClipsList ? 'chevron-up' : 'chevron-down'
                  }`}
                />
                <span className="saved-clips-toggle-text">
                  View Saved Audio Clips ({audioClips.length} total)
                </span>
              </button>
            )}
          </div>

          {/* Right: Prev/Next */}
          <div
            data-tutorial={
              isTutorialMode ? TUTORIAL_TARGETS.clipNavButtons : undefined
            }
            style={{ display: 'flex', gap: '6px' }}
          >
            <button
              className="btn clip-nav-btn-blue ydx-button ydx-toolbar-button"
              disabled={navClipIndex === 0}
              onClick={() => handleClipNavigation(navClipIndexRef.current - 1)}
              aria-label="Go to previous clip"
            >
              ← Previous
            </button>
            <button
              className="btn clip-nav-btn-blue ydx-button ydx-toolbar-button"
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
          isExpanded={shouldShowClipsList}
          setIsExpanded={setIsClipsListExpanded}
          listDataTutorial={
            isTutorialMode ? TUTORIAL_TARGETS.savedClipsList : undefined
          }
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
              currentTime={currentTimeUI}
              userId={user || ''}
              audioDescriptionId={audioDescriptionId || ''}
              youtubeVideoId={youtubeVideoId || ''}
              unitLength={unitLength}
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
