import '../../assets/css/insertPublish.css'
import '../../assets/css/audioDesc.css'

interface Props {
  setHandleClicksFromParent: (value: string) => void
  handlePlayPause: () => void
  isGloballyPaused: boolean
}

const Buttons = ({
  setHandleClicksFromParent,
  handlePlayPause,
  isGloballyPaused,
}: Props) => {
  return (
    <div className="d-flex justify-content-evenly flex-column text-center">
      <div>
        <button
          type="button"
          className="btn btn-sm inline-bg text-dark"
          onClick={() => setHandleClicksFromParent('inline')}
        >
          <i className="fa fa-plus" /> {'   '}
          Insert Inline
        </button>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-sm extended-bg text-white"
          onClick={() => setHandleClicksFromParent('extended')}
        >
          <i className="fa fa-plus" /> {'   '}
          Insert Extended
        </button>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-sm play-pause-bg text-white"
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
    </div>
  )
}

export default Buttons
