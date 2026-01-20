import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import '@/assets/css/audioDesc.css'
import '@/assets/css/editAudioDesc.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import TextareaAutosize from 'react-textarea-autosize'
import ModalComponent from '../../../shared/components/Modal/Modal'
import Button from 'react-bootstrap/Button'
import { YouTubePlayer } from 'youtube-player/dist/types'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import padNumber from '@/shared/utils/padNumber'
import { Tooltip } from 'bootstrap'

interface Props {
  userId: string
  youtubeVideoId: string
  currentTime: number
  currentState: number
  currentEvent: YouTubePlayer | undefined
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
  currentState,
  currentEvent,
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

  // Enhanced state management for better user experience
  const [clipDescriptionText, setClipDescriptionText] = useState(
    initialClipDescriptionText,
  )
  const [recordedClipDuration, setRecordedClipDuration] = useState(0.0)
  const [readySetGo, setReadySetGo] = useState('')
  const [isDeleteModal, setIsDeleteModal] = useState(false)

  // Audio playback state management
  const [recordedAudio, setRecordedAudio] = useState<HTMLAudioElement>()
  const [adAudio, setAdAudio] = useState<HTMLAudioElement>()
  const [isRecordedAudioPlaying, setIsRecordedAudioPlaying] = useState(false)
  const [isAdAudioPlaying, setIsAdAudioPlaying] = useState(false)
  const [isYoutubeVideoPlaying, setIsYoutubeVideoPlaying] = useState(false)

  // Time input state for enhanced timing controls
  const [clipStartTimeHours, setClipStartTimeHours] = useState(0.0)
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0.0)
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0.0)
  const [clipStartTimeMilliSeconds, setClipStartTimeMilliSeconds] =
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

  // Media recorder integration
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({
      audio: true,
    })

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
    if (isRecorded) {
      return 'Add a text transcript of your recording for better accessibility (optional but recommended)...'
    }
    return 'Describe what you see in this scene. Be specific about actions, expressions, and visual details...'
  }

  // Get current audio mode configuration for enhanced UI
  const audioModeConfig = getAudioModeDisplay(isRecorded, !!clipDescriptionText)
  const descriptionPlaceholder = getDescriptionPlaceholder(isRecorded)

  // Helper functions for enhanced audio mode communication

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

    // For AI clips - original logic
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

    return {
      label: 'Saved',
      icon: 'fa-check',
      disabled: true,
      action: 'saved',
    }
  }

  // Initialize component state and setup
  useEffect(() => {
    // Set up tooltips for enhanced user guidance
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]',
    )
    Array.from(tooltipTriggerList).map(
      (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl),
    )

    // Initialize description text from props
    setClipDescriptionText(initialClipDescriptionText ?? '')

    // Setup timing input fields
    handleClipStartTimeInputsRender()
    handleClipEndTimeInputsRender()

    // Configure YouTube player state tracking
    setIsYoutubeVideoPlaying(
      currentState === -1 || currentState === 0 || currentState === 2
        ? false
        : currentState === 1,
    )

    // Setup audio playback when new recording is available
    if (mediaBlobUrl !== null) {
      const newAudio = new Audio(mediaBlobUrl)
      setRecordedAudio(newAudio)

      // Calculate and set recorded audio duration
      newAudio.addEventListener(
        'loadedmetadata',
        function () {
          if (newAudio.duration === Infinity) {
            // Handle edge case for some audio formats
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

    // Setup existing audio clip playback
    setAdAudio(new Audio(clipAudioPath))
  }, [
    clipAudioPath,
    clipCreatedAt,
    currentState,
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
    // Reload audio when clipAudioPath changes (after TTS regeneration)
    if (clipAudioPath && !isRecorded) {
      const newAudio = new Audio(clipAudioPath)
      setAdAudio(newAudio)
    }
  }, [clipAudioPath, isRecorded])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (status === 'recording') {
      setRecordingDuration(0) // Reset duration when recording actually starts
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 0.1)
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (status === 'recording') {
      interval = setInterval(updateRecordingDuration, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status, updateRecordingDuration])

  useEffect(() => {
    if (recordedClipDuration > 0 && clipDuration > 0) {
      const difference = Math.abs(recordedClipDuration - clipDuration)
      if (difference > 0.1) {
        console.log(
          `Syncing duration: frontend=${recordedClipDuration}s, backend=${clipDuration}s`,
        )
        setRecordedClipDuration(clipDuration) // Backend wins
      }
    }
  }, [recordedClipDuration, clipDuration])

  // Enhanced timing input rendering functions
  const handleClipStartTimeInputsRender = () => {
    const cardFormat = convertSecondsToCardFormat(clipStartTime).split(':')
    setClipStartTimeHours(parseInt(cardFormat[0]))
    setClipStartTimeMinutes(parseInt(cardFormat[1]))
    setClipStartTimeSeconds(parseInt(cardFormat[2]))
    setClipStartTimeMilliSeconds(parseInt(cardFormat[3]))
  }

  const handleClipEndTimeInputsRender = () => {
    const calculatedEndTime = clipStartTime + clipDuration
    const cardFormat = convertSecondsToCardFormat(calculatedEndTime).split(':')
    setClipDurationHours(parseInt(cardFormat[0]))
    setClipDurationMinutes(parseInt(cardFormat[1]))
    setClipDurationSeconds(parseInt(cardFormat[2]))
    setClipDurationMilliSeconds(parseInt(cardFormat[3]))
  }

  // Enhanced timing input handlers with proper validation - restored from original
  const handleOnChangeClipStartTimeHours = (e: any) => {
    setClipStartTimeHours(Number(e.target.value))
  }

  const handleOnChangeClipStartTimeMinutes = (e: any) => {
    setClipStartTimeMinutes(Number(e.target.value))
  }

  const handleOnChangeClipStartTimeSeconds = (e: any) => {
    setClipStartTimeSeconds(Number(e.target.value))
  }

  const handleOnChangeClipStartTimeMilliSeconds = (e: any) => {
    setClipStartTimeMilliSeconds(Number(e.target.value))
  }

  // Individual blur handlers with field-specific validation
  const handleBlurClipStartTimeHours = (e: any) => {
    let tempStartTimeHours = clipStartTimeHours

    // Handle single digit input by padding with zero
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

    // Calculate and validate total time
    const calculatedSeconds =
      tempStartTimeHours * 3600 +
      clipStartTimeMinutes * 60 +
      clipStartTimeSeconds +
      clipStartTimeMilliSeconds / 1000

    calculateClipStartTimeinSeconds(
      clipStartTimeMilliSeconds,
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
      clipStartTimeMilliSeconds,
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
      clipStartTimeMilliSeconds,
      clipStartTimeMinutes,
      tempStartTimeSeconds,
    )

    handleClipEndTimeInputsRender()
  }

  const handleBlurClipStartTimeMilliSeconds = (e: any) => {
    let tempStartTimeMilliSeconds = clipStartTimeMilliSeconds

    if (e.target.value.length === 1) {
      setClipStartTimeMilliSeconds(Number(e.target.value + '0'))
      tempStartTimeMilliSeconds = Number(e.target.value + '0')
      if (parseInt(e.target.value + '0') >= 100) {
        setClipStartTimeMilliSeconds(99)
        tempStartTimeMilliSeconds = 99
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeMilliSeconds(0)
      tempStartTimeMilliSeconds = 0
    }

    calculateClipStartTimeinSeconds(
      tempStartTimeMilliSeconds,
      clipStartTimeMinutes,
      clipStartTimeSeconds,
    )

    handleClipEndTimeInputsRender()
  }

  // Enhanced timing validation and update functions
  const calculateClipStartTimeinSeconds = (
    milliseconds: number,
    minutes: number,
    seconds: number,
  ) => {
    const calculatedSeconds = +milliseconds / 1000 + +minutes * 60 + +seconds

    // Validate timing constraints based on playback type
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
      // Extended clip validation
      if (calculatedSeconds < videoLength) {
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error('Start time cannot be later than the video end time.')
        handleClipStartTimeInputsRender()
      }
    }
  }

  // Enhanced audio playback control functions
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
          .catch((err) => {
            toast.error('Cannot play audio. Please try again later.')
          })
      }
    }
  }

  const handlePlayPauseYouTubeVideo = () => {
    if (currentState === -1 || currentState === 0 || currentState === 2) {
      currentEvent?.playVideo()
      setIsYoutubeVideoPlaying(true)
    } else if (currentState === 1) {
      currentEvent?.pauseVideo()
      setIsYoutubeVideoPlaying(false)
    }
  }

  // Enhanced recording workflow functions
  const handleReadySetGo = (): void => {
    const countdown = ['3', '2', '1', 'GO!', 'start']

    countdown.forEach((val, i) => {
      setTimeout(() => {
        setReadySetGo(val)
      }, 1000 * i)
    })

    // Start recording after countdown
    setTimeout(() => {
      startRecording()
    }, 3700)
  }

  const saveClipDescription = (e: any) => {
    e.preventDefault()

    // Get the current button configuration to determine what action to take
    const buttonConfig = getSmartButtonConfig()

    if (!buttonConfig) {
      return
    }

    if (buttonConfig.action === 'start-recording') {
      // User clicked the "Start Recording This Script" button
      handleReadySetGo()
    } else {
      // Normal save operation
      handleClickSaveClipDescription(clipDescriptionText)
    }
  }

  // Toggle text area visibility for recorded clips
  const handleToggleTextAreaForRecording = () => {
    setShowTextAreaForRecording(!showTextAreaForRecording)
  }

  // Determine if text area should be shown
  const shouldShowTextArea = !isRecorded

  const handleStartIntegratedRecording = () => {
    setIsIntegratedRecordingMode(true)
    setIsPreparingToRecord(true)
    // Scroll to keep the content editing area in view
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

      // Reset integrated recording mode after successful replacement
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

  // Enhanced delete functionality
  const handleClickDeleteClip = (e: any) => {
    setShowSpinner(true)
    e.preventDefault()

    axios
      .delete(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/delete-clip/${clipId}`,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
          params: { youtubeVideoId: youtubeVideoId },
        },
      )
      .then((res) => {
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

  // New function for switching between audio modes
  // NOTE: This requires a backend API endpoint that may need to be implemented
  // The endpoint should handle converting recorded audio clips back to TTS mode
  // Expected backend behavior:
  // 1. Delete existing audio file
  // 2. Generate new TTS audio from the provided text
  // 3. Update clip metadata (is_recorded: false, updated file paths)
  // 4. Return success confirmation
  const handleSwitchToTTS = async () => {
    if (!switchToTTSText.trim()) {
      toast.error('Please enter text for AI voice generation')
      return
    }

    try {
      setShowSpinner(true)

      // Call the backend to switch to TTS
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/switch-to-tts/${clipId}`,
        {
          youtubeVideoId: youtubeVideoId,
          text: switchToTTSText,
          audioDescriptionId: audioDescriptionId,
          userId: userId,
        },
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
      {/* Audio Mode Header - Clear visual indicator of current mode */}
      <div className="audio-mode-header">
        <div className="audio-mode-badge">
          <i className={`fa ${audioModeConfig.icon} audio-mode-icon`}></i>
          <span className="audio-mode-title">{audioModeConfig.title}</span>
        </div>
        <div className="audio-mode-description">
          {audioModeConfig.description}
        </div>
      </div>

      {/* Primary Content Section - Description editing gets prime real estate */}
      <div className="primary-content-section">
        <div className="description-editing-area">
          <div className="section-header">
            <h6 className="section-title">Description Content</h6>
            <div className="description-status">
              {clipDescriptionText?.length || 0} characters
            </div>
          </div>

          {/* Show text area based on recording mode */}
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
            /* Show message for recorded clips when text area is hidden */
            <div className="recorded-clip-message">
              <div className="recording-status">
                <i className="fa fa-microphone-alt"></i>
                <span>Voice recording completed</span>
              </div>
            </div>
          )}

          {/* Integrated Recording Interface - appears in content editing area when user wants to record */}
          {isIntegratedRecordingMode && (
            <div className="integrated-recording-interface">
              {isPreparingToRecord ? (
                /* Script Preparation Phase - user can still edit their text and prepare for recording */
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
                        // Transition from preparation to actual recording
                        setIsPreparingToRecord(false)
                        handleReadySetGo() // Use your existing countdown logic
                      }}
                    >
                      <i className="fa fa-microphone" />
                      Start Recording
                    </button>

                    <button
                      className="ydx-button ydx-button--secondary"
                      onClick={() => {
                        // Exit recording mode and return to normal editing
                        setIsIntegratedRecordingMode(false)
                        setIsPreparingToRecord(false)
                      }}
                    >
                      <i className="fa fa-times" />
                      Cancel Recording
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Recording Phase - countdown and recording in progress */
                <div className="active-recording-area">
                  {status === 'recording' && readySetGo !== '' ? (
                    <div className="recording-in-progress">
                      <div className="recording-header">
                        <i className="fa fa-microphone text-danger recording-pulse"></i>
                        <span>
                          Recording in progress - read your script above
                        </span>
                      </div>

                      {/* Recording Duration Display */}
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
                          <i className="fa fa-stop" />
                          Stop Recording
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
                          <i className="fa fa-redo" />
                          Start Over
                        </button>
                      </div>
                    </div>
                  ) : readySetGo !== 'start' && readySetGo !== '' ? (
                    /* Countdown Display */
                    <div className="countdown-in-content">
                      <div className="countdown-circle">{readySetGo}</div>
                      <div className="countdown-message">
                        Get ready to read your script...
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Show recording playback and confirmation after recording stops */}
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
                      <i className="fa fa-check" />
                      Use This Recording
                    </button>

                    <button
                      className="ydx-button ydx-button--secondary"
                      onClick={() => {
                        setIsIntegratedRecordingMode(false)
                        setIsPreparingToRecord(false)
                      }}
                    >
                      <i className="fa fa-times" />
                      Keep Original
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Primary Action Buttons - Unified smart button approach */}
          <div className="primary-actions">
            {/* Record Voice button - ONLY show when NOT in recording mode */}
            {!isRecorded && !isPreview && !isIntegratedRecordingMode && (
              <button
                className="ydx-button ydx-button--primary record-voice-prominent"
                onClick={handleStartIntegratedRecording}
                title="Replace AI voice with your own recording"
              >
                <i className="fa fa-microphone" />
                Record Your Voice
              </button>
            )}

            {/* Replace Recording button - ONLY show when NOT in recording mode */}
            {isRecorded && !isPreview && !isIntegratedRecordingMode && (
              <button
                className="ydx-button ydx-button--primary record-voice-prominent"
                onClick={handleStartIntegratedRecording}
                title="Record a new audio clip to replace the current one"
              >
                <i className="fa fa-microphone" />
                🎤 Record New Audio
              </button>
            )}

            {/* Save/Generate button - HIDE the redundant "Start Recording This Script" when recording interface is active */}
            {!isIntegratedRecordingMode &&
              (() => {
                const buttonConfig = getSmartButtonConfig()
                if (!buttonConfig) {
                  return null
                }
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
                    <i className={`fa ${buttonConfig.icon}`} />
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

            {/* Convert to AI Voice section - inline interface for recorded clips */}
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
                    <i className="fa fa-robot" />
                    Switch to AI Voice
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
                        <i className="fa fa-robot" />
                        Generate AI Voice
                      </button>
                      <button
                        className="ydx-button ydx-button--secondary"
                        onClick={() => {
                          setShowSwitchToTTSModal(false)
                          setSwitchToTTSText('')
                        }}
                      >
                        <i className="fa fa-times" />
                        Cancel
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
              <i className="fa fa-trash" />
              Delete Clip
            </button>
          </div>
        </div>

        <div className="timing-controls-section">
          <div className="section-header">
            <h6 className="section-title">Timing Controls</h6>
          </div>

          <div className="timing-inputs-grid">
            {/* START TIME - Editable for Positioning */}
            <div className="timing-input-group">
              <div className="modern-timing-label">
                <i className="fa fa-play"></i>
                Start Time
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
                    value={padNumber(clipStartTimeMilliSeconds)}
                    onChange={handleOnChangeClipStartTimeMilliSeconds}
                    onBlur={handleBlurClipStartTimeMilliSeconds}
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

            {/* END TIME - Read-only Display */}
            <div className="timing-input-group">
              <div className="modern-timing-label">
                <i className="fa fa-stop"></i>
                End Time
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

          {/* Duration Display */}
          <div className="modern-duration-display">
            <div className="modern-duration-label">
              <i className="fa fa-clock"></i>
              Total Duration
            </div>
            <div className="modern-duration-value">
              {clipDurationAsTimestamp} seconds
            </div>
          </div>
        </div>
      </div>

      {/* Video Synchronization Controls - Keep only this */}
      {!isPreview && !isIntegratedRecordingMode && (
        <div className="video-sync-controls">
          <button
            className={`ydx-button ${
              isYoutubeVideoPlaying
                ? 'ydx-button--secondary'
                : 'ydx-button--primary'
            } video-control-btn`}
            onClick={handlePlayPauseYouTubeVideo}
          >
            <i
              className={`fa ${isYoutubeVideoPlaying ? 'fa-pause' : 'fa-play'}`}
            />
            {isYoutubeVideoPlaying ? 'Pause' : 'Play'} Video with Description
          </button>
        </div>
      )}

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
