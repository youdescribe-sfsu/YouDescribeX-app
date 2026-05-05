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
      // <-- Removed async and seekTime parameter
      const type = clip.playback_type // <-- Use local state immediately
      setActiveClipId(clip.clip_id)

      if (type === 'extended') {
        engineStateRef.current = 'PLAYING_EXTENDED'
        currentEvent?.pauseVideo()
      } else {
        engineStateRef.current = 'PLAYING_INLINE'
      }

      const howl = new Howl({
        src: clip.clip_audio_path,
        html5: true,
        volume: descriptionVolume / 100,
        onplay: () => {
          // Recalculate the time exactly when Howler is fully loaded and starts playing.
          // This absorbs any micro-stutters from downloading/decoding the audio file.
          if (currentEvent && type !== 'extended') {
            const currentVideoTime = currentEvent.getCurrentTime()
            const accurateSeekTime = currentVideoTime - clip.clip_start_time

            // Only seek if we are lagging by more than a tiny threshold
            if (accurateSeekTime > 0.05) {
              howl.seek(accurateSeekTime)
            }
          }
        },
        onend: () => {
          howl.unload()
          currentAudioRef.current = null
          if (type === 'extended') {
            currentEvent?.playVideo()
          }
          engineStateRef.current = 'PLAYING_VIDEO'
        },
      })

      currentAudioRef.current = howl
      howl.play()
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

  // 5. Stop All Audio (Required by Video.tsx)
  // Inside useAudioDescriptionEngine.ts
  const stopAllAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.stop()
      currentAudioRef.current.unload()
      currentAudioRef.current = null
    }
    setActiveClipId(null) // <--- Add this line!
    engineStateRef.current = 'IDLE'
  }, [])

  // 6. Sync & Lifecycle
  useEffect(() => {
    if (currentAudioRef.current)
      currentAudioRef.current.volume(descriptionVolume / 100)
  }, [descriptionVolume])

  useEffect(() => {
    let id: any
    if (isPlaying) id = setInterval(tick, 150)
    return () => clearInterval(id)
  }, [isPlaying, tick])

  return {
    currentTimeUI,
    playedClips,
    activeClipId,
    seekTo,
    handleSeek: seekTo, // Alias for Video.tsx compatibility
    stopAllAudio, // Exported for Video.tsx compatibility
    resetPlayedClips: () => {
      playedClipsRef.current = new Set()
      setPlayedClips(new Set())
    },
  }
}
