import React, { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import convertSecondsToCardFormat from '../helperFunctions/convertSecondsToCardFormat';
import '../assets/css/editAudioDesc.css';
import axios from 'axios';
import { toast } from 'react-toastify'; // for toast messages
import Modal from '../modules/Modal';

const EditClipComponent = (props) => {
  const ref = useRef();
  // destructuring props
  //props of URL Params
  const userId = props.userId;
  const youtubeVideoId = props.youtubeVideoId;
  // props of the video
  const currentTime = props.currentTime;
  const currentState = props.currentState;
  const currentEvent = props.currentEvent;
  const videoLength = props.videoLength;
  const handleClipStartTimeUpdate = props.handleClipStartTimeUpdate;

  // props - state for updating and fetching data in YDXHome.js (child to parent component)
  const updateData = props.updateData;
  const setUpdateData = props.setUpdateData;

  const clip_id = props.clip_id;
  const clip_description_text = props.clip_description_text;
  const clip_description_type = props.clip_description_type;
  const clip_playback_type = props.clip_playback_type;
  const props_clip_start_time = props.clip_start_time;
  const clip_duration = props.clip_duration;
  const is_recorded = props.is_recorded;
  const clip_audio_path = props.clip_audio_path;
  const clip_created_at = props.clip_created_at;

  // use 3 state variables to hold the value of 3 input type number fields
  const [clipStartTimeHours, setClipStartTimeHours] = useState(0.0);
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0.0);
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0.0);
  // const [clipStartTimeMilliSeconds, setClipStartTimeMilliSeconds] =
  //   useState(0.0);

  // variable and function declaration of the react-media-recorder package
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true }); // using only the audio recorder here
  // this state variable keeps track of the play/pause state of the recorded audio
  const [isRecordedAudioPlaying, setIsRecordedAudioPlaying] = useState(false);
  // this state variable is updated whenever mediaBlobUrl is updated. i.e. whenever a new recording is created
  const [recordedAudio, setRecordedAudio] = useState('');
  const [adAudio, setAdAudio] = useState('');
  const [isAdAudioPlaying, setIsAdAudioPlaying] = useState(false);
  const [isYoutubeVideoPlaying, setIsYoutubeVideoPlaying] = useState(false);

  // initialize state variables from props
  const [clipDescriptionText, setClipDescriptionText] = useState(
    clip_description_text
  );

  const [recordedClipDuration, setRecordedClipDuration] = useState(0.0);

  const [readySetGo, setReadySetGo] = useState('');

  useEffect(() => {
    // setClipDescriptionText(clip_description_text);
    // set the button text & state based on YouTube Player's currentState
    setIsYoutubeVideoPlaying(
      currentState === -1 || currentState === 0 || currentState === 2
        ? false
        : currentState === 1
        ? true
        : false
    );
    // scrolls to the latest clip when a new clip is added
    var date = new Date();
    var TEN_SEC = 10 * 1000;
    if (date - new Date(clip_created_at) <= TEN_SEC) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }

    // following statements execute whenever mediaBlobUrl is updated.. used it in the dependency array
    if (mediaBlobUrl !== null) {
      setRecordedAudio(new Audio(mediaBlobUrl));
      const aud = new Audio(mediaBlobUrl);
      // set audio duration if recorded
      aud.addEventListener(
        'loadedmetadata',
        function () {
          if (aud.duration === Infinity) {
            // set it to bigger than the actual duration
            aud.currentTime = 1e101;
            aud.ontimeupdate = function () {
              this.ontimeupdate = () => {
                return;
              };
              setRecordedClipDuration(aud.duration);
              aud.currentTime = 0;
            };
          } else {
            setRecordedClipDuration(aud.duration);
          }
        },
        false
      );
    }
    setAdAudio(new Audio(clip_audio_path));
    // render the start time input fields based on the updated prop value - props_clip_start_time
    handleClipStartTimeInputsRender();
  }, [
    mediaBlobUrl,
    props, // re-render whenever the props change
  ]);

  // render the values in the input[type='number'] fields of the start time - renders everytime the props_clip_start_time value changes
  const handleClipStartTimeInputsRender = () => {
    setClipStartTimeHours(
      convertSecondsToCardFormat(props_clip_start_time).split(':')[0]
    );
    setClipStartTimeMinutes(
      convertSecondsToCardFormat(props_clip_start_time).split(':')[1]
    );
    setClipStartTimeSeconds(
      convertSecondsToCardFormat(props_clip_start_time).split(':')[2]
    );
    // setClipStartTimeMilliSeconds(
    //   Math.floor(
    //     (props_clip_start_time - Math.floor(props_clip_start_time)) * 100
    //   )
    // );
  };

  // calculate the Start Time in seconds from the Hours, Minutes & Seconds passed from handleBlur functions
  const calculateClipStartTimeinSeconds = (hours, minutes, seconds) => {
    let calculatedSeconds = +hours * 60 * 60 + +minutes * 60 + +seconds;
    // restrict the audio block to the timeline
    if (clip_playback_type === 'inline') {
      if (
        parseFloat(calculatedSeconds) + parseFloat(clip_duration) <=
        videoLength
      ) {
        handleClipStartTimeUpdate(calculatedSeconds);
      } else {
        toast.error(
          'Audio Clip cannot be outside the timeline. Change it to extended and adjust the start time.'
        );
        handleClipStartTimeInputsRender();
      }
    }
    // extended clip
    else {
      // check if the updated start time is more than the videolength, if yes, throw error and retain the old state
      if (calculatedSeconds < videoLength) {
        // handleClipStartTimeUpdate is the prop function received from parent component - this runs an axios PUT call and updates the clipStartTime
        handleClipStartTimeUpdate(calculatedSeconds);
      } else {
        toast.error(
          'Oops!! Start Time cannot be later than the video end time.'
        ); // show toast error message
        handleClipStartTimeInputsRender();
      }
    }
  };

  // function for toggling play pause functionality of the recorded audio - on button click
  const handlePlayPauseRecordedAudio = () => {
    if (isRecordedAudioPlaying) {
      recordedAudio.pause();
      setIsRecordedAudioPlaying(false);
    } else {
      recordedAudio.play();
      setIsRecordedAudioPlaying(true);
      // this is for setting setIsRecordedAudioPlaying variable to false, once the playback is completed.
      recordedAudio.addEventListener('ended', function () {
        setIsRecordedAudioPlaying(false);
      });
    }
  };

  // function for toggling play pause functionality of audio Clip - on button click
  const handlePlayPauseAdAudio = () => {
    if (isAdAudioPlaying) {
      adAudio.pause();
      setIsAdAudioPlaying(false);
    } else {
      let audioProm = adAudio.play();
      // handle exceptions in playing audio - like having the wrong url in the audiopath
      if (audioProm !== undefined) {
        audioProm
          .then(() => {
            // Automatic playback started!
            setIsAdAudioPlaying(true);
            // this is for setting setIsAdAudioPlaying variable to false, once the playback is completed.
            adAudio.addEventListener('ended', function () {
              setIsAdAudioPlaying(false);
            });
          })
          .catch((err) => {
            // Auto-play was prevented
            toast.error('Oops! Cannot find Audio. Please try later.');
            // console.error(err);
          });
      }
    }
  };

  // function for toggling play pause functionality of the YouTube video - on button click
  const handlePlayPauseYouTubeVideo = () => {
    // if youTube video is not started or it has ended or it is paused
    if (currentState === -1 || currentState === 0 || currentState === 2) {
      currentEvent.playVideo();
      setIsYoutubeVideoPlaying(true);
    }
    // if youTube video is playing
    else if (currentState === 1) {
      currentEvent.pauseVideo();
      setIsYoutubeVideoPlaying(false);
    }
  };

  // lot of if else conditions to ensure correct input in the start time number fields.
  const handleOnChangeClipStartTimeHours = (e) => {
    setClipStartTimeHours(e.target.value);
    if (e.target.value.length > 2) {
      setClipStartTimeHours(e.target.value.substring(0, 2));
    }
  };
  const handleOnChangeClipStartTimeMinutes = (e) => {
    setClipStartTimeMinutes(e.target.value);
    if (e.target.value.length > 2) {
      setClipStartTimeMinutes(e.target.value.substring(0, 2));
    } else if (e.target.value.length === 2) {
      if (parseInt(e.target.value) >= 60) {
        setClipStartTimeMinutes('59');
      }
    }
  };
  const handleOnChangeClipStartTimeSeconds = (e) => {
    setClipStartTimeSeconds(e.target.value);
    if (e.target.value.length > 2) {
      setClipStartTimeSeconds(e.target.value.substring(0, 2));
    } else if (e.target.value.length === 2) {
      if (parseInt(e.target.value) >= 60) {
        setClipStartTimeSeconds('59');
      }
    }
  };
  const handleBlurClipStartTimeHours = (e) => {
    // store the current clipStartTimeHours in a temp variable,
    // so that when calculateClipStartTimeinSeconds without going into the loops,
    // it has the previous value in it
    let tempStartTimeHours = clipStartTimeHours;
    if (e.target.value.length === 1) {
      setClipStartTimeHours(e.target.value + '0');
      tempStartTimeHours = e.target.value + '0';
      if (parseInt(e.target.value + '0') >= 60) {
        setClipStartTimeHours('59');
        tempStartTimeHours = '59';
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeHours('00');
      tempStartTimeHours = '00';
    }
    // call the function which will update the clipStartTime in the parent component and the db is updated too.
    calculateClipStartTimeinSeconds(
      tempStartTimeHours,
      clipStartTimeMinutes,
      clipStartTimeSeconds
    );
  };
  const handleBlurClipStartTimeMinutes = (e) => {
    // store the current clipStartTimeMinutes in a temp variable,
    // so that when calculateClipStartTimeinSeconds without going into the loops,
    // it has the previous value in it
    let tempStartTimeMinutes = clipStartTimeMinutes;
    if (e.target.value.length === 1) {
      setClipStartTimeMinutes(e.target.value + '0');
      tempStartTimeMinutes = e.target.value + '0';
      if (parseInt(e.target.value + '0') >= 60) {
        setClipStartTimeMinutes('59');
        tempStartTimeMinutes = '59';
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeMinutes('00');
      tempStartTimeMinutes = '00';
    }
    // call the function which will update the clipStartTime in the parent component and the db is updated too.
    calculateClipStartTimeinSeconds(
      clipStartTimeHours,
      tempStartTimeMinutes,
      clipStartTimeSeconds
    );
  };
  const handleBlurClipStartTimeSeconds = (e) => {
    // store the current clipStartTimeSeconds in a temp variable,
    // so that when calculateClipStartTimeinSeconds without going into the loops,
    // it has the previous value in it
    let tempStartTimeSeconds = clipStartTimeSeconds;
    if (e.target.value.length === 1) {
      setClipStartTimeSeconds(e.target.value + '0');
      tempStartTimeSeconds = e.target.value + '0';
      if (parseInt(e.target.value + '0') >= 60) {
        setClipStartTimeSeconds('59');
        tempStartTimeSeconds = '59';
      }
    } else if (e.target.value.length === 0) {
      setClipStartTimeSeconds('00');
      tempStartTimeSeconds = '00';
    }
    // call the function which will update the clipStartTime in the parent component and the db is updated too.
    calculateClipStartTimeinSeconds(
      clipStartTimeHours,
      clipStartTimeMinutes,
      tempStartTimeSeconds
    );
  };

  // handle save clip description - axios call -> generate audio & update endtime, duration
  const handleClickSaveClipDescription = (e) => {
    e.preventDefault();
    // check if the clip has been updated
    if (clipDescriptionText !== clip_description_text) {
      // show spinner
      props.setShowSpinner(true);
      axios
        .put(`/api/audio-clips/update-clip-description/${clip_id}`, {
          userId: userId,
          youtubeVideoId: youtubeVideoId,
          clipDescriptionText: clipDescriptionText,
          clipDescriptionType: clip_description_type,
          audioDescriptionId: props.audioDescriptionId,
        })
        .then((res) => {
          // below prop is used to re-render the parent component i.e. fetch audio clip data
          setUpdateData(!updateData);
          props.setShowSpinner(false); // stop showing spinner
          toast.success('Description Saved Successfully!!'); // show toast message
        })
        .catch((err) => {
          // err.response.data.message has the message text send by the server
          toast.error(err.response.data.message); // show toast message
        });
    }
  };

  // delete a clip
  const handleClickDeleteClip = (e) => {
    props.setShowSpinner(true);
    e.preventDefault();
    axios
      .delete(`/api/audio-clips/delete-clip/${clip_id}`)
      .then((res) => {
        toast.success(
          'Clip Deleted Successfully!! Please wait while we fetch latest Clip Data'
        );
        setTimeout(() => {
          window.location.reload(); // force reload the page to pull the new audio clip on to the page - Any other efficient way??
        }, 3000); // setting the timeout to show the toast message for 4 sec
      })
      .catch((err) => {
        console.error(err);
        toast.error('Error Deleting Clip. Please try again later.');
      });
  };

  // handle record & replace
  const handleClickReplaceClip = async (e) => {
    props.setShowSpinner(true);
    e.preventDefault();
    if (mediaBlobUrl === null) {
      toast.error(
        'Error while saving the recorded audio. Please record again.'
      );
      props.setShowSpinner(false);
    } else {
      // create a new FormData object for easy file uploads
      let formData = new FormData();
      const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob()); // get blob from the audio URI
      const audioFile = new File([audioBlob], 'voice.mp3', {
        type: 'audio/mp3',
      });
      formData.append('clipDescriptionText', clipDescriptionText);
      formData.append('clipStartTime', props_clip_start_time);
      formData.append('newACType', clip_description_type);
      formData.append('youtubeVideoId', youtubeVideoId);
      formData.append('recordedClipDuration', recordedClipDuration);
      formData.append('audioDescriptionId', props.audioDescriptionId);
      formData.append('userId', userId);
      formData.append('file', audioFile);

      // upload formData using axios
      axios
        .put(
          `/api/audio-clips/record-replace-clip-audio/${clip_id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            reportProgress: true,
            observe: 'events',
          }
        )
        .then((res) => {
          toast.success('Replaced Clip Successfully with the Recorded Audio!!');
          setTimeout(() => {
            setUpdateData(!updateData);
            props.setShowSpinner(false);
          }, 4000); // setting the timeout to show the toast message for 4 sec
        })
        .catch((err) => {
          console.log(err);
          toast.error(
            'Error while replacing Audio Clip. Please try again later.'
          );
        });
    }
  };

  // handle Record Ready Set Go
  const handleReadySetGo = () => {
    const _321Go = ['3', '2', '1', 'Go', 'start'];
    // using the concept of closures & IIFE in JavaScript
    _321Go.forEach((val, i) => {
      setTimeout(
        (function (i_local) {
          return function () {
            setReadySetGo(i_local);
          };
        })(val),
        1000 * i
      );
    });
    // start recording once ready set go is completed
    setTimeout(() => {
      startRecording();
    }, 3700);
  };

  return (
    <div className="edit-component text-white" ref={ref}>
      <div className="d-flex justify-content-evenly align-items-center">
        {/* Clip Description & Start time Div */}
        <div className="description-section mt-1">
          <div className="d-flex justify-content-between align-items-start">
            {/* Description label, text area & buttons*/}
            <div className="d-flex justify-content-center align-items-start flex-column">
              <h6 className="text-white">
                Clip Description: {is_recorded ? '(Recorded)' : ''}
              </h6>
              <textarea
                className="form-control form-control-sm border rounded text-center description-textarea"
                rows="3"
                id="description"
                name="description"
                // defaultValue={clip_description_text}
                // placeholder={is_recorded ? 'This is a Recorded Audio Clip' : ''}
                value={clipDescriptionText}
                onChange={(e) => setClipDescriptionText(e.target.value)}
              ></textarea>
              {/* play, save & Delete buttons */}
              <div className="my-2 d-flex justify-content-evenly align-items-center w-100">
                <button
                  type="button"
                  className="btn rounded btn-sm text-white bg-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteModal"
                >
                  <i className="fa fa-trash" /> {'  '} Delete
                </button>
                <button
                  type="button"
                  className="btn rounded btn-sm text-white save-desc-btn"
                  onClick={handleClickSaveClipDescription}
                >
                  <i className="fa fa-save" /> {'  '} Save
                </button>
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
                Start Time: {props_clip_start_time}
              </h6>
              <div className="edit-time-div">
                <div className="text-dark text-center d-flex justify-content-evenly">
                  <input
                    type="number"
                    style={{ width: '25px' }}
                    className="text-white bg-dark"
                    min="0"
                    value={clipStartTimeHours}
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
                    className="text-white bg-dark"
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
                  {/* Duration: {convertSecondsToCardFormat(clip_duration)} sec*/}
                  Duration: {parseFloat(clip_duration).toFixed(2)} sec
                </h6>
              </div>
            </div>
          </div>
        </div>
        {/* vertical divider line */}
        <div className="d-flex flex-column align-items-center">
          <h6>Or</h6>
          <div className="vertical-divider-div"></div>
        </div>
        {/* Record & Replace Section */}
        <div>
          <h6 className="text-white text-center">
            Record & Replace AI's voice
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
                  <button
                    type="button"
                    className="btn rounded btn-sm text-white primary-btn-color disabled-btn"
                  >
                    Replace
                  </button>
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
                  <button
                    type="button"
                    className="btn rounded btn-sm text-white primary-btn-color"
                    data-bs-toggle="modal"
                    data-bs-target="#replaceModal"
                  >
                    Replace
                  </button>
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
                  <button
                    type="button"
                    className="btn rounded btn-sm text-white primary-btn-color"
                    data-bs-toggle="modal"
                    data-bs-target="#replaceModal"
                  >
                    Replace
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="text-center">
            Recording Duration: {parseFloat(recordedClipDuration).toFixed(2)}{' '}
            sec
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
      <Modal
        id="replaceModal"
        title="Replace"
        text="Are you sure you want to replace AI's voice with the one you recorded?"
        modalTask={handleClickReplaceClip}
      />
      {/* <!-- Delete Modal --> Confirmation Modal - opens when user hits Delete and asks for a confirmation if Audio Clip need to be deleted*/}
      <Modal
        id="deleteModal"
        title="Delete"
        text="Are you sure you want to delete the Audio Clip?"
        modalTask={handleClickDeleteClip}
      />
    </div>
  );
};

export default EditClipComponent;
