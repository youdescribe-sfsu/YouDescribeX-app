import React, { useState, useEffect } from 'react';
import '../assets/css/insertPublish.css';
import '../assets/css/audioDesc.css';

const ButtonsComponent = (props) => {
  const setHandleClicksFromParent = props.setHandleClicksFromParent;
  return (
    <div className="d-flex justify-content-evenly flex-column text-center">
      <div>
        <button
          type="button"
          className="btn btn-sm inline-bg text-dark"
          onClick={() => setHandleClicksFromParent('inline')}
        >
          <i className="fa fa-plus" /> {'   '}
          New Inline
        </button>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-sm extended-bg text-white"
          onClick={() => setHandleClicksFromParent('extended')}
        >
          <i className="fa fa-plus" /> {'   '}
          New Extended
        </button>
      </div>
    </div>
  );
};

export default ButtonsComponent;
