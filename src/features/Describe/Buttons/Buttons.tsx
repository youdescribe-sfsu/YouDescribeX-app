import '@/assets/css/insertPublish.css'
import '@/assets/css/audioDesc.css'
import VideoPlayerControls from '@/shared/components/VideoPlayerControls/VideoPlayerControls'

interface Props {
  setHandleClicksFromParent: (value: string) => void
  handlePlayPause: () => void
  isGloballyPaused: boolean
  descriptionVolume: number
  setDescriptionVolume: (value: number) => void
  youTubeVolume: number
  setYouTubeVolume: (value: number) => void
  isPreviewAudioDescription?: boolean
  playPauseDataTutorial?: string
  audioDuckingDataTutorial?: string
}

export const Buttons = ({
  setHandleClicksFromParent,
  handlePlayPause,
  isGloballyPaused,
  descriptionVolume,
  setDescriptionVolume,
  youTubeVolume,
  setYouTubeVolume,
  isPreviewAudioDescription = false,
  playPauseDataTutorial,
  audioDuckingDataTutorial,
}: Props) => {
  return (
    <div className="d-flex justify-content-evenly flex-column text-center p-4">
      <div className="row justify-content-center gx-3 gy-4">
        <div className="col-6 d-grid">
          {isPreviewAudioDescription ? (
            <button
              type="button"
              className="btn btn-lg inline-bg text-dark ydx-button ydx-button--lg w-100"
              onClick={() => setHandleClicksFromParent('inline')}
            >
              <i className="fa fa-plus" /> {'   '}
              Insert Inline
            </button>
          ) : null}
        </div>
        <div className="col-6 d-grid">
          {isPreviewAudioDescription ? (
            <button
              type="button"
              className="btn btn-lg extended-bg text-white ydx-button ydx-button--lg w-100"
              onClick={() => setHandleClicksFromParent('extended')}
            >
              <i className="fa fa-plus" /> {'   '}
              Insert Extended
            </button>
          ) : null}
        </div>
        <div className="col-6">
          <button
            type="button"
            className="btn btn-sm play-pause-bg text-white ydx-button"
            onClick={() => handlePlayPause()}
            data-tutorial={playPauseDataTutorial}
          >
            <i className="fa fa-play"></i> <i className="fa fa-pause"></i>{' '}
            <span className="ydx-button-lable">Play / Pause</span>
          </button>
        </div>
        <div
          className="col-12 text-white"
          data-tutorial={audioDuckingDataTutorial}
        >
          <VideoPlayerControls
            descriptionVolume={descriptionVolume}
            setDescriptionVolume={setDescriptionVolume}
            youTubeVideoVolume={youTubeVolume}
            setYouTubeVideoVolume={setYouTubeVolume}
          />
        </div>
      </div>
    </div>
  )
}
