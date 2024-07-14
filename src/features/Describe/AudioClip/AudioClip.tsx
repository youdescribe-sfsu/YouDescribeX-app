import React, { useState, useEffect } from 'react'
import '@/assets/css/audioDesc.css'
import Draggable from 'react-draggable'
import EditClip from '../EditClip/EditClip'
import convertSecondsToCardFormat from '../../../shared/utils/convertSecondsToCardFormat'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Clip } from '../../../shared/utils/convertClipObject'
import { YouTubePlayer } from 'youtube-player/dist/types'

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
  // all audio clip data from props
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
  const [clipDescriptionText, setClipDescriptionText] = useState(
    clip.description_text,
  )
  // React State Variables
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [clipPlaybackType, setClipPlayBackType] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [clipTitle, setClipTitle] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [clipStartTime, setClipStartTime] = useState(0)

  // toggle variable to show or hide the edit component.
  const [showEditComponent, setShowEditComponent] = useState(false)
  const [adDraggableWidth, setAdDraggableWidth] = useState(0.0)
  const [adDraggablePosition, setAdDraggablePosition] = useState({
    x: 0,
    y: 0,
  })

  useEffect(() => {
    setClipPlayBackType(initialClipPlaybackType)
    setClipTitle(initialClipTitle ?? '')
    // logic to show/hide the edit component based on props.
    // this hides one edit component when the other is opened
    editComponentToggleList.forEach((item) => {
      if (item.clipId === clipID) {
        item.showEditComponent
          ? setShowEditComponent(true)
          : setShowEditComponent(false)
      }
    })
    //  update the clip start time based on the value from the props
    setClipStartTime(initialClipStartTime)
    // set draggable position & width
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

  // Dialog Timeline Draggable Functions
  const stopADBar = (event: any, position: any) => {
    const adBarTime = position.x / unitLength
    const newClipStartTime = Number(parseFloat(`${adBarTime}`).toFixed(2))
    // set left and right bounds
    if (Number(newClipStartTime) >= 1 && newClipStartTime < videoLength) {
      if (clipPlaybackType === 'inline') {
        // calculate the duration too for inline clips
        if (newClipStartTime + clipDuration <= videoLength) {
          updateStartTimeNDraggablePosition(newClipStartTime)
        } else {
          toast.error(
            'Audio Clip cannot be outside the timeline. Change it to extended and adjust the start time.',
          )
        }
      }
      // extended clip
      else {
        if (newClipStartTime < videoLength) {
          updateStartTimeNDraggablePosition(newClipStartTime)
        }
      }
    } else {
      toast.error(
        'Audio Clip is bounded to the timeline. Please try adjusting the start time..',
      )
    }
  }

  // Handle Nudge icons -> add/remove 1 second to start_time
  const handleLeftNudgeClick = (e: any) => {
    const newClipStartTime = (
      parseFloat(`${initialClipStartTime}`) - 0.25
    ).toFixed(2)
    // so that the audio block isn't out of the timeline
    if (Number(newClipStartTime) >= 1) {
      updateStartTimeNDraggablePosition(newClipStartTime)
    }
  }
  const handleRightNudgeClick = (e: any) => {
    const newClipStartTime = Number(
      (parseFloat(`${initialClipStartTime}`) + 0.25).toFixed(2),
    )
    // so that the audio block isn't out of the timeline
    if (clipPlaybackType === 'inline') {
      if (newClipStartTime + clipDuration <= videoLength) {
        updateStartTimeNDraggablePosition(newClipStartTime)
      } else {
        toast.error(
          'Audio Clip cannot be outside the timeline. Change it to extended and adjust the start time.',
        )
      }
    }
    // extended clip
    else {
      if (newClipStartTime < videoLength) {
        updateStartTimeNDraggablePosition(newClipStartTime)
      }
    }
  }

  const updateStartTimeNDraggablePosition = (newClipStartTime: any) => {
    setClipStartTime(newClipStartTime)
    // Also update the draggable div position based on start time
    setAdDraggablePosition({ x: newClipStartTime * unitLength, y: 0 })
    handleClipStartTimeUpdate(newClipStartTime)
  }

  // handle put (update) requests
  // handle update of start time from handleLeftNudgeClick, handleRightNudgeClick, stopADBar
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
        // below prop is used to re-render the parent component i.e. fetch audio clip data
        setUpdateData(!updateData)
      })
      .catch((err) => {
        console.error(err)
      })
  }

  // update clip title

  // update clip playback type - inline/extended
  const handlePlaybackTypeUpdate = (e: any) => {
    // check if user is trying to change the clip Playback type to inline at the end of the timeline
    if (
      clipPlaybackType === 'extended' &&
      e.target.value === 'inline' &&
      parseFloat(`${initialClipStartTime}`) + clipDuration > videoLength
    ) {
      // if yes, throw an error message
      toast.error(
        'Audio Clip cannot be changed to Inline as it is bounded to the timeline. Please try adjusting the start time first.',
      )
    } else {
      setClipPlayBackType(e.target.value)
      axios
        .put(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-playback-type/${clipID}`,
          {
            clipPlaybackType: e.target.value,
          },
        )
        .then((res) => {
          setUpdateData(!updateData)
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }

  // const handleClickSaveClipDescription = (updatedClipDescriptionText:string) => {
  //   // check if the clip has been updated
  //   if (updatedClipDescriptionText !== clipDescriptionText) {
  //     // show spinner
  //     setShowSpinner(true)
  //     axios
  //       .put(
  //         `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-description/${clipID}`,
  //         {
  //           userId: userId,
  //           youtubeVideoId: youtubeVideoId,
  //           clipDescriptionText: updatedClipDescriptionText,
  //           clipDescriptionType: clipDescriptionType,
  //           audioDescriptionId: audioDescriptionId,
  //         },
  //       )
  //       .then((res) => {
  //         // below prop is used to re-render the parent component i.e. fetch audio clip data
  //         setUpdateData(!updateData)
  //         setShowSpinner(false) // stop showing spinner
  //         toast.success('Description Saved Successfully!!') // show toast message
  //       })
  //       .catch((err) => {
  //         // err.response.data.message has the message text send by the server
  //         toast.error(err.response.data.message) // show toast message
  //       })
  //   }

  //   if(clipTitle === '' || clipTitle === null || clipTitle === initialClipTitle){
  //     toast.error('Please enter a valid title')
  //     return
  //   }

  //   else{
  //     axios
  //     .put(
  //       `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-title/${clipID}`,
  //       {
  //         adTitle: clipTitle,
  //       },
  //     )
  //     .then((res) => {
  //       // for simple text field update, the update Data is causing loading of the page.
  //       // so for each char update in the title, the spinner displays - Very bad UX
  //       // hence commenting below. Data is updated anyhow
  //       // setUpdateData(!updateData);
  //     })
  //     .catch((err) => {
  //       console.error(err.response.data)
  //       toast.error('Error updating Title. Please try again!!')
  //     })
  //   }
  // }

  const handleClickSaveClipDescription = async (
    updatedClipDescriptionText: string,
  ) => {
    try {
      // check if the clip has been updated
      if (updatedClipDescriptionText !== initialclipDescriptionText) {
        // show spinner
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

        // below prop is used to re-render the parent component i.e. fetch audio clip data
        setUpdateData(!updateData)
        toast.success('Description Saved Successfully!!') // show toast message
      }

      if (clipTitle === '' || clipTitle === null) {
        toast.error('Please enter a valid title')
        setShowSpinner(false) // stop showing spinner
        return
      } else if (clipTitle !== initialClipTitle) {
        await axios.put(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/update-clip-title/${clipID}`,
          {
            adTitle: clipTitle,
          },
        )

        // for simple text field update, the update Data is causing loading of the page.
        // so for each char update in the title, the spinner displays - Very bad UX
        // hence commenting below. Data is updated anyhow
        // setUpdateData(!updateData);
      }
    } catch (err: any) {
      if (err.response) {
        // err.response.data.message has the message text sent by the server
        toast.error(err.response.data.message) // show toast message
      } else {
        console.error(err)
        toast.error('An error occurred. Please try again!!')
      }
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
    <React.Fragment>
      {/* React Fragments allow you to wrap or group multiple elements without adding an extra node to the DOM. */}
      <div id={`audio-clip-card-${clipID}`}>
        <div className="text-white component mt-2 rounded">
          <div className="row align-items-center">
            <div className="col-2" style={{ width: divWidths.divRef1 }}>
              <div className="mx-1 text-center">
                <p
                  className="ad-title"
                  // props from YDXHome to play YoutubeVideo from current Audio Clip
                  onClick={(e) => handlePlayAudioClip(initialClipStartTime)}
                >
                  Audio Clip {clipSequenceNumber}:
                </p>
                <input
                  type="text"
                  className="form-control form-control-sm ad-title-input text-center"
                  placeholder="Title goes here.."
                  disabled={!showEditComponent}
                  value={clipTitle}
                  onChange={(e) => setClipTitle(e.target.value)}
                />
                <h6 className="mt-1 text-white">
                  <b>Type: </b>
                  {clipDescriptionType?.charAt(0).toUpperCase() ??
                    '' + clipDescriptionType?.slice(1)}{' '}
                  {/* <b>End: </b>
                {clip_end_time} */}
                </h6>
              </div>
            </div>
            <div
              className="col-1 text-center component-column-width-2"
              style={{ width: divWidths.divRef2, marginBottom: '36px' }}
            >
              <small className="text-white">Nudge</small>
              <div
                className="nudge-btns-div d-flex justify-content-around align-items-center"
                data-bs-toggle="tooltip"
                data-bs-placement="bottom"
                title="Nudge the audio block (0.25s)"
              >
                <i
                  className="fa fa-chevron-left p-2 nudge-icons"
                  onClick={handleLeftNudgeClick}
                />
                <i
                  className="fa fa-chevron-right p-2 nudge-icons"
                  onClick={handleRightNudgeClick}
                />
              </div>
            </div>
            <div className="col-7" style={{ width: divWidths.divRef3 }}>
              <div className="row mx-1 component-timeline-div">
                <div
                  id="ad-draggable-div"
                  className="ad-draggable-div"
                  style={{ width: divWidths.divRef4 }}
                >
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
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        title={convertSecondsToCardFormat(initialClipStartTime)}
                        style={{
                          width: adDraggableWidth,
                          height: '20px',
                          backgroundColor: 'var(--inline-color)',
                        }}
                      ></div>
                    ) : (
                      <div
                        className="ad-timestamp-div"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        title={convertSecondsToCardFormat(initialClipStartTime)}
                        style={{
                          width: '2px',
                          height: '20px',
                          backgroundColor: 'var(--extended-color)',
                        }}
                      ></div>
                    )}
                  </Draggable>
                </div>
              </div>
              <div className="mx-5 mt-2">
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`${clipSequenceNumber}`}
                    id="radio1"
                    value="inline"
                    checked={clipPlaybackType === 'inline' ? true : false}
                    onChange={handlePlaybackTypeUpdate}
                  />
                  <div className="inline-bg text-dark inline-extended-radio px-2">
                    <label className="inline-extended-label">Inline</label>
                  </div>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`${clipSequenceNumber}`}
                    id="radio2"
                    value="extended"
                    checked={clipPlaybackType === 'extended' ? true : false}
                    onChange={handlePlaybackTypeUpdate}
                  />
                  <div className="extended-bg text-white inline-extended-radio px-2">
                    <label className="inline-extended-label">Extended</label>
                  </div>
                </div>
              </div>
            </div>
            {/* toggle the chevron to show or hide the edit Clip component */}
            <div className="col-1" style={{ width: 60 }}>
              {showEditComponent ? (
                <i
                  className="fa fa-chevron-up"
                  // show Edit Component
                  onClick={() => setEditComponentToggleFunc(clipID, false)}
                />
              ) : (
                <i
                  className="fa fa-chevron-down"
                  // show Edit Component
                  onClick={() => setEditComponentToggleFunc(clipID, true)}
                />
              )}
            </div>
          </div>
        </div>
        {/* Based on the state of the showEditComponent variable, the edit component will be displayed*/}
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
    </React.Fragment>
  )
}
export default AudioClip
