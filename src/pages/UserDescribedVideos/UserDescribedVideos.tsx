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
  const [LoadMoreVideos, setLoadMoreVideos] = useState<boolean>(false)
  const [LoadMoreAIVideos, setLoadMoreAIVideos] = useState<boolean>(false)
  const [LoadMoreDraftVideos, setLoadMoreDraftVideos] = useState<boolean>(false)
  // Initialize these to false instead of true
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false)
  const [showLoadMoreAIButton, setShowLoadMoreAIButton] = useState(false)
  const [showLoadMoreDraftButton, setShowLoadMoreDraftButton] = useState(false)
  const { userId } = useParams()

  // Function to track video views in localStorage
  const handleView = (videoId: string): void => {
    const recentViews: Record<string, number> = JSON.parse(
      localStorage.getItem('recentViews') || '{}',
    )

    // Update the view timestamp for the given video ID
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
    // If response is an array (first endpoint case), take the first item
    if (Array.isArray(responseData)) {
      return {
        videos: responseData[0]?.videos || [],
        total: responseData[0]?.total || 0,
      }
    }

    // Otherwise, it's already in the desired object format (second and third endpoints)
    return {
      videos: responseData?.videos || [],
      total: responseData?.total || 0,
    }
  }

  const getUserVideos = async (
    url: string,
    setStateFunction: React.Dispatch<React.SetStateAction<any[]>>,
    page: number,
  ) => {
    try {
      // Step 1: Get video IDs from our backend (keep this part)
      const response = await axios.get(url, {
        params: { paginate: 'false', page },
        withCredentials: true,
      })

      const normalizedData = normalizeApiResponse(response.data)

      const videosArray = normalizedData.videos
      const totalVideos = normalizedData.total

      // If no videos, update state and hide spinner and load more button
      if (!videosArray || videosArray.length === 0) {
        setStateFunction([])

        // Hide the appropriate "Load more" button based on which function is being called
        if (setStateFunction === setVideos) {
          setShowLoadMoreButton(false)
        } else if (setStateFunction === setAIVideos) {
          setShowLoadMoreAIButton(false)
        } else if (setStateFunction === setVideosDraft) {
          setShowLoadMoreDraftButton(false)
        }

        setShowSpinner(false)
        return
      }

      // Extract required IDs
      const youTubeVideoIds = videosArray.map(
        (video: { youtube_video_id: any }) => video.youtube_video_id,
      )
      const youDescribeVideosIds = videosArray.map(
        (video: { video_id: any }) => video.video_id,
      )
      const audioDescriptionIds = videosArray.map(
        (video: { audio_description_id: any }) => video.audio_description_id,
      )

      // Step 2: Replace YouTube API call with YouTubeService
      const videoDetails = await YouTubeService.getVideoDetails(youTubeVideoIds)

      // Create compatible format for parseResponseData
      const youTubeVideosArray = { items: videoDetails }

      // Process the response (existing method)
      parseResponseData(
        youTubeVideosArray,
        youDescribeVideosIds,
        audioDescriptionIds,
        setStateFunction,
        totalVideos,
        page,
      )
    } catch (error) {
      console.error('Error fetching videos:', error)

      // In case of error, hide the appropriate load more button
      if (setStateFunction === setVideos) {
        setShowLoadMoreButton(false)
      } else if (setStateFunction === setAIVideos) {
        setShowLoadMoreAIButton(false)
      } else if (setStateFunction === setVideosDraft) {
        setShowLoadMoreDraftButton(false)
      }

      setShowSpinner(false)
    }
  }

  const parseResponseData = (
    youTubeVideosArray: any,
    youDescribeVideosIds: string[],
    audioDescriptionIds: string[],
    setStateFunction: React.Dispatch<React.SetStateAction<any[]>>,
    totalVideos: number,
    page: number,
  ) => {
    const videoComponents = []
    // Determine which collection of videos we're working with
    const existingVideos =
      setStateFunction === setVideos
        ? videos
        : setStateFunction === setAIVideos
        ? videosAI
        : videosDraft

    for (let i = 0; i < youTubeVideosArray.items.length; i += 1) {
      const item = youTubeVideosArray.items[i]
      const youDescribeVideoId = youDescribeVideosIds[i]
      const audioDescriptionId = audioDescriptionIds[i]
      const youTubeId = item.id
      const thumbnail = item.snippet.thumbnails.medium
      const duration = convertSecondsToCardFormat(
        convertISO8601ToSeconds(item.contentDetails.duration),
      )
      const title = item.snippet.title
      const author = item.snippet.channelTitle
      const views = convertViewsToCardFormat(Number(item.statistics.viewCount))
      const publishedAt = new Date(item.snippet.publishedAt).getMilliseconds()
      const now = Date.now()
      const time = convertTimeToCardFormat(Number(now - publishedAt))

      videoComponents.push(
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
        </div>,
      )
    }

    const updatedVideos = [...existingVideos, ...videoComponents]

    // Determine which state setter to use based on which category we're processing
    const loadMoreFlag =
      setStateFunction === setVideos
        ? setShowLoadMoreButton
        : setStateFunction === setAIVideos
        ? setShowLoadMoreAIButton
        : setShowLoadMoreDraftButton

    // Show "Load more" button only if there are more videos to load
    const currentTotal = updatedVideos.length
    loadMoreFlag(totalVideos > currentTotal)

    const loadMoreSpinnerFlag =
      setStateFunction === setVideos
        ? setLoadMoreVideos
        : setStateFunction === setAIVideos
        ? setLoadMoreAIVideos
        : setLoadMoreDraftVideos
    loadMoreSpinnerFlag(false)

    setShowSpinner(false)

    setStateFunction(updatedVideos)
  }

  const loadMoreResults = () => {
    setLoadMoreVideos(true)
    setCurrentPage(currentPage + 1)
    getUserVideos(myDescribedVideosUrl, setVideos, currentPage + 1)
  }

  const loadMoreResultsAI = () => {
    setLoadMoreAIVideos(true)
    setCurrentPageAI(currentPageAI + 1)
    getUserVideos(aiRequestedVideosUrl, setAIVideos, currentPageAI + 1)
  }

  const loadMoreResultsDraft = () => {
    setLoadMoreDraftVideos(true)
    setCurrentPageDraft(currentPageDraft + 1)
    getUserVideos(myDraftVideosUrl, setVideosDraft, currentPageDraft + 1)
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
      getUserVideos(myDescribedVideosUrl, setVideos, currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentPage])

  useEffect(() => {
    if (userId) {
      getUserVideos(myDraftVideosUrl, setVideosDraft, currentPageDraft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentPageDraft])

  useEffect(() => {
    if (userId) {
      getUserVideos(aiRequestedVideosUrl, setAIVideos, currentPageAI)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  } else {
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
}

export default UserDescribedVideos
