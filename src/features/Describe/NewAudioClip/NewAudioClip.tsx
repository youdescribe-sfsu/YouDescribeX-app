import React, { useState, useEffect, useCallback } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import '@/assets/css/audioDesc.css'
import '@/assets/css/editAudioDesc.css'
import { toast } from 'react-toastify'
import axios from 'axios'
import TeleprompterView from '@/features/Describe/AudioClip/TeleprompterView'
import { Tooltip } from 'bootstrap'

interface Props {
  setShowSpinner: React.Dispatch<React.SetStateAction<boolean>>
  userId: string
  youtubeVideoId: string
  showInlineACComponent: boolean
  setShowNewACComponent: React.Dispatch<React.SetStateAction<boolean>>
  currentTime: number
  videoLength: number
  audioDescriptionId: string
  setNeedRefresh: React.Dispatch<React.SetStateAction<boolean>>
}

const NewAudioClipComponent = ({
  setShowSpinner,
  userId,
  youtubeVideoId,
  showInlineACComponent,
  setShowNewACComponent,
  currentTime,
  audioDescriptionId,
  setNeedRefresh,
}: Props) => {
  const [newACTitle, setNewACTitle] = useState('')
  const [newACType, setNewACType] = useState('Visual')
  const [newACDescriptionText, setNewACDescriptionText] = useState('')
  const [newACStartTime, setNewACStartTime] = useState(currentTime)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [descriptionMethod, setDescriptionMethod] = useState<'text' | 'audio'>(
    'text',
  )
  const [recordingDuration, setRecordingDuration] = useState(0)

  const [clipStartTimeHours, setClipStartTimeHours] = useState(0)
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0)
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0)
  const [clipStartTimeMilliSeconds, setClipStartTimeMilliSeconds] = useState(0)

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({
      audio: true,
    })

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]',
    )
    Array.from(tooltipTriggerList).map(
      (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl),
    )
    handleClipStartTimeInputsRender()
  }, [currentTime])

  const updateRecordingDuration = useCallback(() => {
    setRecordingDuration((prevDuration) => prevDuration + 0.1)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRecording) {
      interval = setInterval(updateRecordingDuration, 100)
    }
    // else if (!isRecording && recordingDuration !== 0) {
    //   setRecordingDuration(0)
    // }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, updateRecordingDuration])

  const handleClipStartTimeInputsRender = () => {
    const cardFormat = convertSecondsToCardFormat(currentTime).split(':')
    setClipStartTimeHours(parseInt(cardFormat[0]))
    setClipStartTimeMinutes(parseInt(cardFormat[1]))
    setClipStartTimeSeconds(parseInt(cardFormat[2]))
    setClipStartTimeMilliSeconds(parseInt(cardFormat[3]))
    setNewACStartTime(currentTime)
  }

  const handleStartRecording = () => {
    setIsRecording(true)
    setRecordingError(null)
    setRecordingDuration(0)
    startRecording()
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    stopRecording()
  }

  const calculateClipStartTimeinSeconds = () => {
    return (
      clipStartTimeHours * 3600 +
      clipStartTimeMinutes * 60 +
      clipStartTimeSeconds +
      clipStartTimeMilliSeconds / 1000
    )
  }

  const handleSaveNewAudioClip = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="text-white component mt-2 rounded border border-1 border-white mx-5 d-flex flex-column pb-3 justify-content-between">
      <div className="mx-2 text-end">
        <i
          className="fa fa-close fs-4 close-icon"
          onClick={() => setShowNewACComponent(false)}
        ></i>
      </div>
      <form onSubmit={handleSaveNewAudioClip}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="form-check form-check-inline ms-3">
            <input
              className="form-check-input ydx-input text-size"
              type="radio"
              id="inlineRadio"
              value="inline"
              checked={showInlineACComponent}
              readOnly
            />
            <label
              className={`inline-extended-label px-2 ${
                showInlineACComponent
                  ? 'inline-bg text-dark text-size'
                  : 'extended-bg text-white'
              }`}
            >
              {showInlineACComponent ? 'Inline' : 'Extended'}
            </label>
          </div>
          <div className="d-flex align-items-center">
            <h6 className="text-white fw-bolder text-size mb-0 me-2">Title:</h6>
            <input
              type="text"
              className="form-control form-control-sm  text-size text-center"
              placeholder="Title goes here.."
              value={newACTitle}
              onChange={(e) => setNewACTitle(e.target.value)}
              required
            />
          </div>
          <div className="d-flex align-items-center">
            <h6 className="text-white fw-bolder text-size mb-0 me-2">Type:</h6>
            <select
              className="form-select form-select-sm text-size text-center"
              value={newACType}
              onChange={(e) => setNewACType(e.target.value)}
              required
            >
              <option value="Visual">Visual</option>
              <option value="Text on Screen">Text on Screen</option>
            </select>
          </div>
          <div className="d-flex flex-column align-items-center me-3">
            <h6 className="text-white fw-bolder text-size mb-2">Start Time:</h6>
            <div className="edit-time-div">
              <div className="text-dark text-size text-center d-flex justify-content-evenly">
                {[
                  clipStartTimeHours,
                  clipStartTimeMinutes,
                  clipStartTimeSeconds,
                  clipStartTimeMilliSeconds,
                ].map((value, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <div className="mx-1">:</div>}
                    <input
                      type="number"
                      style={{ width: '30px', height: '28px' }}
                      className="text-white bg-dark ydx-input"
                      value={value.toString().padStart(2, '0')}
                      onChange={(e) => {
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
                            setClipStartTimeMilliSeconds(newValue)
                            break
                        }
                      }}
                      onBlur={() =>
                        setNewACStartTime(calculateClipStartTimeinSeconds())
                      }
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex flex-column align-items-center mb-3">
          <h6 className="text-white text-size mb-2">
            Choose Description Method:
          </h6>
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-md text-size m-2 ${
                descriptionMethod === 'text' ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => setDescriptionMethod('text')}
            >
              Text Description
            </button>
            <button
              type="button"
              className={`btn btn-md text-size m-2 ${
                descriptionMethod === 'audio' ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => setDescriptionMethod('audio')}
            >
              Audio Recording
            </button>
          </div>
        </div>

        {descriptionMethod === 'text' ? (
          <div className="d-flex justify-content-center align-items-center flex-column mb-3 mx-3">
            <h6 className="text-white text-size mb-2">
              Add New Clip Description:
            </h6>
            <textarea
              className="form-control text-size form-control-sm border rounded description-textarea"
              rows={4}
              placeholder="Start writing a Text Description.."
              value={newACDescriptionText}
              onChange={(e) => setNewACDescriptionText(e.target.value)}
            ></textarea>
          </div>
        ) : (
          <div className="d-flex justify-content-center align-items-center flex-column mb-3 mx-3">
            <h6 className="text-white text-size text-center mb-2">
              Record New Audio Clip
              <span
                className="ms-2 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="right"
                title="First write your script in the text area below. During recording, this text will appear as a teleprompter to help you remember what to say. Only your audio will be saved."
              >
                <i className="fa fa-question-circle"></i>
              </span>
            </h6>
            {/* Add this new instructional text block */}
            <div className="alert alert-info mb-3 text-center">
              <i className="fa fa-info-circle me-2"></i>
              <strong>Script for recording:</strong> You can write a script
              below to read while recording. This text will appear as a
              teleprompter during recording but only your audio will be saved.
            </div>

            {/* Add text area for script */}
            <textarea
              className="form-control text-size form-control-sm border rounded description-textarea mb-3"
              rows={4}
              placeholder="Write your script here (optional). You'll see this text while recording to help you remember what to say."
              value={newACDescriptionText}
              onChange={(e) => setNewACDescriptionText(e.target.value)}
            ></textarea>
            <div className="bg-white rounded text-dark d-flex justify-content-between align-items-center p-2 mx-3 my-2">
              {!isRecording ? (
                <button
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                  onClick={handleStartRecording}
                  disabled={status === 'recording'}
                >
                  <i className="fa fa-microphone text-danger" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                  onClick={handleStopRecording}
                  disabled={status !== 'recording'}
                >
                  <i className="fa fa-stop text-danger" />
                </button>
              )}
              {mediaBlobUrl && (
                <audio
                  src={mediaBlobUrl}
                  controls
                  className="ml-3 flex-grow-1"
                />
              )}
            </div>
            {status === 'recording' && (
              <div className="text-warning">Recording in progress...</div>
            )}
            {recordingError && (
              <div className="text-danger">{recordingError}</div>
            )}
            <div className="text-light">
              Recording Duration: {recordingDuration.toFixed(1)} sec
            </div>
            {isRecording && (
              <div className="mt-3 w-100">
                {/* Add enhanced teleprompter */}
                <div className="teleprompter-container recording-active">
                  <div className="teleprompter-header">
                    <i className="fa fa-microphone text-danger me-2"></i>
                    <span>Read from this script while recording</span>
                  </div>
                  <div className="teleprompter-text-area">
                    <p className="teleprompter-text">{newACDescriptionText}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="text-center mt-3">
          <button
            type="submit"
            className="btn rounded btn-sm text-white save-desc-btn ydx-button"
          >
            <i className="fa fa-save text-size" /> Save
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewAudioClipComponent
