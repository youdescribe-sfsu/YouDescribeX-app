import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import '@/assets/css/audioDesc.css'
import '@/assets/css/editAudioDesc.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import TextareaAutosize from 'react-textarea-autosize'
import ModalComponent from '../../../shared/components/Modal/Modal'
import Button from 'react-bootstrap/Button'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import padNumber from '@/shared/utils/padNumber'
import { Tooltip } from 'bootstrap'

interface Props {
  userId: string
  youtubeVideoId: string
  currentTime: number
  videoLength: number
  handleClipStartTimeUpdate: (value: number) => void
  updateData: boolean
  setUpdateData: React.Dispatch<React.SetStateAction<boolean>>
  clipId: string
  initialClipDescriptionText: string
  clipDescriptionType: string
  clipPlaybackType: string
  clipStartTime: number
  clipDuration: number
  isRecorded: boolean
  clipAudioPath: string
  clipCreatedAt: string
  setShowSpinner: React.Dispatch<React.SetStateAction<boolean>>
  audioDescriptionId: string
  fetchUserVideoData: () => void
  setNeedRefresh: React.Dispatch<React.SetStateAction<boolean>>
  setUndoDeletedClip: React.Dispatch<React.SetStateAction<boolean>>
  isPreview?: boolean
  handleClickSaveClipDescription: (updatedClipDescriptionText: string) => void
  setClipDescText: (description: string) => void
}

const EditClip = ({
  userId,
  youtubeVideoId,
  currentTime,
  videoLength,
  handleClipStartTimeUpdate,
  updateData,
  setUpdateData,
  clipId,
  initialClipDescriptionText,
  clipDescriptionType,
  clipPlaybackType,
  clipStartTime,
  clipDuration,
  isRecorded,
  clipAudioPath,
  clipCreatedAt,
  setShowSpinner,
  audioDescriptionId,
  fetchUserVideoData,
  setNeedRefresh,
  isPreview = false,
  handleClickSaveClipDescription,
  setUndoDeletedClip,
  setClipDescText,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const clipEndTime = clipStartTime + clipDuration

  const [clipDescriptionText, setClipDescriptionText] = useState(
    initialClipDescriptionText,
  )
  const [recordedClipDuration, setRecordedClipDuration] = useState(0.0)
  const [readySetGo, setReadySetGo] = useState('')
  const [isDeleteModal, setIsDeleteModal] = useState(false)

  const [recordedAudio, setRecordedAudio] = useState<HTMLAudioElement>()
  const [adAudio, setAdAudio] = useState<HTMLAudioElement>()
  const [isRecordedAudioPlaying, setIsRecordedAudioPlaying] = useState(false)
  const [isAdAudioPlaying, setIsAdAudioPlaying] = useState(false)

  const [clipStartTimeHours, setClipStartTimeHours] = useState(0.0)
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0.0)
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0.0)
  const [clipStartTimeCentiseconds, setClipStartTimeCentiseconds] =
    useState(0.0)
  const [clipDurationHours, setClipDurationHours] = useState(0.0)
  const [clipDurationMinutes, setClipDurationMinutes] = useState(0.0)
  const [clipDurationSeconds, setClipDurationSeconds] = useState(0.0)
  const [clipDurationMilliSeconds, setClipDurationMilliSeconds] = useState(0.0)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const [isIntegratedRecordingMode, setIsIntegratedRecordingMode] =
    useState(false)
  const [isPreparingToRecord, setIsPreparingToRecord] = useState(false)
  const [showTextAreaForRecording, setShowTextAreaForRecording] =
    useState(false)
  const [showSwitchToTTSModal, setShowSwitchToTTSModal] = useState(false)
  const [switchToTTSText, setSwitchToTTSText] = useState('')

  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true })

  const updateRecordingDuration = useCallback(() => {
    setRecordingDuration((prevDuration) => prevDuration + 0.1)
  }, [])

  const clipDurationAsTimestamp = convertSecondsToCardFormat(clipDuration)

  const getAudioModeDisplay = (isRecorded: boolean, hasText: boolean) => {
    if (isRecorded) {
      return {
        mode: 'voice',
        title: 'Voice Recording',
        icon: 'fa-microphone',
        primaryAction: 'Replace Recording',
        secondaryAction: 'Switch to AI Voice',
        description: 'Your voice recording is ready',
      }
    }
    return {
      mode: 'ai',
      title: 'AI Voice (Text-to-Speech)',
      icon: 'fa-robot',
      primaryAction: 'Regenerate AI Voice',
      secondaryAction: 'Use My Voice',
      description: 'AI-generated voice from your text description',
    }
  }

  const getDescriptionPlaceholder = (isRecorded: boolean) => {
    if (isRecorded)
      return 'Add a text transcript of your recording for better accessibility (optional but recommended)...'
    return 'Describe what you see in this scene. Be specific about actions, expressions, and visual details...'
  }

  const audioModeConfig = getAudioModeDisplay(isRecorded, !!clipDescriptionText)
  const descriptionPlaceholder = getDescriptionPlaceholder(isRecorded)

  const getSmartButtonConfig = () => {
    if (isRecorded) {
      if (
        showTextAreaForRecording &&
        clipDescriptionText !== initialClipDescriptionText
      ) {
        return {
          label: 'Save Transcript',
          icon: 'fa-save',
          disabled: false,
          action: 'update',
        }
      }
      return null
    }
    if (!clipDescriptionText || clipDescriptionText.trim() === '') {
      return {
        label: 'Add Description Text',
        icon: 'fa-edit',
        disabled: true,
        action: 'create',
      }
    }
    if (isPreparingToRecord) {
      return {
        label: 'Start Recording This Script',
        icon: 'fa-microphone',
        disabled: false,
        action: 'start-recording',
      }
    }
    if (!clipAudioPath || clipAudioPath.trim() === '') {
      return {
        label: 'Generate AI Voice',
        icon: 'fa-robot',
        disabled: false,
        action: 'generate',
      }
    }
    if (clipDescriptionText !== initialClipDescriptionText) {
      return {
        label: 'Update AI Voice',
        icon: 'fa-sync',
        disabled: false,
        action: 'update',
      }
    }
    return { label: 'Saved', icon: 'fa-check', disabled: true, action: 'saved' }
  }

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]',
    )
    Array.from(tooltipTriggerList).map(
      (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl),
    )
    setClipDescriptionText(initialClipDescriptionText ?? '')
    handleClipStartTimeInputsRender()
    handleClipEndTimeInputsRender()
    if (mediaBlobUrl !== null) {
      const newAudio = new Audio(mediaBlobUrl)
      setRecordedAudio(newAudio)
      newAudio.addEventListener(
        'loadedmetadata',
        function () {
          if (newAudio.duration === Infinity) {
            newAudio.currentTime = 1e101
            newAudio.ontimeupdate = function () {
              this.ontimeupdate = () => {
                return
              }
              const browserDuration =
                Math.round(newAudio.duration * 1000) / 1000
              setRecordedClipDuration(browserDuration)
              newAudio.currentTime = 0
            }
          } else {
            const browserDuration = Math.round(newAudio.duration * 1000) / 1000
            setRecordedClipDuration(browserDuration)
          }
        },
        false,
      )
    }
    setAdAudio(new Audio(clipAudioPath))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    clipAudioPath,
    clipCreatedAt,
    mediaBlobUrl,
    initialClipDescriptionText,
    clipStartTime,
    clipEndTime,
  ])

  useEffect(() => {
    return () => {
      adAudio?.pause()
      adAudio?.remove?.()
      recordedAudio?.pause()
      recordedAudio?.remove?.()
    }
  }, [adAudio, recordedAudio])

  useEffect(() => {
    if (clipAudioPath && !isRecorded) {
      const newAudio = new Audio(clipAudioPath)
      setAdAudio(newAudio)
    }
  }, [clipAudioPath, isRecorded])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (status === 'recording') {
      setRecordingDuration(0)
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 0.1)
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status])

  useEffect(() => {
    if (
      recordedClipDuration > 0 &&
      clipDuration > 0 &&
      !isIntegratedRecordingMode
    ) {
      const difference = Math.abs(recordedClipDuration - clipDuration)
      if (difference > 0.1) {
        setRecordedClipDuration(clipDuration)
      }
    }
  }, [recordedClipDuration, clipDuration, isIntegratedRecordingMode])

  const handleClipStartTimeInputsRender = () => {
    const cardFormat = convertSecondsToCardFormat(clipStartTime).split(':')
    setClipStartTimeHours(parseInt(cardFormat[0]))
    setClipStartTimeMinutes(parseInt(cardFormat[1]))
    setClipStartTimeSeconds(parseInt(cardFormat[2]))
    setClipStartTimeCentiseconds(parseInt(cardFormat[3]))
  }

  const handleClipEndTimeInputsRender = () => {
    const calculatedEndTime = clipStartTime + clipDuration
    const cardFormat = convertSecondsToCardFormat(calculatedEndTime).split(':')
    setClipDurationHours(parseInt(cardFormat[0]))
    setClipDurationMinutes(parseInt(cardFormat[1]))
    setClipDurationSeconds(parseInt(cardFormat[2]))
    setClipDurationMilliSeconds(parseInt(cardFormat[3]))
  }

  const handleOnChangeClipStartTimeHours = (e: any) => {
    setClipStartTimeHours(Number(e.target.value))
  }
  const handleOnChangeClipStartTimeMinutes = (e: any) => {
    setClipStartTimeMinutes(Number(e.target.value))
  }
  const handleOnChangeClipStartTimeSeconds = (e: any) => {
    setClipStartTimeSeconds(Number(e.target.value))
  }
  const handleOnChangeClipStartTimeCentiseconds = (e: any) => {
    setClipStartTimeCentiseconds(Number(e.target.value))
  }

  const handleBlurClipStartTimeHours = (e: any) => {
    let tempStartTimeHours = clipStartTimeHours
    if (e.target.value.length === 1) {
      setClipStartTimeHours(Number(e.target.value + '0'))
      tempStartTimeHours = Number(e.target.value + '0')
      if (parseInt(e.target.value + '0') >= 24) {
        setClipStartTimeHours(23)
        tempStartTimeHours = 23
      }
    } else if (e.target.value.length === 2) {
      const inputValue = parseInt(e.target.value, 10)
      if (inputValue >= 24) {
        setClipStartTimeHours(23)
        tempStartTimeHours = 23
      } else {
        setClipStartTimeHours(inputValue)
        tempStartTimeHours = inputValue
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeHours(0)
      tempStartTimeHours = 0
    }
    calculateClipStartTimeinSeconds(
      clipStartTimeCentiseconds,
      clipStartTimeMinutes,
      clipStartTimeSeconds,
    )
    handleClipEndTimeInputsRender()
  }

  const handleBlurClipStartTimeMinutes = (e: any) => {
    let tempStartTimeMinutes = clipStartTimeMinutes
    if (e.target.value.length === 1) {
      setClipStartTimeMinutes(Number(e.target.value + '0'))
      tempStartTimeMinutes = Number(e.target.value + '0')
      if (parseInt(e.target.value + '0') >= 60) {
        setClipStartTimeMinutes(59)
        tempStartTimeMinutes = 59
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeMinutes(0)
      tempStartTimeMinutes = 0
    }
    calculateClipStartTimeinSeconds(
      clipStartTimeCentiseconds,
      tempStartTimeMinutes,
      clipStartTimeSeconds,
    )
    handleClipEndTimeInputsRender()
  }

  const handleBlurClipStartTimeSeconds = (e: any) => {
    let tempStartTimeSeconds = clipStartTimeSeconds
    if (e.target.value.length === 1) {
      setClipStartTimeSeconds(Number(e.target.value + '0'))
      tempStartTimeSeconds = Number(e.target.value + '0')
      if (parseInt(e.target.value + '0') >= 60) {
        setClipStartTimeSeconds(59)
        tempStartTimeSeconds = 59
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeSeconds(0)
      tempStartTimeSeconds = 0
    }
    calculateClipStartTimeinSeconds(
      clipStartTimeCentiseconds,
      clipStartTimeMinutes,
      tempStartTimeSeconds,
    )
    handleClipEndTimeInputsRender()
  }

  const handleBlurClipStartTimeCentiseconds = (e: any) => {
    let tempStartTimeCentiseconds = clipStartTimeCentiseconds
    if (e.target.value.length === 1) {
      setClipStartTimeCentiseconds(Number(e.target.value + '0'))
      tempStartTimeCentiseconds = Number(e.target.value + '0')
      if (parseInt(e.target.value + '0') >= 100) {
        setClipStartTimeCentiseconds(99)
        tempStartTimeCentiseconds = 99
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeCentiseconds(0)
      tempStartTimeCentiseconds = 0
    }
    calculateClipStartTimeinSeconds(
      tempStartTimeCentiseconds,
      clipStartTimeMinutes,
      clipStartTimeSeconds,
    )
    handleClipEndTimeInputsRender()
  }

  const calculateClipStartTimeinSeconds = (
    milliseconds: number,
    minutes: number,
    seconds: number,
  ) => {
    const calculatedSeconds = +milliseconds / 100 + +minutes * 60 + +seconds
    if (clipPlaybackType === 'inline') {
      if (calculatedSeconds + clipDuration <= videoLength) {
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error(
          'Inline clips cannot extend beyond the video timeline. Consider changing to extended mode.',
        )
        handleClipStartTimeInputsRender()
      }
    } else {
      if (calculatedSeconds < videoLength) {
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error('Start time cannot be later than the video end time.')
        handleClipStartTimeInputsRender()
      }
    }
  }

  const handlePlayPauseRecordedAudio = () => {
    if (isRecordedAudioPlaying) {
      recordedAudio?.pause()
      setIsRecordedAudioPlaying(false)
    } else {
      recordedAudio?.play()
      setIsRecordedAudioPlaying(true)
      recordedAudio?.addEventListener('ended', function () {
        setIsRecordedAudioPlaying(false)
      })
    }
  }

  const handlePlayPauseAdAudio = () => {
    if (isAdAudioPlaying) {
      adAudio?.pause()
      setIsAdAudioPlaying(false)
    } else {
      const audioProm = adAudio?.play()
      if (audioProm !== undefined) {
        audioProm
          .then(() => {
            setIsAdAudioPlaying(true)
            adAudio?.addEventListener('ended', function () {
              setIsAdAudioPlaying(false)
            })
          })
          .catch(() => {
            toast.error('Cannot play audio. Please try again later.')
          })
      }
    }
  }

  const handleReadySetGo = (): void => {
    const countdown = ['3', '2', '1', 'GO!', 'start']
    countdown.forEach((val, i) => {
      setTimeout(() => {
        setReadySetGo(val)
      }, 1000 * i)
    })
    setTimeout(() => {
      startRecording()
    }, 3700)
  }

  const saveClipDescription = (e: any) => {
    e.preventDefault()
    const buttonConfig = getSmartButtonConfig()
    if (!buttonConfig) return
    if (buttonConfig.action === 'start-recording') {
      handleReadySetGo()
    } else {
      handleClickSaveClipDescription(clipDescriptionText)
    }
  }

  const handleToggleTextAreaForRecording = () => {
    setShowTextAreaForRecording(!showTextAreaForRecording)
  }
  const shouldShowTextArea = !isRecorded

  const handleStartIntegratedRecording = () => {
    setIsIntegratedRecordingMode(true)
    setIsPreparingToRecord(true)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleReplaceWithNewRecording = useCallback(async () => {
    if (!mediaBlobUrl) {
      toast.error('No recording found. Please record audio first.')
      return
    }
    setShowSpinner(true)
    try {
      const formData = new FormData()
      const audioBlob = await fetch(`${mediaBlobUrl}`).then((r) => r.blob())
      const audioFile = new File([audioBlob], 'voice.mp3', {
        type: 'audio/mp3',
      })
      formData.append(
        'clipDescriptionText',
        clipDescriptionText || 'Voice recording (no transcript)',
      )
      formData.append('clipStartTime', String(clipStartTime))
      formData.append('newACType', clipDescriptionType)
      formData.append('youtubeVideoId', youtubeVideoId)
      formData.append('recordedClipDuration', String(recordedClipDuration))
      formData.append('audioDescriptionId', audioDescriptionId)
      formData.append('userId', userId)
      formData.append('file', audioFile)
      await axios.put(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/record-replace-clip-audio/${clipId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      toast.success('Successfully replaced with your recorded audio!')
      setIsIntegratedRecordingMode(false)
      setIsPreparingToRecord(false)
      setTimeout(() => {
        setUpdateData(!updateData)
        setShowSpinner(false)
      }, 2000)
    } catch (err) {
      toast.error('Error replacing audio. Please try again.')
      setShowSpinner(false)
    }
  }, [
    mediaBlobUrl,
    clipDescriptionText,
    clipStartTime,
    clipDescriptionType,
    youtubeVideoId,
    recordedClipDuration,
    audioDescriptionId,
    userId,
    clipId,
    updateData,
    setUpdateData,
    setShowSpinner,
  ])

  const handleClickDeleteClip = (e: any) => {
    setShowSpinner(true)
    e.preventDefault()
    axios
      .delete(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/delete-clip/${clipId}`,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
          params: { youtubeVideoId },
        },
      )
      .then(() => {
        toast.success('Clip deleted successfully!')
        fetchUserVideoData()
        setUndoDeletedClip(true)
        setNeedRefresh(true)
      })
      .catch((err) => {
        console.error(err)
        toast.error('Error deleting clip. Please try again.')
        setShowSpinner(false)
      })
  }

  const handleSwitchToTTS = async () => {
    if (!switchToTTSText.trim()) {
      toast.error('Please enter text for AI voice generation')
      return
    }
    try {
      setShowSpinner(true)
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/switch-to-tts/${clipId}`,
        { youtubeVideoId, text: switchToTTSText, audioDescriptionId, userId },
        { withCredentials: true },
      )
      toast.success('Successfully switched to AI voice!')
      setShowSwitchToTTSModal(false)
      setSwitchToTTSText('')
      setUpdateData(!updateData)
    } catch (err: any) {
      console.error('Switch to TTS error:', err)
      toast.error('Error switching to AI voice. Please try again.')
    } finally {
      setShowSpinner(false)
    }
  }

  return (
    <div className="edit-component" ref={ref} id={clipId}>
      <div className="audio-mode-header">
        <div className="audio-mode-badge">
          <i className={`fa ${audioModeConfig.icon} audio-mode-icon`}></i>
          <span className="audio-mode-title">{audioModeConfig.title}</span>
        </div>
        <div className="audio-mode-description">
          {audioModeConfig.description}
        </div>
      </div>

      <div className="primary-content-section">
        <div className="description-editing-area">
          <div className="section-header">
            <h6 className="section-title">Description Content</h6>
            <div className="description-status">
              {clipDescriptionText?.length || 0} characters
            </div>
          </div>

          {shouldShowTextArea ? (
            <TextareaAutosize
              className="enhanced-description-textarea"
              placeholder={descriptionPlaceholder}
              value={clipDescriptionText}
              onChange={(e) => {
                setClipDescriptionText(e.target.value)
                setClipDescText(e.target.value)
              }}
              disabled={isPreview}
              minRows={4}
              maxRows={8}
            />
          ) : (
            <div className="recorded-clip-message">
              <div className="recording-status">
                <i className="fa fa-microphone-alt"></i>
                <span>Voice recording completed</span>
              </div>
            </div>
          )}

          {isIntegratedRecordingMode && (
            <div className="integrated-recording-interface">
              {isPreparingToRecord ? (
                <div className="recording-preparation-area">
                  <div className="preparation-header">
                    <i className="fa fa-microphone text-primary"></i>
                    <span>
                      {isRecorded
                        ? 'Ready to record a replacement? You can edit your script above first.'
                        : 'Ready to record? You can still edit your script above.'}
                    </span>
                  </div>
                  <div className="preparation-actions">
                    <button
                      className="ydx-button ydx-button--primary"
                      onClick={() => {
                        setIsPreparingToRecord(false)
                        handleReadySetGo()
                      }}
                    >
                      <i className="fa fa-microphone" /> Start Recording
                    </button>
                    <button
                      className="ydx-button ydx-button--secondary"
                      onClick={() => {
                        setIsIntegratedRecordingMode(false)
                        setIsPreparingToRecord(false)
                      }}
                    >
                      <i className="fa fa-times" /> Cancel Recording
                    </button>
                  </div>
                </div>
              ) : (
                <div className="active-recording-area">
                  {status === 'recording' && readySetGo !== '' ? (
                    <div className="recording-in-progress">
                      <div className="recording-header">
                        <i className="fa fa-microphone text-danger recording-pulse"></i>
                        <span>
                          Recording in progress - read your script above
                        </span>
                      </div>
                      <div className="recording-status-display">
                        <div className="duration-indicator">
                          <i className="fa fa-clock text-warning"></i>
                          <span>{recordingDuration.toFixed(1)}s</span>
                        </div>
                      </div>
                      <div className="recording-action-buttons">
                        <button
                          className="ydx-button ydx-button--danger"
                          onClick={() => {
                            stopRecording()
                            setReadySetGo('')
                          }}
                        >
                          <i className="fa fa-stop" /> Stop Recording
                        </button>
                        <button
                          className="ydx-button ydx-button--secondary"
                          onClick={() => {
                            stopRecording()
                            setRecordingDuration(0)
                            setReadySetGo('')
                            setTimeout(() => setIsPreparingToRecord(true), 100)
                          }}
                        >
                          <i className="fa fa-redo" /> Start Over
                        </button>
                      </div>
                    </div>
                  ) : readySetGo !== 'start' && readySetGo !== '' ? (
                    <div className="countdown-in-content">
                      <div className="countdown-circle">{readySetGo}</div>
                      <div className="countdown-message">
                        Get ready to read your script...
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {mediaBlobUrl && status === 'stopped' && (
                <div className="recording-playback-confirmation">
                  <div className="playback-header">
                    <i className="fa fa-check-circle text-success"></i>
                    <span>Recording completed! Listen and confirm:</span>
                  </div>
                  <audio src={mediaBlobUrl} controls className="w-100 mb-3" />
                  <div className="confirmation-actions">
                    <button
                      className="ydx-button ydx-button--success"
                      onClick={handleReplaceWithNewRecording}
                    >
                      <i className="fa fa-check" /> Use This Recording
                    </button>
                    <button
                      className="ydx-button ydx-button--secondary"
                      onClick={() => {
                        setIsIntegratedRecordingMode(false)
                        setIsPreparingToRecord(false)
                      }}
                    >
                      <i className="fa fa-times" /> Keep Original
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="primary-actions">
            {!isRecorded && !isPreview && !isIntegratedRecordingMode && (
              <button
                className="ydx-button ydx-button--primary record-voice-prominent"
                onClick={handleStartIntegratedRecording}
                title="Replace AI voice with your own recording"
              >
                <i className="fa fa-microphone" /> Record Your Voice
              </button>
            )}
            {isRecorded && !isPreview && !isIntegratedRecordingMode && (
              <button
                className="ydx-button ydx-button--primary record-voice-prominent"
                onClick={handleStartIntegratedRecording}
                title="Record a new audio clip to replace the current one"
              >
                <i className="fa fa-microphone" /> 🎤 Record New Audio
              </button>
            )}
            {!isIntegratedRecordingMode &&
              (() => {
                const buttonConfig = getSmartButtonConfig()
                if (!buttonConfig) return null
                return (
                  <button
                    className={`ydx-button ${
                      buttonConfig.disabled
                        ? 'ydx-button--secondary'
                        : 'ydx-button--success'
                    }`}
                    onClick={
                      buttonConfig.disabled ? undefined : saveClipDescription
                    }
                    disabled={isPreview || buttonConfig.disabled}
                  >
                    <i className={`fa ${buttonConfig.icon}`} />{' '}
                    {buttonConfig.label}
                  </button>
                )
              })()}
            <button
              className={`ydx-button ${
                isAdAudioPlaying
                  ? 'ydx-button--secondary'
                  : 'ydx-button--primary'
              }`}
              onClick={handlePlayPauseAdAudio}
            >
              <i
                className={`fa ${isAdAudioPlaying ? 'fa-pause' : 'fa-play'}`}
              />
              {isAdAudioPlaying ? 'Pause Audio' : 'Play Audio'}
            </button>
            {isRecorded && !isPreview && (
              <>
                {!showSwitchToTTSModal ? (
                  <button
                    className="ydx-button ydx-button--secondary"
                    onClick={() => {
                      setSwitchToTTSText(clipDescriptionText || '')
                      setShowSwitchToTTSModal(true)
                    }}
                    title="Switch back to AI-generated voice"
                  >
                    <i className="fa fa-robot" /> Switch to AI Voice
                  </button>
                ) : (
                  <div className="switch-to-tts-inline">
                    <div className="inline-text-header">
                      <i className="fa fa-robot text-primary me-2"></i>
                      <span>Enter text for AI voice generation:</span>
                    </div>
                    <textarea
                      className="enhanced-description-textarea"
                      rows={3}
                      placeholder="Describe what you recorded so the AI can generate similar speech..."
                      value={switchToTTSText}
                      onChange={(e) => setSwitchToTTSText(e.target.value)}
                      style={{ marginTop: '8px', marginBottom: '8px' }}
                    />
                    <div className="inline-action-buttons">
                      <button
                        className="ydx-button ydx-button--primary"
                        onClick={handleSwitchToTTS}
                        disabled={!switchToTTSText.trim()}
                      >
                        <i className="fa fa-robot" /> Generate AI Voice
                      </button>
                      <button
                        className="ydx-button ydx-button--secondary"
                        onClick={() => {
                          setShowSwitchToTTSModal(false)
                          setSwitchToTTSText('')
                        }}
                      >
                        <i className="fa fa-times" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <button
              className="ydx-button ydx-button--danger"
              onClick={() => setIsDeleteModal(true)}
              disabled={isPreview}
            >
              <i className="fa fa-trash" /> Delete Clip
            </button>
          </div>
        </div>

        <div className="timing-controls-section">
          <div className="section-header">
            <h6 className="section-title">Timing Controls</h6>
          </div>
          <div className="timing-inputs-grid">
            <div className="timing-input-group">
              <div className="modern-timing-label">
                <i className="fa fa-play"></i> Start Time
              </div>
              <div className="modern-time-input-container">
                <div className="time-field-group">
                  <span className="time-field-label">HR</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipStartTimeHours)}
                    onChange={handleOnChangeClipStartTimeHours}
                    onBlur={handleBlurClipStartTimeHours}
                    min="0"
                    max="23"
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                </div>
                <span className="modern-time-separator">:</span>
                <div className="time-field-group">
                  <span className="time-field-label">MIN</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipStartTimeMinutes)}
                    onChange={handleOnChangeClipStartTimeMinutes}
                    onBlur={handleBlurClipStartTimeMinutes}
                    min="0"
                    max="59"
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                </div>
                <span className="modern-time-separator">:</span>
                <div className="time-field-group">
                  <span className="time-field-label">SEC</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipStartTimeSeconds)}
                    onChange={handleOnChangeClipStartTimeSeconds}
                    onBlur={handleBlurClipStartTimeSeconds}
                    min="0"
                    max="59"
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                </div>
                <span className="modern-time-separator">:</span>
                <div className="time-field-group">
                  <span className="time-field-label">MS</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipStartTimeCentiseconds)}
                    onChange={handleOnChangeClipStartTimeCentiseconds}
                    onBlur={handleBlurClipStartTimeCentiseconds}
                    min="0"
                    max="99"
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                </div>
              </div>
            </div>
            <div className="timing-input-group">
              <div className="modern-timing-label">
                <i className="fa fa-stop"></i> End Time
              </div>
              <div className="modern-time-input-container">
                <div className="time-field-group">
                  <span className="time-field-label">HR</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipDurationHours)}
                    readOnly
                  />
                </div>
                <span className="modern-time-separator">:</span>
                <div className="time-field-group">
                  <span className="time-field-label">MIN</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipDurationMinutes)}
                    readOnly
                  />
                </div>
                <span className="modern-time-separator">:</span>
                <div className="time-field-group">
                  <span className="time-field-label">SEC</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipDurationSeconds)}
                    readOnly
                  />
                </div>
                <span className="modern-time-separator">:</span>
                <div className="time-field-group">
                  <span className="time-field-label">MS</span>
                  <input
                    type="number"
                    className="modern-time-input"
                    value={padNumber(clipDurationMilliSeconds)}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modern-duration-display">
            <div className="modern-duration-label">
              <i className="fa fa-clock"></i> Total Duration
            </div>
            <div className="modern-duration-value">
              {clipDurationAsTimestamp} seconds
            </div>
          </div>
        </div>
      </div>
      {/* Delete Modal */}
      <ModalComponent
        id="deleteModal"
        title="Delete Clip"
        text="Are you sure you want to delete this audio clip? This action cannot be undone."
        modalTask={(e: any) => handleClickDeleteClip(e)}
        show={isDeleteModal}
        handleClose={() => setIsDeleteModal(false)}
      />
    </div>
  )
}

export default EditClip
