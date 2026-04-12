import React, { useState, useEffect } from 'react'
import '@/assets/css/audioDesc.css'
import Draggable from 'react-draggable'
import EditClip from '../EditClip/EditClip'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Clip } from '@/shared/utils/convertClipObject'
import { YouTubePlayer } from 'youtube-player/dist/types'

// Helper functions for better audio mode communication
const getDescriptionDisplay = (clip: Clip): string => {
  if (clip.is_recorded) {
    return clip.description_text || 'Voice recording'
  }
  return clip.description_text || 'No description yet'
}

const getAudioModeConfig = (clip: Clip) => {
  if (clip.is_recorded) {
    return {
      mode: 'voice',
      label: 'My Voice (Recording)',
      icon: 'fa-microphone',
      description: 'Voice recording with optional transcript',
    }
  }
  return {
    mode: 'ai',
    label: 'AI Voice (Text-to-Speech)',
    icon: 'fa-robot',
    description: 'AI-generated voice from text',
  }
}

interface Props {
  userId: string
  youtubeVideoId: string
  unitLength: number
  currentTime: number
  videoLength: number
  updateData: boolean
  setUpdateData: React.Dispatch<React.SetStateAction<boolean>>
  clip: Clip
  setNeedRefresh: React.Dispatch<React.SetStateAction<boolean>>
  setUndoDeletedClip: React.Dispatch<React.SetStateAction<boolean>>
  divWidths: { [key: string]: number }
  handlePlayAudioClip: (startTime: number) => void
  editComponentToggleList: {
    clipId: string
    showEditComponent: boolean
  }[]
  audioDescriptionId: string
  setEditComponentToggleFunc: (clipId: string, value: boolean) => void
  currentEvent: YouTubePlayer | undefined
  currentState: number
  setShowSpinner: React.Dispatch<React.SetStateAction<boolean>>
  fetchUserVideoData: () => void
  isPreview?: boolean
  setUpdatedDescriptions: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >
}

const AudioClip = ({
  userId,
  youtubeVideoId,
  unitLength,
  currentTime,
  videoLength,
  updateData,
  setUpdateData,
  clip,
  setNeedRefresh,
  divWidths,
  handlePlayAudioClip,
  editComponentToggleList,
  audioDescriptionId,
  setEditComponentToggleFunc,
  currentEvent,
  currentState,
  setShowSpinner,
  fetchUserVideoData,
  isPreview = false,
  setUndoDeletedClip,
  setUpdatedDescriptions,
}: Props) => {
  // Extract audio clip data from props with better organization
  const clipID = clip.clip_id
  const clipSequenceNumber = clip.clip_sequence_number
  const clipDescriptionType = clip.description_type
  const initialClipTitle = clip.clip_title?.startsWith('scene undef')
    ? `scene ${clip.description_type}`
    : clip.clip_title

  const initialclipDescriptionText = clip.description_text
  const initialClipPlaybackType = clip.playback_type
  const initialClipStartTime = clip.clip_start_time
  const clipDuration = clip.clip_duration
  const clipAudioPath = clip.clip_audio_path
  const isRecorded = clip.is_recorded
  const clipCreatedAt = clip.createdAt

  // Get audio mode configuration for enhanced UI communication
  const audioModeConfig = getAudioModeConfig(clip)
  const descriptionDisplay = getDescriptionDisplay(clip)

  const [clipDescriptionText, setClipDescriptionText] = useState(
    clip.description_text,
  )

  // React State Variables
  const [clipPlaybackType, setClipPlayBackType] = useState('')
  const [clipTitle, setClipTitle] = useState('')
  const [clipStartTime, setClipStartTime] = useState(0)

  // Toggle variable to show or hide the edit component
  const [showEditComponent, setShowEditComponent] = useState(false)
  const [adDraggableWidth, setAdDraggableWidth] = useState(0.0)
  const [adDraggablePosition, setAdDraggablePosition] = useState({
    x: 0,
    y: 0,
  })

  useEffect(() => {
    setClipPlayBackType(initialClipPlaybackType)
    setClipTitle(initialClipTitle ?? '')

    // Logic to show/hide the edit component based on props
    // This ensures only one edit component is open at a time
    editComponentToggleList.forEach((item) => {
      if (item.clipId === clipID) {
        item.showEditComponent
          ? setShowEditComponent(true)
          : setShowEditComponent(false)
      }
    })

    // Update the clip start time based on the value from the props
    setClipStartTime(initialClipStartTime)

    // Set draggable position & width based on timeline calculations
    setAdDraggablePosition({ x: initialClipStartTime * unitLength, y: 0 })
    setAdDraggableWidth(clipDuration * unitLength)
  }, [
    clipDuration,
    clipID,
    initialClipPlaybackType,
    initialClipStartTime,
    initialClipTitle,
    editComponentToggleList,
    unitLength,
  ])

  // Dialog Timeline Draggable Functions - Enhanced with better error handling
  const stopADBar = (event: any, position: any) => {
    const adBarTime = position.x / unitLength
    const newClipStartTime = Number(parseFloat(`${adBarTime}`).toFixed(2))

    // Validate positioning bounds
    if (Number(newClipStartTime) >= 0.02 && newClipStartTime < videoLength) {
      if (clipPlaybackType === 'inline') {
        // For inline clips, ensure they don't extend beyond timeline
        if (newClipStartTime + clipDuration <= videoLength) {
          updateStartTimeNDraggablePosition(newClipStartTime)
        } else {
          toast.error(
            'Audio Clip cannot extend beyond the timeline. Change to extended mode or adjust the start time.',
          )
        }
      } else {
        // For extended clips, just ensure start time is within video bounds
        if (newClipStartTime < videoLength) {
          updateStartTimeNDraggablePosition(newClipStartTime)
        }
      }
    } else {
      toast.error('Audio Clip must be positioned within the video timeline.')
    }
  }

  // Enhanced Nudge functionality with better UX feedback
  const handleLeftNudgeClick = (e: any) => {
    const newClipStartTime = (parseFloat(`${clipStartTime}`) - 0.25).toFixed(2)

    if (Number(newClipStartTime) >= 0.02) {
      updateStartTimeNDraggablePosition(newClipStartTime)
      toast.success(`Moved clip earlier by 0.25 seconds`)
    } else {
      toast.warning('Cannot move clip before 0.02 seconds')
    }
  }

  const handleRightNudgeClick = (e: any) => {
    const newClipStartTime = Number(
      (parseFloat(`${clipStartTime}`) + 0.25).toFixed(2),
    )

    if (clipPlaybackType === 'inline') {
      if (newClipStartTime + clipDuration <= videoLength) {
        updateStartTimeNDraggablePosition(newClipStartTime)
        toast.success(`Moved clip later by 0.25 seconds`)
      } else {
        toast.error(
          'Cannot move inline clip beyond timeline. Change to extended mode first.',
        )
      }
    } else {
      if (newClipStartTime < videoLength) {
        updateStartTimeNDraggablePosition(newClipStartTime)
        toast.success(`Moved clip later by 0.25 seconds`)
      } else {
        toast.warning('Cannot move clip beyond video end time')
      }
    }
  }

  const updateStartTimeNDraggablePosition = (newClipStartTime: any) => {
    setClipStartTime(newClipStartTime)
    // Update the draggable div position based on new start time
    setAdDraggablePosition({ x: newClipStartTime * unitLength, y: 0 })
    handleClipStartTimeUpdate(newClipStartTime)
  }

  // Handle PUT (update) requests - Enhanced with better error handling
  const handleClipStartTimeUpdate = (updatedClipStartTime: any) => {
    axios
      .put(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-start-time/${clipID}`,
        {
          clipStartTime: updatedClipStartTime,
          audioDescriptionId: audioDescriptionId,
          youtubeVideoId: youtubeVideoId,
        },
      )
      .then((res) => {
        // Trigger re-render of parent component to fetch updated data
        setUpdateData(!updateData)
      })
      .catch((err) => {
        console.error('Error updating clip start time:', err)
        toast.error('Failed to update clip timing. Please try again.')
      })
  }

  // Enhanced playback type update with better validation
  const handlePlaybackTypeUpdate = (e: any) => {
    const newPlaybackType = e.target.value

    // Validate inline conversion at timeline boundary
    if (
      clipPlaybackType === 'extended' &&
      newPlaybackType === 'inline' &&
      parseFloat(`${initialClipStartTime}`) + clipDuration > videoLength
    ) {
      toast.error(
        'Cannot change to Inline mode: clip would extend beyond timeline. Please adjust start time first.',
      )
      return
    }

    setClipPlayBackType(newPlaybackType)

    axios
      .put(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-playback-type/${clipID}`,
        {
          clipPlaybackType: newPlaybackType,
        },
      )
      .then((res) => {
        setUpdateData(!updateData)
        toast.success(`Changed to ${newPlaybackType} mode`)
      })
      .catch((err) => {
        console.error('Error updating playback type:', err)
        toast.error('Failed to change playback mode. Please try again.')
      })
  }

  const handleClickSaveClipDescription = async (
    updatedClipDescriptionText: string,
  ) => {
    try {
      // Check if the clip description has been updated
      if (updatedClipDescriptionText !== initialclipDescriptionText) {
        setShowSpinner(true)

        await axios.put(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-description/${clipID}`,
          {
            userId: userId,
            youtubeVideoId: youtubeVideoId,
            clipDescriptionText: updatedClipDescriptionText,
            clipDescriptionType: clipDescriptionType,
            audioDescriptionId: audioDescriptionId,
          },
        )

        setUpdateData(!updateData)
        toast.success('Description saved successfully!')
      }

      // Handle title updates separately
      if (clipTitle === '' || clipTitle === null) {
        toast.error('Please enter a valid title')
        setShowSpinner(false)
        return
      } else if (clipTitle !== initialClipTitle) {
        await axios.put(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-title/${clipID}`,
          {
            adTitle: clipTitle,
          },
        )
      }
    } catch (err: any) {
      if (err.response) {
        toast.error(err.response.data.message)
      } else {
        console.error('Error saving clip:', err)
        toast.error('An error occurred. Please try again!')
      }
    } finally {
      setShowSpinner(false)
    }
  }

  useEffect(() => {
    setClipDescriptionText(clip.description_text)
  }, [clip.description_text])

  const handleDescriptionChange = (newDescription: string) => {
    setClipDescriptionText(newDescription)
    setUpdatedDescriptions((prev) => ({
      ...prev,
      [clip.clip_id]: newDescription,
    }))
  }

  return (
    <div id={`audio-clip-card-${clipID}`} className="spacing-component">
      <div className="component">
        {/* Enhanced header with better visual hierarchy */}
        <div className="audio-clip-header">
          {/* Clip Information Section */}
          <div className="clip-info-section">
            <div
              className="ad-title"
              onClick={() => handlePlayAudioClip(initialClipStartTime)}
            >
              Audio Clip {clipSequenceNumber}
            </div>

            <input
              type="text"
              className="ad-title-input"
              placeholder="Enter clip title..."
              disabled={!showEditComponent}
              value={clipTitle}
              onChange={(e) => setClipTitle(e.target.value)}
            />

            {/* Enhanced metadata with audio mode indicator */}
            <div className="clip-metadata">
              <div className="audio-mode-indicator">
                <i className={`fa ${audioModeConfig.icon}`}></i>
                <span>{audioModeConfig.label}</span>
              </div>
              <div>
                <strong>Type:</strong>{' '}
                {clipDescriptionType?.charAt(0).toUpperCase()}
                {clipDescriptionType?.slice(1)}
              </div>
              <div>
                <strong>Duration:</strong>{' '}
                {convertSecondsToCardFormat(clipDuration)}
              </div>
              <div className="description-preview">
                {descriptionDisplay.substring(0, 60)}
                {descriptionDisplay.length > 60 ? '...' : ''}
              </div>
            </div>
          </div>

          {/* Nudge Controls Section */}
          <div className="nudge-controls-section">
            <div className="nudge-label">Nudge</div>
            <div className="nudge-btns-div">
              <i
                className="fa fa-chevron-left nudge-icons"
                onClick={handleLeftNudgeClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleLeftNudgeClick(e)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Move clip earlier by 0.25 seconds"
                title="Move earlier by 0.25s"
              />
              <i
                className="fa fa-chevron-right nudge-icons"
                onClick={handleRightNudgeClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRightNudgeClick(e)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Move clip later by 0.25 seconds"
                title="Move later by 0.25s"
              />
            </div>
          </div>

          {/* Timeline Section */}
          <div className="timeline-section">
            <div className="component-timeline-div">
              <div className="ad-draggable-div">
                <Draggable
                  axis="x"
                  defaultPosition={{ x: 0, y: 0 }}
                  position={adDraggablePosition}
                  onStop={stopADBar}
                  bounds="parent"
                >
                  {clipPlaybackType === 'inline' ? (
                    <div
                      className="ad-timestamp-div"
                      title={`${convertSecondsToCardFormat(
                        initialClipStartTime,
                      )} - ${audioModeConfig.label}`}
                      style={{
                        width: adDraggableWidth,
                        height: '20px',
                        backgroundColor: 'var(--inline-color)',
                      }}
                    />
                  ) : (
                    <div
                      className="ad-timestamp-div"
                      title={`${convertSecondsToCardFormat(
                        initialClipStartTime,
                      )} - ${audioModeConfig.label}`}
                      style={{
                        width: '3px',
                        height: '20px',
                        backgroundColor: 'var(--extended-color)',
                      }}
                    />
                  )}
                </Draggable>
              </div>
            </div>

            {/* Enhanced playback type controls */}
            <div className="playback-type-controls">
              <div className="playback-type-option">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`playback-${clipSequenceNumber}`}
                  id={`inline-${clipID}`}
                  value="inline"
                  checked={clipPlaybackType === 'inline'}
                  onChange={handlePlaybackTypeUpdate}
                />
                <label
                  htmlFor={`inline-${clipID}`}
                  className="inline-extended-radio inline-bg"
                  style={{
                    width: '95px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '40px',
                  }}
                >
                  <span className="inline-extended-label">Inline</span>
                </label>
              </div>

              <div className="playback-type-option">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`playback-${clipSequenceNumber}`}
                  id={`extended-${clipID}`}
                  value="extended"
                  checked={clipPlaybackType === 'extended'}
                  onChange={handlePlaybackTypeUpdate}
                />
                <label
                  htmlFor={`extended-${clipID}`}
                  className="inline-extended-radio extended-bg"
                  style={{
                    width: '95px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="inline-extended-label">Extended</span>
                </label>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Control */}
          <div className="expand-collapse-section">
            {showEditComponent ? (
              <i
                className="fa fa-chevron-up"
                onClick={() => setEditComponentToggleFunc(clipID, false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setEditComponentToggleFunc(clipID, false)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Collapse detailed editing"
                title="Collapse detailed editing"
              />
            ) : (
              <i
                className="fa fa-chevron-down"
                onClick={() => setEditComponentToggleFunc(clipID, true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setEditComponentToggleFunc(clipID, true)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Expand detailed editing"
                title="Expand detailed editing"
              />
            )}
          </div>
        </div>

        {/* Enhanced edit component with smooth animation */}
        {showEditComponent && (
          <EditClip
            handleClipStartTimeUpdate={handleClipStartTimeUpdate}
            userId={userId}
            youtubeVideoId={youtubeVideoId}
            clipCreatedAt={clipCreatedAt}
            clipId={clipID}
            clipDescriptionType={clipDescriptionType ?? ''}
            initialClipDescriptionText={initialclipDescriptionText ?? ''}
            clipPlaybackType={clipPlaybackType}
            clipStartTime={clipStartTime}
            clipDuration={clipDuration}
            isRecorded={isRecorded ?? false}
            clipAudioPath={clipAudioPath}
            currentTime={currentTime}
            updateData={updateData}
            setUpdateData={setUpdateData}
            currentEvent={currentEvent}
            currentState={currentState}
            videoLength={videoLength}
            setShowSpinner={setShowSpinner}
            audioDescriptionId={audioDescriptionId}
            fetchUserVideoData={fetchUserVideoData}
            setNeedRefresh={setNeedRefresh}
            isPreview={isPreview}
            handleClickSaveClipDescription={handleClickSaveClipDescription}
            setUndoDeletedClip={setUndoDeletedClip}
            setClipDescText={handleDescriptionChange}
          />
        )}
      </div>
    </div>
  )
}

export default AudioClip
