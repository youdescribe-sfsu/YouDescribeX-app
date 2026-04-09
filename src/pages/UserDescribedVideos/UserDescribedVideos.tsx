import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import Spinner from '@/shared/components/Spinner/Spinner'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl } from '@/shared/config'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './UserDescribedVideos.css'
import YouTubeService from '@/shared/utils/YouTubeService'

const UserDescribedVideos = () => {
  const [showSpinner, setShowSpinner] = useState(true)
  const [videos, setVideos] = useState<any[]>([])
  const [videosAI, setAIVideos] = useState<any[]>([])
  const [videosDraft, setVideosDraft] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageAI, setCurrentPageAI] = useState(1)
  const [currentPageDraft, setCurrentPageDraft] = useState(1)
  const [loadMoreVideos, setLoadMoreVideos] = useState(false)
  const [loadMoreAIVideos, setLoadMoreAIVideos] = useState(false)
  const [loadMoreDraftVideos, setLoadMoreDraftVideos] = useState(false)
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false)
  const [showLoadMoreAIButton, setShowLoadMoreAIButton] = useState(false)
  const [showLoadMoreDraftButton, setShowLoadMoreDraftButton] = useState(false)
  const { userId } = useParams()

  type VideoListType = 'described' | 'ai' | 'draft'

  const handleView = (videoId: string): void => {
    const recentViews: Record<string, number> = JSON.parse(
      localStorage.getItem('recentViews') || '{}',
    )

    recentViews[videoId] = Date.now()
    localStorage.setItem('recentViews', JSON.stringify(recentViews))
  }

  const onVideoClick = (videoId: string) => {
    handleView(videoId)
  }

  const myDescribedVideosUrl = process.env.REACT_APP_USE_YDX
    ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-my-descriptions`
    : `${apiUrl}/audio-descriptions/get-my-descriptions`

  const myDraftVideosUrl = process.env.REACT_APP_USE_YDX
    ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-my-draft-descriptions`
    : `${apiUrl}/audio-descriptions/get-my-draft-descriptions`

  const aiRequestedVideosUrl = process.env.REACT_APP_USE_YDX
    ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/get-user-Ai-DescriptionRequests`
    : `${apiUrl}/users/get-user-Ai-DescriptionRequests`

  const normalizeApiResponse = (
    responseData: any,
  ): { videos: any[]; total: number } => {
    if (Array.isArray(responseData)) {
      return {
        videos: responseData[0]?.videos || [],
        total: responseData[0]?.total || 0,
      }
    }

    return {
      videos: responseData?.videos || [],
      total: responseData?.total || 0,
    }
  }

  const getStateSetter = (listType: VideoListType) => {
    switch (listType) {
      case 'described':
        return setVideos
      case 'ai':
        return setAIVideos
      default:
        return setVideosDraft
    }
  }

  const setLoadMoreButtonVisibility = (
    listType: VideoListType,
    visible: boolean,
  ) => {
    if (listType === 'described') {
      setShowLoadMoreButton(visible)
    } else if (listType === 'ai') {
      setShowLoadMoreAIButton(visible)
    } else {
      setShowLoadMoreDraftButton(visible)
    }
  }

  const stopLoadMoreSpinner = (listType: VideoListType) => {
    if (listType === 'described') {
      setLoadMoreVideos(false)
    } else if (listType === 'ai') {
      setLoadMoreAIVideos(false)
    } else {
      setLoadMoreDraftVideos(false)
    }
  }

  const buildVideoCards = (
    videoDetails: any[],
    audioDescriptionIds: string[],
  ) => {
    return videoDetails.map((item) => {
      const youTubeId = item.id
      const thumbnail = item.snippet.thumbnails.medium
      const duration = convertSecondsToCardFormat(
        convertISO8601ToSeconds(item.contentDetails.duration),
      )
      const title = item.snippet.title
      const author = item.snippet.channelTitle
      const views = convertViewsToCardFormat(Number(item.statistics.viewCount))
      const publishedAt = new Date(item.snippet.publishedAt).getTime()
      const time = convertTimeToCardFormat(Date.now() - publishedAt)
      const audioDescriptionId = audioDescriptionIds[videoDetails.indexOf(item)]

      return (
        <div className="col-sm-6 col-md-4 col-lg-3" key={youTubeId}>
          <VideoCard
            key={youTubeId}
            youTubeId={youTubeId}
            audioDescriptionId={audioDescriptionId}
            thumbnailMediumUrl={thumbnail.url}
            duration={duration}
            title={title}
            author={author}
            views={views}
            time={time}
            buttons="edit"
            onClick={() => onVideoClick(youTubeId)}
          />
        </div>
      )
    })
  }

  const getUserVideos = async (
    url: string,
    listType: VideoListType,
    page: number,
  ) => {
    try {
      const response = await axios.get(url, {
        params: { paginate: 'false', page },
        withCredentials: true,
      })

      const normalizedData = normalizeApiResponse(response.data)
      const videosArray = normalizedData.videos
      const totalVideos = normalizedData.total
      const setStateFunction = getStateSetter(listType)

      if (!videosArray || videosArray.length === 0) {
        if (page === 1) {
          setStateFunction([])
        }
        setLoadMoreButtonVisibility(listType, false)
        stopLoadMoreSpinner(listType)
        setShowSpinner(false)
        return
      }

      const youTubeVideoIds = videosArray.map(
        (video: { youtube_video_id: string }) => video.youtube_video_id,
      )
      const audioDescriptionIds = videosArray.map(
        (video: { audio_description_id: string }) => video.audio_description_id,
      )

      const videoDetails = await YouTubeService.getVideoDetails(youTubeVideoIds)
      const videoComponents = buildVideoCards(videoDetails, audioDescriptionIds)

      setStateFunction((previousVideos) =>
        page === 1 ? videoComponents : [...previousVideos, ...videoComponents],
      )

      setLoadMoreButtonVisibility(listType, totalVideos > page * 20)
      stopLoadMoreSpinner(listType)
      setShowSpinner(false)
    } catch (error) {
      console.error('Error fetching videos:', error)
      setLoadMoreButtonVisibility(listType, false)
      stopLoadMoreSpinner(listType)
      setShowSpinner(false)
    }
  }

  const loadMoreResults = () => {
    setLoadMoreVideos(true)
    setCurrentPage((previousPage) => previousPage + 1)
  }

  const loadMoreResultsAI = () => {
    setLoadMoreAIVideos(true)
    setCurrentPageAI((previousPage) => previousPage + 1)
  }

  const loadMoreResultsDraft = () => {
    setLoadMoreDraftVideos(true)
    setCurrentPageDraft((previousPage) => previousPage + 1)
  }

  const YDLoadMoreButton = showLoadMoreButton ? (
    <div className="w3-margin-top w3-center load-more">
      <Button
        title={translate('Load more videos')}
        ariaLabel="Load More"
        color="w3-indigo"
        text="Load more"
        onClick={loadMoreResults}
      />
    </div>
  ) : null

  const YDLoadMoreButtonAI = showLoadMoreAIButton ? (
    <div className="w3-margin-top w3-center load-more">
      <Button
        title={translate('Load more videos')}
        ariaLabel="Load More"
        color="w3-indigo"
        text="Load more"
        onClick={loadMoreResultsAI}
      />
    </div>
  ) : null

  const YDLoadMoreButtonDraft = showLoadMoreDraftButton ? (
    <div className="w3-margin-top w3-center load-more">
      <Button
        title={translate('Load more videos')}
        ariaLabel="Load More"
        color="w3-indigo"
        text="Load more"
        onClick={loadMoreResultsDraft}
      />
    </div>
  ) : null

  useEffect(() => {
    if (userId) {
      getUserVideos(myDescribedVideosUrl, 'described', currentPage)
    }
  }, [userId, currentPage])

  useEffect(() => {
    if (userId) {
      getUserVideos(myDraftVideosUrl, 'draft', currentPageDraft)
    }
  }, [userId, currentPageDraft])

  useEffect(() => {
    if (userId) {
      getUserVideos(aiRequestedVideosUrl, 'ai', currentPageAI)
    }
  }, [userId, currentPageAI])

  if (
    !userDataStore.getState().isSignedIn ||
    userId !== userDataStore.getState().userId
  ) {
    return (
      <div id="user-videos-page" title="User described videos page">
        <main>
          <section>
            <header className="w3-container w3-indigo">
              <h2 className="classic-h2">{translate('MY DESCRIBED VIDEOS')}</h2>
            </header>
            <h2 className="classic-h2">Sign In Required</h2>
            <p>
              Sorry! The link you followed points to a YouDescribe page that
              requires you to sign in to your account
            </p>
            <p>Please Sign In using your google account to access this page.</p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div id="user-videos-page" title="User described videos page">
      <main>
        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('MY DESCRIBED VIDEOS')}</h2>
          </header>

          {showSpinner ? <Spinner /> : null}

          {videos.length === 0 && !showSpinner && (
            <div className="no-videos-message">
              <i className="fas fa-video-slash no-videos-icon"></i>
              <p className="no-videos-text">
                {translate('No videos to display')}
              </p>
            </div>
          )}
          <div className="w3-row classic-container row">{videos}</div>

          {YDLoadMoreButton}
        </section>
        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('MY DRAFT VIDEOS')}</h2>
          </header>

          {showSpinner ? <Spinner /> : null}

          {videosDraft.length === 0 && !showSpinner && (
            <div className="no-videos-message">
              <i className="fas fa-video-slash no-videos-icon"></i>
              <p className="no-videos-text">
                {translate('No draft videos to display')}
              </p>
            </div>
          )}
          <div className="w3-row classic-container row">{videosDraft}</div>

          {YDLoadMoreButtonDraft}
        </section>
        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('AI REQUESTED VIDEOS')}</h2>
          </header>

          {showSpinner ? <Spinner /> : null}

          {videosAI.length === 0 && !showSpinner && (
            <div className="no-videos-message">
              <i className="fas fa-video-slash no-videos-icon"></i>
              <p className="no-videos-text">
                {translate('No AI requested videos to display')}
              </p>
            </div>
          )}
          <div className="w3-row classic-container row">{videosAI}</div>

          {YDLoadMoreButtonAI}
        </section>
      </main>
    </div>
  )
}

export default UserDescribedVideos
