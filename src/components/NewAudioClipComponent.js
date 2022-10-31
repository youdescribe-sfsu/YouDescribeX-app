import React, { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import convertSecondsToCardFormat from '../helperFunctions/convertSecondsToCardFormat';
import '../assets/css/audioDesc.css';
import '../assets/css/editAudioDesc.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const NewAudioClipComponent = (props) => {
  // destructuring props
  const setShowSpinner = props.setShowSpinner;
  const userId = props.userId;
  const youtubeVideoId = props.youtubeVideoId;
  let showInlineACComponent = props.showInlineACComponent;
  let setShowNewACComponent = props.setShowNewACComponent;
  const currentTime = props.currentTime;
  const videoLength = props.videoLength;
  const audioDescriptionId = props.audioDescriptionId;

  // for audio Recording
  // variable and function declaration of the react-media-recorder package
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true }); // using only the audio recorder here
  const [readySetGo, setReadySetGo] = useState('');
  // this state variable keeps track of the play/pause state of the recorded audio
  const [isRecordedAudioPlaying, setIsRecordedAudioPlaying] = useState(false);
  // this state variable is updated whenever mediaBlobUrl is updated. i.e. whenever a new recording is created
  const [recordedAudio, setRecordedAudio] = useState('');

  // state variables - for new AD
  const [newACTitle, setNewACTitle] = useState('');
  const [newACType, setNewACType] = useState('Visual'); // default for Visual
  const [newACDescriptionText, setNewACDescriptionText] = useState('');
  const [newACStartTime, setNewACStartTime] = useState(0.0);
  const [newACDuration, setNewACDuration] = useState(0.0);

  // use 3 state variables to hold the value of 3 input type number fields
  const [clipStartTimeHours, setClipStartTimeHours] = useState(0);
  const [clipStartTimeMinutes, setClipStartTimeMinutes] = useState(0);
  const [clipStartTimeSeconds, setClipStartTimeSeconds] = useState(0);

  useEffect(() => {
    // scroll to the bottom of the screen and make the Inline AD component visible
    window.scrollTo({
      left: 0,
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
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
              setNewACDuration(aud.duration);
              aud.currentTime = 0;
            };
          } else {
            setNewACDuration(aud.duration);
          }
        },
        false
      );
    }
    handleClipStartTimeInputsRender();
  }, [mediaBlobUrl, props.showInlineACComponent]);

  // render the values in the input[type='number'] fields of the start time - renders everytime the props_clip_start_time value changes
  const handleClipStartTimeInputsRender = () => {
    setClipStartTimeHours(
      convertSecondsToCardFormat(currentTime).split(':')[0]
    );
    setClipStartTimeMinutes(
      convertSecondsToCardFormat(currentTime).split(':')[1]
    );
    setClipStartTimeSeconds(
      convertSecondsToCardFormat(currentTime).split(':')[2]
    );
    setNewACStartTime(currentTime);
  };

  // calculate the Start Time in seconds from the Hours, Minutes & Seconds passed from handleBlur functions
  const calculateClipStartTimeinSeconds = (hours, minutes, seconds) => {
    let calculatedSeconds = +hours * 60 * 60 + +minutes * 60 + +seconds;
    // check if the updated start time is more than the videolength, if yes, throw error and retain the old state
    if (calculatedSeconds > videoLength) {
      toast.error('Oops!! Start Time cannot be later than the video end time.'); // show toast error message
      handleClipStartTimeInputsRender();
    } else {
      setNewACStartTime(calculatedSeconds);
    }
  };

  // lots of if else conditions to ensure correct input in the start time number fields.
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

  // to save the new audio clip into the database
  const handleSaveNewAudioClip = (e) => {
    e.preventDefault();
    if (newACTitle === '') {
      toast.error('Please enter a Title');
    } else {
      if (newACDescriptionText === '' && mediaBlobUrl === null) {
        toast.error(
          'Please enter a description text for the New Clip or record one'
        );
      } else {
        setShowSpinner(true);
        if (mediaBlobUrl !== null) {
          // axios call to backend with isRecorded true
          saveNewClipInDB({ isRecorded: true });
        } else {
          // axios call to backend with isRecorded false
          saveNewClipInDB({ isRecorded: false });
        }
      }
    }
  };

  const saveNewClipInDB = async ({ isRecorded }) => {
    const newACPlaybackType = showInlineACComponent ? 'inline' : 'extended';
    // create a new FormData object for easy file uploads
    let formData = new FormData();
    formData.append('newACTitle', newACTitle);
    formData.append('newACType', newACType);
    formData.append('newACPlaybackType', newACPlaybackType);
    formData.append('newACStartTime', newACStartTime);
    formData.append('isRecorded', isRecorded);
    formData.append('youtubeVideoId', youtubeVideoId);
    formData.append('userId', userId);
    if (!isRecorded) {
      formData.append('newACDescriptionText', newACDescriptionText);
    } else {
      const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob()); // get blob from the audio URI
      const audioFile = new File([audioBlob], 'voice.mp3', {
        type: 'audio/mp3',
      });
      // formData.append('newACDescriptionText', '');
      formData.append('newACDescriptionText', newACDescriptionText);
      formData.append('newACDuration', newACDuration);
      formData.append('file', audioFile);
    }
    // upload formData using axios
    axios
      .post(`/api/audio-clips/add-new-clip/${audioDescriptionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        reportProgress: true,
        observe: 'events',
      })
      .then((res) => {
        toast.success(`New Clip Added Successfully!!\n${res.data}`);
        setTimeout(() => {
          window.location.reload(); // force reload the page to pull the new audio clip on to the page - Any other efficient way??
        }, 4000); // setting the timeout to show the toast message for 2 sec
      })
      .catch((err) => {
        console.log(err.response.data.message);
        toast.error('Error Adding New Clip. Please try again later.');
      });
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
    <div className="text-white component mt-2 rounded border border-1 border-white mx-5 d-flex flex-column pb-3 justify-content-between">
      {/* close icon to the top right */}
      <div className="mx-2 text-end">
        <i
          className="fa fa-close fs-4 close-icon "
          onClick={() => {
            setShowNewACComponent(false);
          }}
        ></i>
      </div>
      {/* div for radio button, title, type, start time */}
      <div className="d-flex justify-content-evenly align-items-start">
        {/* Inline or Extended Radio Button */}
        <div className="">
          {showInlineACComponent ? (
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                id="radio1"
                value="inline"
                defaultChecked
              />
              <div className="inline-bg text-dark inline-extended-radio px-2">
                <label className="inline-extended-label">Inline</label>
              </div>
            </div>
          ) : (
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                id="radio2"
                value="extended"
                defaultChecked
              />
              <div className="extended-bg text-white inline-extended-radio px-2">
                <label className="inline-extended-label">Extended</label>
              </div>
            </div>
          )}
        </div>
        {/* Title Text box div */}
        <div className="d-flex justify-content-evenly align-items-center">
          <h6 className="text-white fw-bolder mb-0">Title:</h6>
          <input
            type="text"
            className="form-control form-control-sm text-center mx-2"
            placeholder="Title goes here.."
            value={newACTitle}
            onChange={(e) => setNewACTitle(e.target.value)}
          />
        </div>
        {/* type dropdown div */}
        <div className="d-flex justify-content-evenly align-items-center">
          <h6 className="text-white fw-bolder mb-0">Type:</h6>
          <select
            className="form-select form-select-sm text-center mx-2"
            aria-label="Select the type of new AD"
            required
            defaultValue={'Visual'}
            onChange={(e) => setNewACType(e.target.value)}
          >
            <option value="Visual">Visual</option>
            <option value="Text on Screen">Text on Screen</option>
          </select>
        </div>
        {/* Start Time Div */}
        <div className="d-flex justify-content-evenly flex-column align-items-center">
          <div className="d-flex justify-content-evenly align-items-center">
            <h6 className="text-white fw-bolder mx-2">Start Time:</h6>
            <div className="edit-time-div mx-auto">
              <div className="text-dark text-center d-flex justify-content-evenly">
                <input
                  type="number"
                  style={{ width: '25px', height: '28px' }}
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
                  style={{ width: '25px', height: '28px' }}
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
                  style={{ width: '25px', height: '28px' }}
                  className="text-white bg-dark"
                  value={clipStartTimeSeconds}
                  onChange={handleOnChangeClipStartTimeSeconds}
                  onBlur={handleBlurClipStartTimeSeconds}
                  onKeyDown={(evt) =>
                    ['e', 'E', '+', '-'].includes(evt.key) &&
                    evt.preventDefault()
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="m-2" />
      {/* div below hr to enter description / record audio */}
      <div className="d-flex justify-content-evenly align-items-start">
        <div className="d-flex justify-content-center align-items-start flex-column">
          <h6 className="text-white">Add New Clip Description:</h6>
          <textarea
            className="form-control form-control-sm border rounded description-textarea"
            rows="3"
            id="description"
            name="description"
            placeholder="Start writing a Text Description.."
            value={newACDescriptionText}
            onChange={(e) => setNewACDescriptionText(e.target.value)}
          ></textarea>
        </div>
        {/* vertical divider line */}
        <div className="d-flex flex-column align-items-center">
          <h6>Or</h6>
          <div
            className="vertical-divider-div"
            style={{ height: '65px' }}
          ></div>
        </div>
        {/* Recording Div */}
        <div className="text-center">
          <h6 className="text-white text-center">Record New Audio Clip</h6>
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
                  <i className="fa fa-stop text-danger" />
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
                  <i className="fa fa-microphone text-danger" />
                </button>
              ) : readySetGo !== 'start' ? (
                <button
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Ready Set Go"
                  type="button"
                  className="btn rounded btn-sm mx-auto border border-warning bg-light"
                  disabled
                >
                  <b className="fs-6">{readySetGo}</b>
                </button>
              ) : (
                <></>
              )}
            </div>
            {/* No recording to Play */}
            {mediaBlobUrl === null ? (
              <div
                data-bs-toggle="tooltip"
                data-bs-placement="bottom"
                title="No recording to Play"
              >
                <button
                  type="button"
                  className="btn rounded btn-sm text-white primary-btn-color mx-3"
                  disabled
                >
                  Listen
                </button>
              </div>
            ) : isRecordedAudioPlaying ? ( //Listen to your recording
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
            ) : (
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
            )}
          </div>
          <div>
            Recording Duration: {parseFloat(newACDuration).toFixed(2)} sec
          </div>
        </div>
      </div>
      <hr className="m-2" />
      {/* Save New AD Button */}
      <div className="text-center mt-1">
        <button
          type="button"
          className="btn rounded btn-sm text-white save-desc-btn"
          onClick={handleSaveNewAudioClip}
        >
          <i className="fa fa-save" /> {'  '} Save
        </button>
      </div>
    </div>
  );
};

export default NewAudioClipComponent;
