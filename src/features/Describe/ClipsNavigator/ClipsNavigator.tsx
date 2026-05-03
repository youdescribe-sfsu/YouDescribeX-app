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

const ClipsNavigator = ({
  clips,
  currentIndex,
  onSelectClip,
  isExpanded,
  setIsExpanded,
  listDataTutorial,
}: Props) => {
  if (clips.length === 0) return null

  return (
    <div className="clips-navigator">
      {isExpanded && (
        <div className="clips-list-container" data-tutorial={listDataTutorial}>
          {clips.map((clip, index) => (
            <div
              key={clip.clip_id}
              className={`clip-summary-item ${
                index === currentIndex ? 'active' : ''
              }`}
              onClick={() => {
                onSelectClip(index)
                setIsExpanded(false)
              }}
            >
              <div className="clip-summary-header">
                <span className="clip-number">{getClipLabel(clip, index)}</span>
                <span
                  className={`clip-type-badge ${
                    clip.playback_type === 'inline' ? 'inline' : 'extended'
                  }`}
                >
                  {formatPlaybackType(clip.playback_type)}
                </span>
              </div>
              <div className="clip-summary-content">
                <div className="clip-time">
                  {convertSecondsToCardFormat(clip.clip_start_time)} →{' '}
                  {convertSecondsToCardFormat(clip.clip_end_time)}
                </div>
                <div className="clip-description-preview">
                  {clip.description_text?.substring(0, 80) || 'No description'}
                  {clip.description_text && clip.description_text.length > 80
                    ? '...'
                    : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClipsNavigator
