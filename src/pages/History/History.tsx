import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import Spinner from '@/shared/components/Spinner/Spinner'
import Slider from 'react-slick'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl, youTubeApiKey, youTubeApiUrl } from '@/shared/config'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import ourFetch from '@/shared/utils/ourFetch'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import './history.scss'

const History = () => {
  const [showSpinner, setShowSpinner] = useState(true)
  // const [userName, setUserName] = useState('')
  const [userVideosArray, setUserVideosArray] = useState([])
  const [videos, setVideos] = useState<any[]>([])
  const [videosAI, setAIVideos] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const { userId } = useParams()

  // const itemsPerPage = 4 // Change this as per your requirements
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--items-per-page')
        .trim(),
      10,
    ),
  )

  console.log({ itemsPerPage })

  // Calculate the total number of pages for videosAI
  const totalVideoPages = Math.ceil(videos.length / itemsPerPage)

  // Initialize active page state
  const [activeVideoPage, setActiveVideoPage] = useState(0)

  // Function to handle page change for videosAI
  const handleVideoPageChange = (selectedIndex: number) => {
    setActiveVideoPage(selectedIndex)
  }

  // Calculate the total number of slides for videosAI
  const totalVideoAISlides = Math.ceil(videosAI.length / itemsPerPage)

  // Initialize active slide state
  const [activeVideoAISlide, setActiveVideoAISlide] = useState(0)

  // Function to handle slide change for videosAI
  const handleVideoAISlideChange = (selectedIndex: number) => {
    setActiveVideoAISlide(selectedIndex)
  }

  // Calculate the total number of slides for videosAI
  const totalVideoHistorySlides = Math.ceil(history.length / itemsPerPage)

  // Initialize active slide state
  const [activeVideoHistorySlide, setActiveVideoHistorySlide] = useState(0)

  // Function to handle slide change for videosAI
  const handleVideoHistorySlideChange = (selectedIndex: number) => {
    setActiveVideoHistorySlide(selectedIndex)
  }

  // const getUserInfo = async () => {
  //   const url = `${apiUrl}/users/${userId}`
  //   ourFetch(url).then((response) => {
  //     if (response.result) {
  //       const user = response.result
  //       setUserName(user.name)
  //     }
  //   })
  // }

  const getUserVideos = async (
    url: string,
    setStateFunction: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    let youTubeIds = ''
    const youTubeVideoIds: string[] = []
    const youDescribeVideosIds: string[] = []
    const audioDescriptionIds: string[] = []
    const status: string[] = []

    axios
      .get(url, {
        withCredentials: true,
      })
      .then((response) => {
        const responseData = response.data

        const videosArray = responseData
        // setUserVideosArray(videosArray)
        for (let i = 0; i < videosArray.length; i += 1) {
          youTubeVideoIds.push(videosArray[i].youtube_video_id)
          youDescribeVideosIds.push(videosArray[i].video_id)
          audioDescriptionIds.push(videosArray[i].audio_description_id)
          status.push(videosArray[i].status)
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
            audioDescriptionIds,
            status,
            setStateFunction,
          )
        })
      })
  }

  const parseResponseData = (
    youTubeVideosArray: any,
    youDescribeVideosIds: string[],
    audioDescriptionIds: string[],
    status: string[],
    setStateFunction: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    const videoComponents = []
    for (let i = 0; i < youTubeVideosArray.items.length; i += 1) {
      const item = youTubeVideosArray.items[i]
      const youDescribeVideoId = youDescribeVideosIds[i]
      const audioDescriptionId = audioDescriptionIds[i]
      const statusVal = status[i]
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
            statusVal={statusVal}
            // buttons={setStateFunction === setVideos ? 'edit' : ''}
            buttons="none"
          />
        </div>,
      )
    }
    setShowSpinner(false)
    // setVideos(videoComponents)
    setStateFunction(videoComponents)
  }
  function renderCarouselIndicators(
    totalSlides: number,
    activeSlide: number,
    setActive: React.Dispatch<React.SetStateAction<number>>,
  ) {
    return (
      <ol className="carousel-indicators">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <li
            key={index}
            onClick={() => setActive(index)}
            className={index === activeSlide ? 'active' : ''}
          ></li>
        ))}
      </ol>
    )
  }

  // Calculate the range of videos to display on the current page
  const videoStartIndex = activeVideoPage * itemsPerPage
  const videoEndIndex = videoStartIndex + itemsPerPage

  // Calculate the range of videos to display on the current slide
  const videoAIStartIndex = activeVideoAISlide * itemsPerPage
  const videoAIEndIndex = videoAIStartIndex + itemsPerPage

  // Calculate the range of videos to display on the current page
  const videoHistoryStartIndex = activeVideoHistorySlide * itemsPerPage
  const videoHistoryEndIndex = videoHistoryStartIndex + itemsPerPage

  // Slice the videosAI array to display only the videos for the active slide
  const videosAIToDisplay = videosAI.slice(videoAIStartIndex, videoAIEndIndex)
  const videosToDisplay = videos.slice(videoStartIndex, videoEndIndex)
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

    if (userId) {
      // getUserInfo()
      // Fetch and process History Videos
      const userHistoryUrl = process.env.REACT_APP_USE_YDX
        ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/get-Visited-Videos-History`
        : `${apiUrl}/api/create-user-links/get-Visited-Videos-History`

      getUserVideos(userHistoryUrl, setHistory)

      // Fetch and process AI Requested Videos
      const aiRequestedVideosUrl = process.env.REACT_APP_USE_YDX
        ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/get-All-Ai-DescriptionRequests`
        : `${apiUrl}/api/create-user-links/get-All-Ai-DescriptionRequests`
      // const aiRequestedVideosUrl = `http://127.0.0.1:4001/api/create-user-links/get-All-Ai-DescriptionRequests?user=${userId}`

      getUserVideos(aiRequestedVideosUrl, setAIVideos)
    }

    // Fetch and process Recent Descripton Videos
    const recentDescriptionsUrl = process.env.REACT_APP_USE_YDX
      ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-recent-descriptions`
      : `${apiUrl}/api/audio-descriptions/get-recent-descriptions`

    getUserVideos(recentDescriptionsUrl, setVideos)
    return () => {
      window.removeEventListener('resize', updateItemsPerPage)
    }
  }, [userId])

  if (
    !userDataStore.getState().isSignedIn ||
    userId !== userDataStore.getState().userId
  ) {
    return (
      <div id="user-videos-page" title="User described videos page">
        <main>
          <section>
            <header className="w3-container w3-indigo">
              <h2 className="classic-h2">{translate('HISTORY')}</h2>
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
              <h2 className="classic-h2">{translate('RECENT DESCRIPTIONS')}</h2>
            </header>

            {showSpinner ? <Spinner /> : null}
            <div className="custom-carousel">
              {videosToDisplay.length > 0 && (
                <div className="d-flex justify-content-between align-items-center">
                  {/* Custom previous button */}
                  <button
                    className="prev-icon"
                    onClick={() => handleVideoPageChange(activeVideoPage - 1)}
                    disabled={activeVideoPage === 0}
                  >
                    &lt;
                  </button>

                  {/* Content for displaying videos */}
                  <div className="w3-row classic-container row">
                    {videosToDisplay}
                  </div>

                  {renderCarouselIndicators(
                    totalVideoPages,
                    activeVideoPage,
                    setActiveVideoPage,
                  )}

                  {/* Custom next button */}
                  <button
                    className="next-icon"
                    onClick={() => handleVideoPageChange(activeVideoPage + 1)}
                    disabled={activeVideoPage === totalVideoPages - 1}
                  >
                    &gt;
                  </button>
                </div>
              )}

              {videosToDisplay.length === 0 && (
                <p className="history-text">No Recent descriptions to view</p>
              )}
            </div>
          </section>

          <section>
            <header className="w3-container w3-indigo">
              <h2 className="classic-h2">{translate('AI REQUESTED VIDEOS')}</h2>
            </header>

            {showSpinner ? <Spinner /> : null}
            <div className="custom-carousel">
              {videosAIToDisplay.length > 0 && (
                <div className="d-flex justify-content-between align-items-center">
                  {/* Custom previous button */}
                  <button
                    className="prev-icon"
                    onClick={() =>
                      handleVideoAISlideChange(activeVideoAISlide - 1)
                    }
                    disabled={activeVideoAISlide === 0}
                  >
                    &lt;
                  </button>

                  {/* Content for displaying videos */}
                  <div className="w3-row classic-container row">
                    {videosAIToDisplay}
                  </div>
                  {renderCarouselIndicators(
                    totalVideoAISlides,
                    activeVideoAISlide,
                    setActiveVideoAISlide,
                  )}
                  {/* Custom next button */}
                  <button
                    className="next-icon"
                    onClick={() =>
                      handleVideoAISlideChange(activeVideoAISlide + 1)
                    }
                    disabled={activeVideoAISlide === totalVideoAISlides - 1}
                  >
                    &gt;
                  </button>
                </div>
              )}

              {videosAIToDisplay.length === 0 && (
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

            {showSpinner ? <Spinner /> : null}
            <div className="d-flex justify-content-center custom-carousel">
              {videosHistoryToDisplay.length > 0 && ( // Check if there are videos to display
                <>
                  {/* Custom previous button */}
                  <button
                    className="prev-icon"
                    onClick={() =>
                      handleVideoHistorySlideChange(activeVideoHistorySlide - 1)
                    }
                    disabled={activeVideoHistorySlide === 0}
                  >
                    &lt;
                  </button>

                  {/* Content for displaying videos */}
                  <div className="w3-row classic-container row">
                    {videosHistoryToDisplay}
                  </div>
                  {renderCarouselIndicators(
                    totalVideoHistorySlides,
                    activeVideoHistorySlide,
                    setActiveVideoHistorySlide,
                  )}

                  {/* Custom next button */}
                  <button
                    className="next-icon"
                    onClick={() =>
                      handleVideoHistorySlideChange(activeVideoHistorySlide + 1)
                    }
                    disabled={
                      activeVideoHistorySlide === totalVideoHistorySlides - 1
                    }
                  >
                    &gt;
                  </button>
                </>
              )}

              {videosHistoryToDisplay.length === 0 && (
                <p className="history-text">No history to view.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    )
  }
}

export default History
