/**
 * xiao 0824: AnnouncementBar.tsx
 * AnnouncementBar — dismissible full-width bar shown above the navbar.
 *
 * All content comes from props so the same bar can be reused for any
 * future announcement.
 *
 *   storageKey  required — unique localStorage key per announcement
 *   headline    required — bold leading text
 *   icon        optional — emoji on the left
 *   message     optional — muted text after the headline
 *   ctaLabel    optional — button text, needs ctaHref
 *   ctaHref     optional — external link, opens in a new tab
 *
 * Dismissal is stored in localStorage under the `ANNOUNCEMENT_KEY_PREFIX`
 * namespace, read lazily so a dismissed bar never flashes on load. Access is
 * wrapped in try/catch — localStorage throws when the quota is full or site
 * data is blocked.
 */

import React, { useState } from 'react'
import './announcementBar.scss'

interface AnnouncementBarProps {
  storageKey: string
  headline: string
  icon?: string
  message?: string
  ctaLabel?: string
  ctaHref?: string
}

// All announcement dismissal flags live under this prefix so callers that wipe
// localStorage in bulk (e.g. App.tsx's clearUserData on sign-out) can preserve
// them by pattern instead of having to know every individual storageKey.
export const ANNOUNCEMENT_KEY_PREFIX = 'ydx-announcement:'

const namespacedKey = (key: string) => `${ANNOUNCEMENT_KEY_PREFIX}${key}`

const readDismissed = (key: string): boolean => {
  try {
    return localStorage.getItem(namespacedKey(key)) === 'true'
  } catch (error) {
    console.error('Error reading announcement bar state:', error)
    return false
  }
}

const AnnouncementBar = ({
  storageKey,
  headline,
  icon,
  message,
  ctaLabel,
  ctaHref,
}: AnnouncementBarProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(
    () => !readDismissed(storageKey),
  )

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem(namespacedKey(storageKey), 'true')
    } catch (error) {
      console.error('Error saving announcement bar state:', error)
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <section
      className="ydx-announcement-bar"
      role="region"
      aria-label={headline}
    >
      <div className="ydx-announcement-bar__content">
        {icon && (
          <span className="ydx-announcement-bar__icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <span className="ydx-announcement-bar__headline">{headline}</span>

        {message && (
          <span className="ydx-announcement-bar__message">{message}</span>
        )}

        {ctaHref && ctaLabel && (
          <a
            className="ydx-announcement-bar__cta"
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${ctaLabel} (opens in a new tab)`}
          >
            {ctaLabel} <span aria-hidden="true">→</span>
          </a>
        )}
      </div>

      <button
        type="button"
        className="ydx-announcement-bar__close"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
      >
        <i className="fa fa-xmark" aria-hidden="true" />
      </button>
    </section>
  )
}

export default AnnouncementBar
