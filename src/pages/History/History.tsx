import { translate, userDataStore } from '@/App'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl } from '@/shared/config'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import './history.scss'
import Spinner from 'react-bootstrap/Spinner'
import YouTubeService from '@/shared/utils/YouTubeService'

interface VideosState {
  data: any[]
  totalVideos: number
  totalPages: number
  currentPage: number
  videoComponentData: any[]
}

type SetVideosData = React.Dispatch<React.SetStateAction<VideosState | null>>

type DataState = VideosState | null

type FetchVideosDataFunction = (
  dataState: DataState,
  setVideosData: SetVideosData,
  apiEndpoint: string,
  setVideoLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
) => Promise<void>

const CustomButton = ({
  className,
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  className: string
  disabled: boolean
  children: React.ReactNode
}) => {
  const buttonStyle: React.CSSProperties = {
    opacity: disabled ? '50%' : '100%',
  }

  const handleHover = (event: any) => {
    if (!disabled) {
      // Add your custom hover style changes here
      event.target.style.cursor = 'pointer'
      // Other hover effects
    } else {
      event.target.style.cursor = 'not-allowed'
    }
  }

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      onMouseOver={handleHover}
    >
      {children}
    </button>
  )
}

const CustomSpinner = () => (
  <div className="d-flex justify-content-between align-items-center h-100 h-100 m-auto">
    <div className="w3-row classic-container row">
      <Spinner
        animation="border"
        role="status"
        style={{
          margin: 'auto',
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  </div>
)

const fetchVideoDetails = async (videoIds: string[]) => {
  if (!videoIds || !videoIds.length) {
    return []
  }

  try {
    return await YouTubeService.getVideoDetails(videoIds)
  } catch (error) {
    console.error('Error fetching video details:', error)
    return []
  }
}

const History = () => {
  const authUserId = userDataStore.getState().userId
  // Recent Descriptions
  const [recentDescriptions, setRecentDescriptions] =
    useState<VideosState | null>(null)
  const [showRecentDescriptionsSpinner, setShowRecentDescriptionsSpinner] =
    useState(true)

  // AI Requested Videos
  const [aiRequestedVideos, setAiRequestedVideos] =
    useState<VideosState | null>(null)
  const [showAiRequestedVideosSpinner, setShowAiRequestedVideosSpinner] =
    useState(true)

  // History Videos
  const [historyVideos, setHistoryVideos] = useState<VideosState | null>(null)
  const [showHistoryVideosSpinner, setShowHistoryVideosSpinner] = useState(true)

  const itemsPerPage = 4 // Change this as per your requirements

  const getRecentDescriptionsUrl = () => {
    return process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-my-descriptions`
      : `${apiUrl}/audio-descriptions/get-my-descriptions`
  }

  const getUserHistoryUrl = () => {
    return process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/get-Visited-Videos-History`
      : `${apiUrl}/users/get-Visited-Videos-History`
  }

  const getAiRequestedVideosUrl = () => {
    return process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/users/get-user-Ai-DescriptionRequests`
      : `${apiUrl}/users/get-user-Ai-DescriptionRequests`
  }

  const fetchRecentDescriptions = async () => {
    try {
      const response = await axios.get(getRecentDescriptionsUrl(), {
        params: {
          paginate: 'true',
          page: 1, // Always provide a default page
        },
        headers: authUserId ? { authorization: authUserId } : undefined,
        withCredentials: true,
      })

      // Handle array wrapped response
      let videos = []
      let total = 0

      if (Array.isArray(response.data) && response.data.length > 0) {
        videos = response.data[0].videos || []
        total = response.data[0].total || 0
      } else {
        videos = response.data.videos || []
        total = response.data.total || 0
      }

      return { videos, total }
    } catch (error) {
      console.error('Error fetching recent descriptions:', error)
      return { videos: [], total: 0 }
    }
  }

  const fetchAiRequestedVideos = async () => {
    try {
      const response = await axios.get(getAiRequestedVideosUrl(), {
        params: {
          paginate: 'true',
          page: 1,
        },
        headers: authUserId ? { authorization: authUserId } : undefined,
        withCredentials: true,
      })
      return {
        videos: response.data.videos || [],
        total: response.data.total || 0,
      }
    } catch (error) {
      console.error('Error fetching AI requested videos:', error)
      return { videos: [], total: 0 }
    }
  }

  const fetchHistoryVideos = async () => {
    try {
      const response = await axios.get(getUserHistoryUrl(), {
        params: {
          paginate: 'true',
          page: 1,
        },
        headers: authUserId ? { authorization: authUserId } : undefined,
        withCredentials: true,
      })
      return {
        videos: response.data.videos || [],
        total: response.data.total || 0,
      }
    } catch (error) {
      console.error('Error fetching history videos:', error)
      return { videos: [], total: 0 }
    }
  }

  const fetchVideosData: FetchVideosDataFunction = async (
    dataState,
    setVideosData,
    apiEndpoint,
    setLoadingState,
  ) => {
    try {
      const pageNumber = dataState?.currentPage || 1
      setLoadingState(true)

      const response = await axios.get(apiEndpoint, {
        params: {
          paginate: 'true',
          page: pageNumber,
        },
        headers: authUserId ? { authorization: authUserId } : undefined,
        withCredentials: true,
      })

      let responseData = response.data.videos
      let totalVideosLength = response.data.total

      // Handle array-wrapped response for my-descriptions
      if (
        apiEndpoint.includes('get-my-descriptions') &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        responseData = response.data[0].videos || []
        totalVideosLength = response.data[0].total || 0
      }

      const calculatedTotalVideoPages = Math.ceil(
        totalVideosLength / itemsPerPage,
      )

      // Extract necessary data for video fetching
      const videoIds: string[] = []
      const status: string[] = []
      const urls: string[] = []

      responseData.forEach((data: any) => {
        videoIds.push(data.youtube_video_id)
        status.push(data.status)
        urls.push(data.url)
      })

      const videoDetails = await fetchVideoDetails(videoIds)

      const videoData = videoDetails.map((item: any, index: any) => {
        return {
          youTubeId: item.id,
          thumbnailMediumUrl: item.snippet.thumbnails.medium.url,
          duration: convertSecondsToCardFormat(
            convertISO8601ToSeconds(item.contentDetails.duration),
          ),
          title: item.snippet.title,
          author: item.snippet.channelTitle,
          views: convertViewsToCardFormat(Number(item.statistics.viewCount)),
          time: convertTimeToCardFormat(
            Date.now() - new Date(item.snippet.publishedAt).getTime(), // Fix here
          ),
          status: status[index] === 'completed' ? urls[index] : null,
        }
      })

      setVideosData({
        data: videoData.slice(0, itemsPerPage),
        totalVideos: totalVideosLength,
        totalPages: calculatedTotalVideoPages,
        currentPage: pageNumber,
        videoComponentData: videoData,
      })
      setLoadingState(false)
    } catch (error) {
      console.error(`Error fetching ${apiEndpoint}:`, error)
      setLoadingState(false)
    }
  }

  const handleNextPage = (
    currentDataState: VideosState | null,
    setStateFunction: React.Dispatch<React.SetStateAction<VideosState | null>>,
    apiEndpoint: string,
    setVideoLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!currentDataState) return
    fetchVideosData(
      {
        ...currentDataState,
        currentPage: Math.min(
          currentDataState.currentPage + 1,
          currentDataState.totalPages,
        ),
      },
      setStateFunction,
      apiEndpoint,
      setVideoLoadingState,
    )
  }

  const handlePreviousPage = (
    currentDataState: VideosState | null,
    setStateFunction: React.Dispatch<React.SetStateAction<VideosState | null>>,
    apiEndpoint: string,
    setVideoLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!currentDataState) return
    fetchVideosData(
      {
        ...currentDataState,
        currentPage: Math.max(currentDataState.currentPage - 1, 1),
      },
      setStateFunction,
      apiEndpoint,
      setVideoLoadingState,
    )
  }

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch descriptions from the different sections
        const recentData = await fetchRecentDescriptions()

        const aiData = await fetchAiRequestedVideos()

        const historyData = await fetchHistoryVideos()

        // Extract all YouTube IDs from the responses
        const videoIdsToFetch = new Set<string>()

        // Process recent descriptions
        recentData.videos.forEach((desc: any) => {
          if (desc.youtube_video_id) {
            videoIdsToFetch.add(desc.youtube_video_id)
          }
        })

        // Process AI requested videos
        aiData.videos.forEach((video: any) => {
          if (video.youtube_video_id) {
            videoIdsToFetch.add(video.youtube_video_id)
          }
        })

        // Process history videos
        historyData.videos.forEach((video: any) => {
          if (video.youtube_video_id) {
            videoIdsToFetch.add(video.youtube_video_id)
          }
        })

        // Fetch all video details in one batch
        const videoDetails = await fetchVideoDetails(
          Array.from(videoIdsToFetch),
        )

        // Create a map for easy access by ID
        const videoMap = new Map()
        videoDetails.forEach((video) => {
          videoMap.set(video.id, video)
        })

        // Process each dataset with the fetched video details
        const processedRecentData = processVideoData(
          recentData.videos,
          recentData.total,
          'youtube_video_id',
          videoMap,
        )

        const processedAiData = processVideoData(
          aiData.videos,
          aiData.total,
          'youtube_video_id',
          videoMap,
        )

        const processedHistoryData = processVideoData(
          historyData.videos,
          historyData.total,
          'youtube_video_id',
          videoMap,
        )

        // Now set the state for each section
        setRecentDescriptions(processedRecentData)
        setAiRequestedVideos(processedAiData)
        setHistoryVideos(processedHistoryData)

        // Update loading states
        setShowRecentDescriptionsSpinner(false)
        setShowAiRequestedVideosSpinner(false)
        setShowHistoryVideosSpinner(false)
      } catch (error) {
        console.error('Error fetching history data:', error)
        setShowRecentDescriptionsSpinner(false)
        setShowAiRequestedVideosSpinner(false)
        setShowHistoryVideosSpinner(false)
      }
    }

    fetchAllData()
  }, [])

  const processVideoData = (
    data: any[],
    totalCount: number,
    idField: string,
    videoMap: Map<string, any>,
  ) => {
    const videoComponentData = []

    for (const item of data) {
      const videoId = item[idField]
      const videoDetails = videoMap.get(videoId)

      if (videoDetails) {
        try {
          videoComponentData.push({
            youTubeId: videoDetails.id,
            thumbnailMediumUrl: videoDetails.snippet.thumbnails.medium.url,
            duration: convertSecondsToCardFormat(
              convertISO8601ToSeconds(videoDetails.contentDetails.duration),
            ),
            title: videoDetails.snippet.title,
            author: videoDetails.snippet.channelTitle,
            views: convertViewsToCardFormat(
              Number(videoDetails.statistics.viewCount),
            ),
            time: convertTimeToCardFormat(
              Date.now() - new Date(videoDetails.snippet.publishedAt).getTime(), // Fix: changed getMilliseconds() to getTime()
            ),
            status: item.status === 'completed' ? item.url : null,
          })
        } catch (error) {
          console.error(`Error processing video ${videoId}:`, error)
        }
      }
    }

    const result = {
      data: videoComponentData.slice(0, itemsPerPage),
      totalVideos: totalCount, // Use total from API response
      totalPages: Math.ceil(totalCount / itemsPerPage),
      currentPage: 1,
      videoComponentData,
    }
    return result
  }

  return (
    <div id="user-videos-page" title="User described videos page">
      <main>
        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('MY HISTORY')}</h2>
          </header>

          <div className="d-flex justify-content-center custom-carousel flex min-h-[290px] m-auto">
            {!userDataStore.getState().isSignedIn ? (
              <div className="auth-required-message">
                <i className="fas fa-lock auth-required-icon"></i>
                <p className="auth-required-text">
                  Log in to view your browsing history
                </p>
              </div>
            ) : (
              <>
                {!historyVideos && <CustomSpinner />}
                {historyVideos && historyVideos?.data.length > 0 && (
                  <>
                    {/* Custom previous button */}
                    <CustomButton
                      className="prev-icon"
                      onClick={() =>
                        handlePreviousPage(
                          historyVideos,
                          setHistoryVideos,
                          getUserHistoryUrl(),
                          setShowHistoryVideosSpinner,
                        )
                      }
                      disabled={historyVideos.currentPage === 1}
                    >
                      &lt;
                    </CustomButton>

                    {/* Content for displaying videos */}
                    <div className="w3-row classic-container row">
                      {showHistoryVideosSpinner ? (
                        <CustomSpinner />
                      ) : (
                        historyVideos.videoComponentData.map((video) => (
                          <div
                            className="col-sm-6 col-md-4 col-lg-3"
                            key={video.youTubeId}
                          >
                            <VideoCard {...video} />
                          </div>
                        ))
                      )}
                    </div>

                    {/* Custom next button */}
                    <CustomButton
                      className="next-icon"
                      onClick={() =>
                        handleNextPage(
                          historyVideos,
                          setHistoryVideos,
                          getUserHistoryUrl(),
                          setShowHistoryVideosSpinner,
                        )
                      }
                      disabled={
                        historyVideos.currentPage === historyVideos.totalPages
                      }
                    >
                      &gt;
                    </CustomButton>
                  </>
                )}
                {historyVideos?.data.length === 0 && (
                  <div className="no-videos-message">
                    <i className="fas fa-video-slash no-videos-icon"></i>
                    <p className="no-videos-text">No history to view.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('MY DESCRIPTIONS')}</h2>
          </header>

          <div className="custom-carousel flex min-h-[290px]">
            {!userDataStore.getState().isSignedIn ? (
              <div className="auth-required-message">
                <i className="fas fa-lock auth-required-icon"></i>
                <p className="auth-required-text">
                  Log in to view your recent descriptions
                </p>
              </div>
            ) : (
              <>
                {!recentDescriptions && <CustomSpinner />}
                {recentDescriptions && recentDescriptions?.data.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center h-100 m-auto">
                    <CustomButton
                      className="prev-icon"
                      onClick={() =>
                        handlePreviousPage(
                          recentDescriptions,
                          setRecentDescriptions,
                          getRecentDescriptionsUrl(),
                          setShowRecentDescriptionsSpinner,
                        )
                      }
                      disabled={recentDescriptions.currentPage === 1}
                    >
                      &lt;
                    </CustomButton>

                    {/* Content for displaying videos */}
                    <div className="w3-row classic-container row">
                      {showRecentDescriptionsSpinner ? (
                        <CustomSpinner />
                      ) : (
                        recentDescriptions.videoComponentData.map(
                          (video: any) => (
                            <div
                              className="col-sm-6 col-md-4 col-lg-3"
                              key={video.youTubeId}
                            >
                              <VideoCard {...video} />
                            </div>
                          ),
                        )
                      )}
                    </div>

                    {/* Custom next button */}
                    <CustomButton
                      className="next-icon"
                      onClick={() =>
                        handleNextPage(
                          recentDescriptions,
                          setRecentDescriptions,
                          getRecentDescriptionsUrl(),
                          setShowRecentDescriptionsSpinner,
                        )
                      }
                      disabled={
                        recentDescriptions.currentPage ===
                        recentDescriptions.totalPages
                      }
                    >
                      &gt;
                    </CustomButton>
                  </div>
                )}
                {recentDescriptions?.data.length === 0 && (
                  <div className="no-videos-message">
                    <i className="fas fa-video-slash no-videos-icon"></i>
                    <p className="no-videos-text">
                      No Recent descriptions to view
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">
              {translate('MY AI REQUESTED VIDEOS')}
            </h2>
          </header>

          <div className="custom-carousel flex min-h-[290px]">
            {!userDataStore.getState().isSignedIn ? (
              <div className="auth-required-message">
                <i className="fas fa-lock auth-required-icon"></i>
                <p className="auth-required-text">
                  Log in to view your AI-generated descriptions
                </p>
              </div>
            ) : (
              <>
                {!aiRequestedVideos && <CustomSpinner />}
                {aiRequestedVideos && aiRequestedVideos?.data.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center h-100 m-auto">
                    {/* Custom previous button */}
                    <CustomButton
                      className="prev-icon"
                      onClick={() =>
                        handlePreviousPage(
                          aiRequestedVideos,
                          setAiRequestedVideos,
                          getAiRequestedVideosUrl(),
                          setShowAiRequestedVideosSpinner,
                        )
                      }
                      disabled={aiRequestedVideos.currentPage === 1}
                    >
                      &lt;
                    </CustomButton>

                    {/* Content for displaying videos */}
                    <div className="w3-row classic-container row">
                      {showAiRequestedVideosSpinner ? (
                        <CustomSpinner />
                      ) : (
                        aiRequestedVideos.videoComponentData.map(
                          (video: any) => (
                            <div
                              className="col-sm-6 col-md-4 col-lg-3"
                              key={video.youTubeId}
                            >
                              <VideoCard {...video} />
                            </div>
                          ),
                        )
                      )}
                    </div>

                    {/* Custom next button */}
                    <CustomButton
                      className="next-icon"
                      onClick={() =>
                        handleNextPage(
                          aiRequestedVideos,
                          setAiRequestedVideos,
                          getAiRequestedVideosUrl(),
                          setShowAiRequestedVideosSpinner,
                        )
                      }
                      disabled={
                        aiRequestedVideos.currentPage ===
                        aiRequestedVideos.totalPages
                      }
                    >
                      &gt;
                    </CustomButton>
                  </div>
                )}
                {aiRequestedVideos?.data.length === 0 && (
                  <div className="no-videos-message">
                    <i className="fas fa-video-slash no-videos-icon"></i>
                    <p className="no-videos-text">
                      Please request AI descriptions to view AI Requested
                      videos.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default History
