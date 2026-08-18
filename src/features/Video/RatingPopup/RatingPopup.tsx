import { translate, userDataStore } from '@/App'
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import './ratingPopup.scss'
import { apiUrl } from '@/shared/config'
import ourFetch from '@/shared/utils/ourFetch'
import { getTabbableElements, hidePageBehind, trapTabKey } from './modalFocus'

interface Props {
  /** The popup mounts only while open, so focus and live regions behave predictably. */
  isOpen: boolean
  audioDescriptionId: string
  comprehensionRating: number
  setComprehensionRating: Dispatch<SetStateAction<number>>
  enjoymentRating: number
  setEnjoymentRating: Dispatch<SetStateAction<number>>
  comment: string
  setComment: Dispatch<SetStateAction<string>>
  /** Server/session failures raised by the host page; rendered in the dialog's alert region. */
  submitError?: string
  handleRatingSubmit: (
    comprehensionRating: number,
    enjoymentRating: number,
    comment: string,
  ) => void
  handleRatingPopupClose: () => void
}

const COMPREHENSION_QUESTION =
  'How well were you able to follow what was happening in the video?'
const ENJOYMENT_QUESTION = 'How much did you enjoy the video?'

const COMPREHENSION_CAPTIONS = [
  'Not at all',
  'A little',
  'Somewhat',
  'Mostly',
  'Completely',
]

const ENJOYMENT_CAPTIONS = [
  'Not at all',
  'A little',
  'Somewhat',
  'Quite a bit',
  'A great deal',
]

const ERROR_ID = 'rating-popup-error'
const SUBTITLE_ID = 'rating-popup-subtitle'
const DICTATION_HINT_ID = 'rating-dictation-hint'

/** Option+S on a Mac reports as Alt+S, which is the aria-keyshortcuts spelling. */
const DICTATION_SHORTCUT = 'Alt+S'

/** "1 2 3 4 5" — the number keys that pick a score. */
const scaleShortcuts = (count: number) =>
  Array.from({ length: count }, (unused, index) => index + 1).join(' ')

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((event: any) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

const SpeechRecognitionCtor =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition // eslint-disable-line @typescript-eslint/no-explicit-any

const RatingPopup = ({
  isOpen,
  audioDescriptionId,
  comprehensionRating,
  setComprehensionRating,
  enjoymentRating,
  setEnjoymentRating,
  comment,
  setComment,
  submitError = '',
  handleRatingSubmit,
  handleRatingPopupClose,
}: Props) => {
  const [isListening, setIsListening] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [prefillNotice, setPrefillNotice] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const baseCommentRef = useRef('')
  const finalTranscriptRef = useRef('')

  // Rendering into body (rather than inside the page's <main>) keeps landmark
  // navigation sane while the dialog is open and lets us hide the rest of body.
  const portalTarget = useMemo(() => {
    if (typeof document === 'undefined') {
      return null
    }
    return document.createElement('div')
  }, [])

  useEffect(() => {
    if (!isOpen || !portalTarget) {
      return undefined
    }
    document.body.appendChild(portalTarget)
    const restorePage = hidePageBehind(portalTarget)
    return () => {
      restorePage()
      portalTarget.remove()
    }
  }, [isOpen, portalTarget])

  // Move focus into the dialog on open and hand it back to whatever opened it.
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => {
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setValidationError('')
      setPrefillNotice('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    let cancelled = false

    const fetchUserRating = async () => {
      try {
        const userId = userDataStore.getState().userId
        if (!audioDescriptionId || !userId) {
          return
        }
        const url = `${apiUrl}/audio-descriptions/ratings/user/${audioDescriptionId}?userId=${userId}`
        const response = await ourFetch(url)
        const result = response.result as {
          rating: number | null
          enjoymentRating: number | null
          comment: string
        } | null
        if (!result || cancelled) {
          return
        }
        if (result.rating !== null) {
          setComprehensionRating(result.rating)
        }
        if (result.enjoymentRating !== null) {
          setEnjoymentRating(result.enjoymentRating)
        }
        if (result.comment) {
          setComment(result.comment)
        }
        // Radios silently becoming selected is invisible to a screen reader, so
        // say that the form was populated from a previous rating.
        if (
          result.rating !== null ||
          result.enjoymentRating !== null ||
          result.comment
        ) {
          setPrefillNotice(
            translate(
              'Your previous answers for this video have been filled in.',
            ),
          )
        }
      } catch (error) {
        console.error('Error fetching user rating:', error)
      }
    }

    fetchUserRating()
    return () => {
      cancelled = true
    }
  }, [
    isOpen,
    audioDescriptionId,
    setComprehensionRating,
    setEnjoymentRating,
    setComment,
  ])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const stopDictation = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const toggleDictation = () => {
    if (isListening) {
      stopDictation()
      return
    }

    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    baseCommentRef.current = comment ? `${comment.trimEnd()} ` : ''
    finalTranscriptRef.current = ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript
        } else {
          interim += transcript
        }
      }
      setComment(baseCommentRef.current + finalTranscriptRef.current + interim)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const closePopup = useCallback(() => {
    stopDictation()
    handleRatingPopupClose()
  }, [handleRatingPopupClose, stopDictation])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      closePopup()
      return
    }
    // event.code rather than event.key: Option+S emits "ß" on a Mac layout.
    if (SpeechRecognitionCtor && event.altKey && event.code === 'KeyS') {
      event.preventDefault()
      toggleDictation()
      return
    }
    if (dialogRef.current) {
      trapTabKey(event, dialogRef.current)
    }
  }

  const comprehensionMissing = comprehensionRating === 0
  const enjoymentMissing = enjoymentRating === 0

  const focusFirstUnanswered = () => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    const groupName = comprehensionMissing
      ? 'comprehension-rating'
      : 'enjoyment-rating'
    const target = getTabbableElements(dialog).find(
      (el) => el instanceof HTMLInputElement && el.name === groupName,
    )
    target?.focus()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    stopDictation()

    if (comprehensionMissing || enjoymentMissing) {
      // Name the outstanding question rather than a generic failure, and put the
      // message inside the dialog where aria-modal lets a screen reader reach it.
      if (comprehensionMissing && enjoymentMissing) {
        setValidationError(
          translate('Please answer both questions before submitting.'),
        )
      } else {
        setValidationError(
          `${translate('Please answer this question:')} ${translate(
            comprehensionMissing ? COMPREHENSION_QUESTION : ENJOYMENT_QUESTION,
          )}`,
        )
      }
      focusFirstUnanswered()
      return
    }

    setValidationError('')
    handleRatingSubmit(comprehensionRating, enjoymentRating, comment)
  }

  const errorMessage = validationError || submitError

  const selectScore = (
    name: string,
    score: number,
    onSelect: (score: number) => void,
  ) => {
    setValidationError('')
    onSelect(score)
    // Move the cursor onto the chosen radio so the selection is announced.
    const radio = document.getElementById(`${name}-${score}`)
    radio?.focus()
  }

  /** Number keys pick a score directly, so the scale is one keystroke deep. */
  const handleScaleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    name: string,
    captionCount: number,
    onSelect: (score: number) => void,
  ) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return
    }
    const score = Number(event.key)
    if (!Number.isInteger(score) || score < 1 || score > captionCount) {
      return
    }
    event.preventDefault()
    selectScore(name, score, onSelect)
  }

  const renderScale = (
    name: string,
    captions: string[],
    value: number,
    onSelect: (score: number) => void,
    isInvalid: boolean,
  ) =>
    captions.map((caption, index) => {
      const score = index + 1
      return (
        <div className="scale-option" key={score}>
          <input
            type="radio"
            id={`${name}-${score}`}
            name={name}
            value={score}
            checked={value === score}
            onChange={() => {
              setValidationError('')
              onSelect(score)
            }}
            aria-describedby={`${name}-${score}-caption`}
            aria-invalid={isInvalid || undefined}
          />
          <label htmlFor={`${name}-${score}`}>
            <span className="scale-number">{score}</span>
          </label>
          <span className="scale-caption" id={`${name}-${score}-caption`}>
            {translate(caption)}
          </span>
        </div>
      )
    })

  const renderQuestion = (
    name: string,
    question: string,
    captions: string[],
    value: number,
    onSelect: (score: number) => void,
  ) => {
    // A radiogroup rather than a fieldset: aria-required is not allowed on an
    // individual radio, and nesting a radiogroup inside a fieldset would make
    // VoiceOver read the question twice.
    const labelId = `${name}-label`
    const hintId = `${name}-hint`
    const isInvalid = Boolean(validationError) && value === 0
    return (
      <div
        className="rating-question"
        role="radiogroup"
        aria-labelledby={labelId}
        aria-required="true"
        aria-invalid={isInvalid || undefined}
        // Group-level, so it is read once on entering the scale rather than
        // again on every arrow key, which moves focus between the radios.
        aria-describedby={isInvalid ? `${hintId} ${ERROR_ID}` : hintId}
        aria-keyshortcuts={scaleShortcuts(captions.length)}
        onKeyDown={(event) =>
          handleScaleKeyDown(event, name, captions.length, onSelect)
        }
      >
        <p className="rating-question-label" id={labelId}>
          {translate(question)}
        </p>
        {/* Enumerates the scale so the options are known without arrowing
            through all five, and states the number-key shortcut. */}
        <p className="visually-hidden" id={hintId}>
          {`${translate('Press a number to answer')}, ${captions
            .map((caption, index) => `${index + 1} ${translate(caption)}`)
            .join(', ')}`}
        </p>
        <div className="scale">
          {renderScale(name, captions, value, onSelect, isInvalid)}
        </div>
      </div>
    )
  }

  if (!isOpen || !portalTarget) {
    return null
  }

  return createPortal(
    <div id="rating-popup" onKeyDown={handleKeyDown}>
      <div
        id="rating-popup-contents"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-popup-title"
        aria-describedby={SUBTITLE_ID}
      >
        <button
          type="button"
          className="close-window"
          aria-label={translate('Close window')}
          onClick={closePopup}
        >
          <i className="fa fa-window-close" aria-hidden="true" />
        </button>
        <h2 id="rating-popup-title">{translate('Two quick questions')}</h2>
        <p className="rating-subtitle" id={SUBTITLE_ID}>
          {translate('About the video you just watched.')}
        </p>
        {/* Always mounted so the region is registered before it gains text. */}
        <div className="visually-hidden" role="status">
          {prefillNotice}
        </div>
        <div className="rating-error" id={ERROR_ID} role="alert">
          {errorMessage}
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {renderQuestion(
            'comprehension-rating',
            COMPREHENSION_QUESTION,
            COMPREHENSION_CAPTIONS,
            comprehensionRating,
            setComprehensionRating,
          )}
          {renderQuestion(
            'enjoyment-rating',
            ENJOYMENT_QUESTION,
            ENJOYMENT_CAPTIONS,
            enjoymentRating,
            setEnjoymentRating,
          )}
          <div className="comment-block">
            <label htmlFor="rating-comment">
              {translate("Anything else you'd like us to know?")}{' '}
              <span className="optional-tag">({translate('optional')})</span>
            </label>
            <div className="comment-wrap">
              <textarea
                id="rating-comment"
                rows={3}
                value={comment}
                placeholder={translate(
                  'Optional — any other thoughts about the video or its description.',
                )}
                onChange={(event) => setComment(event.target.value)}
                aria-describedby={
                  SpeechRecognitionCtor ? DICTATION_HINT_ID : undefined
                }
                aria-keyshortcuts={
                  SpeechRecognitionCtor ? DICTATION_SHORTCUT : undefined
                }
              />
              {SpeechRecognitionCtor && (
                <>
                  {/* Announced on reaching the comment box, so the shortcut is
                      known before the mic button is tabbed to. */}
                  <span className="visually-hidden" id={DICTATION_HINT_ID}>
                    {translate(
                      'Press Option plus S to start or stop voice dictation',
                    )}
                  </span>
                  <button
                    type="button"
                    className={`mic-button ${isListening ? 'listening' : ''}`}
                    onClick={toggleDictation}
                    aria-pressed={isListening}
                    aria-label={translate(
                      isListening
                        ? 'Stop dictating note, press Option plus S'
                        : 'Dictate note with microphone, press Option plus S',
                    )}
                    title={`${translate('Speak your note')}, ${translate(
                      'Option plus S',
                    )}`}
                    aria-keyshortcuts={DICTATION_SHORTCUT}
                  >
                    <i className="fa fa-microphone" aria-hidden="true" />
                  </button>
                </>
              )}
              <span className="dictation-status" role="status">
                {isListening ? translate('Listening…') : ''}
              </span>
            </div>
          </div>
          <div className="rating-footer">
            {/* The keycap and arrow stay in the accessible names to match the
                agreed VoiceOver script ("Back Esc", "Submit & finish "); 
                aria-hidden on them would drop both. */}
            <button
              type="button"
              className="back-button"
              onClick={closePopup}
              aria-keyshortcuts="Escape"
            >
              {translate('Back')} <kbd className="keycap">Esc</kbd>
            </button>
            <button type="submit" className="submit-button">
              {translate('Submit & finish')} <span>&rarr;</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget,
  )
}

export default RatingPopup
