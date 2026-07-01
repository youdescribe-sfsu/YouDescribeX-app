import { useEffect, useRef, useState, useCallback } from 'react'
import { Howl } from 'howler'
import axios from 'axios'
import { Clip } from '@/shared/utils/convertClipObject'

type EngineState =
  | 'IDLE'
  | 'PLAYING_VIDEO'
  | 'PLAYING_INLINE'
  | 'PLAYING_EXTENDED'
  | 'SEEKING'

export const useAudioDescriptionEngine = (
  audioClips: Clip[],
  currentEvent: any, // YouTube instance
  descriptionVolume: number,
  isPlaying: boolean, // To control the tick interval
) => {
  // --- SYNCHRONOUS REFS (The "Brain") ---
  const engineStateRef = useRef<EngineState>('IDLE')
  const playedClipsRef = useRef<Set<string>>(new Set())
  const currentAudioRef = useRef<Howl | null>(null)
  const currentSoundIdRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number>(0)

  // --- UI STATE (The "Face") ---
  const [playedClips, setPlayedClips] = useState<Set<string>>(new Set())
  const [currentTimeUI, setCurrentTimeUI] = useState(0)
  const [activeClipId, setActiveClipId] = useState<string | null>(null)

  // 1. Helper: Check DB for type changes (needed for editing workflow)
  const checkPlaybackType = async (clip: Clip) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/get-playback-type/${clip.clip_id}`,
        { withCredentials: true },
      )
      return data.playback_type
    } catch (e) {
      return clip.playback_type
    }
  }

  // 2. Playback Logic
  const startPlayback = useCallback(
    (clip: Clip) => {
      const type = clip.playback_type
      setActiveClipId(clip.clip_id)

      if (type === 'extended') {
        engineStateRef.current = 'PLAYING_EXTENDED'
        currentEvent?.pauseVideo()
      } else {
        engineStateRef.current = 'PLAYING_INLINE'
      }

      // Assign to a variable and ensure it is treated as a Howl instance
      const howlInstance: Howl =
        clip.clip_audio ??
        new Howl({
          src: clip.clip_audio_path,
          html5: true,
          preload: true,
          volume: descriptionVolume / 100,
        })

      // Use howlInstance consistently within this scope
      howlInstance.once('play', () => {
        if (currentEvent && type !== 'extended') {
          const currentVideoTime = currentEvent.getCurrentTime()
          const drift = currentVideoTime - clip.clip_start_time

          if (drift > 0.02 && drift < clip.clip_duration) {
            howlInstance.seek(drift) // TS now knows this is a Howl instance
          }
        }
      })

      howlInstance.once('end', () => {
        currentAudioRef.current = null
        currentSoundIdRef.current = null
        if (type === 'extended') currentEvent?.playVideo()
        engineStateRef.current = 'PLAYING_VIDEO'
      })

      currentAudioRef.current = howlInstance
      currentSoundIdRef.current = howlInstance.play()
    },
    [currentEvent, descriptionVolume],
  )

  // 3. The "Tick" Loop
  const tick = useCallback(() => {
    if (!currentEvent || engineStateRef.current === 'SEEKING') return

    const now = currentEvent.getCurrentTime()
    setCurrentTimeUI(now)

    const clipToPlay = audioClips.find((clip) => {
      if (playedClipsRef.current.has(clip.clip_id)) return false
      return (
        clip.clip_start_time <= now &&
        clip.clip_start_time >= previousTimeRef.current
      )
    })

    if (clipToPlay && !currentAudioRef.current?.playing()) {
      playedClipsRef.current.add(clipToPlay.clip_id)
      setPlayedClips(new Set(playedClipsRef.current))

      // Update how this is called
      startPlayback(clipToPlay)
    }

    previousTimeRef.current = now
  }, [audioClips, currentEvent, startPlayback])

  // 4. Seek Handler
  const seekTo = useCallback(
    (time: number) => {
      engineStateRef.current = 'SEEKING'

      if (currentAudioRef.current) {
        currentAudioRef.current.stop()
        currentAudioRef.current = null
        currentSoundIdRef.current = null
      }

      const newPlayedSet = new Set<string>()
      audioClips.forEach((c) => {
        if (c.clip_start_time < time) newPlayedSet.add(c.clip_id)
      })

      playedClipsRef.current = newPlayedSet
      setPlayedClips(newPlayedSet)
      previousTimeRef.current = time
      setCurrentTimeUI(time)

      engineStateRef.current = 'PLAYING_VIDEO'
    },
    [audioClips],
  )

  // 4b. Buffering handler — YouTube has no dedicated seek event; it fires
  // BUFFERING both on real seeks and on a plain resume after pause. Only a
  // genuine playhead jump should reset the engine; resetting on resume would
  // kill (and mark as played) an inline clip that is merely paused.
  const handleBuffering = useCallback(
    (time: number) => {
      const SEEK_JUMP_THRESHOLD = 1.5 // seconds
      if (Math.abs(time - previousTimeRef.current) > SEEK_JUMP_THRESHOLD) {
        seekTo(time)
      }
    },
    [seekTo],
  )

  // 5. Pause/Resume the current inline clip (video pause/play controls)
  // Extended clips are excluded: they pause the video themselves, and that
  // pause event must not stop the clip that triggered it.
  const pauseCurrentAudio = useCallback(() => {
    if (
      engineStateRef.current === 'PLAYING_INLINE' &&
      currentAudioRef.current?.playing()
    ) {
      currentAudioRef.current.pause(currentSoundIdRef.current ?? undefined)
    }
  }, [])

  const resumeCurrentAudio = useCallback(() => {
    if (
      engineStateRef.current === 'PLAYING_INLINE' &&
      currentAudioRef.current &&
      !currentAudioRef.current.playing()
    ) {
      currentAudioRef.current.play(currentSoundIdRef.current ?? undefined)
    }
  }, [])

  // 6. Stop All Audio (Required by Video.tsx)
  // Inside useAudioDescriptionEngine.ts
  const stopAllAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.stop()
      currentAudioRef.current.unload()
      currentAudioRef.current = null
      currentSoundIdRef.current = null
    }
    setActiveClipId(null) // <--- Add this line!
    engineStateRef.current = 'IDLE'
  }, [])

  // 7. Sync & Lifecycle
  useEffect(() => {
    if (currentAudioRef.current)
      currentAudioRef.current.volume(descriptionVolume / 100)
  }, [descriptionVolume])

  useEffect(() => {
    let id: any
    if (isPlaying) id = setInterval(tick, 150)
    return () => clearInterval(id)
  }, [isPlaying, tick])

  useEffect(() => {
    return () => {
      // When the hook is destroyed (e.g., navigating away from the page),
      // ensure any currently playing Howler instance is killed.
      stopAllAudio()
    }
  }, [stopAllAudio])

  return {
    currentTimeUI,
    playedClips,
    activeClipId,
    seekTo,
    handleSeek: seekTo, // Alias for Video.tsx compatibility
    handleBuffering,
    stopAllAudio, // Exported for Video.tsx compatibility
    pauseCurrentAudio,
    resumeCurrentAudio,
    resetPlayedClips: () => {
      playedClipsRef.current = new Set()
      setPlayedClips(new Set())
    },
  }
}
