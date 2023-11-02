import '@/assets/css/insertPublish.css'
import '@/assets/css/audioDesc.css'
import VideoPlayerControls from '@/shared/components/VideoPlayerControls/VideoPlayerControls'

interface Props {
  handlePlayPause: () => void
  isGloballyPaused: boolean
  descriptionVolume: number
  setDescriptionVolume: (value: number) => void
  youTubeVolume: number
  setYouTubeVolume: (value: number) => void
  isCollaborativeEditing: boolean
  toggleCollaborativeEditing: () => void
}

const PublishedAudioButtons = ({
  handlePlayPause,
  isGloballyPaused,
  descriptionVolume,
  setDescriptionVolume,
  youTubeVolume,
  setYouTubeVolume,
  toggleCollaborativeEditing,
  isCollaborativeEditing,
}: Props) => {
  return (
    <div className="d-flex justify-content-evenly flex-column text-center p-4">
      <div className="row justify-content-center gx-3 gy-4">
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
        <div className="col-6">
          <button
            type="button"
            className={`btn btn-sm ${
              isCollaborativeEditing ? 'collaborative-bg' : 'default-bg'
            } text-white ydx-button w-100`}
            onClick={toggleCollaborativeEditing}
          >
            {isCollaborativeEditing ? (
              <i className="fa fa-check" />
            ) : (
              <i className="fa fa-pencil" />
            )}
            {'    '}
            {isCollaborativeEditing
              ? 'Collaborative Editing On'
              : 'Collaborative Editing Off'}
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

export default PublishedAudioButtons
