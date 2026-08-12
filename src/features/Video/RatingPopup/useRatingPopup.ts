import { useCallback, useEffect, useState } from 'react'

/**
 * How long the confirmation stays on screen. The old implementation used 1s,
 * which cut VoiceOver off mid-sentence.
 */
const SUCCESS_MESSAGE_TIMEOUT_MS = 6000

/**
 * Owns the open/closed and post-submit-confirmation state for the rating popup.
 *
 * Video.tsx and Video_v2.tsx both host the popup and previously each carried
 * their own copy of this logic (toggling `display` on `#rating-popup` by id and
 * focusing a transient success div). Keeping it here means the accessibility
 * behaviour — mount/unmount instead of display toggling, and a confirmation
 * that survives long enough to be announced — only has one implementation.
 */
export const useRatingPopup = () => {
  const [isRatingPopupOpen, setIsRatingPopupOpen] = useState(false)
  const [ratingSubmitError, setRatingSubmitError] = useState('')
  const [ratingSuccessMessage, setRatingSuccessMessage] = useState('')

  const openRatingPopup = useCallback(() => {
    setRatingSubmitError('')
    setRatingSuccessMessage('')
    setIsRatingPopupOpen(true)
  }, [])

  const closeRatingPopup = useCallback(() => {
    setRatingSubmitError('')
    setIsRatingPopupOpen(false)
  }, [])

  /** Close after a successful save and hand the popup's own message to the page live region. */
  const completeRatingPopup = useCallback((message: string) => {
    setRatingSubmitError('')
    setIsRatingPopupOpen(false)
    setRatingSuccessMessage(message)
  }, [])

  // Clearing the text afterwards does not retract what was already announced,
  // so the visual confirmation can be dismissed without affecting the live region.
  useEffect(() => {
    if (!ratingSuccessMessage) {
      return undefined
    }
    const timeout = window.setTimeout(
      () => setRatingSuccessMessage(''),
      SUCCESS_MESSAGE_TIMEOUT_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [ratingSuccessMessage])

  return {
    isRatingPopupOpen,
    openRatingPopup,
    closeRatingPopup,
    completeRatingPopup,
    ratingSubmitError,
    setRatingSubmitError,
    ratingSuccessMessage,
  }
}
