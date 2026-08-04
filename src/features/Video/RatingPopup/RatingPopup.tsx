import { translate, userDataStore } from '@/App'
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import './ratingPopup.scss'
import { apiUrl } from '@/shared/config'
import ourFetch from '@/shared/utils/ourFetch'

interface Props {
  audioDescriptionId: string
  comprehensionRating: number
  setComprehensionRating: Dispatch<SetStateAction<number>>
  enjoymentRating: number
  setEnjoymentRating: Dispatch<SetStateAction<number>>
  comment: string
  setComment: Dispatch<SetStateAction<string>>
  handleRatingSubmit: (
    comprehensionRating: number,
    enjoymentRating: number,
    comment: string,
  ) => void
  handleRatingPopupClose: () => void
}

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
  audioDescriptionId,
  comprehensionRating,
  setComprehensionRating,
  enjoymentRating,
  setEnjoymentRating,
  comment,
  setComment,
  handleRatingSubmit,
  handleRatingPopupClose,
}: Props) => {
  const [isListening, setIsListening] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const baseCommentRef = useRef('')
  const finalTranscriptRef = useRef('')

  useEffect(() => {
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
        if (!result) {
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
      } catch (error) {
        console.error('Error fetching user rating:', error)
      }
    }

    fetchUserRating()
  }, [
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

  const stopDictation = () => {
    recognitionRef.current?.stop()
  }

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

  const closePopup = () => {
    stopDictation()
    handleRatingPopupClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') {
      return
    }
    if (rootRef.current?.style.display !== 'block') {
      return
    }
    closePopup()
  }

  const renderScale = (
    name: string,
    captions: string[],
    value: number,
    onSelect: (score: number) => void,
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
            onChange={() => onSelect(score)}
            aria-describedby={`${name}-${score}-caption`}
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

  return (
    <div
      id="rating-popup"
      tabIndex={-1}
      ref={rootRef}
      onKeyDown={handleKeyDown}
    >
      <div
        id="rating-popup-contents"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-popup-title"
      >
        <a
          className="close-window"
          aria-label="close window"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            closePopup()
          }}
        >
          <i className="fa fa-window-close" />
        </a>
        <h2 id="rating-popup-title">{translate('Two quick questions')}</h2>
        <p className="rating-subtitle">
          {translate('About the video you just watched.')}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            stopDictation()
            handleRatingSubmit(comprehensionRating, enjoymentRating, comment)
          }}
        >
          <fieldset className="rating-question">
            <legend>
              {translate(
                'How well were you able to follow what was happening in the video?',
              )}
            </legend>
            <div className="scale">
              {renderScale(
                'comprehension-rating',
                COMPREHENSION_CAPTIONS,
                comprehensionRating,
                setComprehensionRating,
              )}
            </div>
          </fieldset>
          <fieldset className="rating-question">
            <legend>{translate('How much did you enjoy the video?')}</legend>
            <div className="scale">
              {renderScale(
                'enjoyment-rating',
                ENJOYMENT_CAPTIONS,
                enjoymentRating,
                setEnjoymentRating,
              )}
            </div>
          </fieldset>
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
              />
              {SpeechRecognitionCtor && (
                <button
                  type="button"
                  className={`mic-button ${isListening ? 'listening' : ''}`}
                  onClick={toggleDictation}
                  aria-pressed={isListening}
                  aria-label={translate(
                    isListening ? 'Stop dictation' : 'Dictate your answer',
                  )}
                >
                  <i className="fa fa-microphone" />
                </button>
              )}
              <span className="dictation-status" role="status">
                {isListening ? translate('Listening…') : ''}
              </span>
            </div>
          </div>
          <div className="rating-footer">
            <button type="button" className="back-button" onClick={closePopup}>
              {translate('Back')} <kbd className="keycap">Esc</kbd>
            </button>
            <button type="submit" className="submit-button">
              {translate('Submit & finish')} →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RatingPopup
