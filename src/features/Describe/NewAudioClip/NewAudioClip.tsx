import React, { useState, useEffect, useCallback } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import '@/assets/css/audioDesc.css'
import '@/assets/css/editAudioDesc.css'
import { toast } from 'react-toastify'
import axios from 'axios'
import { Tooltip } from 'bootstrap'
import { TUTORIAL_TARGETS } from '../../Tutorial/tutorialSelectors'

interface Props {
  setShowSpinner: React.Dispatch<React.SetStateAction<boolean>>
  userId: string
  youtubeVideoId: string
  showInlineACComponent: boolean
  setShowNewACComponent: React.Dispatch<React.SetStateAction<boolean>>
  initialStartTime: number
  videoLength: number
  audioDescriptionId: string
  setNeedRefresh: React.Dispatch<React.SetStateAction<boolean>>
  tutorialMode?: boolean
}

const NewAudioClipComponent = ({
  setShowSpinner,
  userId,
  youtubeVideoId,
  showInlineACComponent,
  setShowNewACComponent,
  initialStartTime,
  audioDescriptionId,
  setNeedRefresh,
  tutorialMode = false,
}: Props) => {
  const [newACTitle, setNewACTitle] = useState('')
  const [newACType, setNewACType] = useState('Visual')
  const [newACDescriptionText, setNewACDescriptionText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [descriptionMethod, setDescriptionMethod] = useState<'text' | 'audio'>(
    'text',
  )
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [readySetGo, setReadySetGo] = useState('')

  const [clipStartTimeHours, setClipStartTimeHours] = useState(0)
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0)
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0)
  const [clipStartTimeCentiseconds, setClipStartTimeCentiseconds] = useState(0)

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({
      audio: true,
    })
  const displayedInitialStartTime = tutorialMode ? 0 : initialStartTime

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]',
    )
    Array.from(tooltipTriggerList).map(
      (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl),
    )
    handleClipStartTimeInputsRender(displayedInitialStartTime)
  }, [displayedInitialStartTime])

  const updateRecordingDuration = useCallback(() => {
    setRecordingDuration((prevDuration) => prevDuration + 0.1)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (status === 'recording') {
      setIsRecording(true)
      setRecordingDuration(0) // Reset when recording actually starts
      interval = setInterval(updateRecordingDuration, 100)
    } else if (status === 'stopped') {
      setIsRecording(false)
    }
    // else if (!isRecording && recordingDuration !== 0) {
    //   setRecordingDuration(0)
    // }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status, updateRecordingDuration])

  const handleClipStartTimeInputsRender = (startTime: number) => {
    const cardFormat = convertSecondsToCardFormat(startTime).split(':')
    setClipStartTimeHours(parseInt(cardFormat[0]))
    setClipStartTimeMinutes(parseInt(cardFormat[1]))
    setClipStartTimeSeconds(parseInt(cardFormat[2]))
    setClipStartTimeCentiseconds(parseInt(cardFormat[3]))
  }

  // Handle Record Ready Set Go - Match EditClip.tsx exactly
  const handleReadySetGo = (): void => {
    const _321Go = ['3', '2', '1', 'GO!', 'start']

    _321Go.forEach((val, i) => {
      setTimeout(() => {
        setReadySetGo(val)
      }, 1000 * i)
    })

    // start recording once ready set go is completed
    setTimeout(() => {
      handleStartRecording()
    }, 3700)
  }

  const handleStartRecording = () => {
    setRecordingError(null)
    startRecording()
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    stopRecording()
  }

  const handleReRecord = () => {
    clearBlobUrl()
    setRecordingDuration(0)
    setReadySetGo('')
  }

  const calculateClipStartTimeinSeconds = () => {
    return (
      clipStartTimeHours * 3600 +
      clipStartTimeMinutes * 60 +
      clipStartTimeSeconds +
      clipStartTimeCentiseconds / 100
    )
  }

  const handleSaveNewAudioClip = async (e: React.FormEvent) => {
    e.preventDefault()

    if (tutorialMode) {
      setShowSpinner(false)
      return
    }

    setShowSpinner(true)

    if (!newACTitle) {
      toast.error('Please enter a Title')
      setShowSpinner(false)
      return
    }

    if (descriptionMethod === 'text' && !newACDescriptionText) {
      toast.error('Please enter a description text')
      setShowSpinner(false)
      return
    }

    if (descriptionMethod === 'audio' && !mediaBlobUrl) {
      toast.error('Please record an audio description')
      setShowSpinner(false)
      return
    }

    const formData = new FormData()
    formData.append('newACTitle', newACTitle)
    formData.append('newACType', newACType)
    formData.append(
      'newACPlaybackType',
      showInlineACComponent ? 'inline' : 'extended',
    )
    formData.append('newACStartTime', String(calculateClipStartTimeinSeconds()))
    formData.append('isRecorded', String(descriptionMethod === 'audio'))
    formData.append('youtubeVideoId', youtubeVideoId)
    formData.append('userId', userId)

    if (descriptionMethod === 'text') {
      formData.append('newACDescriptionText', newACDescriptionText)
    } else {
      formData.append('newACDescriptionText', '')
      const audioBlob = await fetch(mediaBlobUrl!).then((r) => r.blob())
      formData.append('file', audioBlob, 'recorded_audio.webm')
      formData.append('newACDuration', String(recordingDuration))
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/add-new-clip/${audioDescriptionId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      toast.success(`New Clip Added Successfully!!\n${response.data}`)
      setShowNewACComponent(false)
      // Flag the next refresh as save-triggered so the editor rebuilds from
      // the current playback position instead of resetting to the start.
      window.dispatchEvent(new Event('ydx:new-clip-saved'))
      setNeedRefresh(true)
      setRecordingDuration(0)
    } catch (error) {
      console.error(error)
      toast.error('Error Adding New Clip. Please try again later.')
    } finally {
      setShowSpinner(false)
    }
  }

  return (
    <div
      className="text-white component mt-2 rounded border border-1 border-white mx-5 d-flex flex-column pb-3 justify-content-between"
      data-tutorial={tutorialMode ? TUTORIAL_TARGETS.clipFormArea : undefined}
    >
      <div className="mx-2 text-end">
        <i
          className="fa fa-close fs-4 close-icon"
          onClick={() => setShowNewACComponent(false)}
        ></i>
      </div>
      <form onSubmit={handleSaveNewAudioClip}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="ms-3">
            <span
              className={`inline-extended-label px-3 py-2 text-size fw-bold ${
                showInlineACComponent
                  ? 'inline-bg text-dark'
                  : 'extended-bg text-white'
              }`}
            >
              {showInlineACComponent ? 'Inline' : 'Extended'}
            </span>
          </div>
          <div
            className="dialog-form-field"
            data-tutorial={
              tutorialMode ? TUTORIAL_TARGETS.titleInput : undefined
            }
          >
            <label className="dialog-form-label">Title:</label>
            <input
              type="text"
              className="dialog-input-enhanced"
              placeholder="Title goes here.."
              value={newACTitle}
              onChange={(e) => setNewACTitle(e.target.value)}
              readOnly={tutorialMode}
              required
            />
          </div>
          <div
            className="dialog-form-field"
            data-tutorial={
              tutorialMode ? TUTORIAL_TARGETS.typeDropdown : undefined
            }
          >
            <label className="dialog-form-label">Type:</label>
            <select
              className="dialog-select-enhanced"
              value={newACType}
              onChange={(e) => {
                if (tutorialMode) {
                  e.currentTarget.value = newACType
                  return
                }
                setNewACType(e.target.value)
              }}
              aria-disabled={tutorialMode ? true : undefined}
              required
            >
              <option value="Visual">Visual</option>
              <option value="Text on Screen">Text on Screen</option>
            </select>
          </div>
          <div
            className="d-flex flex-column align-items-center me-3"
            data-tutorial={
              tutorialMode ? TUTORIAL_TARGETS.startTime : undefined
            }
          >
            <h6 className="text-white fw-bolder text-size mb-2">Start Time:</h6>
            <div className="edit-time-div">
              <div className="text-dark text-size text-center d-flex justify-content-evenly">
                {[
                  clipStartTimeHours,
                  clipStartTimeMinutes,
                  clipStartTimeSeconds,
                  clipStartTimeCentiseconds,
                ].map((value, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <div className="mx-1">:</div>}
                    <input
                      type="number"
                      style={{ width: '30px', height: '28px' }}
                      className="text-white bg-dark ydx-input"
                      value={value.toString().padStart(2, '0')}
                      readOnly={tutorialMode}
                      onChange={(e) => {
                        if (tutorialMode) return
                        const newValue = Math.min(
                          parseInt(e.target.value) || 0,
                          index === 1 || index === 2 ? 59 : 99,
                        )
                        switch (index) {
                          case 0:
                            setClipStartTimeHours(newValue)
                            break
                          case 1:
                            setClipStartTimeMinutes(newValue)
                            break
                          case 2:
                            setClipStartTimeSeconds(newValue)
                            break
                          case 3:
                            setClipStartTimeCentiseconds(newValue)
                            break
                        }
                      }}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex flex-column align-items-center mb-3">
          <div
            className="d-flex flex-column align-items-center"
            data-tutorial={
              tutorialMode ? TUTORIAL_TARGETS.descriptionMethod : undefined
            }
          >
            <h6 className="text-white text-size mb-2">
              Choose Description Method:
            </h6>
            <div className="method-selection-enhanced">
              <button
                type="button"
                className={`method-button-enhanced method-button-voice ${
                  descriptionMethod === 'audio' ? 'active' : ''
                }`}
                onClick={() => {
                  if (!tutorialMode) setDescriptionMethod('audio')
                }}
              >
                VOICE RECORD
              </button>
              <button
                type="button"
                className={`method-button-enhanced method-button-tts ${
                  descriptionMethod === 'text' ? 'active' : ''
                }`}
                onClick={() => {
                  if (!tutorialMode) setDescriptionMethod('text')
                }}
              >
                TTS RECORD
              </button>
            </div>
          </div>
        </div>

        {descriptionMethod === 'text' ? (
          <div
            className="d-flex justify-content-center align-items-center flex-column mb-3 mx-3"
            data-tutorial={
              tutorialMode ? TUTORIAL_TARGETS.textInputArea : undefined
            }
          >
            <h6 className="text-white text-size mb-2">
              Add New Clip Description:
            </h6>
            <textarea
              className="form-control text-size form-control-sm border rounded description-textarea"
              rows={4}
              placeholder="Start writing a Text Description.."
              value={newACDescriptionText}
              onChange={(e) => setNewACDescriptionText(e.target.value)}
              readOnly={tutorialMode}
            ></textarea>
          </div>
        ) : (
          <div className="d-flex justify-content-center align-items-center flex-column mb-3 mx-3">
            <h6 className="text-white text-size text-center mb-2">
              VOICE RECORD
              <span
                className="ms-2 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="right"
                title="First write your script in the text area below. During recording, this text will appear as a teleprompter to help you remember what to say. Only your audio will be saved."
              >
                <i className="fa fa-question-circle"></i>
              </span>
            </h6>

            {/* Text area for script - consistent with EditClip */}
            <textarea
              className="form-control text-size form-control-sm border rounded description-textarea mb-3"
              rows={4}
              placeholder="Write your script here. You'll see this text while recording to help you remember what to say."
              value={newACDescriptionText}
              onChange={(e) => setNewACDescriptionText(e.target.value)}
            ></textarea>

            {/* Recording controls - simplified without teleprompter */}
            <div className="bg-white rounded text-dark d-flex justify-content-center align-items-center p-2 mx-3 my-2">
              {status !== 'recording' && readySetGo === '' && !mediaBlobUrl ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Click to Start Recording your voice"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                  onClick={handleReadySetGo}
                >
                  <i className="fa fa-microphone text-danger fs-5 mt-1" />
                </button>
              ) : readySetGo !== 'start' && readySetGo !== '' ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Ready Set Go"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                >
                  <b className="fs-5 mt-1">{readySetGo}</b>
                </button>
              ) : status === 'recording' ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Click to Stop Recording"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                  onClick={handleStopRecording}
                >
                  <i className="fa fa-stop text-danger fs-5 mt-1" />
                </button>
              ) : null}

              {mediaBlobUrl && (
                <div className="d-flex align-items-center gap-2 w-100">
                  <audio src={mediaBlobUrl} controls className="flex-grow-1" />
                  <button
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Record Again"
                    type="button"
                    className="btn rounded btn-sm border border-warning bg-light ydx-button d-flex align-items-center gap-1"
                    onClick={handleReRecord}
                  >
                    <i className="fa fa-microphone text-danger" />
                    <span className="small">Clear & Re-record</span>
                  </button>
                </div>
              )}
            </div>

            {/* Simple recording status - no teleprompter */}
            {status === 'recording' && (
              <div className="text-center mt-2">
                <div className="text-warning">
                  <i className="fa fa-microphone me-2 text-danger"></i>
                  Recording in progress... Read from the text area above
                </div>
                <div className="text-light mt-1">
                  Recording Duration: {recordingDuration.toFixed(1)} sec
                </div>
              </div>
            )}

            {/* Show recording duration for completed recordings */}
            {!status || status === 'stopped' ? (
              <div className="text-light text-center mt-2">
                Recording Duration: {recordingDuration.toFixed(1)} sec
              </div>
            ) : null}
          </div>
        )}
        <div className="text-center mt-3">
          <button
            type="submit"
            className="btn rounded btn-sm text-white save-desc-btn ydx-button"
            data-tutorial={tutorialMode ? TUTORIAL_TARGETS.saveBtn : undefined}
          >
            <i className="fa fa-save text-size" /> Save
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewAudioClipComponent
