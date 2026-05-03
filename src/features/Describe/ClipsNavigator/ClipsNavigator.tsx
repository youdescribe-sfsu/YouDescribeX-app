import React from 'react'
import { Clip } from '../../../shared/utils/convertClipObject'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import './clipsNavigator.css'

interface Props {
  clips: Clip[]
  currentIndex: number
  onSelectClip: (index: number) => void
  isExpanded: boolean
  setIsExpanded: (val: boolean) => void
  listDataTutorial?: string
}

const formatPlaybackType = (playbackType: string) =>
  playbackType
    ? `${playbackType.charAt(0).toUpperCase()}${playbackType
        .slice(1)
        .toLowerCase()}`
    : ''

const getClipLabel = (clip: Clip, index: number) => {
  const title = clip.clip_title?.trim()
  return title ? `Clip ${index + 1}: ${title}` : `Clip ${index + 1}`
}

const getDescriptionPreview = (description?: string) => {
  if (!description) return 'No description'
  return `${description.substring(0, 80)}${
    description.length > 80 ? '...' : ''
  }`
}

const getClipAccessibilityLabel = (clip: Clip, index: number) => {
  const startTime = convertSecondsToCardFormat(clip.clip_start_time)
  const endTime = convertSecondsToCardFormat(clip.clip_end_time)
  const type = formatPlaybackType(clip.playback_type)
  const description = getDescriptionPreview(clip.description_text)

  return `${getClipLabel(
    clip,
    index,
  )}. ${type}. Starts at ${startTime}, ends at ${endTime}. ${description}. Press Enter to select this clip.`
}

const ClipsNavigator = ({
  clips,
  currentIndex,
  onSelectClip,
  isExpanded,
  setIsExpanded,
  listDataTutorial,
}: Props) => {
  const clipButtonRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  if (clips.length === 0) return null

  const selectClip = (index: number) => {
    onSelectClip(index)
    setIsExpanded(false)
  }

  const focusClipButton = (index: number) => {
    clipButtonRefs.current[index]?.focus()
  }

  const handleClipKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusClipButton(Math.min(index + 1, clips.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusClipButton(Math.max(index - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusClipButton(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusClipButton(clips.length - 1)
    }
  }

  return (
    <div className="clips-navigator">
      {isExpanded && (
        <ul
          className="clips-list-container"
          data-tutorial={listDataTutorial}
          role="list"
          aria-label={`${clips.length} saved audio clips`}
        >
          {clips.map((clip, index) => (
            <li key={clip.clip_id} className="clip-summary-list-item">
              <button
                type="button"
                ref={(element) => {
                  clipButtonRefs.current[index] = element
                }}
                className={`clip-summary-item ${
                  index === currentIndex ? 'active' : ''
                }`}
                onClick={() => selectClip(index)}
                onKeyDown={(event) => handleClipKeyDown(event, index)}
                aria-label={getClipAccessibilityLabel(clip, index)}
                aria-current={index === currentIndex ? 'true' : undefined}
              >
                <div className="clip-summary-header">
                  <span className="clip-number">
                    <span className="clip-title-line">
                      {getClipLabel(clip, index)}
                    </span>
                  </span>
                  <div className="clip-summary-meta">
                    <div className="clip-time">
                      <i className="fa fa-clock" aria-hidden="true" />
                      <span>
                        {convertSecondsToCardFormat(clip.clip_start_time)} →{' '}
                        {convertSecondsToCardFormat(clip.clip_end_time)}
                      </span>
                    </div>
                    <span
                      className={`clip-type-badge ${
                        clip.playback_type === 'inline'
                          ? 'inline'
                          : 'extended'
                      }`}
                    >
                      {formatPlaybackType(clip.playback_type)}
                    </span>
                  </div>
                </div>
                <div className="clip-summary-content">
                  <div className="clip-description-preview">
                    <span className="clip-description-text">
                      {getDescriptionPreview(clip.description_text)}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ClipsNavigator
