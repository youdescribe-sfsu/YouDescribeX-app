import { useCallback, useEffect, useRef, useState } from 'react'
import YouTubeService from '../utils/YouTubeService'
import convertISO8601ToSeconds from '../utils/convertISO8601ToSeconds'

type CanonicalVideoDurationSource = 'youtube' | 'backend' | 'none'
type CanonicalVideoDurationStatus = 'loading' | 'resolved' | 'error'
type ResolutionFinalization = 'none' | 'youtube' | 'backend' | 'error'

export interface CanonicalVideoDurationState {
  durationSeconds: number
  source: CanonicalVideoDurationSource
  status: CanonicalVideoDurationStatus
}

interface InternalCanonicalVideoDurationState
  extends CanonicalVideoDurationState {
  youtubeVideoId?: string
}

const BACKEND_FALLBACK_TIMEOUT_MS = 750
const createInitialDurationState = (
  youtubeVideoId?: string,
): InternalCanonicalVideoDurationState => ({
  durationSeconds: 0,
  source: 'none',
  status: youtubeVideoId ? 'loading' : 'error',
  youtubeVideoId,
})

const useCanonicalVideoDuration = (
  youtubeVideoId?: string,
  backendFallbackSeconds?: number,
): CanonicalVideoDurationState => {
  const [resolutionState, setResolutionState] =
    useState<InternalCanonicalVideoDurationState>(
      createInitialDurationState(youtubeVideoId),
    )
  const requestIdRef = useRef(0)
  const latestBackendFallbackRef = useRef(backendFallbackSeconds ?? 0)
  const requestStateRef = useRef<{
    deadlineReached: boolean
    finalization: ResolutionFinalization
    requestId: number
    youtubeSettledWithoutUsableDuration: boolean
  }>({
    deadlineReached: false,
    finalization: 'none',
    requestId: 0,
    youtubeSettledWithoutUsableDuration: false,
  })

  useEffect(() => {
    latestBackendFallbackRef.current = backendFallbackSeconds ?? 0
  }, [backendFallbackSeconds])

  const commitBackendResolution = useCallback(
    (
      requestId: number,
      durationSeconds: number,
      resolvedYoutubeVideoId?: string,
    ) => {
      const requestState = requestStateRef.current

      if (
        requestState.requestId !== requestId ||
        requestState.finalization === 'youtube' ||
        requestState.finalization === 'backend' ||
        durationSeconds <= 0
      ) {
        return
      }

      requestState.finalization = 'backend'
      setResolutionState({
        durationSeconds,
        source: 'backend',
        status: 'resolved',
        youtubeVideoId: resolvedYoutubeVideoId,
      })
    },
    [],
  )

  const commitErrorResolution = useCallback(
    (requestId: number, resolvedYoutubeVideoId?: string) => {
      const requestState = requestStateRef.current

      if (
        requestState.requestId !== requestId ||
        requestState.finalization === 'youtube' ||
        requestState.finalization === 'backend'
      ) {
        return
      }

      requestState.finalization = 'error'
      setResolutionState({
        durationSeconds: 0,
        source: 'none',
        status: 'error',
        youtubeVideoId: resolvedYoutubeVideoId,
      })
    },
    [],
  )

  useEffect(() => {
    const backendFallback = latestBackendFallbackRef.current

    if (!youtubeVideoId) {
      requestStateRef.current = {
        deadlineReached: false,
        finalization: backendFallback > 0 ? 'backend' : 'error',
        requestId: requestIdRef.current,
        youtubeSettledWithoutUsableDuration: true,
      }

      if (backendFallback > 0) {
        setResolutionState({
          durationSeconds: backendFallback,
          source: 'backend',
          status: 'resolved',
          youtubeVideoId,
        })
        return
      }

      setResolutionState({
        durationSeconds: 0,
        source: 'none',
        status: 'error',
        youtubeVideoId,
      })
      return
    }

    const requestId = ++requestIdRef.current
    let isCancelled = false
    requestStateRef.current = {
      deadlineReached: false,
      finalization: 'none',
      requestId,
      youtubeSettledWithoutUsableDuration: false,
    }
    setResolutionState(createInitialDurationState(youtubeVideoId))

    const timeoutId = window.setTimeout(() => {
      if (isCancelled || requestStateRef.current.requestId !== requestId) {
        return
      }

      requestStateRef.current.deadlineReached = true

      const latestBackendFallback = latestBackendFallbackRef.current
      if (latestBackendFallback > 0) {
        commitBackendResolution(
          requestId,
          latestBackendFallback,
          youtubeVideoId,
        )
      }
    }, BACKEND_FALLBACK_TIMEOUT_MS)

    const resolveDuration = async () => {
      try {
        const videoDetails = await YouTubeService.getVideoDetails(
          youtubeVideoId,
        )

        if (isCancelled || requestStateRef.current.requestId !== requestId) {
          return
        }

        const matchingVideo =
          videoDetails.find((video) => video.id === youtubeVideoId) ||
          videoDetails[0]
        const youtubeDuration = matchingVideo?.contentDetails?.duration
          ? convertISO8601ToSeconds(matchingVideo.contentDetails.duration)
          : 0

        if (youtubeDuration > 0) {
          if (
            requestStateRef.current.finalization === 'backend' ||
            requestStateRef.current.finalization === 'youtube'
          ) {
            return
          }

          requestStateRef.current.finalization = 'youtube'
          window.clearTimeout(timeoutId)
          setResolutionState({
            durationSeconds: youtubeDuration,
            source: 'youtube',
            status: 'resolved',
            youtubeVideoId,
          })
          return
        }

        requestStateRef.current.youtubeSettledWithoutUsableDuration = true
        window.clearTimeout(timeoutId)

        const latestBackendFallback = latestBackendFallbackRef.current
        if (latestBackendFallback > 0) {
          commitBackendResolution(
            requestId,
            latestBackendFallback,
            youtubeVideoId,
          )
          return
        }

        commitErrorResolution(requestId, youtubeVideoId)
      } catch {
        if (isCancelled || requestStateRef.current.requestId !== requestId) {
          return
        }

        requestStateRef.current.youtubeSettledWithoutUsableDuration = true
        window.clearTimeout(timeoutId)

        const latestBackendFallback = latestBackendFallbackRef.current
        if (latestBackendFallback > 0) {
          commitBackendResolution(
            requestId,
            latestBackendFallback,
            youtubeVideoId,
          )
          return
        }

        commitErrorResolution(requestId, youtubeVideoId)
      }
    }

    resolveDuration()

    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [commitBackendResolution, commitErrorResolution, youtubeVideoId])

  useEffect(() => {
    const requestState = requestStateRef.current

    if (
      (backendFallbackSeconds ?? 0) > 0 &&
      requestState.requestId > 0 &&
      requestState.finalization !== 'youtube' &&
      requestState.finalization !== 'backend' &&
      (requestState.deadlineReached ||
        requestState.youtubeSettledWithoutUsableDuration)
    ) {
      commitBackendResolution(
        requestState.requestId,
        backendFallbackSeconds ?? 0,
        youtubeVideoId,
      )
    }
  }, [backendFallbackSeconds, commitBackendResolution, youtubeVideoId])

  if (resolutionState.youtubeVideoId !== youtubeVideoId) {
    const initialState = createInitialDurationState(youtubeVideoId)
    return {
      durationSeconds: initialState.durationSeconds,
      source: initialState.source,
      status: initialState.status,
    }
  }

  return {
    durationSeconds: resolutionState.durationSeconds,
    source: resolutionState.source,
    status: resolutionState.status,
  }
}

export default useCanonicalVideoDuration
