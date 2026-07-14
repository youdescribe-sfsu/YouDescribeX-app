import { debounce } from 'debounce'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { DESCRIPTION_VOLUME_MAX } from '@/shared/utils/descriptionGain'
import './videoPlayerControls.scss'

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
  const [descriptionValue, setDescriptionValue] =
    useState<number>(descriptionVolume)
  const [YTValue, setYTValue] = useState<number>(youTubeVideoVolume)

  // Keep the visible slider positions in lockstep with the parent-owned
  // volume state, so external changes (e.g. clicking YouTube's built-in
  // mute button) move the sliders too.
  useEffect(() => {
    setDescriptionValue(descriptionVolume)
  }, [descriptionVolume])
  useEffect(() => {
    setYTValue(youTubeVideoVolume)
  }, [youTubeVideoVolume])

  // const showAudioDuckingTooltip = (props: any) => {
  //   return (
  //     <Tooltip {...props}>
  //       Audio ducking will reduce the volume of a video when an audio
  //       description is playing. The description volume slider controls the audio
  //       description volume and the video volume slider controls the YouTube
  //       video volume.
  //     </Tooltip>
  //   )
  // }

  // const showDescriptionVolumeTooltip = (props: any) => {
  //   return (
  //     <Tooltip {...props}>
  //       The description volume slider controls the audio description volume
  //     </Tooltip>
  //   )
  // }

  // const showVideoVolumeTooltip = (props: any) => {
  //   return (
  //     <Tooltip {...props}>
  //       The video volume slider controls the YouTube video volume
  //     </Tooltip>
  //   )
  // }

  const handleYouTubeVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setYTValue(parseInt(e.target.value))
    debouncedYouTubeVolumeChange(parseInt(e.target.value))
  }

  const debouncedYouTubeVolumeChange = useMemo(
    () =>
      debounce((value: number) => {
        // console.log('Updating YT Volume', value)
        setYouTubeVideoVolume(value)
      }, 500),
    [setYouTubeVideoVolume],
  )
  const handleDescriptionVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescriptionValue(parseInt(e.target.value))
    debouncedDescriptionVolumeChange(parseInt(e.target.value))
  }

  const debouncedDescriptionVolumeChange = useMemo(
    () =>
      debounce((value: number) => {
        // console.log('Updating Description Volume', value)
        setDescriptionVolume(value)
      }, 500),
    [setDescriptionVolume],
  )

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
            <h6 className="classic-h6">
              Audio Ducking{' '}
              {/* <i className="fa fa-question-circle question-font" /> */}
            </h6>
          </div>
          <div className="col-sm-6 col-md-6 col-lg-6">
            <Form.Range
              aria-label="Audio Description Volume Slider"
              aria-roledescription={`Slider for audio description volume. 0 is muted, 100 is the recorded level, and ${DESCRIPTION_VOLUME_MAX} amplifies quiet recordings up to 3x.`}
              className=""
              min={0}
              max={DESCRIPTION_VOLUME_MAX}
              step={1}
              value={descriptionValue}
              onChange={handleDescriptionVolumeChange}
            />
          </div>
          <div className="col-sm-6 col-md-6 col-lg-6">
            <Form.Label className="">Description Volume</Form.Label>
          </div>
          <div className="col-sm-6 col-md-6 col-lg-6">
            <Form.Range
              aria-label="YouTube Video Volume Slider"
              aria-roledescription="This slider controls the volume of the YouTube video. The volume can be adjusted from 0 to 100."
              className="form-range"
              value={YTValue}
              onChange={handleYouTubeVolumeChange}
            />
          </div>
          <div className="col-sm-6 col-md-6 col-lg-6">
            <Form.Label className="form-range-label">Video Volume</Form.Label>
          </div>
          {/* <FullscreenButton playFullscreen={props.playFullscreen} />
      <VideoTimer {...props} /> */}
        </div>
      </div>
    </div>
  )
}

export default VideoPlayerControls
