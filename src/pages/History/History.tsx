import { translate } from '@/App'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl, youTubeApiKey, youTubeApiUrl } from '@/shared/config'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import ourFetch from '@/shared/utils/ourFetch'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import './history.scss'
import Spinner from 'react-bootstrap/Spinner'

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
  try {
    const url = `${youTubeApiUrl}/videos?id=${videoIds.join(
      ',',
    )}&part=contentDetails,snippet,statistics&key=${youTubeApiKey}`
    const data: any = await ourFetch(url)
    // const jsonData = await data.json();
    window.localStorage.setItem('userVideosYoutubeData', JSON.stringify(data))
    return data.items
  } catch (error) {
    console.error('Error fetching video details:', error)
    return []
  }
}

const History = () => {
  // const [showSpinner, setShowSpinner] = useState(true)
  // const [videos, setVideos] = useState<any[]>([])

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
      : `${apiUrl}/api/audio-descriptions/get-my-descriptions`
  }

  const getUserHistoryUrl = () => {
    return process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/get-Visited-Videos-History`
      : `${apiUrl}/api/create-user-links/get-Visited-Videos-History`
  }

  const getAiRequestedVideosUrl = () => {
    return process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/get-user-Ai-DescriptionRequests`
      : `${apiUrl}/api/create-user-links/get-user-Ai-DescriptionRequests`
  }

  const fetchVideosData: FetchVideosDataFunction = async (
    dataState,
    setVideosData,
    apiEndpoint,
    setLoadingState,
  ) => {
    try {
      // console.log('fetchVideosData')
      // console.log(dataState)
      const pageNumber = dataState?.currentPage || 1
      setLoadingState(true)
      const response = await axios.get(apiEndpoint, {
        params: {
          paginate: 'true',
          page: pageNumber,
        },
        withCredentials: true,
      })
      const responseData = response.data.videos
      const totalVideosLength = response.data.total
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
            Date.now() - new Date(item.snippet.publishedAt).getMilliseconds(),
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
      // setShowSpinner(false)
    } catch (error) {
      console.error(`Error fetching ${apiEndpoint}:`, error)
      setLoadingState(false)
      // setShowSpinner(false)
      // Handle error, perhaps set an error state to show to the user
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
    fetchVideosData(
      recentDescriptions,
      setRecentDescriptions,
      getRecentDescriptionsUrl(),
      setShowRecentDescriptionsSpinner,
    )

    fetchVideosData(
      historyVideos,
      setHistoryVideos,
      getUserHistoryUrl(),
      setShowHistoryVideosSpinner,
    )
    fetchVideosData(
      aiRequestedVideos,
      setAiRequestedVideos,
      getAiRequestedVideosUrl(),
      setShowAiRequestedVideosSpinner,
    )
  }, [])

  return (
    <div id="user-videos-page" title="User described videos page">
      <main>
        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('MY DESCRIPTIONS')}</h2>
          </header>

          <div className="custom-carousel flex min-h-[290px]">
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
                    recentDescriptions.videoComponentData.map((video: any) => (
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
              <p className="history-text">No Recent descriptions to view</p>
            )}
          </div>
        </section>

        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('AI REQUESTED VIDEOS')}</h2>
          </header>

          <div className="custom-carousel flex min-h-[290px]">
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
                    aiRequestedVideos.videoComponentData.map((video: any) => (
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
              <p className="history-text">
                Please request AI descriptions to view AI Requested videos.
              </p>
            )}
          </div>
        </section>

        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('HISTORY')}</h2>
          </header>

          <div className="d-flex justify-content-center custom-carousel flex min-h-[290px] m-auto">
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
              <p className="history-text">No history to view.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default History
