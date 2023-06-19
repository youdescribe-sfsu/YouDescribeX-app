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
}

const Buttons = ({
  setHandleClicksFromParent,
  handlePlayPause,
  isGloballyPaused,
  descriptionVolume,
  setDescriptionVolume,
  youTubeVolume,
  setYouTubeVolume,
}: Props) => {
  return (
    <div className="d-flex justify-content-evenly flex-column text-center p-4">
      <div className="row justify-content-center gx-3 gy-4">
        <div className="col-6">
          <button
            type="button"
            className="btn btn-sm inline-bg text-dark ydx-button w-100"
            onClick={() => setHandleClicksFromParent('inline')}
          >
            <i className="fa fa-plus" /> {'   '}
            Insert Inline
          </button>
        </div>
        <div className="col-6">
          <button
            type="button"
            className="btn btn-sm extended-bg text-white ydx-button w-100"
            onClick={() => setHandleClicksFromParent('extended')}
          >
            <i className="fa fa-plus" /> {'   '}
            Insert Extended
          </button>
        </div>
        <div className="col-6">
          <button
            type="button"
            className="btn btn-sm play-pause-bg text-white ydx-button"
            onClick={() => handlePlayPause()}
          >
            {isGloballyPaused ? (
              <i className="fa fa-play" />
            ) : (
              <i className="fa fa-pause" />
            )}
            {'    '}
            {isGloballyPaused ? 'Play' : 'Pause'}
          </button>
        </div>
        <div className="col-12 text-white">
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

export default Buttons
