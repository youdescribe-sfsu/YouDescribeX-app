import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import Spinner from '@/shared/components/Spinner/Spinner'
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

const History = () => {
  const [showSpinner, setShowSpinner] = useState(true)
  const [userName, setUserName] = useState('')
  const [userVideosArray, setUserVideosArray] = useState([])
  const [videos, setVideos] = useState<any[]>([])
  const [videosAI, setAIVideos] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [currentRecentPage, setcurrentRecentPage] = useState(1)
  const [totalRecentDescVideos, settotalRecentDescVideos] = useState(0)
  const [totalRecentVideoPages, settotalRecentVideoPages] = useState(1)
  const [currentAIPage, setcurrentAIPage] = useState(1)
  const [totalAIVideos, settotalAIVideos] = useState(0)
  const [totalAIPages, settotalAIPages] = useState(1)

  // const itemsPerPage = 4 // Change this as per your requirements
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--items-per-page')
        .trim(),
      10,
    ),
  )

  // Calculate the total number of pages for videosAI
  // totalRecentVideoPages = Math.ceil(totalRecentDescVideos / itemsPerPage)
  // Initialize active page state
  const [activeVideoPage, setActiveVideoPage] = useState(0)

  // // Function to handle page change for videosAI
  // const handleVideoPageChange = (selectedIndex: number) => {
  //   setActiveVideoPage(selectedIndex)
  // }

  // Calculate the total number of slides for videosAI
  const totalVideoAISlides = Math.ceil(videosAI.length / itemsPerPage)

  // Initialize active slide state
  const [activeVideoAISlide, setActiveVideoAISlide] = useState(0)

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

  // Function to handle slide change for videosAI
  const handleVideoHistorySlideChange = (selectedIndex: number) => {
    setActiveVideoHistorySlide(selectedIndex)
  }

  const handleAINextPage = () => {
    if (currentAIPage < totalAIPages - 1) {
      setcurrentAIPage(currentAIPage + 1)
    } else if (currentAIPage == 1) {
      setcurrentAIPage(currentAIPage + 1)
    }
  }

  const handleAIPrevPage = () => {
    if (currentAIPage > 0) {
      // handleVideoPageChange(activeVideoPage - 1)
      setcurrentAIPage(currentAIPage - 1)
    }
  }

  const handleRecentDescNextPage = () => {
    if (currentRecentPage < totalRecentVideoPages - 1) {
      setcurrentRecentPage(currentRecentPage + 1)
    } else if (currentRecentPage == 1) {
      setcurrentRecentPage(currentRecentPage + 1)
    }
  }

  const handleRecentDescPrevPage = () => {
    if (currentRecentPage > 0) {
      // handleVideoPageChange(activeVideoPage - 1)
      setcurrentRecentPage(currentRecentPage - 1)
    }
  }

  useEffect(() => {
    const recentDescriptionsUrl = process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-recent-descriptions?pageNumber=1`
      : `${apiUrl}/api/audio-descriptions/get-recent-descriptions?pageNumber=1`

    axios.get(recentDescriptionsUrl).then((response) => {
      const totalRecentDescVideosLength = response.data.totalVideos
      settotalRecentDescVideos(totalRecentDescVideosLength)
      const calculatedtotalRecentVideoPages = Math.ceil(
        totalRecentDescVideosLength / itemsPerPage,
      )
      settotalRecentVideoPages(calculatedtotalRecentVideoPages)
    })
    const aiDescriptionsUrl = process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/get-All-Ai-DescriptionRequests?pageNumber=1`
      : `${apiUrl}/api/create-user-links/get-All-Ai-DescriptionRequests?pageNumber=1`

    axios.get(aiDescriptionsUrl).then((response) => {
      const totalAIVideosLength = response.data.totalVideos
      settotalAIVideos(totalAIVideosLength)
      const calculatedtotalAIVideoPages = Math.ceil(
        totalAIVideosLength / itemsPerPage,
      )
      settotalAIPages(calculatedtotalAIVideoPages)
    })
  }, [])

  const getUserVideos = async (
    url: string,
    setStateFunction: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    let youTubeIds = ''
    const youTubeVideoIds: string[] = []
    const youDescribeVideosIds: string[] = []
    const audioDescriptionIds: string[] = []
    const status: string[] = []
    const urls: string[] = []

    axios
      .get(url, {
        withCredentials: true,
      })
      .then((response) => {
        const responseData = response.data.result
        const videosArray = responseData
        // setUserVideosArray(videosArray)
        for (let i = 0; i < videosArray.length; i += 1) {
          youTubeVideoIds.push(videosArray[i].youtube_video_id)
          youDescribeVideosIds.push(videosArray[i].video_id)
          // audioDescriptionIds.push(videosArray[i].audio_description_id)
          status.push(videosArray[i].status)
          urls.push(videosArray[i].url)
        }
        youTubeIds = youTubeVideoIds.join(',')
      })
      .then(() => {
        const url = `${youTubeApiUrl}/videos?id=${youTubeIds}&part=contentDetails,snippet,statistics&key=${youTubeApiKey}`
        ourFetch(url).then((data) => {
          window.localStorage.setItem(
            'userVideosYoutubeData',
            JSON.stringify(data),
          )
          const youTubeVideosArray = data

          parseResponseData(
            youTubeVideosArray,
            youDescribeVideosIds,
            // audioDescriptionIds,
            status,
            urls,
            setStateFunction,
          )
        })
      })
  }

  const parseResponseData = (
    youTubeVideosArray: any,
    youDescribeVideosIds: string[],
    // audioDescriptionIds: string[],
    status: string[],
    urls: string[],
    setStateFunction: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    const videoComponents = []
    for (let i = 0; i < youTubeVideosArray.items.length; i += 1) {
      const item = youTubeVideosArray.items[i]
      const youDescribeVideoId = youDescribeVideosIds[i]
      // const audioDescriptionId = audioDescriptionIds[i]
      const statusVal = status[i]
      const youTubeId = item.id
      const thumbnail = item.snippet.thumbnails.medium
      const duration = convertSecondsToCardFormat(
        convertISO8601ToSeconds(item.contentDetails.duration),
      )
      let url
      if (statusVal === 'completed') {
        url = urls[i]
      }
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
            // audioDescriptionId={audioDescriptionId}
            thumbnailMediumUrl={thumbnail.url}
            duration={duration}
            title={title}
            author={author}
            views={views}
            time={time}
            statusVal={statusVal}
            // buttons={setStateFunction === setVideos ? 'edit' : ''}
            buttons="none"
            url={url}
          />
        </div>,
      )
    }
    setShowSpinner(false)
    // setVideos(videoComponents)
    setStateFunction(videoComponents)
  }
  // function renderCarouselIndicators(
  //   totalSlides: number,
  //   activeSlide: number,
  //   setActive: React.Dispatch<React.SetStateAction<number>>,
  // ) {
  //   return (
  //     <ol className="carousel-indicators">
  //       {Array.from({ length: totalSlides }).map((_, index) => (
  //         <li
  //           key={index}
  //           onClick={() => setActive(index)}
  //           className={index === activeSlide ? 'active' : ''}
  //         ></li>
  //       ))}
  //     </ol>
  //   )
  // }
  // Calculate the range of videos to display on the current slide
  const videoAIStartIndex = activeVideoAISlide * itemsPerPage
  const videoAIEndIndex = videoAIStartIndex + itemsPerPage

  // Calculate the range of videos to display on the current page
  const videoHistoryStartIndex = activeVideoHistorySlide * itemsPerPage
  const videoHistoryEndIndex = videoHistoryStartIndex + itemsPerPage

  // Slice the videosAI array to display only the videos for the active slide
  const videosAIToDisplay = videosAI.slice(videoAIStartIndex, videoAIEndIndex)
  // const videosToDisplay = videos.slice(videoStartIndex, videoEndIndex)
  const videosHistoryToDisplay = history.slice(
    videoHistoryStartIndex,
    videoHistoryEndIndex,
  )

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(
        parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--items-per-page')
            .trim(),
          10,
        ),
      )
    }
    // Attach the event listener to window resize
    window.addEventListener('resize', updateItemsPerPage)
    // Fetch and process History Videos
    const userHistoryUrl = process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/get-Visited-Videos-History`
      : `${apiUrl}/api/create-user-links/get-Visited-Videos-History`

    getUserVideos(userHistoryUrl, setHistory)

    // Fetch and process AI Requested Videos
    const aiRequestedVideosUrl = process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/get-All-Ai-DescriptionRequests?pageNumber=${currentAIPage}`
      : `${apiUrl}/api/create-user-links/get-All-Ai-DescriptionRequests?pageNumber=${currentAIPage}`
    // const aiRequestedVideosUrl = `http://127.0.0.1:4001/api/create-user-links/get-All-Ai-DescriptionRequests?user=${userId}`

    getUserVideos(aiRequestedVideosUrl, setAIVideos)

    // Fetch and process Recent Descripton Videos
    const recentDescriptionsUrl = process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-recent-descriptions?pageNumber=${currentRecentPage}`
      : `${apiUrl}/api/audio-descriptions/get-recent-descriptions?pageNumber=${currentRecentPage}`

    getUserVideos(recentDescriptionsUrl, setVideos)
    return () => {
      window.removeEventListener('resize', updateItemsPerPage)
    }
  }, [currentRecentPage])

  // if (
  //   !userDataStore.getState().isSignedIn ||
  //   userId !== userDataStore.getState().userId
  // ) {
  //   return (
  //     <div id="user-videos-page" title="User described videos page">
  //       <main>
  //         <section>
  //           <header className="w3-container w3-indigo">
  //             <h2 className="classic-h2">{translate('HISTORY')}</h2>
  //           </header>
  //           <h2 className="classic-h2">Sign In Required</h2>
  //           <p>
  //             Sorry! The link you followed points to a YouDescribe page that
  //             requires you to sign in to your account
  //           </p>
  //           <p>Please Sign In using your google account to access this page.</p>
  //         </section>
  //       </main>
  //     </div>
  //   )
  // } else {
  return (
    <div id="user-videos-page" title="User described videos page">
      <main>
        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('RECENT DESCRIPTIONS')}</h2>
          </header>

          <div className="custom-carousel">
            {!recentDescriptions && <CustomSpinner />}
            {recentDescriptions && recentDescriptions?.data.length > 0 && (
              <div className="d-flex justify-content-between align-items-center h-100">
                {/* Custom previous button */}
                <CustomButton
                  className="prev-icon"
                  onClick={() => handleRecentDescPrevPage()}
                  disabled={currentRecentPage === 0}
                  onClick={() => handleRecentDescPrevPage()}
                  disabled={currentRecentPage === 0}
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
                  onClick={() => handleRecentDescNextPage()}
                  disabled={currentRecentPage === totalRecentVideoPages - 1}
                  onClick={() => handleRecentDescNextPage()}
                  disabled={currentRecentPage === totalRecentVideoPages - 1}
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

          <div className="custom-carousel">
            {videosAI.length > 0 && (
            {videosAI.length > 0 && (
              <div className="d-flex justify-content-between align-items-center">
                {/* Custom previous button */}
                <CustomButton
                  className="prev-icon"
                  onClick={() => handleAIPrevPage()}
                  disabled={currentAIPage === 0}
                  onClick={() => handleAIPrevPage()}
                  disabled={currentAIPage === 0}
                >
                  &lt;
                </button>
                {/* {renderCarouselIndicators(
                  totalVideoAISlides,
                  activeVideoAISlide,
                  setActiveVideoAISlide,
                )} */}
                <div className="w3-row classic-container row">{videosAI}</div>
                <div className="w3-row classic-container row">{videosAI}</div>
                {/* Custom next button */}
                <CustomButton
                  className="next-icon"
                  onClick={() => handleAIPrevPage()}
                  disabled={currentAIPage === totalAIPages - 1}
                >
                  &gt;
                </CustomButton>
              </div>
            )}

            {videosAI.length === 0 && (
            {videosAI.length === 0 && (
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

          <div className="d-flex justify-content-center custom-carousel">
            {history.length > 0 && ( // Check if there are videos to display
            {history.length > 0 && ( // Check if there are videos to display
              <>
                {/* Custom previous button */}
                <CustomButton
                  className="prev-icon"
                  onClick={() => handleHistoryPrevPage()}
                  disabled={currentHistoryPage === 0}
                  onClick={() => handleHistoryPrevPage()}
                  disabled={currentHistoryPage === 0}
                >
                  &lt;
                </CustomButton>

                {/* {renderCarouselIndicators(
                  totalVideoHistorySlides,
                  activeVideoHistorySlide,
                  setActiveVideoHistorySlide,
                )} */}
                <div className="w3-row classic-container row">{history}</div>
                <div className="w3-row classic-container row">{history}</div>

                {/* Custom next button */}
                <CustomButton
                  className="next-icon"
                  onClick={() => handleHistoryNextPage()}
                  disabled={currentHistoryPage === totalHistoryPages - 1}
                  onClick={() => handleHistoryNextPage()}
                  disabled={currentHistoryPage === totalHistoryPages - 1}
                >
                  &gt;
                </CustomButton>
              </>
            )}

            {history.length === 0 && (
            {history.length === 0 && (
              <p className="history-text">No history to view.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default History
