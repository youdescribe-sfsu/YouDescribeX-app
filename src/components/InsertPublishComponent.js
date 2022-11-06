import React, { useState, useEffect } from 'react';
import '../assets/css/insertPublish.css';
import '../assets/css/audioDesc.css';
import axios from 'axios';
import {
  useNavigate
} from "react-router-dom";
import NewAudioClipComponent from './NewAudioClipComponent';
import Modal from '../modules/Modal';

const InsertPublishComponent = (props) => {
  // destructuring props
  // props which handles clicks of New Inline and New Extended buttons from Button Component
  const navigate = useNavigate();
  const handleClicksFromParent = props.handleClicksFromParent;
  const setHandleClicksFromParent = props.setHandleClicksFromParent;
  let seconds = props.seconds;
  const resetFunction = props.reset;
  const setShowSpinner = props.setShowSpinner;
  const userId = props.userId;
  const youtubeVideoId = props.youtubeVideoId;
  const currentTime = props.currentTime;
  const videoLength = props.videoLength;
  const audioDescriptionId = props.audioDescriptionId;
  const participant_id = props.participant_id;
  // const [timeData,setTimeData] = useState(seconds);
  const [showInlineACComponent, setShowInlineACComponent] = useState(false);
  const [showNewACComponent, setShowNewACComponent] = useState(false);
  const handleClickInsertInline = (e) => {
    e.preventDefault();
    setShowNewACComponent(true);
    setShowInlineACComponent(true);
  };

  const handleClickInsertExtended = (e) => {
    e.preventDefault();
    setShowNewACComponent(true);
    setShowInlineACComponent(false);
  };

  const handleClickPublish = (e) => {
    
    axios.post('/api/add-timedata-to-db/addtimedata', {
      participant_id: participant_id,
      time: seconds
    })
    .then(function (response) {
      resetFunction();
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });

  };

  const handlePublish = async (e) => {
    console.log("publish");
    navigate(`/userstudy/${participant_id}`);
  };

  useEffect(() => {
    if (handleClicksFromParent === 'inline') {
      setShowNewACComponent(true);
      setShowInlineACComponent(true);
      setHandleClicksFromParent(''); // reset it back to empty
    } else if (handleClicksFromParent === 'extended') {
      setShowNewACComponent(true);
      setShowInlineACComponent(false);
      setHandleClicksFromParent(''); // reset it back to empty
    }
  }, [props]);

  return (
    <React.Fragment>
      <hr />
      {showNewACComponent ? (
        <>
          <h5 className="text-white">
            Insert {showInlineACComponent ? 'Inline' : 'Extended'} Audio
            Clip
          </h5>
          <NewAudioClipComponent
            userId={userId}
            youtubeVideoId={youtubeVideoId}
            showInlineACComponent={showInlineACComponent}
            setShowNewACComponent={setShowNewACComponent}
            currentTime={currentTime}
            videoLength={videoLength}
            audioDescriptionId={audioDescriptionId}
            setShowSpinner={setShowSpinner}
          />
        </>
      ) : (
        <></>
      )}

      <div className="d-flex justify-content-between my-3">
        <div>
          <button
            type="button"
            className="btn inline-bg text-dark"
            onClick={handleClickInsertInline}
          >
            <i className="fa fa-plus" /> {'   '}
            Insert Inline
          </button>
          <button
            type="button"
            className="btn mx-5 extended-bg text-white"
            onClick={handleClickInsertExtended}
          >
            <i className="fa fa-plus" /> {'   '}
            Insert Extended
          </button>
        </div>
        <div className="mx-4">
          <button
            type="button"
            className="btn publish-bg text-white"
            data-bs-toggle="modal"
            data-bs-target="#publishModal"
            onClick={handleClickPublish}
          >
            <i className="fa fa-upload" /> {'   '}
            Publish
          </button>
        </div>
      </div>
      {/* Publish Modal Confirmation Modal - opens when user hits Publish buton and asks for a confirmation */}
      <Modal id="publishModal" title="Publish" text="Are you sure?"  modalTask={handlePublish}/>
    </React.Fragment>
  );
};

export default InsertPublishComponent;
