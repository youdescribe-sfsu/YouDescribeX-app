import React, { useLayoutEffect } from 'react'
import '@/assets/css/home.css'
import '@/assets/css/insertPublish.css'
import '@/assets/css/audioDesc.css'
import '@/assets/css/editAudioDesc.css'
import '@/assets/css/notes.css'
import { Buttons } from '@/features/Describe/Buttons/Buttons'
import MockThumbnail from './MockThumbnail'
import {
  DEFAULT_DESCRIPTION_VOLUME,
  DEFAULT_YOUTUBE_VOLUME,
  INSTANT_SCROLL_RESET,
  MOCK_AI_CLIP_SEGMENTS,
  MOCK_SAMPLE_DESCRIPTION,
  MOCK_THUMBNAIL_URL,
  MOCK_TIMECODES,
  TIME_FIELD_LABELS,
  noop,
} from './tutorialConstants'
import './tutorial.scss'

const MOCK_CLIP_TITLE = 'Audio Clip 1'

const TIMELINE_SEGMENT_BASE_STYLE: React.CSSProperties = {
  position: 'absolute',
  height: '20px',
  top: '0px',
  zIndex: 3,
  borderRadius: '2px',
  opacity: 1,
}

interface Props {
  tutorialMode?: 'freestyle' | 'ai' | null
  uiState?: {
    showClipForm?: boolean
    showSavedClip?: boolean
    isEditing?: boolean
  }
}

interface TimeInputRowProps {
  iconClass: string
  label: string
  values: readonly string[]
}

const TimeInputRow = ({ iconClass, label, values }: TimeInputRowProps) => (
  <div className="timing-input-group">
    <div className="modern-timing-label">
      <i className={iconClass} /> {label}
    </div>
    <div className="modern-time-input-container">
      {values.map((value, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="modern-time-separator">:</span>}
          <div className="time-field-group">
            <span className="time-field-label">{TIME_FIELD_LABELS[index]}</span>
            <input
              type="text"
              className="modern-time-input"
              value={value}
              readOnly
              disabled
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  </div>
)

/**
 * Tutorial mock that uses the real Editor (YDXHome) layout and styles.
 * Same structure and class names as YDXHome so users see what the real editor looks like.
 */
const MockEditorPage = ({ tutorialMode, uiState = {} }: Props) => {
  const [descriptionVolume, setDescriptionVolume] = React.useState(
    DEFAULT_DESCRIPTION_VOLUME,
  )
  const [youTubeVolume, setYouTubeVolume] = React.useState(
    DEFAULT_YOUTUBE_VOLUME,
  )

  const showClipForm = uiState.showClipForm
  const showSavedClip = uiState.showSavedClip
  const isEditing = uiState.isEditing
  const isAiMode = tutorialMode === 'ai'

  // Ensure this specific mock page starts at the top when it appears
  useLayoutEffect(() => {
    window.scrollTo(INSTANT_SCROLL_RESET)
  }, [])

  return (
    <div className="ydx-body ydx-html">
      <div className="container home-container">
        {/* Same top row as YDXHome: YouTube placeholder | Buttons | Notes */}
        <div className="d-flex justify-content-around">
          <div className="text-white">
            <MockThumbnail
              thumbnailUrl={MOCK_THUMBNAIL_URL}
              alt="Editor Thumbnail"
              width={500}
              height={265}
              iconSize={48}
              overlayTextColor="rgba(255,255,255,0.4)"
            />
          </div>
          {/* Real Buttons component: same layout/size as in-app (Play/Pause + Audio Ducking) */}
          <Buttons
            setHandleClicksFromParent={noop}
            handlePlayPause={noop}
            isGloballyPaused={false}
            descriptionVolume={descriptionVolume}
            setDescriptionVolume={setDescriptionVolume}
            youTubeVolume={youTubeVolume}
            setYouTubeVolume={setYouTubeVolume}
            playPauseDataTutorial="play-pause-btn"
            audioDuckingDataTutorial="audio-ducking"
          />
          {/* Mock Notes: same structure/placeholder as real Notes, read-only to avoid API calls */}
          <div className="notes-bg rounded" data-tutorial="notes-area">
            <div className="d-flex justify-content-between align-items-center pt-1 px-3 notes-label">
              <h6 className="text-white">Notes:</h6>
            </div>
            <div className="mx-auto my-auto notes-textarea-div align-items-center border rounded">
              <textarea
                className="form-control border rounded notes-textarea"
                rows={9}
                placeholder="Start taking your Notes.."
                disabled
                readOnly
              />
            </div>
          </div>
        </div>

        <hr className="m-2 ydx-hr" />

        {/* Dialog Timeline - matches YDXHome: header, track, clip segment, playhead */}
        <div
          className="timeline-section-wrapper"
          data-tutorial="dialog-timeline"
        >
          <div className="timeline-header">
            <h6 className="timeline-title">
              Dialog Timeline (
              {showSavedClip
                ? MOCK_TIMECODES.filledTimeline
                : MOCK_TIMECODES.emptyTimeline}
              ):
            </h6>
            <div className="timeline-actions">
              <span className="clips-count">
                Audio Clips Count:{' '}
                {showSavedClip
                  ? isAiMode
                    ? MOCK_AI_CLIP_SEGMENTS.length
                    : 1
                  : 0}
              </span>
            </div>
          </div>
          <div className="timeline-container-wrapper">
            <div className="timeline-track-wrapper">
              {/* Inline clip segments (yellow) - visible when we have a saved clip */}
              {showSavedClip &&
                (isAiMode ? (
                  MOCK_AI_CLIP_SEGMENTS.map((seg, i) => (
                    <div
                      key={i}
                      className={`audio-clip-timeline-segment ${
                        seg.isPurple ? 'w3-purple' : 'w3-yellow'
                      }`}
                      style={{
                        ...TIMELINE_SEGMENT_BASE_STYLE,
                        left: `${seg.left}px`,
                        width: `${seg.width}px`,
                      }}
                    />
                  ))
                ) : (
                  <div
                    className="audio-clip-timeline-segment w3-yellow"
                    style={{
                      ...TIMELINE_SEGMENT_BASE_STYLE,
                      left: '0px',
                      width: '120px',
                    }}
                  />
                ))}
              {/* Red playhead - static position at start */}
              <div className="progress-bar-div" style={{ left: 0 }}>
                <p
                  className="mt-5 text-white progress-bar-time"
                  data-tutorial="dialog-timeline-time"
                >
                  {MOCK_TIMECODES.emptyTimeline}
                </p>
              </div>
            </div>
          </div>
        </div>
        <hr />

        {/* New clip form - visible only after step 10 (Insert Extended), same look as real app */}
        {showClipForm && (
          <h5 className="text-white">Insert Inline Audio Clip</h5>
        )}
        {showClipForm && (
          <div
            className="text-white component mt-2 rounded border border-1 border-white mx-5 d-flex flex-column pb-3 justify-content-between"
            data-tutorial="clip-form-area"
          >
            <div className="mx-2 text-end">
              <i className="fa fa-close fs-4 close-icon" />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="ms-3">
                <span className="inline-extended-label px-3 py-2 text-size fw-bold inline-bg text-dark">
                  Inline
                </span>
              </div>
              <div className="dialog-form-field" data-tutorial="title-input">
                <label className="dialog-form-label">Title:</label>
                <input
                  type="text"
                  className="dialog-input-enhanced"
                  placeholder="Title goes here.."
                  value={isEditing ? MOCK_CLIP_TITLE : ''}
                  readOnly
                />
              </div>
              <div className="dialog-form-field" data-tutorial="type-dropdown">
                <label className="dialog-form-label">Type:</label>
                <select
                  className="dialog-select-enhanced"
                  defaultValue="Visual"
                >
                  <option value="Visual">Visual</option>
                  <option value="Text on Screen">Text on Screen</option>
                </select>
              </div>
              <div
                className="d-flex flex-column align-items-center me-3"
                data-tutorial="start-time"
              >
                <h6 className="text-white fw-bolder text-size mb-2">
                  Start Time:
                </h6>
                <div className="edit-time-div">
                  <div className="text-dark text-size text-center d-flex justify-content-evenly">
                    {isEditing
                      ? MOCK_TIMECODES.clipStart.map((value, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <div className="mx-1">:</div>}
                            <input
                              type="number"
                              className="text-white bg-dark ydx-input"
                              value={value}
                              readOnly
                              disabled
                            />
                          </React.Fragment>
                        ))
                      : ['00', '00', '00', '00'].map((value, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <div className="mx-1">:</div>}
                            <input
                              type="number"
                              className="text-white bg-dark ydx-input"
                              value={value}
                              readOnly
                              disabled
                            />
                          </React.Fragment>
                        ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex flex-column align-items-center mb-3">
              <div
                data-tutorial="description-method"
                className="d-inline-flex flex-column align-items-center"
              >
                <h6 className="text-white text-size mb-2">
                  Choose Description Method:
                </h6>
                <div className="method-selection-enhanced">
                  <button
                    type="button"
                    className="method-button-enhanced active"
                  >
                    Text Description
                  </button>
                  <button type="button" className="method-button-enhanced">
                    Audio Recording
                  </button>
                </div>
              </div>
            </div>
            <div
              className="d-flex justify-content-center align-items-center flex-column mb-2 mx-3"
              data-tutorial="text-input-area"
            >
              <h6 className="text-white text-size mb-2">
                Add New Clip Description:
              </h6>
              <textarea
                className="form-control text-size form-control-sm border rounded description-textarea"
                rows={4}
                placeholder="Start writing a Text Description.."
                value={isEditing ? MOCK_SAMPLE_DESCRIPTION : ''}
                readOnly
              />
            </div>
            <div className="text-center mt-1">
              <button
                type="button"
                data-tutorial="save-btn"
                className="btn rounded btn-sm text-white save-desc-btn ydx-button"
              >
                <i className="fa fa-save text-size" /> Save
              </button>
            </div>
          </div>
        )}

        {/* Insert/Publish toolbar - same structure as InsertPublish */}
        <div className="d-flex justify-content-between my-3">
          <div>
            <button
              type="button"
              data-tutorial="insert-inline-btn"
              className="btn inline-bg text-dark ydx-button"
            >
              <i className="fa fa-plus" /> {'   '}
              Insert Inline
            </button>
            <button
              type="button"
              data-tutorial="insert-extended-btn"
              className="btn mx-5 extended-bg text-white ydx-button"
            >
              <i className="fa fa-plus" /> {'   '}
              Insert Extended
            </button>
          </div>
          <div className="mx-4 d-flex align-items-center">
            <div className="me-3">
              <div
                data-tutorial="collab-checkbox"
                className="d-inline-flex align-items-center"
              >
                <input
                  type="checkbox"
                  id="mock-collab"
                  className="form-check-input me-2"
                  data-tutorial="collab-checkbox-input"
                  disabled
                />
                <label
                  htmlFor="mock-collab"
                  className="form-check-label text-white"
                >
                  Enroll in Collaborative Editing
                </label>
              </div>
            </div>
            <button
              type="button"
              data-tutorial="publish-btn"
              className="btn publish-bg text-white ydx-button"
            >
              <i className="fa fa-upload" /> {'   '}
              Publish
            </button>
          </div>
        </div>

        {showSavedClip && (
          <div
            className="audio-desc-component-list tutorial-clip-full-view"
            style={{ marginTop: 16 }}
          >
            <div className="spacing-component">
              <div className="component" data-tutorial="clip-controls">
                {/* Header: matches real AudioClip - title, input, metadata, nudge, inline/extended, collapse */}
                <div className="audio-clip-header">
                  <div className="clip-info-section">
                    <div className="ad-title">Audio Clip 1</div>
                    <input
                      type="text"
                      className="ad-title-input"
                      value={MOCK_CLIP_TITLE}
                      readOnly
                      disabled
                    />
                    <div className="clip-metadata">
                      <div className="audio-mode-indicator">
                        <i className="fa fa-robot" />
                        <span>AI Voice (Text-to-Speech)</span>
                      </div>
                      <div>
                        <strong>Type:</strong> Visual
                      </div>
                      <div>
                        <strong>Duration:</strong> {MOCK_TIMECODES.clipDuration}
                      </div>
                      <div className="description-preview">
                        {MOCK_SAMPLE_DESCRIPTION}
                      </div>
                    </div>
                  </div>
                  <div
                    className="nudge-controls-section"
                    data-tutorial="nudge-controls"
                  >
                    <div className="nudge-label">Nudge</div>
                    <div className="nudge-btns-div">
                      <i className="fa fa-chevron-left nudge-icons" />
                      <i className="fa fa-chevron-right nudge-icons" />
                    </div>
                  </div>
                  <div
                    className="timeline-section"
                    data-tutorial="ai-clip-type"
                  >
                    <div className="component-timeline-div">
                      <div className="ad-draggable-div">
                        <div
                          className={`ad-timestamp-div ${
                            isAiMode ? 'w3-purple' : 'w3-yellow'
                          }`}
                          style={{
                            position: 'absolute',
                            left: isAiMode ? '12px' : 0,
                            top: 0,
                            width: isAiMode ? '4px' : '60px',
                            height: '100%',
                          }}
                        />
                      </div>
                    </div>
                    <div className="playback-type-controls">
                      <div className="playback-type-option">
                        <input
                          type="radio"
                          name="mock-playback"
                          id="mock-inline"
                          readOnly
                          className="form-check-input"
                        />
                        <label
                          htmlFor="mock-inline"
                          className="inline-extended-radio inline-bg"
                        >
                          <span className="inline-extended-label">Inline</span>
                        </label>
                      </div>
                      <div className="playback-type-option">
                        <input
                          type="radio"
                          name="mock-playback"
                          id="mock-extended"
                          className="form-check-input"
                          defaultChecked
                          readOnly
                        />
                        <label
                          htmlFor="mock-extended"
                          className="inline-extended-radio extended-bg"
                        >
                          <span className="inline-extended-label">
                            Extended
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="expand-collapse-section">
                    <i className="fa fa-chevron-up" />
                  </div>
                </div>

                {/* EditClip-style body: AI Voice header, Description Content, Timing Controls, Play Video */}
                <div className="edit-component">
                  {/* Full-width header row with AI Voice title and description */}
                  <div className="audio-mode-header">
                    <div className="audio-mode-badge">
                      <i className="fa fa-robot audio-mode-icon" />
                      <span className="audio-mode-title">
                        AI Voice (Text-to-Speech)
                      </span>
                    </div>
                    <div className="audio-mode-description">
                      AI-generated voice from your text description
                    </div>
                  </div>
                  <div className="primary-content-section tutorial-clip-layout">
                    {/* Left column: Description Content + actions - step 19 target */}
                    <div
                      data-tutorial="clip-ai-voice"
                      className="description-editing-area"
                    >
                      <div className="section-header">
                        <h6 className="section-title">Description Content</h6>
                        <div className="description-status">
                          {MOCK_SAMPLE_DESCRIPTION.length} characters
                        </div>
                      </div>
                      <textarea
                        className="enhanced-description-textarea"
                        rows={4}
                        value={MOCK_SAMPLE_DESCRIPTION}
                        readOnly
                        disabled
                      />
                      <div className="primary-actions">
                        <button
                          type="button"
                          className="ydx-button ydx-button--primary record-voice-prominent tutorial-mock-button"
                          disabled
                        >
                          <i className="fa fa-microphone" /> Record Your Voice
                        </button>
                        <span className="tutorial-saved-status">
                          <i className="fa fa-check" /> Saved
                        </span>
                        <button
                          type="button"
                          className="ydx-button ydx-button--primary tutorial-mock-button"
                          disabled
                        >
                          <i className="fa fa-play" /> Play Audio
                        </button>
                        <button
                          type="button"
                          className="ydx-button ydx-button--danger tutorial-mock-button"
                          disabled
                        >
                          <i className="fa fa-trash" /> Delete Clip
                        </button>
                      </div>
                    </div>
                    {/* Right column: Timing Controls - step 20 target */}
                    <div
                      className="timing-controls-section"
                      data-tutorial="clip-timing-controls"
                    >
                      <div className="section-header">
                        <h6 className="section-title">Timing Controls</h6>
                      </div>
                      <div className="timing-inputs-grid">
                        <TimeInputRow
                          iconClass="fa fa-play"
                          label="Start Time"
                          values={MOCK_TIMECODES.clipEditStart}
                        />
                        <TimeInputRow
                          iconClass="fa fa-stop"
                          label="End Time"
                          values={MOCK_TIMECODES.clipEditEnd}
                        />
                      </div>
                      <div className="modern-duration-display">
                        <div className="modern-duration-label">
                          <i className="fa fa-clock" /> Total Duration
                        </div>
                        <div className="modern-duration-value">
                          {MOCK_TIMECODES.clipDuration} seconds
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="video-sync-controls">
                    <button
                      type="button"
                      className="ydx-button ydx-button--primary video-control-btn tutorial-mock-button"
                      disabled
                    >
                      <i className="fa fa-play" /> Play Video with Description
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MockEditorPage
