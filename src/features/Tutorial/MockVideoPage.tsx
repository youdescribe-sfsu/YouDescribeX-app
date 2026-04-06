import VideoPlayerControls from '@/shared/components/VideoPlayerControls/VideoPlayerControls'
import { useState } from 'react'
import ShareBar from '@/features/Video/ShareBar/ShareBar'
import Button from '@/shared/components/Button/Button'
import YTInfoCard from '@/features/Video/YTInfoCard/YTInfoCard'
import MockThumbnail from './MockThumbnail'
import '@/pages/Video/video.scss'
import './tutorial.scss'
import {
  DEFAULT_DESCRIPTION_VOLUME,
  DEFAULT_YOUTUBE_VOLUME,
  MOCK_THUMBNAIL_URL,
  MOCK_VIDEO_METADATA,
  noop,
} from './tutorialConstants'

/**
 * Tutorial mock of the Video page. Uses the same structure and styles as the
 * real Video page (video-page, video-area, w3-card-2, etc.) so it looks in-app.
 */
const MockVideoPage = () => {
  const [descriptionVolume, setDescriptionVolume] = useState(
    DEFAULT_DESCRIPTION_VOLUME,
  )
  const [youTubeVolume, setYouTubeVolume] = useState(DEFAULT_YOUTUBE_VOLUME)

  return (
    <div id="video-page" className="video-page">
      <main role="main" className="video-page-main" title="Video page">
        <section id="video-area" className="video-area">
          <ShareBar videoTitle={MOCK_VIDEO_METADATA.title} />
          <div id="video" className="video">
            <MockThumbnail
              thumbnailUrl={MOCK_THUMBNAIL_URL}
              alt="Video Thumbnail"
              width="100%"
              height="100%"
              minHeight={440}
              iconSize={72}
              overlayTextColor="rgba(255,255,255,0.5)"
            />
          </div>
          <div
            className="classic-container audio-ducking-container"
            aria-hidden="true"
          >
            <VideoPlayerControls
              descriptionVolume={descriptionVolume}
              setDescriptionVolume={setDescriptionVolume}
              youTubeVideoVolume={youTubeVolume}
              setYouTubeVideoVolume={setYouTubeVolume}
            />
          </div>
          <div className="classic-container video-timeline" aria-hidden="true">
            <div
              style={{
                height: 15,
                backgroundColor: '#f5f5f5',
                borderRadius: 7,
                overflow: 'hidden',
              }}
            />
          </div>
        </section>
        <section
          id="video-info"
          className="classic-container w3-row video-info"
        >
          <div className="w3-col l8 m8">
            <YTInfoCard
              videoTitle={MOCK_VIDEO_METADATA.title}
              videoAuthor={MOCK_VIDEO_METADATA.author}
              videoViews={MOCK_VIDEO_METADATA.views}
              videoPublishedAt={MOCK_VIDEO_METADATA.publishedAt}
              videoLikes={MOCK_VIDEO_METADATA.likes}
            />
          </div>
          <div id="no-descriptions" className="w3-col l4 m4">
            <div className="w3-card-2">
              <h3 className="classic-h3">No descriptions available</h3>
              <div data-tutorial="wishlist-btn">
                <Button
                  title="Add this video to your wishlist"
                  ariaLabel="Add to wishlist"
                  text="Add to WISHLIST"
                  color="w3-indigo w3-block w3-margin-top"
                  onClick={noop}
                />
              </div>
              <div className="description-buttons">
                <div
                  data-tutorial="freestyle-btn"
                  className="tutorial-video-btn-wrap"
                >
                  <Button
                    title="Add a new description for this video"
                    ariaLabel="Add a new description for this video"
                    text="Add Freestyle Description"
                    color="w3-yellow w3-block"
                    onClick={noop}
                  />
                </div>
                <div
                  data-tutorial="request-ai-btn"
                  className="tutorial-video-btn-wrap"
                >
                  <Button
                    title="Request AI Descriptions"
                    ariaLabel="Request AI Descriptions"
                    text="Request AI Descriptions"
                    color="w3-light-blue w3-block w3-margin-top ai-request-button"
                    onClick={noop}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default MockVideoPage
