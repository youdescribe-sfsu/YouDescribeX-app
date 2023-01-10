import React, { useState, useEffect, useRef } from 'react';
import { useElapsedTime } from "use-elapsed-time";
import { useParams } from 'react-router-dom'; /* to use params on the url */
import axios from 'axios';
import YouTube from 'react-youtube';
import Draggable from 'react-draggable';
import '../assets/css/home.css';
import AudioClipComponent from '../components/AudioClipComponent';
import Timer from '../components/Timer';
import Notes from '../components/NotesComponent';
import convertSecondsToCardFormat from '../helperFunctions/convertSecondsToCardFormat';
import InsertPublishComponent from '../components/InsertPublishComponent';
import ButtonsComponent from '../components/ButtonsComponent';
import Spinner from '../modules/Spinner';
import { Howl } from 'howler';


const YDXHome = (props) => {
  /* to use params on the url and get userId & youtubeVideoId */
  const { userId, youtubeVideoId } = useParams();
  let participant_id = sessionStorage.getItem("id");
  /* Options for YouTube video API */
  const opts = {
    height: '265',
    width: '500',
    playerVars: {
      autoplay: 0,
      enablejsapi: 1,
      cc_load_policy: 1,
      controls: 0,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      wmode: 'opaque',
    },
  };
  // use a reference for the #draggable-div to get the width and use in calculateDraggableDivWidth()
  const divRef1 = useRef(null);
  const divRef2 = useRef(null);
  const divRef3 = useRef(null);
  const [divWidths, setDivWidths] = useState({});

  // State Variables
   const [videoId, setVideoId] = useState(''); // retrieved from db, stored to fetch audio_descriptions
  const [audioDescriptionId, setAudioDescriptionId] = useState(''); // retrieved from db, stored to fetch Notes & Audio Clips
  const [notesData, setNotesData] = useState(''); // retrieved from db, stored to pass on to Notes Component
  const [videoLength, setVideoLength] = useState(0); // retrieved from db, stored to display as a label for the dialog timeline
  const [draggableDivWidth, setDraggableDivWidth] = useState(0.0); //stores width of #draggable-div
  const [currentEvent, setCurrentEvent] = useState(0); //stores YouTube video's event
  const [currentState, setCurrentState] = useState(-1); // stores YouTube video's PLAYING, CUED, PAUSED, UNSTARTED, BUFFERING, ENDED state values
  const [currentTime, setCurrentTime] = useState(0.0); //stores current running time of the YouTube video
  const [timer, setTimer] = useState(0); // stores TBD
  const [unitLength, setUnitLength] = useState(0); // stores unit length based on the video length to maintain colored div's on the timelines
  const [draggableTime, setDraggableTime] = useState({ x: -3, y: 0 }); // stores the position of the draggable bar on the #draggable-div
  const [videoDialogTimestamps, setVideoDialogTimestamps] = useState([]); // stores dialog-timestamps data for a video from backend db
  const [isPublished, setIsPublished] = useState(false); // holds the published state of the Video & Audio Description
  const [audioClips, setAudioClips] = useState([]); // stores list of Audio Clips data for a video from backend db

  // store current extended & inline Audio Clips to pause/play based on the YT video current state
  const [currExtendedAC, setCurrExtendedAC] = useState(null); // see onStateChange() - stop extended ac, when Video is played.
  const [currInlineAC, setCurrInlineAC] = useState(null); // see onStateChange() - stop Inline ac, when Video is paused.

  const [updateData, setUpdateData] = useState(false); // passed to child components to use in the dependency array so that data is fetched again after this variable is modified

  const [recentAudioPlayedTime, setRecentAudioPlayedTime] = useState(0.0); // used to store the time of a recent AD played to stop playing the same Audio twice concurrently - due to an issue found in updateTime() method because it returns the same currentTime twice or more
  const [playedAudioClip, setPlayedAudioClip] = useState(''); // store clip_id of the audio clip that is already played.
  const [playedClipPath, setPlayedClipPath] = useState(''); // store clip_audio_path of the audio clip that is already played.
  // Spinner div
  const [showSpinner, setShowSpinner] = useState(false);

  // logic to show/hide the edit component and add it to a list along with clip Id
  // this hides one edit component when the other is opened
  const [editComponentToggleList, setEditComponentToggleList] = useState([]);

    // handle clicks of new Inline & New Extended buttons placed beside Notes
  // pass as props to ButtonsComponent & InsertPublishComponent'
  const [handleClicksFromParent, setHandleClicksFromParent] = useState('');

  const [isCurrentExtACPaused, setCurrentExtACPaused] = useState(false); // Manages the play/pause state of an extended audio clip
  const [isGloballyPaused, setGloballyPaused] = useState(true); // Manages the global play/pause state

  const [isPlaying, setIsPlaying] = useState(false);
  const { elapsedTime } = useElapsedTime({ isPlaying });

  const storedValueAsNumber = Number(localStorage.getItem('Seconds'));
  const [seconds, setSeconds] = useState(Number.isInteger(storedValueAsNumber) ? storedValueAsNumber : 0);
  const [isActive, setIsActive] = useState(false);

  const [needRefresh, setNeedRefresh] = useState(false);
  // const [clipDeleted, setClipDeleted] = useState(false);
  const [samplingRate, setSamplingRate] = useState(100);

  function toggle() {
    setIsActive(!isActive);
  }

  function reset() {
    setSeconds(0);
    setIsActive(false);
  }

  useEffect(() => {
    setDivWidths({
      divRef1:
        divRef1.current.clientWidth / 3 + divRef1.current.clientWidth / 3,
      divRef2: divRef1.current.clientWidth / 3,
      divRef3: divRef2.current.clientWidth,
      divRef4: divRef3.current.clientWidth,
    });
    setShowSpinner(true);
    // set the toggle list back to empty if we are fetching the data again
    fetchUserVideoData(); // use axios to get audio descriptions for the youtubeVideoId & userId passed to the url Params

    document.addEventListener("keyup", () => {
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    });
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [
    isActive,
    draggableDivWidth,
    unitLength,
    videoId,
    youtubeVideoId,
    // changing this state variable, will fetch user data again
    updateData, // to fetch data whenever updateData state is changed.
    setEditComponentToggleList,
  ]);

  useEffect(() => {
    localStorage.setItem('Seconds', String(seconds));
  }, [seconds]);


  useEffect(() => {
    if(needRefresh) {
      fetchAudioDescriptionData(true);
      setNeedRefresh(false);
    }
  }, [needRefresh])

  // for calculating the draggable-div width of the timeline
  const calculateDraggableDivWidth = () => {
    // remove the left & right margin - leaving about 96% of the total width of the draggable-div
    const currWidth = divRef3.current.clientWidth;
    // const currWidth = 700;
    const draggableDivWidth = (96 * currWidth) / 100;
    setDraggableDivWidth(draggableDivWidth);
    // could add this to change the unit length for every window resize.. commenting this for now
    // window.addEventListener('resize', () => {
    //   const newWidth = divRef.current.clientWidth;
    //   const draggableDivWidth = (96 * newWidth) / 100;
    //   setDraggableDivWidth(draggableDivWidth);
    // });
  };
  // calculate unit length of the timeline width based on video length
  const calculateUnitLength = (videoEndTime) => {
    let unitLength = draggableDivWidth / videoEndTime; // let unitlength = 644 / 299;
    setUnitLength(unitLength);
  };

  // use axios and get dialog timestamps for the Dialog Timeline
  const fetchDialogData = () => {
    axios
      .get(`/api/dialog-timestamps/get-video-dialog/${videoId}`)
      .then((res) => {
        setShowSpinner(false);
        const dialogData = res.data;
        return dialogData;
      })
      .then((dialogData) => {
        setShowSpinner(false);
        const updatedDialogData = [];
        dialogData.forEach((dialog) => {
          const x = dialog.dialog_start_time * unitLength;
          const width = dialog.dialog_duration * unitLength;
          const dialog_start_time = {
            dialog_seq_no: dialog.dialog_sequence_num,
            // dialog_end_time: dialog.dialog_end_time,
            controlledPosition: { x: x, y: 0 },
            width: width,
          };
          updatedDialogData.push(dialog_start_time);
        });
        setVideoDialogTimestamps(updatedDialogData);
      })
      .catch((err) => {
        // console.error(err.response.data);
        setShowSpinner(true);
      });
  };

  // fetch videoId based on the youtubeVideoId which is later used to get audioClips
  const fetchUserVideoData = () => {
    axios
      .get(`/api/videos/get-by-youtubeVideo/${youtubeVideoId}`)
      .then((res) => {
        setShowSpinner(false);
        const video_id = res.data.video_id;
        const video_length = res.data.video_length;
        setVideoLength(video_length);
        setVideoId(video_id);
        return video_length;
      })
      .then((video_length) => {
        setShowSpinner(false);
        // order of the below function calls is important
        calculateDraggableDivWidth(); // for calculating the draggable-div width of the timeline
        calculateUnitLength(video_length); // calculate unit length of the timeline width based on video length
        setShowSpinner(true);
        fetchDialogData(); // use axios and get dialog timestamps for the Dialog Timeline});
        setShowSpinner(true);
        fetchAudioDescriptionData();
      })
      .catch((err) => {
        // console.error(err.response.data);
        setShowSpinner(true);
      });
  };

  // use axios to get audio descriptions for the videoId (set in fetchUserVideoData()) & userId passed to the url Params
  const fetchAudioDescriptionData = (isNewClipAdded = false) => {
    //  this API fetches the audioDescription and all related AudioClips based on the UserID & VideoID
    axios
      .get(`/api/audio-descriptions/get-user-ad/${videoId}&${userId}`)
      .then((res) => {
        setShowSpinner(false);
        setAudioDescriptionId(res.data.ad_id);
        setIsPublished(res.data.is_published);
        return res.data;
      })
      .then((data) => {
        setShowSpinner(false);
        // data is nested - so AudioClips data is in res.data.Audio_Clips
        const audioClipsData = data.Audio_Clips;
        // data is nested - so Notes data is in res.data.Notes
        const notesData = data.Notes[0];
        // update the audio path for every clip row - the path might change later- TODO: change the server IP
        var tempArray = [];
        var date = new Date();
        var ONE_MIN = 1 * 60 * 1000;
        audioClipsData.forEach((clip, i) => {
          // add a sequence number for every audio clip
          clip.clip_sequence_num = i + 1;
          clip.clip_audio_path = clip.clip_audio_path.replace(
            '.',
            '/api/static'
          );
          clip.clip_audio = new Howl({
            src: clip.clip_audio_path,
            html5: true,
            pool: 1
          });

          // set the showEditComponent of the new clip to true.. compare time
          if (date - new Date(clip.createdAt) <= ONE_MIN) {
            // show Edit Component
            tempArray.push({
              clipId: clip.clip_id,
              showEditComponent: true,
            });
          } else {
            // logic to show/hide the edit component and add it to a list along with clip Id
            // this hides one edit component when the other is opened
            tempArray.push({
              clipId: clip.clip_id,
              showEditComponent: false,
            });
          }
        });

        if (editComponentToggleList.length === 0 || isNewClipAdded) {
          setEditComponentToggleList(tempArray);
        }
        setAudioClips([...audioClipsData]);
        // console.log("Audio Clips", audioClips);
        setNotesData(notesData);
      })
      .catch((err) => {
        // console.error(err.response.data);
        setShowSpinner(true);
      });
  };

  // function to update currentime state variable & draggable bar time.
  const updateTime = (
    time,
    playedAudioClip,
    recentAudioPlayedTime,
    playedClipPath
  ) => {
    setCurrentTime(time);
    // for updating the draggable component position based on current time
    setDraggableTime({ x: unitLength * time, y: 0 });
    // check if the audio is not played recently. do not play it again.
    if (parseFloat(recentAudioPlayedTime) !== parseFloat(time)) {
      // To Play audio files based on current time
      playAudioAtCurrentTime(time, playedAudioClip, playedClipPath);
    }
  };

  const waitForTimer = ms => new Promise(res => setTimeout(res, ms))

  // To Play audio files based on current time
  const playAudioAtCurrentTime = async (
    updatedCurrentTime,
    playedAudioClip,
    playedClipPath
  ) => {
    if (currentState === 1) {
      // playing
      const filteredClip = audioClips.filter(
        (clip) =>
          parseFloat(updatedCurrentTime) >=
            parseFloat(parseFloat(clip.clip_start_time) - 0.2) &&
          parseFloat(updatedCurrentTime) <=
            parseFloat(parseFloat(clip.clip_start_time) + 0.2)
      );
      if (filteredClip.length !== 0) {
        let isClipPlaying = false;
        let clipCounter = 0;
        while (clipCounter < filteredClip.length) {
          if (!isClipPlaying) {
            const currentFilteredClip = filteredClip[clipCounter];
            isClipPlaying = true;
            console.log("Filtered Clips Length", filteredClip.length, 'CLIP COUNTER', clipCounter);
            console.log(
              "Updated Current Time",
              updatedCurrentTime,
              "Clip Start Time",
              currentFilteredClip.clip_start_time
            );
            const prevelement = document.querySelectorAll(".green-border");
            // TODO: Convert to normal for loop
            prevelement.forEach((elem) =>
              elem.classList.remove("green-border")
            );
            if (playedAudioClip !== currentFilteredClip.clip_id) {
              setPlayedAudioClip(currentFilteredClip.clip_id);
              //  update recentAudioPlayedTime - which stores the time at which an audio has been played - to stop playing the same audio twice concurrently
              setRecentAudioPlayedTime(updatedCurrentTime);
              const clip_audio_path = currentFilteredClip.clip_audio_path;
              // play along with the video if the clip is an inline clip
              if (currentFilteredClip.playback_type === "inline") {
                if (clip_audio_path !== playedClipPath) {
                  setPlayedClipPath(clip_audio_path);
                  // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
                  setEditComponentToggleFunc(currentFilteredClip.clip_id, true);
                  const currentAudio = currentFilteredClip.clip_audio;
                  console.log(
                    new Date().toISOString(),
                    `[${currentFilteredClip.clip_id}][INLINE] Playing Audio Clip -> Original Start Time = ${currentFilteredClip.clip_start_time}`
                  );
                  if (!currentAudio.playing()) {
                    currentAudio.play();
                  }
                  // see onStateChange() - storing current inline clip.
                  setCurrInlineAC(currentAudio);
                  // ended event listener, to set the currInlineAC back to null
                  currentAudio.on("play", function () {
                    console.log(
                      new Date().toISOString(),
                      `[${currentFilteredClip.clip_id}][INLINE][Howler JS] Audio Clip started playing`
                    );
                  });
                  // eslint-disable-next-line no-loop-func
                  currentAudio.on("end", function () {
                    console.log(
                      new Date().toISOString(),
                      `[${currentFilteredClip.clip_id}][INLINE][Howler JS] Audio Clip ended`
                    );
                    isClipPlaying = false;
                    clipCounter += 1;
                    setCurrInlineAC(null); // setting back to null, as it is played completely.
                  });
                }
              }
              // play after pausing the youtube video if the clip is an extended clip
              else if (currentFilteredClip.playback_type === "extended") {
                if (clip_audio_path !== playedClipPath) {
                  setPlayedClipPath(clip_audio_path);
                  // when an audio clip is playing, that particular Audio Clip component will be opened up - UX Improvement
                  setEditComponentToggleFunc(currentFilteredClip.clip_id, true);
                  const currentAudio = currentFilteredClip.clip_audio;
                  currentEvent.pauseVideo();
                  console.log(
                    new Date().toISOString(),
                    `[${currentFilteredClip.clip_id}][EXTENDED] Playing Audio CLIP -> Original Start Time = ${currentFilteredClip.clip_start_time}`
                  );
                  if (!currentAudio.playing()) {
                    currentAudio.play();
                  }
                  // see onStateChange() - storing current Extended Clip
                  setCurrExtendedAC(currentAudio);
                  // youtube video should be played after the clip has finished playing
                  currentAudio.on("play", function () {
                    console.log(
                      new Date().toISOString(),
                      `[${currentFilteredClip.clip_id}][EXTENDED][Howler JS] Audio Clip started playing`
                    );
                  });
                  // eslint-disable-next-line no-loop-func
                  currentAudio.on("end", function () {
                    console.log(
                      new Date().toISOString(),
                      `[${currentFilteredClip.clip_id}][EXTENDED][Howler JS] Audio Clip ended`
                    );
                    setCurrExtendedAC(null); // setting back to null, as it is played completely.
                    clipCounter += 1;
                    isClipPlaying = false;
                    if (clipCounter >= filteredClip.length){
                      currentEvent.playVideo();
                    }
                    setCurrentExtACPaused(false); // reset the play/pause state
                  });
                }
              }
            }
            const element = document.getElementById(
              currentFilteredClip.clip_id
            );
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            element.classList.add("green-border");
          }
          await waitForTimer(200);
        }
      }
        // for (const currentFilteredClip of filteredClip) {
      // }
    }
  };

  // YouTube Player Functions
  const onStateChange = (event) => {
    const currentTime = event.target.getCurrentTime();
    setCurrentEvent(event.target);
    setCurrentTime(currentTime);
    setCurrentState(event.data);
    switch (event.data) {
      case 0: // end of the video
        clearInterval(timer);
        // event.target.seekTo(0);
        break;
      case 1: // Playing
        // Case for Extended Audio Clips:
        // When an extended Audio Clip is playing, YT video is paused
        // User plays the YT Video. Extended is still played along with the video. Overlapping with Dialogs &/ other audio clips
        // Work around - add current extended audio clip to a state variable & check if YT state is changed to playing i.e. 1
        // if yes, stop playing the extended audio clip & set the state back to null
        if (currExtendedAC !== null) {
          // to stop playing -> pause and set time to 0
          currExtendedAC.pause();
          currExtendedAC.currentTime = 0;
          setCurrExtendedAC(null);
        }
        if (currInlineAC !== null) {
          // to stop playing -> pause and set time to 0
          currInlineAC.play();
          currInlineAC.on('end', function () {
            setCurrInlineAC(null); // setting back to null, as it is played completely.
          });
          // currInlineAC.currentTime = 0;
          // setCurrInlineAC(null);
        }
        setGloballyPaused(false); // reset the play/pause state
        clearInterval(timer);
        break;
      case 2: // Paused
        // Case for Inline Audio Clips:
        // When an inline Audio Clip is playing along with the Video,
        // If user pauses the YT video, Inline Clip is still played.
        // Work around - add current inline audio clip to a state variable & check if YT state is changed to paused i.e. 2
        // if yes, stop playing the inline audio clip & set the state back to null
        if (currInlineAC !== null) {
          // to stop playing -> pause and set time to 0
          currInlineAC.pause();
          // currInlineAC.currentTime = 0;
          // setCurrInlineAC(null);
        }
        clearInterval(timer);
        break;
      case 3: // Buffering
        // onSeek - Buffering event is also called
        // so that when user wants to go back and play the same clip again, recentAudioPlayedTime will be reset to 0.
        setPlayedClipPath('');
        setPlayedAudioClip('');
        setRecentAudioPlayedTime(0.0);
        clearInterval(timer);
        setCurrExtendedAC(null);
        setCurrInlineAC(null);
        break;
      default: // All other states
        clearInterval(timer);
        break;
    }
  };
  const onReady = (event) => {
    setCurrentEvent(event.target);
  };
  const onPlay = (event) => {
    setCurrentEvent(event.target);
    setCurrentTime(event.target.getCurrentTime());
    // pass the current time & recentAudioPlayedTime - to avoid playing same clip multiple times
    setTimer(
      setInterval(
        () =>
          updateTime(
            event.target.getCurrentTime(),
            playedAudioClip,
            recentAudioPlayedTime,
            playedClipPath
          ),
        samplingRate
      )
    );
  };
  const onPause = (event) => {
    event.target.pauseVideo();
  };

  // Dialog Timeline Draggable Functions
  const stopProgressBar = (event, position) => {
    setDraggableTime({ x: position.x, y: 0 });
    let progressBarTime = 0.0;
    progressBarTime = position.x / unitLength;
    currentEvent.seekTo(progressBarTime);
    const currentTime = currentEvent.getCurrentTime();
    setCurrentTime(currentTime);
  };
  const dragProgressBar = (event, position) => {
    // setDraggableTime({ x: position.x, y: 0 });
    let progressBarTime = 0.0;
    progressBarTime = position.x / unitLength;
    currentEvent.seekTo(progressBarTime);
    const currentTime = currentEvent.getCurrentTime();
    setCurrentTime(currentTime);
    if (currExtendedAC !== null) {
      // to stop playing -> pause and set time to 0
      currExtendedAC.pause();
      currExtendedAC.currentTime = 0;
      setCurrExtendedAC(null);
      currentEvent.playVideo();
    }
    if (currInlineAC !== null) {
      // to stop playing -> pause and set time to 0
      currInlineAC.pause();
      currInlineAC.currentTime = 0;
      setCurrExtendedAC(null);
      currentEvent.playVideo();
    }
  };

  // toggle Show Edit Component
  // logic to show/hide the edit component and add it to a list along with clip Id
  // this hides one edit component when the other is opened
  const setEditComponentToggleFunc = (clipId, value) => {
    let temp = [...editComponentToggleList];
    temp.forEach((data) => {
      if (value) {
        if (data.clipId === clipId) {
          data.showEditComponent = value;
        } 
      } else {
        // else case is used when false is passed to the function. If false, other edit components are not opened.
        if (data.clipId === clipId) {
          data.showEditComponent = value;
        }
      }
    });
    setEditComponentToggleList(temp);
  };

  // when "AudioClip <seq no>" is clicked, video is playing from that audio clip start time
  const handlePlayAudioClip = (clipStartTime) => {
    currentEvent.seekTo(parseFloat(clipStartTime) - parseFloat(0.4)); // 0.4 is added for some buffering time
    currentEvent.playVideo(); // if paused, video is played from that audio clip.
  };

  const handlePlayPause = () => {
    if (currExtendedAC) { // If an extended clip exists, make it play/pause
      if (isCurrentExtACPaused) {
        currExtendedAC.play();
        setCurrentExtACPaused(false);
        setGloballyPaused(false);
      } else {
        currExtendedAC.pause();
        setCurrentExtACPaused(true);
        setGloballyPaused(true);
      }
    } else if (currentState === 1) { // If an extended clip does not exist make the YouTube video play/pause
      currentEvent.pauseVideo();
      setGloballyPaused(true);
    } else {
      if(!isActive) setIsActive(true);
      currentEvent.playVideo();
      setGloballyPaused(false);
    }
  };

  return (
    <React.Fragment>
      {/* Spinner div - displayed based on showSpinner */}
      {showSpinner ? <Spinner /> : <></>}
      <div className="container home-container">
        <div className="app">
          <div className="col">
            <div className="time">
              User Study Timer : {seconds}s
              <button
                className={`button button-primary button-primary-${
                  isActive ? "active" : "inactive"
                }`}
                onClick={toggle}
              >
                {isActive ? "Pause" : "Start"}
              </button>
              <button className="button" onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </div>
        <hr className="m-2" />
        {/* Youtube Iframe & Notes Component Container */}
        <div className="d-flex justify-content-around">
          <div className="text-white">
            <YouTube
              className="rounded"
              videoId={youtubeVideoId}
              opts={opts}
              onStateChange={onStateChange}
              onPlay={onPlay}
              onPause={onPause}
              onReady={onReady}
            />
          </div>
          <ButtonsComponent
            setHandleClicksFromParent={setHandleClicksFromParent}
            handlePlayPause={handlePlayPause}
            isGloballyPaused={isGloballyPaused}
          />
          <Notes
            currentTime={convertSecondsToCardFormat(currentTime)}
            audioDescriptionId={audioDescriptionId}
            notesData={notesData}
          />
        </div>
        <hr className="m-2" />
        {/* Dialog Timeline */}
        <div className="row div-below-hr">
          <div className="col-3 text-white" ref={divRef1}>
            <h6 className="dialog-timeline-text text-center fw-bolder">
              Dialog Timeline ({convertSecondsToCardFormat(videoLength)}):
            </h6>
          </div>
          <div className="col-7 mt-3" ref={divRef2}>
            <div className="row mx-1 timeline-div">
              <div id="draggable-div" className="draggable-div" ref={divRef3}>
                {/* Dialog Timeline blue & white div's */}
                {videoDialogTimestamps.map((dialog, key) => (
                  <Draggable
                    axis="x"
                    key={key}
                    position={dialog.controlledPosition}
                    bounds="parent"
                  >
                    <div
                      className="dialog-timestamps-div"
                      style={{
                        width: dialog.width,
                        height: "20px",
                      }}
                    ></div>
                  </Draggable>
                ))}

                {/* ProgressBar */}
                <Draggable
                  axis="x"
                  bounds="parent"
                  defaultPosition={{ x: 0, y: 0 }}
                  position={draggableTime}
                  onDrag={dragProgressBar}
                  onStop={stopProgressBar}
                >
                  <div tabIndex={0} className="progress-bar-div">
                    <p className="mt-5 text-white progress-bar-time">
                      {convertSecondsToCardFormat(currentTime)}
                    </p>
                  </div>
                </Draggable>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="row">
          <div className="col-3 text-white" ref={divRef1}>
            <h6 className="dialog-timeline-text text-center fw-bolder">
              Sampling Rate:
            </h6>
          </div>
          <div className="col-3 text-white">
            <select class="form-select" aria-label="Select Sampling Rate" onChange={(e) => setSamplingRate(e.target.value)} value={samplingRate}>
              <option value={200}>1/5</option>
              <option value={100}>1/10</option>
              <option value={50}>1/20</option>
              <option value={20}>1/50</option>
              <option value={10}>1/100</option>
            </select>
          </div>
        </div> */}
        {/* Map Audio Clips Component */}
        <div className="audio-desc-component-list" id="audio-list">
          {audioClips.map((clip, key) => (
            <AudioClipComponent
              key={key}
              clip={clip}
              userId={userId}
              audioDescriptionId={audioDescriptionId}
              youtubeVideoId={youtubeVideoId}
              unitLength={unitLength}
              currentTime={currentTime}
              currentEvent={currentEvent}
              currentState={currentState}
              updateData={updateData}
              setUpdateData={setUpdateData}
              videoLength={videoLength}
              setShowSpinner={setShowSpinner}
              editComponentToggleList={editComponentToggleList}
              setEditComponentToggleFunc={setEditComponentToggleFunc}
              divWidths={divWidths}
              handlePlayAudioClip={handlePlayAudioClip}
              fetchUserVideoData={fetchUserVideoData}
              setNeedRefresh={setNeedRefresh}
            />
          ))}
        </div>
        <InsertPublishComponent
          handleClicksFromParent={handleClicksFromParent}
          setHandleClicksFromParent={setHandleClicksFromParent}
          userId={userId}
          setShowSpinner={setShowSpinner}
          youtubeVideoId={youtubeVideoId}
          currentTime={currentTime}
          videoLength={videoLength}
          audioDescriptionId={audioDescriptionId}
          seconds={seconds}
          reset={reset}
          participant_id={participant_id}
          setNeedRefresh={setNeedRefresh}
        />
      </div>
    </React.Fragment>
  );
};

export default YDXHome;
