import React from 'react'
import Form from 'react-bootstrap/Form'
import './videoPlayerControls.scss'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

interface Props {
  descriptionVolume: number
  setDescriptionVolume: (value: number) => void
  youTubeVideoVolume: number
  setYouTubeVideoVolume: (value: number) => void
}

const VideoPlayerControls = ({
  descriptionVolume,
  setDescriptionVolume,
  youTubeVideoVolume,
  setYouTubeVideoVolume,
}: Props) => {
  const showAudioDuckingTooltip = (props: any) => {
    return (
      <Tooltip {...props}>
        Audio ducking will reduce the volume of a video when an audio
        description is playing. The description volume slider controls the audio
        description volume and the video volume slider controls the YouTube
        video volume.
      </Tooltip>
    )
  }

  const showDescriptionVolumeTooltip = (props: any) => {
    return (
      <Tooltip {...props}>
        The description volume slider controls the audio description volume
      </Tooltip>
    )
  }

  const showVideoVolumeTooltip = (props: any) => {
    return (
      <Tooltip {...props}>
        The video volume slider controls the YouTube video volume
      </Tooltip>
    )
  }

  return (
    <div id="video-player-controls" className="video-player-controls">
      <div className="w3-row">
        {/* <VideoPlayerAccessibleSeekbar
      updateState={props.updateState}
      {...props}
    /> */}
      </div>

      <div className="">
        <div className="range-container row">
          {/* <PlayPauseButton {...props} /> */}
          <div className="col-12">
            <OverlayTrigger
              placement="top"
              delay={{ show: 250, hide: 400 }}
              overlay={showAudioDuckingTooltip}
            >
              <h6 className="classic-h6">
                Audio Ducking{' '}
                {/* <i className="fa fa-question-circle question-font" /> */}
              </h6>
            </OverlayTrigger>
          </div>
          <div className="col-sm-6 col-md-6 col-lg-4">
            <Form.Range
              className=""
              value={descriptionVolume}
              onChange={(e) => {
                setDescriptionVolume(parseInt(e.target.value))
              }}
            />
          </div>
          <div className="col-sm-6 col-md-6 col-lg-8">
            <OverlayTrigger
              placement="top"
              delay={{ show: 250, hide: 400 }}
              overlay={showDescriptionVolumeTooltip}
            >
              <Form.Label className="">Description Volume</Form.Label>
            </OverlayTrigger>
          </div>
          <div className="col-sm-6 col-md-6 col-lg-4">
            <Form.Range
              className="form-range"
              value={youTubeVideoVolume}
              onChange={(e) => {
                setYouTubeVideoVolume(parseInt(e.target.value))
              }}
            />
          </div>
          <div className="col-sm-6 col-md-6 col-lg-8">
            <OverlayTrigger
              placement="top"
              delay={{ show: 250, hide: 400 }}
              overlay={showVideoVolumeTooltip}
            >
              <Form.Label className="form-range-label">Video Volume</Form.Label>
            </OverlayTrigger>
          </div>
          {/* <FullscreenButton playFullscreen={props.playFullscreen} />
      <VideoTimer {...props} /> */}
        </div>
      </div>
    </div>
  )
}

export default VideoPlayerControls
