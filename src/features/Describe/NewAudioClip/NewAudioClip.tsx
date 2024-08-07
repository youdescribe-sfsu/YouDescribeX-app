import React, { useState, useEffect } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import '@/assets/css/audioDesc.css'
import '@/assets/css/editAudioDesc.css'
import { toast } from 'react-toastify'
import axios from 'axios'

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
  videoLength,
  audioDescriptionId,
  setNeedRefresh,
}: Props) => {
  const [newACTitle, setNewACTitle] = useState('')
  const [newACType, setNewACType] = useState('Visual')
  const [newACDescriptionText, setNewACDescriptionText] = useState('')
  const [newACStartTime, setNewACStartTime] = useState(currentTime)
  const [newACDuration, setNewACDuration] = useState(0.0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  const [clipStartTimeHours, setClipStartTimeHours] = useState(0)
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0)
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0)
  const [clipStartTimeMilliSeconds, setClipStartTimeMilliSeconds] = useState(0)

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({
      audio: true,
      onStop: (blobUrl) => {
        const audio = new Audio(blobUrl)
        audio.addEventListener('loadedmetadata', () => {
          setNewACDuration(audio.duration)
        })
      },
    })

  useEffect(() => {
    handleClipStartTimeInputsRender()
  }, [currentTime])

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

    if (!newACDescriptionText && !mediaBlobUrl) {
      toast.error('Please enter a description text or record audio')
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
    formData.append('isRecorded', String(!!mediaBlobUrl))
    formData.append('youtubeVideoId', youtubeVideoId)
    formData.append('userId', userId)
    formData.append('newACDescriptionText', newACDescriptionText)

    if (mediaBlobUrl) {
      const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob())
      formData.append('file', audioBlob, 'recorded_audio.webm')
      formData.append('newACDuration', String(newACDuration))
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
        <div className="d-flex justify-content-evenly align-items-start mb-3">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input ydx-input"
              type="radio"
              id="inlineRadio"
              value="inline"
              checked={showInlineACComponent}
              readOnly
            />
            <label
              className={`inline-extended-label ${
                showInlineACComponent
                  ? 'inline-bg text-dark'
                  : 'extended-bg text-white'
              }`}
            >
              {showInlineACComponent ? 'Inline' : 'Extended'}
            </label>
          </div>
          <div className="d-flex justify-content-evenly align-items-center">
            <h6 className="text-white fw-bolder mb-0 me-2">Title:</h6>
            <input
              type="text"
              className="form-control form-control-sm text-center ydx-input"
              placeholder="Title goes here.."
              value={newACTitle}
              onChange={(e) => setNewACTitle(e.target.value)}
              required
            />
          </div>
          <div className="d-flex justify-content-evenly align-items-center">
            <h6 className="text-white fw-bolder mb-0 me-2">Type:</h6>
            <select
              className="form-select form-select-sm text-center"
              value={newACType}
              onChange={(e) => setNewACType(e.target.value)}
              required
            >
              <option value="Visual">Visual</option>
              <option value="Text on Screen">Text on Screen</option>
            </select>
          </div>
          <div className="d-flex justify-content-evenly flex-column align-items-center">
            <h6 className="text-white fw-bolder mx-2">Start Time:</h6>
            <div className="edit-time-div">
              <div className="text-dark text-center d-flex justify-content-evenly">
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
                      style={{ width: '25px', height: '28px' }}
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
        <div className="d-flex justify-content-evenly align-items-start mb-3">
          <div className="d-flex justify-content-center align-items-start flex-column">
            <h6 className="text-white">Add New Clip Description:</h6>
            <textarea
              className="form-control form-control-sm border rounded description-textarea"
              rows={3}
              placeholder="Start writing a Text Description.."
              value={newACDescriptionText}
              onChange={(e) => setNewACDescriptionText(e.target.value)}
            ></textarea>
          </div>
          <div className="d-flex flex-column align-items-center">
            <h6>Or</h6>
            <div
              className="vertical-divider-div"
              style={{ height: '65px' }}
            ></div>
          </div>
          <div className="text-center">
            <h6 className="text-white text-center">Record New Audio Clip</h6>
            <div className="bg-white rounded text-dark d-flex justify-content-between align-items-center p-2 w-100 my-2">
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
                <audio src={mediaBlobUrl} controls className="ml-3" />
              )}
            </div>
            {status === 'recording' && <div>Recording in progress...</div>}
            {recordingError && (
              <div className="text-danger">{recordingError}</div>
            )}
            <div>Recording Duration: {newACDuration.toFixed(2)} sec</div>
          </div>
        </div>
        <div className="text-center mt-3">
          <button
            type="submit"
            className="btn rounded btn-sm text-white save-desc-btn ydx-button"
          >
            <i className="fa fa-save" /> Save
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewAudioClipComponent
