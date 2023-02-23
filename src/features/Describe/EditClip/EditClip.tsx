import React, { useState, useEffect, useRef } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import styles from '@/assets/css/audioDesc.module.css'
import axios from 'axios'
import { toast } from 'react-toastify' // for toast messages
import TextareaAutosize from 'react-textarea-autosize'
import ModalComponent from '../../../shared/components/Modal/Modal'
import Button from 'react-bootstrap/Button'
import { YouTubePlayer } from 'youtube-player/dist/types'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'

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
    // setClipDescriptionText(initialClipDescriptionText);
    // set the button text & state based on YouTube Player's currentState
    setIsYoutubeVideoPlaying(
      currentState === -1 || currentState === 0 || currentState === 2
        ? false
        : currentState === 1
        ? true
        : false,
    )
    // scrolls to the latest clip when a new clip is added
    const date = new Date()
    const TEN_SEC = 10 * 1000
    if (date.getTime() - new Date(clipCreatedAt).getTime() <= TEN_SEC) {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    }

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

  // lot of if else conditions to ensure correct input in the start time number fields.
  // const handleOnChangeClipStartTimeHours = (e: any) => {
  //   setClipStartTimeHours(e.target.value);
  //   if (e.target.value.length > 2) {
  //     setClipStartTimeHours(e.target.value.substring(0, 2));
  //   }
  // };
  const handleOnChangeClipStartTimeMinutes = (e: any) => {
    setClipStartTimeMinutes(e.target.value)
    // if (e.target.value.length > 2) {
    //   setClipStartTimeMinutes(e.target.value.substring(0, 2));
    // } else if (e.target.value.length === 2) {
    //   if (parseInt(e.target.value) >= 60) {
    //     setClipStartTimeMinutes('59');
    //   }
    // }
  }
  const handleOnChangeClipStartTimeSeconds = (e: any) => {
    setClipStartTimeSeconds(e.target.value)
    if (e.target.value.length > 2) {
      setClipStartTimeSeconds(e.target.value.substring(0, 2))
    } else if (e.target.value.length === 2) {
      if (parseInt(e.target.value) >= 60) {
        setClipStartTimeSeconds(59)
      }
    }
  }

  const handleOnChangeClipStartTimeMilliSeconds = (e: any) => {
    setClipStartTimeMilliSeconds(e.target.value)
    if (e.target.value.length > 2) {
      setClipStartTimeMilliSeconds(e.target.value.substring(0, 2))
    } else if (e.target.value.length === 2) {
      if (parseInt(e.target.value) >= 60) {
        setClipStartTimeMilliSeconds(59)
      }
    }
  }
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

  // handle save clip description - axios call -> generate audio & update endtime, duration
  const handleClickSaveClipDescription = (e: any) => {
    e.preventDefault()
    // check if the clip has been updated
    if (clipDescriptionText !== initialClipDescriptionText) {
      // show spinner
      setShowSpinner(true)
      axios
        .put(`/api/audio-clips/update-clip-description/${clipId}`, {
          userId: userId,
          youtubeVideoId: youtubeVideoId,
          clipDescriptionText: clipDescriptionText,
          clipDescriptionType: clipDescriptionType,
          audioDescriptionId: audioDescriptionId,
        })
        .then((res) => {
          // below prop is used to re-render the parent component i.e. fetch audio clip data
          setUpdateData(!updateData)
          setShowSpinner(false) // stop showing spinner
          toast.success('Description Saved Successfully!!') // show toast message
        })
        .catch((err) => {
          // err.response.data.message has the message text send by the server
          toast.error(err.response.data.message) // show toast message
        })
    }
  }

  // delete a clip
  const handleClickDeleteClip = (e: any) => {
    setShowSpinner(true)
    e.preventDefault()
    console.log(clipId)
    axios
      .delete(`/api/audio-clips/delete-clip/${clipId}`)
      .then((res) => {
        toast.success(
          'Clip Deleted Successfully!! Please wait while we fetch latest Clip Data',
        )
        fetchUserVideoData()
        setNeedRefresh(true)
        // setTimeout(() => {
        //   window.location.reload(); // force reload the page to pull the new audio clip on to the page - Any other efficient way??
        // }, 3000); // setting the timeout to show the toast message for 4 sec
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
    if (mediaBlobUrl === null) {
      toast.error('Error while saving the recorded audio. Please record again.')
      setShowSpinner(false)
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
        .put(`/api/audio-clips/record-replace-clip-audio/${clipId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => {
          toast.success('Replaced Clip Successfully with the Recorded Audio!!')
          setTimeout(() => {
            setUpdateData(!updateData)
            setShowSpinner(false)
          }, 4000) // setting the timeout to show the toast message for 4 sec
        })
        .catch((err) => {
          console.log(err)
          toast.error(
            'Error while replacing Audio Clip. Please try again later.',
          )
        })
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
              <TextareaAutosize
                className="form-control form-control-sm border rounded text-center description-textarea"
                id="description"
                name="description"
                value={clipDescriptionText}
                onChange={(e) => setClipDescriptionText(e.target.value)}
              ></TextareaAutosize>
              {/* play, save & Delete buttons */}
              <div className="my-2 d-flex justify-content-evenly align-items-center w-100">
                <Button
                  className="btn rounded btn-sm text-white bg-danger"
                  onClick={() => setIsDeleteModal(true)}
                >
                  <i className="fa fa-trash" /> {'  '} Delete
                </Button>
                <Button
                  type="button"
                  className="btn rounded btn-sm text-white save-desc-btn"
                  onClick={handleClickSaveClipDescription}
                >
                  <i className="fa fa-save" /> {'  '} Save
                </Button>
                {isAdAudioPlaying ? (
                  <button
                    type="button"
                    className="btn rounded btn-sm primary-btn-color text-white"
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
                    className="btn rounded btn-sm primary-btn-color text-white"
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
                    className="text-white bg-dark"
                    min="0"
                    value={clipStartTimeMinutes}
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
                    className="text-white bg-dark"
                    value={clipStartTimeSeconds}
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
                    className="text-white bg-dark"
                    value={clipStartTimeMilliSeconds}
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
                    className="text-white bg-dark"
                    min="0"
                    value={clipDurationMinutes}
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
                    className="text-white bg-dark"
                    value={clipDurationSeconds}
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
                    className="text-white bg-dark"
                    value={clipDurationMilliSeconds}
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
          <div className="d-flex flex-column align-items-center">
            <h6>Or</h6>
            <div className="vertical-divider-div"></div>
          </div>
        </div>
        {/* Record & Replace Section */}
        <div>
          <h6 className="text-white text-center">
            Record & Replace AI&apos;s voice
          </h6>
          <div className="bg-white rounded text-dark d-flex justify-content-between align-items-center p-2 w-100 my-2">
            <div className="mx-1">
              {status === 'recording' && readySetGo !== '' ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Click to Stop Recording"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light"
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
                  className="btn rounded btn-sm mx-auto border border-warning bg-light"
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
                  className="btn rounded btn-sm mx-auto border border-warning bg-light"
                >
                  <b className="fs-5 mt-1">{readySetGo}</b>
                </button>
              ) : (
                <></>
              )}
            </div>
            {/* No recording to Play */}
            {mediaBlobUrl === null ? (
              <>
                {/* Disabled buttons */}
                <div
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="No recording to Play"
                >
                  <button
                    type="button"
                    className="btn rounded btn-sm text-white primary-btn-color disabled-btn mx-3"
                  >
                    Listen
                  </button>
                </div>
                <div
                  data-bs-toggle="toggle"
                  data-bs-placement="bottom"
                  title="No recording to Replace"
                >
                  <Button
                    className="btn rounded btn-sm text-white primary-btn-color disabled-btn"
                    disabled
                  >
                    Replace
                  </Button>
                </div>
              </>
            ) : isRecordedAudioPlaying ? ( //Listen to your recording
              <>
                <button
                  type="button"
                  className="btn rounded btn-sm text-white primary-btn-color mx-3"
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Listen to your recording"
                  onClick={handlePlayPauseRecordedAudio} // toggle function for play / pause
                >
                  Pause/Stop
                </button>
                <div
                  data-bs-toggle="toggle"
                  data-bs-placement="bottom"
                  title="Replace the AI's Voice with your Voice"
                >
                  <Button
                    className="btn rounded btn-sm text-white primary-btn-color"
                    onClick={() => setIsReplaceModal(true)}
                  >
                    Replace
                  </Button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn rounded btn-sm text-white primary-btn-color mx-3"
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Listen to your recording"
                  onClick={handlePlayPauseRecordedAudio} // toggle function for play / pause
                >
                  Listen
                </button>
                <div
                  data-bs-toggle="toggle"
                  data-bs-placement="bottom"
                  title="Replace the AI's Voice with your Voice"
                >
                  <Button
                    className="btn rounded btn-sm text-white primary-btn-color"
                    onClick={() => setIsReplaceModal(true)}
                  >
                    Replace
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="text-center">
            Recording Duration: {recordedClipDuration.toFixed(2)} sec
          </div>
          <div className="d-flex justify-content-center align-items-center rounded mx-auto p-1">
            {isYoutubeVideoPlaying ? (
              <button
                type="button"
                className="btn rounded btn-sm text-white primary-btn-color"
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
                className="btn rounded btn-sm text-white primary-btn-color"
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
          title="Replace"
          text="Are you sure you want to replace AI's voice with the one you recorded?"
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
