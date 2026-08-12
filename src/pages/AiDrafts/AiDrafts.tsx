import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import VideoCard from '../../shared/components/VideoCard/VideoCard'
import Spinner from '../../shared/components/Spinner/Spinner'
import Button from '../../shared/components/Button/Button'
import YouTubeService from '../../shared/utils/YouTubeService'
import convertISO8601ToSeconds from '../../shared/utils/convertISO8601ToSeconds'
import convertSecondsToCardFormat from '../../shared/utils/convertSecondsToCardFormat'
import './aiDrafts.css'

interface AiDraft {
  audio_description_id: string
  video_id: string
  youtube_id: string
  video_name: string
  video_length?: number
  createdAt: number
  updatedAt: number
  status: string
  admin_review: boolean
}

interface AiDraftCard extends AiDraft {
  title: string
  author: string
  thumbnailMediumUrl: string
  duration: string
}

interface AiDraftsResponse {
  result: AiDraft[]
  totalVideos: number
}

const AiDrafts = () => {
  const [drafts, setDrafts] = useState<AiDraftCard[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalVideos, setTotalVideos] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasError, setHasError] = useState(false)

  const fetchDrafts = useCallback(async (page: number) => {
    try {
      if (page === 1) {
        setIsLoading(true)
        setHasError(false)
      } else {
        setIsLoadingMore(true)
      }

      const response = await axios.get<AiDraftsResponse>(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-All-AI-descriptions`,
        {
          params: {
            pageNumber: page,
          },
        },
      )

      const newDrafts = response.data.result || []
      const youtubeIds = newDrafts.map((draft) => draft.youtube_id)
      const youtubeVideos =
        youtubeIds.length > 0
          ? await YouTubeService.getVideoDetails(youtubeIds)
          : []

      const youtubeVideoMap = new Map(
        youtubeVideos.map((video) => [video.id, video]),
      )

      const newCards: AiDraftCard[] = newDrafts.map((draft) => {
        const youtubeVideo = youtubeVideoMap.get(draft.youtube_id)

        return {
          ...draft,
          title: youtubeVideo?.snippet?.title || draft.video_name,
          author: youtubeVideo?.snippet?.channelTitle || 'Unknown',
          thumbnailMediumUrl:
            youtubeVideo?.snippet?.thumbnails?.medium?.url ||
            youtubeVideo?.snippet?.thumbnails?.default?.url ||
            '',
          duration: youtubeVideo?.contentDetails?.duration
            ? convertSecondsToCardFormat(
                convertISO8601ToSeconds(youtubeVideo.contentDetails.duration),
                true,
              )
            : '',
        }
      })

      setDrafts((currentDrafts) =>
        page === 1 ? newCards : [...currentDrafts, ...newCards],
      )
      setTotalVideos(response.data.totalVideos || 0)
    } catch (error) {
      console.error('Unable to load AI drafts:', error)
      setHasError(true)
      toast.error('Unable to load AI drafts. Please try again later.')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchDrafts(1)
  }, [fetchDrafts])

  const loadMoreDrafts = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchDrafts(nextPage)
  }

  return (
    <main id="ai-drafts" title="AI Drafts">
      <header role="banner" className="classic-header w3-container w3-indigo">
        <h2 id="ai-drafts-heading" className="classic-h2" tabIndex={0}>
          AI DRAFTS
        </h2>
      </header>

      <div className="classic-container ai-drafts-introduction">
        <p>
          Preview AI-generated audio descriptions that have not yet been
          reviewed or published.
        </p>
      </div>

      {isLoading ? <Spinner /> : null}

      {!isLoading && hasError && drafts.length === 0 ? (
        <div className="classic-container ai-drafts-message">
          <p>AI drafts could not be loaded.</p>
          <Button
            ariaLabel="Try loading AI drafts again"
            color="w3-indigo"
            text="Try again"
            onClick={() => fetchDrafts(1)}
          />
        </div>
      ) : null}

      {!isLoading && !hasError && drafts.length === 0 ? (
        <div className="classic-container ai-drafts-message">
          <p>No AI drafts are available.</p>
        </div>
      ) : null}

      <div className="w3-row classic-container row ai-drafts-grid">
        {drafts.map((draft) => (
          <div
            className="col-sm-6 col-md-4 col-lg-3"
            key={draft.audio_description_id}
          >
            <VideoCard
              youTubeId={draft.youtube_id}
              audioDescriptionId={draft.audio_description_id}
              title={draft.title}
              thumbnailMediumUrl={draft.thumbnailMediumUrl}
              author={draft.author}
              duration={draft.duration}
              time=""
              buttons="none"
              previewUrl={`/video/${draft.youtube_id}?ad=${draft.audio_description_id}`}
            />
          </div>
        ))}
      </div>

      {drafts.length < totalVideos ? (
        <div className="w3-center ai-drafts-load-more">
          <Button
            ariaLabel="Load more AI drafts"
            color="w3-indigo"
            text={isLoadingMore ? 'Loading…' : 'Load more'}
            disabled={isLoadingMore}
            onClick={loadMoreDrafts}
          />
        </div>
      ) : null}
    </main>
  )
}

export default AiDrafts
