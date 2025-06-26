import React, { useState, useEffect, useRef } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import '@/assets/css/audioDesc.css'
import axios from 'axios'
import { toast } from 'react-toastify' // for toast messages
import TextareaAutosize from 'react-textarea-autosize'
import ModalComponent from '../../../shared/components/Modal/Modal'
import Button from 'react-bootstrap/Button'
import { YouTubePlayer } from 'youtube-player/dist/types'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import padNumber from '@/shared/utils/padNumber'
import TeleprompterView from '@/features/Describe/AudioClip/TeleprompterView'
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
  // use 3 state variables to hold the value of 3 input type number fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [clipStartTimeHours, setClipStartTimeHours] = useState(0.0)
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0.0)
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0.0)
  const [clipStartTimeMilliSeconds, setClipStartTimeMilliSeconds] =
    useState(0.0)
  const [clipDurationHours, setClipDurationHours] = useState(0.0)
  const [clipDurationMinutes, setClipDurationMinutes] = useState(0.0)
  const [clipDurationSeconds, setClipDurationSeconds] = useState(0.0)
  const [clipDurationMilliSeconds, setClipDurationMilliSeconds] = useState(0.0)
  const [isDeleteModal, setIsDeleteModal] = useState(false)
  const [isReplaceModal, setIsReplaceModal] = useState(false)

  // const [clipEndTimeMinutes, setClipEndTimeMinutes] = useState(0.0);
  // const [clipEndTimeSeconds, setClipEndTimeSeconds] = useState(0.0);
  // const [clipEndTimeMilliSeconds, setClipEndTimeMilliSeconds] = useState(0.0);

  // variable and function declaration of the react-media-recorder package
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({
      audio: true,
    }) // using only the audio recorder here
  // this state variable keeps track of the play/pause state of the recorded audio
  const [isRecordedAudioPlaying, setIsRecordedAudioPlaying] = useState(false)
  // this state variable is updated whenever mediaBlobUrl is updated. i.e. whenever a new recording is created
  const [recordedAudio, setRecordedAudio] = useState<HTMLAudioElement>()
  const [adAudio, setAdAudio] = useState<HTMLAudioElement>()
  const [isAdAudioPlaying, setIsAdAudioPlaying] = useState(false)
  const [isYoutubeVideoPlaying, setIsYoutubeVideoPlaying] = useState(false)

  // initialize state variables from props
  const [clipDescriptionText, setClipDescriptionText] = useState(
    initialClipDescriptionText,
  )

  const [recordedClipDuration, setRecordedClipDuration] = useState(0.0)

  const [readySetGo, setReadySetGo] = useState('')

  useEffect(() => {
    setClipDescriptionText(initialClipDescriptionText ?? '')
    handleClipStartTimeInputsRender()
    handleClipEndTimeInputsRender()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipStartTime, clipEndTime, initialClipDescriptionText])

  // Helper function to determine what text to display
  const getDescriptionDisplay = () => {
    // If it's a recorded clip with no meaningful text
    if (
      isRecorded &&
      (!clipDescriptionText || clipDescriptionText.trim() === '')
    ) {
      return {
        displayText: '🎙️ Voice recording - no transcript available',
        isPlaceholder: true,
        canEdit: false,
        className: 'text-muted font-italic',
      }
    }

    // If it's a recorded clip but has text (maybe from teleprompter)
    if (isRecorded && clipDescriptionText) {
      return {
        displayText: clipDescriptionText,
        isPlaceholder: false,
        canEdit: true,
        className: 'recorded-with-text',
        helperText: '📝 This text was saved with your recording',
      }
    }

    // If it's a TTS clip (normal case)
    return {
      displayText: clipDescriptionText || '',
      isPlaceholder: false,
      canEdit: true,
      className: '',
    }
  }

  // Helper function for audio mode configuration
  const getAudioModeConfig = () => {
    if (!clipAudioPath) {
      return {
        icon: '🎵',
        title: 'Add Audio Description',
        subtitle: 'Choose how to add audio to this scene',
        mode: 'empty',
      }
    } else if (isRecorded) {
      return {
        icon: '🎙️',
        title: 'Your Voice Recording',
        subtitle: `Duration: ${clipDuration.toFixed(2)}s`,
        mode: 'recorded',
      }
    } else {
      return {
        icon: '🤖',
        title: 'AI Voice (Text-to-Speech)',
        subtitle: 'Generated from your text description',
        mode: 'tts',
      }
    }
  }

  // Get configurations
  const descriptionDisplay = getDescriptionDisplay()
  const audioMode = getAudioModeConfig()

  // New handler functions
  const handleConvertToTextMode = () => {
    setClipDescriptionText('') // Enable text field
    toast.info('You can now add text to your recording')
  }

  const handleRegenerateAI = async () => {
    if (!clipDescriptionText) {
      toast.error('Please enter text before generating AI voice')
      return
    }
    // Call your existing save function to regenerate TTS
    await handleClickSaveClipDescription(clipDescriptionText)
  }

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]',
    )
    Array.from(tooltipTriggerList).map(
      (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl),
    )
    // setClipDescriptionText(initialClipDescriptionText);
    // set the button text & state based on YouTube Player's currentState
    setIsYoutubeVideoPlaying(
      currentState === -1 || currentState === 0 || currentState === 2
        ? false
        : currentState === 1,
    )
    // scrolls to the latest clip when a new clip is added
    const date = new Date()
    const TEN_SEC = 10 * 1000
    // if (date.getTime() - new Date(clipCreatedAt).getTime() <= TEN_SEC) {
    //   ref.current?.scrollIntoView({
    //     behavior: 'smooth',
    //     block: 'start',
    //     inline: 'start',
    //   })
    // }

    // following statements execute whenever mediaBlobUrl is updated.. used it in the dependency array
    if (mediaBlobUrl !== null) {
      setRecordedAudio(new Audio(mediaBlobUrl))
      const aud = new Audio(mediaBlobUrl)
      // set audio duration if recorded
      aud.addEventListener(
        'loadedmetadata',
        function () {
          if (aud.duration === Infinity) {
            // set it to bigger than the actual duration
            aud.currentTime = 1e101
            aud.ontimeupdate = function () {
              this.ontimeupdate = () => {
                return
              }
              setRecordedClipDuration(aud.duration)
              aud.currentTime = 0
            }
          } else {
            setRecordedClipDuration(aud.duration)
          }
        },
        false,
      )
    }
    setAdAudio(new Audio(clipAudioPath))
    // render the start time input fields based on the updated prop value - clipStartTime
    handleClipStartTimeInputsRender()
    handleClipEndTimeInputsRender()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipAudioPath, clipCreatedAt, currentState, mediaBlobUrl])

  // render the values in the input[type='number'] fields of the start time - renders everytime the clipStartTime value changes
  const handleClipStartTimeInputsRender = () => {
    const cardFormat = convertSecondsToCardFormat(clipStartTime).split(':')
    setClipStartTimeHours(parseInt(cardFormat[0]))
    setClipStartTimeMinutes(parseInt(cardFormat[1]))
    setClipStartTimeSeconds(parseInt(cardFormat[2]))
    setClipStartTimeMilliSeconds(parseInt(cardFormat[3]))
  }

  const handleClipEndTimeInputsRender = () => {
    const cardFormat = convertSecondsToCardFormat(clipEndTime).split(':')
    setClipDurationHours(parseInt(cardFormat[0]))
    setClipDurationMinutes(parseInt(cardFormat[1]))
    setClipDurationSeconds(parseInt(cardFormat[2]))
    setClipDurationMilliSeconds(parseInt(cardFormat[3]))
  }

  // calculate the Start Time in seconds from the Hours, Minutes & Seconds passed from handleBlur functions
  const calculateClipStartTimeinSeconds = (
    milliseconds: number,
    minutes: number,
    seconds: number,
  ) => {
    const calculatedSeconds = +milliseconds / 1000 + +minutes * 60 + +seconds
    // restrict the audio block to the timeline
    if (clipPlaybackType === 'inline') {
      if (calculatedSeconds + clipDuration <= videoLength) {
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error(
          'Audio Clip cannot be outside the timeline. Change it to extended and adjust the start time.',
        )
        handleClipStartTimeInputsRender()
      }
    }
    // extended clip
    else {
      // check if the updated start time is more than the videolength, if yes, throw error and retain the old state
      if (calculatedSeconds < videoLength) {
        // handleClipStartTimeUpdate is the prop function received from parent component - this runs an axios PUT call and updates the clipStartTime
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error(
          'Oops!! Start Time cannot be later than the video end time.',
        ) // show toast error message
        handleClipStartTimeInputsRender()
      }
    }
  }

  // function for toggling play pause functionality of the recorded audio - on button click
  const handlePlayPauseRecordedAudio = () => {
    if (isRecordedAudioPlaying) {
      recordedAudio?.pause()
      setIsRecordedAudioPlaying(false)
    } else {
      recordedAudio?.play()
      setIsRecordedAudioPlaying(true)
      // this is for setting setIsRecordedAudioPlaying variable to false, once the playback is completed.
      recordedAudio?.addEventListener('ended', function () {
        setIsRecordedAudioPlaying(false)
      })
    }
  }

  // function for toggling play pause functionality of audio Clip - on button click
  const handlePlayPauseAdAudio = () => {
    if (isAdAudioPlaying) {
      adAudio?.pause()
      setIsAdAudioPlaying(false)
    } else {
      const audioProm = adAudio?.play()
      // handle exceptions in playing audio - like having the wrong url in the audiopath
      if (audioProm !== undefined) {
        audioProm
          .then(() => {
            // Automatic playback started!
            setIsAdAudioPlaying(true)
            // this is for setting setIsAdAudioPlaying variable to false, once the playback is completed.
            adAudio?.addEventListener('ended', function () {
              setIsAdAudioPlaying(false)
            })
          })
          .catch((err) => {
            // Auto-play was prevented
            toast.error('Oops! Cannot find Audio. Please try later.')
            // console.error(err);
          })
      }
    }
  }

  // function for toggling play pause functionality of the YouTube video - on button click
  const handlePlayPauseYouTubeVideo = () => {
    // if youTube video is not started or it has ended or it is paused
    if (currentState === -1 || currentState === 0 || currentState === 2) {
      currentEvent?.playVideo()
      setIsYoutubeVideoPlaying(true)
    }
    // if youTube video is playing
    else if (currentState === 1) {
      currentEvent?.pauseVideo()
      setIsYoutubeVideoPlaying(false)
    }
  }

  // const handleOnChangeClipStartTimeHours = (e: any) => {
  //   setClipStartTimeHours(Number(e.target.value))
  //   if (e.target.value.length > 2) {
  //     setClipStartTimeHours(Number(e.target.value.substring(0, 2)))
  //   }
  // }
  // const handleOnChangeClipStartTimeMinutes = (e: any) => {
  //   setClipStartTimeMinutes(Number(e.target.value))
  //   if (e.target.value.length > 2) {
  //     setClipStartTimeMinutes(e.target.value.substring(0, 2));
  //   } else if (e.target.value.length === 2) {
  //     if (parseInt(e.target.value) >= 60) {
  //       setClipStartTimeMinutes(59);
  //     }
  //   }
  // }
  // const handleOnChangeClipStartTimeSeconds = (e: any) => {
  //   setClipStartTimeSeconds(Number(e.target.value))
  //   if (e.target.value.length > 2) {
  //     setClipStartTimeSeconds(Number(e.target.value.substring(0, 2)))
  //   } else if (e.target.value.length === 2) {
  //     if (parseInt(e.target.value) >= 60) {
  //       setClipStartTimeSeconds(59)
  //     }
  //   }
  // }

  // const handleOnChangeClipStartTimeMilliSeconds = (e: any) => {
  //   setClipStartTimeMilliSeconds(Number(e.target.value))
  //   if (e.target.value.length > 2) {
  //     setClipStartTimeMilliSeconds(Number(e.target.value.substring(0, 2)))
  //   } else if (e.target.value.length === 2) {
  //     if (parseInt(e.target.value) >= 60) {
  //       setClipStartTimeMilliSeconds(59)
  //     }
  //   }
  // }
  const handleBlurClipStartTimeMilliSeconds = (e: any) => {
    // store the current clipStartTimeHours in a temp variable,
    // so that when calculateClipStartTimeinSeconds without going into the loops,
    // it has the previous value in it
    let tempStartTimeMilliSeconds = clipStartTimeMilliSeconds
    if (e.target.value.length === 1) {
      setClipStartTimeMilliSeconds(Number(e.target.value + '0'))
      tempStartTimeMilliSeconds = Number(e.target.value + '0')
      if (parseInt(e.target.value + '0') >= 60) {
        setClipStartTimeMilliSeconds(59)
        tempStartTimeMilliSeconds = 59
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeMilliSeconds(0)
      tempStartTimeMilliSeconds = 0
    }
    // call the function which will update the clipStartTime in the parent component and the db is updated too.
    calculateClipStartTimeinSeconds(
      tempStartTimeMilliSeconds,
      clipStartTimeMinutes,
      clipStartTimeSeconds,
    )
  }
  const handleBlurClipStartTimeMinutes = (e: any) => {
    // store the current clipStartTimeMinutes in a temp variable,
    // so that when calculateClipStartTimeinSeconds without going into the loops,
    // it has the previous value in it
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
    // call the function which will update the clipStartTime in the parent component and the db is updated too.
    calculateClipStartTimeinSeconds(
      clipStartTimeMilliSeconds,
      tempStartTimeMinutes,
      clipStartTimeSeconds,
    )
  }
  const handleBlurClipStartTimeSeconds = (e: any) => {
    // store the current clipStartTimeSeconds in a temp variable,
    // so that when calculateClipStartTimeinSeconds without going into the loops,
    // it has the previous value in it
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
    // call the function which will update the clipStartTime in the parent component and the db is updated too.
    calculateClipStartTimeinSeconds(
      clipStartTimeMilliSeconds,
      clipStartTimeMinutes,
      tempStartTimeSeconds,
    )
  }

  const handleBlurClipStartTimeHours = (e: any) => {
    // Store the current clipStartTimeHours in a temp variable
    let tempStartTimeHours = clipStartTimeHours
    // Ensure the input value is within bounds
    if (e.target.value.length === 1) {
      setClipStartTimeHours(Number(e.target.value + '0'))
      tempStartTimeHours = Number(e.target.value + '0')
      if (parseInt(e.target.value + '0') >= 24) {
        setClipStartTimeHours(23)
        tempStartTimeHours = 23
      }
    } else if (e.target.value.length === 2) {
      // If the input is two digits, ensure it's within bounds
      const inputValue = parseInt(e.target.value, 10)
      if (inputValue >= 24) {
        setClipStartTimeHours(23)
        tempStartTimeHours = 23
      } else {
        setClipStartTimeHours(inputValue)
        tempStartTimeHours = inputValue
      }
    } else if (e.target.value.length === 0) {
      // If the input is empty, set it to 0
      setClipStartTimeHours(0)
      tempStartTimeHours = 0
    }
    const calculatedSeconds =
      +e.target.value * 3600 +
      +clipStartTimeMinutes * 60 +
      +clipStartTimeSeconds +
      +clipStartTimeMilliSeconds / 1000

    if (clipPlaybackType === 'inline') {
      if (calculatedSeconds + clipDuration <= videoLength) {
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error(
          'Audio Clip cannot be outside the timeline. Change it to extended and adjust the start time.',
        )
        handleClipStartTimeInputsRender()
      }
    }
    // extended clip
    else {
      // check if the updated start time is more than the videolength, if yes, throw error and retain the old state
      if (calculatedSeconds < videoLength) {
        // handleClipStartTimeUpdate is the prop function received from parent component - this runs an axios PUT call and updates the clipStartTime
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error(
          'Oops!! Start Time cannot be later than the video end time.',
        ) // show toast error message
        handleClipStartTimeInputsRender()
      }
    }
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

  const handleOnChangeClipStartTimeMilliSeconds = (e: any) => {
    setClipStartTimeMilliSeconds(Number(e.target.value))
  }

  const handleBlurClipStartTime = () => {
    const calculatedSeconds =
      clipStartTimeHours * 3600 +
      clipStartTimeMinutes * 60 +
      clipStartTimeSeconds +
      clipStartTimeMilliSeconds / 1000

    if (clipPlaybackType === 'inline') {
      if (calculatedSeconds + clipDuration <= videoLength) {
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error(
          'Audio Clip cannot be outside the timeline. Change it to extended and adjust the start time.',
        )
        handleClipStartTimeInputsRender()
      }
    } else {
      if (calculatedSeconds < videoLength) {
        handleClipStartTimeUpdate(calculatedSeconds)
      } else {
        toast.error(
          'Oops!! Start Time cannot be later than the video end time.',
        )
        handleClipStartTimeInputsRender()
      }
    }
  }

  // handle save clip description - axios call -> generate audio & update endtime, duration
  const saveClipDescription = (e: any) => {
    e.preventDefault()
    handleClickSaveClipDescription(clipDescriptionText)
    // // check if the clip has been updated
    // if (clipDescriptionText !== initialClipDescriptionText) {
    //   // show spinner
    //   setShowSpinner(true)
    //   axios
    //     .put(
    //       `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-description/${clipId}`,
    //       {
    //         userId: userId,
    //         youtubeVideoId: youtubeVideoId,
    //         clipDescriptionText: clipDescriptionText,
    //         clipDescriptionType: clipDescriptionType,
    //         audioDescriptionId: audioDescriptionId,
    //       },
    //     )
    //     .then((res) => {
    //       // below prop is used to re-render the parent component i.e. fetch audio clip data
    //       setUpdateData(!updateData)
    //       setShowSpinner(false) // stop showing spinner
    //       toast.success('Description Saved Successfully!!') // show toast message
    //     })
    //     .catch((err) => {
    //       // err.response.data.message has the message text send by the server
    //       toast.error(err.response.data.message) // show toast message
    //     })
    // }
  }

  // delete a clip
  const handleClickDeleteClip = (e: any) => {
    setShowSpinner(true)
    e.preventDefault()

    axios
      .delete(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/delete-clip/${clipId}`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            youtubeVideoId: youtubeVideoId,
          },
        },
      )
      .then((res) => {
        toast.success(
          'Clip Deleted Successfully!! Please wait while we fetch latest Clip Data',
        )
        fetchUserVideoData()
        setUndoDeletedClip(true)
        setNeedRefresh(true)
      })
      .catch((err) => {
        console.error(err)
        toast.error('Error Deleting Clip. Please try again later.')
      })
  }

  // handle record & replace
  const handleClickReplaceClip = async (e: any) => {
    setShowSpinner(true)
    e.preventDefault()

    // If currently TTS and user wants to record
    if (!isRecorded && mediaBlobUrl) {
      // Your existing recording replacement logic
      if (mediaBlobUrl === null) {
        toast.error(
          'Error while saving the recorded audio. Please record again.',
        )
        setShowSpinner(false)
        return
      } else {
        // create a new FormData object for easy file uploads
        const formData = new FormData()
        const audioBlob = await fetch(`${mediaBlobUrl}`).then((r) => r.blob()) // get blob from the audio URI
        const audioFile = new File([audioBlob], 'voice.mp3', {
          type: 'audio/mp3',
        })
        formData.append('clipDescriptionText', clipDescriptionText)
        formData.append('clipStartTime', String(clipStartTime))
        formData.append('newACType', clipDescriptionType)
        formData.append('youtubeVideoId', youtubeVideoId)
        formData.append('recordedClipDuration', String(recordedClipDuration))
        formData.append('audioDescriptionId', audioDescriptionId)
        formData.append('userId', userId)
        formData.append('file', audioFile)

        // upload formData using axios
        axios
          .put(
            `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/record-replace-clip-audio/${clipId}`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            },
          )
          .then((res) => {
            toast.success(
              'Replaced Clip Successfully with the Recorded Audio!!',
            )
            setTimeout(() => {
              setUpdateData(!updateData)
              setShowSpinner(false)
            }, 4000) // setting the timeout to show the toast message for 4 sec
          })
          .catch((err) => {
            // console.log(err)
            toast.error(
              'Error while replacing Audio Clip. Please try again later.',
            )
          })
      }
    } else if (isRecorded && clipDescriptionText) {
      // NEW: If currently recorded and user wants to switch to TTS
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/switch-to-tts/${clipId}`,
          {
            text: clipDescriptionText,
            userId: userId,
            youtubeVideoId: youtubeVideoId,
            audioDescriptionId: audioDescriptionId,
          },
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          },
        )

        toast.success('Switched to AI voice successfully!')
        setUpdateData(!updateData)
        setShowSpinner(false)
      } catch (err) {
        toast.error('Error switching to AI voice. Please try again.')
        setShowSpinner(false)
      }
    } else {
      toast.error('Cannot switch voice mode without text description')
      setShowSpinner(false)
    }
  }
  // handle Record Ready Set Go
  const handleReadySetGo = () => {
    const _321Go = ['3', '2', '1', 'Go', 'start']
    // using the concept of closures & IIFE in JavaScript
    _321Go.forEach((val, i) => {
      setTimeout(
        (function (i_local) {
          return function () {
            setReadySetGo(i_local)
          }
        })(val),
        1000 * i,
      )
    })
    // start recording once ready set go is completed
    setTimeout(() => {
      startRecording()
    }, 3700)
  }

  return (
    <div className="edit-component text-white" ref={ref} id={clipId}>
      <div className="d-flex justify-content-evenly align-items-center">
        {/* Clip Description & Start time Div */}
        <div className="description-section mt-1">
          <div className="d-flex justify-content-between align-items-start">
            {/* Description label, text area & buttons*/}
            <div className="d-flex justify-content-center align-items-start flex-column">
              <h6 className="text-white">
                Clip Description: {isRecorded ? '(Recorded)' : ''}
              </h6>
              <div className="description-text-container">
                <TextareaAutosize
                  className={`expand-textarea ${descriptionDisplay.className} ${
                    isPreview ? 'preview-textarea' : ''
                  }`}
                  value={descriptionDisplay.displayText}
                  onChange={(e) => {
                    // Only allow editing if it's not a placeholder
                    if (descriptionDisplay.canEdit) {
                      setClipDescriptionText(e.target.value)
                      setClipDescText(e.target.value)
                    }
                  }}
                  placeholder="Type your audio description here..."
                  disabled={!descriptionDisplay.canEdit || isPreview}
                  onFocus={() => {
                    if (descriptionDisplay.isPlaceholder) {
                      toast.info(
                        "To add text to this recording, use 'Convert to Text Mode' below",
                      )
                    }
                  }}
                />

                {/* Add helper text when appropriate */}
                {descriptionDisplay.helperText && (
                  <small className="form-text text-muted">
                    {descriptionDisplay.helperText}
                  </small>
                )}

                {/* Add option to switch to text mode for recordings */}
                {isRecorded && !clipDescriptionText && !isPreview && (
                  <Button
                    size="sm"
                    variant="link"
                    className="mt-2"
                    onClick={handleConvertToTextMode}
                  >
                    <i className="fa fa-keyboard" /> Convert to Text Mode
                  </Button>
                )}
              </div>
              {/* play, save & Delete buttons */}
              <div className="my-2 d-flex justify-content-evenly align-items-center w-100">
                <Button
                  className="btn rounded btn-sm text-white bg-danger ydx-button"
                  onClick={() => setIsDeleteModal(true)}
                  disabled={isPreview}
                >
                  <i className="fa fa-trash" /> {'  '} Delete
                </Button>
                <Button
                  type="button"
                  className="btn rounded btn-sm text-white save-desc-btn ydx-button"
                  onClick={saveClipDescription}
                  disabled={isPreview}
                >
                  <i className="fa fa-save" /> {'  '} Save
                </Button>
                {isAdAudioPlaying ? (
                  <button
                    type="button"
                    className="btn rounded btn-sm primary-btn-color text-white ydx-button"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Pause Audio"
                    onClick={handlePlayPauseAdAudio}
                  >
                    <i className="fa fa-pause" /> {'  '} Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn rounded btn-sm primary-btn-color text-white ydx-button"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="Play this Clip"
                    onClick={handlePlayPauseAdAudio}
                  >
                    <i className="fa fa-play" /> {'  '} Play
                  </button>
                )}
              </div>
            </div>
            {/* Start Time div */}
            <div className="mx-2 d-flex justify-content-between align-items-center flex-column">
              <h6 className="text-white">
                Start Time
                {/* TODO: We will need to handle three digit long minutes or videos longer than hour */}
              </h6>
              <div className="edit-time-div">
                <div className="text-dark text-center d-flex justify-content-evenly">
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    min="0"
                    value={padNumber(clipStartTimeHours)}
                    onChange={handleOnChangeClipStartTimeHours}
                    onBlur={handleBlurClipStartTimeHours}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  <div className="mx-1">:</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    min="0"
                    value={padNumber(clipStartTimeMinutes)}
                    onChange={handleOnChangeClipStartTimeMinutes}
                    onBlur={handleBlurClipStartTimeMinutes}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  <div className="mx-1">:</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    value={padNumber(clipStartTimeSeconds)}
                    onChange={handleOnChangeClipStartTimeSeconds}
                    onBlur={handleBlurClipStartTimeSeconds}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  <div className="mx-1">:</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    value={padNumber(clipStartTimeMilliSeconds)}
                    onChange={handleOnChangeClipStartTimeMilliSeconds}
                    onBlur={handleBlurClipStartTimeMilliSeconds}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  {/* <div className="mx-1">.</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark"
                    value={
                      clipStartTimeMilliSeconds < 10
                        ? `0` + clipStartTimeMilliSeconds
                        : clipStartTimeMilliSeconds
                    }
                    readOnly
                  /> */}
                </div>
              </div>
              <h6 className="text-white">
                End Time
                {/* TODO: We will need to handle three digit long minutes or videos longer than hour */}
              </h6>
              <div className="edit-time-div">
                <div className="text-dark text-center d-flex justify-content-evenly">
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    min="0"
                    value={padNumber(clipDurationHours)}
                    // onChange={handleOnChangeClipStartTimeMinutes}
                    // onBlur={handleBlurClipStartTimeMinutes}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  <div className="mx-1">:</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    min="0"
                    value={padNumber(clipDurationMinutes)}
                    // onChange={handleOnChangeClipStartTimeMinutes}
                    // onBlur={handleBlurClipStartTimeMinutes}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  <div className="mx-1">:</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    value={padNumber(clipDurationSeconds)}
                    // onChange={handleOnChangeClipStartTimeSeconds}
                    // onBlur={handleBlurClipStartTimeSeconds}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  <div className="mx-1">:</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark ydx-input"
                    value={padNumber(clipDurationMilliSeconds)}
                    // onChange={handleOnChangeClipStartTimeMilliSeconds}
                    // onBlur={handleBlurClipStartTimeMilliSeconds}
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-'].includes(evt.key) &&
                      evt.preventDefault()
                    }
                  />
                  {/* <div className="mx-1">.</div>
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark"
                    value={
                      clipStartTimeMilliSeconds < 10
                        ? `0` + clipStartTimeMilliSeconds
                        : clipStartTimeMilliSeconds
                    }
                    readOnly
                  /> */}
                </div>
              </div>
              {/* Clip Duration div */}
              <div>
                <h6 className="text-white text-center">
                  {/* Duration: {convertSecondsToCardFormat(clipDuration)} sec*/}
                  Duration: {clipDuration.toFixed(2)} sec
                </h6>
              </div>
            </div>
          </div>
        </div>
        {/* vertical divider line */}
        <div className="d-flex justify-content-between align-items-start">
          <div
            className="d-flex flex-column align-items-center"
            style={{
              visibility: isPreview ? 'hidden' : 'visible',
            }}
          >
            <h6>Or</h6>
            <div className="vertical-divider-div"></div>
          </div>
        </div>
        {/* Record & Replace Section */}
        <div
          style={{
            visibility: isPreview ? 'hidden' : 'visible',
          }}
        >
          <div className="audio-mode-header text-center mb-3">
            <div className="mode-indicator">
              <span className="mode-icon" style={{ fontSize: '2em' }}>
                {audioMode.icon}
              </span>
              <h6 className="text-white mb-1">{audioMode.title}</h6>
              <small className="text-muted">{audioMode.subtitle}</small>
            </div>

            {/* Visual mode indicator */}
            <div className="mode-badge-container mt-2">
              {audioMode.mode === 'recorded' && (
                <span className="badge bg-primary">Human Voice</span>
              )}
              {audioMode.mode === 'tts' && (
                <span className="badge bg-info">AI Voice</span>
              )}
              {audioMode.mode === 'empty' && (
                <span className="badge bg-secondary">No Audio Yet</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded text-dark d-flex justify-content-between align-items-center p-2 w-100 my-2">
            <div className="mx-1">
              {status === 'recording' && readySetGo !== '' ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Click to Stop Recording"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                  onClick={stopRecording} // default functions given by the react-media-recorder package
                >
                  <i className="fa fa-stop text-danger  fs-5 mt-1" />
                </button>
              ) : (readySetGo === '' && status !== 'recording') ||
                (readySetGo === 'start' && status === 'stopped') ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Click to Start Recording your voice"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                  onClick={handleReadySetGo} // default functions given by the react-media-recorder package
                >
                  <i className="fa fa-microphone text-danger fs-5 mt-1" />
                </button>
              ) : readySetGo !== 'start' ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Ready Set Go"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light ydx-button"
                >
                  <b className="fs-5 mt-1">{readySetGo}</b>
                </button>
              ) : (
                <></>
              )}
              {status === 'recording' && (
                <div className="mt-3">
                  {/* Add this teleprompter with enhanced visual indicator */}
                  <div className="teleprompter-container recording-active">
                    <div className="teleprompter-header">
                      <i className="fa fa-microphone text-danger me-2"></i>
                      <span>Read from this script while recording</span>
                    </div>
                    <div className="teleprompter-text-area">
                      <p className="teleprompter-text">{clipDescriptionText}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* No recording to Play */}
          </div>
          {/* NEW: Smart audio controls based on current mode */}
          <div className="audio-controls-section">
            {audioMode.mode === 'recorded' ? (
              // Controls when user has recorded audio (either fresh recording or existing)
              <div className="recorded-audio-controls">
                <div className="playback-section text-center mb-3">
                  {/* Show different buttons based on whether we have a fresh recording or saved recording */}
                  {mediaBlobUrl || clipAudioPath ? (
                    <Button
                      onClick={handlePlayPauseRecordedAudio}
                      className="btn btn-primary me-2"
                    >
                      {isRecordedAudioPlaying ? (
                        <>
                          <i className="fa fa-pause" /> Pause Recording
                        </>
                      ) : (
                        <>
                          <i className="fa fa-play" /> Listen to Recording
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="btn btn-primary me-2 disabled"
                      disabled
                      title="No recording available to play"
                    >
                      <i className="fa fa-play" /> No Recording
                    </Button>
                  )}

                  {/* Show duration information */}
                  <div className="text-white small">
                    Duration: {recordedClipDuration.toFixed(2)}s
                  </div>
                </div>

                <div className="action-buttons text-center">
                  {/* Re-record button - always available for recorded mode */}
                  <Button
                    onClick={() => {
                      // Clear any existing recording state and start fresh
                      setReadySetGo('ready')
                      toast.info('Get ready to re-record your voice')
                    }}
                    className="btn btn-warning me-2"
                  >
                    <i className="fa fa-microphone" /> Re-record
                  </Button>

                  {/* Switch to AI voice - only if we have text */}
                  <Button
                    onClick={() => {
                      if (
                        !clipDescriptionText ||
                        clipDescriptionText.trim() === ''
                      ) {
                        toast.error(
                          'Please add text before switching to AI voice',
                        )
                        return
                      }
                      setIsReplaceModal(true)
                    }}
                    className="btn btn-info"
                    disabled={
                      !clipDescriptionText || clipDescriptionText.trim() === ''
                    }
                    title={
                      !clipDescriptionText
                        ? 'Add text description first'
                        : 'Switch to AI voice using your text'
                    }
                  >
                    <i className="fa fa-robot" /> Switch to AI Voice
                  </Button>
                </div>
              </div>
            ) : audioMode.mode === 'tts' ? (
              // Controls when user has AI-generated audio
              <div className="tts-audio-controls">
                <div className="playback-section text-center mb-3">
                  <Button
                    onClick={handlePlayPauseAdAudio}
                    className="btn btn-primary me-2"
                  >
                    {isAdAudioPlaying ? (
                      <>
                        <i className="fa fa-pause" /> Pause AI Voice
                      </>
                    ) : (
                      <>
                        <i className="fa fa-play" /> Listen to AI Voice
                      </>
                    )}
                  </Button>

                  <div className="text-white small">
                    Generated from your text
                  </div>
                </div>

                <div className="action-buttons text-center">
                  {/* Regenerate AI voice */}
                  <Button
                    onClick={async () => {
                      if (
                        !clipDescriptionText ||
                        clipDescriptionText.trim() === ''
                      ) {
                        toast.error(
                          'Please enter text before regenerating AI voice',
                        )
                        return
                      }
                      // Call the existing save function which regenerates TTS
                      await handleClickSaveClipDescription(clipDescriptionText)
                    }}
                    className="btn btn-secondary me-2"
                    disabled={
                      !clipDescriptionText || clipDescriptionText.trim() === ''
                    }
                  >
                    <i className="fa fa-refresh" /> Regenerate AI Voice
                  </Button>

                  {/* Switch to recording */}
                  <Button
                    onClick={() => {
                      setReadySetGo('ready')
                      toast.info('Get ready to record your voice')
                    }}
                    className="btn btn-success"
                  >
                    <i className="fa fa-microphone" /> Use My Voice Instead
                  </Button>
                </div>
              </div>
            ) : (
              // No audio exists yet - guide user to create some
              <div className="no-audio-controls">
                <div className="text-center mb-3">
                  <p className="text-white">
                    Choose how to add audio to this scene:
                  </p>
                </div>

                <div className="action-buttons text-center">
                  <Button
                    onClick={() => {
                      // Focus on the text area to encourage typing first
                      const textarea = document.querySelector(
                        '.expand-textarea',
                      ) as HTMLTextAreaElement
                      if (textarea) {
                        textarea.focus()
                        toast.info(
                          'Type your description, then save to generate AI voice',
                        )
                      }
                    }}
                    className="btn btn-primary me-3"
                  >
                    <i className="fa fa-keyboard" /> Type & Generate AI Voice
                  </Button>

                  <Button
                    onClick={() => {
                      setReadySetGo('ready')
                      toast.info('Get ready to record your voice')
                    }}
                    className="btn btn-success"
                  >
                    <i className="fa fa-microphone" /> Record My Voice
                  </Button>
                </div>

                {/* Show disabled buttons to maintain layout */}
                <div className="mt-3 text-center">
                  <Button className="btn btn-outline-secondary me-2" disabled>
                    <i className="fa fa-play" /> Listen (No audio yet)
                  </Button>
                  <Button className="btn btn-outline-secondary" disabled>
                    <i className="fa fa-exchange" /> Replace (No audio yet)
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            Recording Duration: {recordedClipDuration.toFixed(2)} sec
          </div>
          <div className="d-flex justify-content-center align-items-center rounded mx-auto p-1">
            {isYoutubeVideoPlaying ? (
              <button
                type="button"
                className="btn rounded btn-sm text-white primary-btn-color ydx-button"
                data-bs-toggle="tooltip"
                data-bs-placement="bottom"
                title="YouTube Video plays/pauses along with the Audio Clip"
                onClick={handlePlayPauseYouTubeVideo}
              >
                <i className="fa fa-pause play-pause-icons" />
                {'  '} Pause Video with AD
              </button>
            ) : (
              <button
                type="button"
                className="btn rounded btn-sm text-white primary-btn-color ydx-button"
                data-bs-toggle="tooltip"
                data-bs-placement="bottom"
                title="YouTube Video plays/pauses along with the Audio Clips"
                onClick={handlePlayPauseYouTubeVideo}
              >
                <i className="fa fa-play play-pause-icons" />
                {'  '} Play Video with Description
              </button>
            )}
          </div>
        </div>
      </div>

      {/* <!-- Replace Modal --> Confirmation Modal - opens when user hits Replace and asks for a confirmation if AI's audio is to be replaced with the user recorded audio*/}
      {
        <ModalComponent
          id="replaceModal"
          title={
            isRecorded ? 'Switch to AI Voice?' : 'Replace with Your Recording?'
          }
          text={
            isRecorded
              ? 'This will generate an AI voice from your text description. Your recording will be replaced.'
              : 'This will replace the AI voice with your new recording. The text will be preserved.'
          }
          modalTask={(e: any) => handleClickReplaceClip(e)}
          show={isReplaceModal}
          handleClose={() => setIsReplaceModal(false)}
        />
      }
      {/* <!-- Delete Modal --> Confirmation Modal - opens when user hits Delete and asks for a confirmation if Audio Clip need to be deleted*/}
      {
        <ModalComponent
          id="deleteModal"
          title="Delete"
          text={'Are you sure you want to delete the Audio Clip?'}
          modalTask={(e: any) => handleClickDeleteClip(e)}
          show={isDeleteModal}
          handleClose={() => setIsDeleteModal(false)}
        />
      }
    </div>
  )
}

export default EditClip
