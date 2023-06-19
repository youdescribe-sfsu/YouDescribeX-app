import { translate } from '@/App'
import './ytInfoCard.scss'

interface Props {
  videoTitle: string
  videoAuthor: string
  videoViews: string
  videoPublishedAt: string
  videoLikes: string
}

const YTInfoCard = ({
  videoTitle,
  videoAuthor,
  videoViews,
  videoPublishedAt,
  videoLikes,
}: Props) => {
  return (
    <div id="yt-info-card" className="w3-card-2 yt-info-card">
      <h2 className="classic-h2">{videoTitle}</h2>
      <span>{videoAuthor}</span>
      <span style={{ float: 'right' }}>{videoViews}</span>
      <hr className="classic-hr" style={{ marginTop: 0 }} aria-hidden="true" />
      <div id="time-and-likes-container" className="time-and-likes-container">
        <div id="publish-time" className="publish-time">
          {translate('Published on')} {videoPublishedAt}
        </div>
        <div id="video-likes" className="video-likes">
          <span style={{ paddingRight: '16px' }}>
            <i className="fa fa-thumbs-o-up" aria-hidden="true" /> {videoLikes}
          </span>
        </div>
      </div>
    </div>
  )
}

export default YTInfoCard
