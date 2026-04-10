import { useEffect, useRef, useState } from 'react'
import YouTubeService from '../utils/YouTubeService'
import convertISO8601ToSeconds from '../utils/convertISO8601ToSeconds'

type CanonicalVideoDurationSource = 'youtube' | 'backend' | 'none'
type CanonicalVideoDurationStatus = 'loading' | 'resolved' | 'error'

export interface CanonicalVideoDurationState {
  durationSeconds: number
  source: CanonicalVideoDurationSource
  status: CanonicalVideoDurationStatus
}

interface InternalCanonicalVideoDurationState
  extends CanonicalVideoDurationState {
  youtubeVideoId?: string
}

const createCanonicalDurationState = (
  youtubeVideoId?: string,
  backendFallbackSeconds?: number,
): InternalCanonicalVideoDurationState => ({
  durationSeconds: !youtubeVideoId && (backendFallbackSeconds ?? 0) > 0
    ? backendFallbackSeconds ?? 0
    : 0,
  source: !youtubeVideoId && (backendFallbackSeconds ?? 0) > 0
    ? 'backend'
    : 'none',
  status: youtubeVideoId
    ? 'loading'
    : (backendFallbackSeconds ?? 0) > 0
      ? 'resolved'
      : 'error',
  youtubeVideoId,
})

const useCanonicalVideoDuration = (
  youtubeVideoId?: string,
  backendFallbackSeconds?: number,
): CanonicalVideoDurationState => {
  const [canonicalDurationState, setCanonicalDurationState] =
    useState<InternalCanonicalVideoDurationState>(
      createCanonicalDurationState(youtubeVideoId, backendFallbackSeconds),
    )
  const latestBackendFallbackSecondsRef = useRef(backendFallbackSeconds ?? 0)

  useEffect(() => {
    latestBackendFallbackSecondsRef.current = backendFallbackSeconds ?? 0
  }, [backendFallbackSeconds])

  useEffect(() => {
    const backendFallbackSecondsForCurrentVideo =
      latestBackendFallbackSecondsRef.current

    if (!youtubeVideoId) {
      setCanonicalDurationState(
        createCanonicalDurationState(
          youtubeVideoId,
          backendFallbackSecondsForCurrentVideo,
        ),
      )
      return
    }

    let isCancelled = false
    setCanonicalDurationState(createCanonicalDurationState(youtubeVideoId))

    const resolveDuration = async () => {
      try {
        const videoDetails = await YouTubeService.getVideoDetails(
          youtubeVideoId,
        )

        if (isCancelled) {
          return
        }

        const matchingVideo =
          videoDetails.find((video) => video.id === youtubeVideoId) ||
          videoDetails[0]
        const youtubeDurationSeconds = matchingVideo?.contentDetails?.duration
          ? convertISO8601ToSeconds(matchingVideo.contentDetails.duration)
          : 0

        if (youtubeDurationSeconds > 0) {
          setCanonicalDurationState({
            durationSeconds: youtubeDurationSeconds,
            source: 'youtube',
            status: 'resolved',
            youtubeVideoId,
          })
          return
        }
      } catch {
        // Fall through to backend fallback below.
      }

      if (isCancelled) {
        return
      }

      const latestBackendFallbackSeconds =
        latestBackendFallbackSecondsRef.current

      if (latestBackendFallbackSeconds > 0) {
        setCanonicalDurationState({
          durationSeconds: latestBackendFallbackSeconds,
          source: 'backend',
          status: 'resolved',
          youtubeVideoId,
        })
        return
      }

      setCanonicalDurationState({
        durationSeconds: 0,
        source: 'none',
        status: 'error',
        youtubeVideoId,
      })
    }

    resolveDuration()

    return () => {
      isCancelled = true
    }
  }, [youtubeVideoId])

  useEffect(() => {
    const backendFallback = backendFallbackSeconds ?? 0

    if (!youtubeVideoId || backendFallback <= 0) {
      return
    }

    setCanonicalDurationState((currentDurationState) => {
      if (
        currentDurationState.youtubeVideoId !== youtubeVideoId ||
        currentDurationState.status !== 'error' ||
        currentDurationState.source !== 'none'
      ) {
        return currentDurationState
      }

      return {
        durationSeconds: backendFallback,
        source: 'backend',
        status: 'resolved',
        youtubeVideoId,
      }
    })
  }, [backendFallbackSeconds, youtubeVideoId])

  if (canonicalDurationState.youtubeVideoId !== youtubeVideoId) {
    const initialDurationState = createCanonicalDurationState(
      youtubeVideoId,
      backendFallbackSeconds,
    )
    return {
      durationSeconds: initialDurationState.durationSeconds,
      source: initialDurationState.source,
      status: initialDurationState.status,
    }
  }

  return {
    durationSeconds: canonicalDurationState.durationSeconds,
    source: canonicalDurationState.source,
    status: canonicalDurationState.status,
  }
}

export default useCanonicalVideoDuration
