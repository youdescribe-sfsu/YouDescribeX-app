export interface TimelineMetrics {
  durationSeconds: number
  trackWidthPx: number
  playheadWidthPx: number
  maxX: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const buildTimelineMetrics = (
  trackWidthPx: number,
  playheadWidthPx: number,
  durationSeconds: number,
): TimelineMetrics => {
  const safeDurationSeconds = Math.max(durationSeconds, 0)
  const safeTrackWidthPx = Math.max(trackWidthPx, 0)
  const safePlayheadWidthPx = clamp(
    Math.max(playheadWidthPx, 0),
    0,
    safeTrackWidthPx,
  )

  return {
    durationSeconds: safeDurationSeconds,
    trackWidthPx: safeTrackWidthPx,
    playheadWidthPx: safePlayheadWidthPx,
    maxX:
      safeDurationSeconds > 0
        ? Math.max(safeTrackWidthPx - safePlayheadWidthPx, 0)
        : 0,
  }
}

export const clampTimelineTime = (
  time: number,
  durationSeconds: number,
): number =>
  clamp(Number.isFinite(time) ? time : 0, 0, Math.max(durationSeconds, 0))

export const clampTimelineX = (x: number, maxX: number): number =>
  clamp(Number.isFinite(x) ? x : 0, 0, Math.max(maxX, 0))

export const timeToTimelineX = (
  time: number,
  metrics: TimelineMetrics,
): number => {
  if (metrics.durationSeconds <= 0 || metrics.maxX <= 0) {
    return 0
  }

  return (
    (clampTimelineTime(time, metrics.durationSeconds) /
      metrics.durationSeconds) *
    metrics.maxX
  )
}

export const timelineXToTime = (
  x: number,
  metrics: TimelineMetrics,
): number => {
  if (metrics.durationSeconds <= 0 || metrics.maxX <= 0) {
    return 0
  }

  return (
    (clampTimelineX(x, metrics.maxX) / metrics.maxX) * metrics.durationSeconds
  )
}
