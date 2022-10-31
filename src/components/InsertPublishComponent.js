import React, { useState, useEffect } from 'react';
import '../assets/css/insertPublish.css';
import '../assets/css/audioDesc.css';
import NewAudioClipComponent from './NewAudioClipComponent';
import Modal from '../modules/Modal';

const InsertPublishComponent = (props) => {
  // destructuring props
  // props which handles clicks of New Inline and New Extended buttons from Button Component
  const handleClicksFromParent = props.handleClicksFromParent;
  const setHandleClicksFromParent = props.setHandleClicksFromParent;

  const setShowSpinner = props.setShowSpinner;
  const userId = props.userId;
  const youtubeVideoId = props.youtubeVideoId;
  const currentTime = props.currentTime;
  const videoLength = props.videoLength;
  const audioDescriptionId = props.audioDescriptionId;
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
            Insert New {showInlineACComponent ? 'Inline' : 'Extended'} Audio
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
            Insert New Inline
          </button>
          <button
            type="button"
            className="btn mx-5 extended-bg text-white"
            onClick={handleClickInsertExtended}
          >
            <i className="fa fa-plus" /> {'   '}
            Insert New Extended
          </button>
        </div>
        <div className="mx-4">
          <button
            type="button"
            className="btn publish-bg text-white"
            data-bs-toggle="modal"
            data-bs-target="#publishModal"
          >
            <i className="fa fa-upload" /> {'   '}
            Publish
          </button>
        </div>
      </div>
      {/* Publish Modal Confirmation Modal - opens when user hits Publish buton and asks for a confirmation */}
      <Modal id="publishModal" title="Publish" text="Are you sure?" />
    </React.Fragment>
  );
};

export default InsertPublishComponent;
