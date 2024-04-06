import { translate, userDataStore } from '@/App'
import Spinner from '@/shared/components/Spinner/Spinner'
import { apiUrl } from '@/shared/config'
import ourFetch from '@/shared/utils/ourFetch'
import './homePage.css'
import React, { useEffect, useState } from 'react'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import Button from '@/shared/components/Button/Button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const Home = () => {
  // const [dbResult, setDbResult] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  // const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState<any[]>([])
  const [showSpinner, setShowSpinner] = useState(true)
  const [LoadMoreVideos, setLoadMoreVideos] = useState<boolean>(false)

  const navigate = useNavigate()

  useEffect(() => {
    document.title = translate(
      'YouDescribe - Audio Description for YouTube Videos',
    )
    fetchingVideosToHome()
    checkUserPolicyReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchingVideosToHome = async (page: number = currentPage) => {
    try {
      const url = `${apiUrl}/videos?page=${page}`
      const response = await ourFetch(url)
      const allResults = response.result // Assuming allResults is defined
      console.log('result', allResults)

      const youDescribeVideosIds = allResults.map((result: any) => result._id)
      const youTubeVideosIds = allResults
        .map((result: any) => result.youtube_id)
        .join(',')

      const youtubeDataUrl = `${apiUrl}/videos/getyoutubedatafromcache?youtubeids=${youTubeVideosIds}&key=home`
      const youtubeDataResponse = await ourFetch(youtubeDataUrl)

      setShowSpinner(false)
      setLoadMoreVideos(false)
      parseFetchedData(youtubeDataResponse.result, youDescribeVideosIds)
    } catch (error) {
      // Handle errors here
      toast.error('Error fetching videos. Please try again later.')
      console.error(error)
    }
  }

  const parseFetchedData = (data: any, youDescribeVideosIds: any) => {
    const videosData = videos.slice()
    if (data.items === undefined) {
      videosData.push(
        <h1>
          Thank you for visiting YouDescribe. This video is not viewable at this
          time due to YouTube API key limits. Our key is reset by Google at
          midnight Pacific time
        </h1>,
      )
    } else {
      for (let i = 0; i < data.items.length; i += 1) {
        const item = data.items[i]
        if (!item.statistics || !item.snippet) {
          continue
        }
        const _id = youDescribeVideosIds[i]
        const youTubeId = item.id
        const thumbnailMedium = item.snippet.thumbnails.medium
        const duration = convertSecondsToCardFormat(
          convertISO8601ToSeconds(item.contentDetails.duration),
          true,
        )
        const title = item.snippet.title
        const description = item.snippet.description
        const author = item.snippet.channelTitle
        const views = convertViewsToCardFormat(
          Number(item.statistics.viewCount),
        )
        const publishedAt = new Date(item.snippet.publishedAt).getMilliseconds()

        const now = Date.now()
        const time = convertTimeToCardFormat(Number(now - publishedAt))

        videosData.push(
          <div className="col-sm-6 col-md-4 col-lg-3" key={_id}>
            <VideoCard
              key={_id}
              youTubeId={youTubeId}
              description={description}
              thumbnailMediumUrl={thumbnailMedium.url}
              duration={duration}
              title={title}
              author={author}
              views={views}
              time={time}
              buttons="none"
            />
          </div>,
        )
      }
    }
    setShowSpinner(false)
    setVideos(videosData)
  }

  const loadMoreResults = () => {
    setLoadMoreVideos(true)
    setCurrentPage(currentPage + 1)
    fetchingVideosToHome(currentPage + 1)
  }

  const checkUserPolicyReview = () => {
    const isSignedIn = userDataStore.getState().isSignedIn
    const userId = userDataStore.getState().userId
    if (isSignedIn) {
      const url = `${apiUrl}/users/${userId}`
      ourFetch(url).then((response) => {
        const user = response.result
        if (user.policy_review === '') {
          toast.error(
            'YouDescribe has been updated, please update your notification preferences in the next page.',
          )
          navigate(`/profile/` + userDataStore.getState().userId)
        }
      })
    }
  }

  const YDLoadMoreButton = (
    <div className="w3-margin-top w3-center load-more">
      {LoadMoreVideos ? (
        <Spinner />
      ) : videos.length >= 20 ? (
        <Button
          title={translate('Load more videos')}
          ariaLabel="Load More"
          color="w3-indigo"
          text="Load more"
          onClick={loadMoreResults}
        />
      ) : null}
    </div>
  )

  return (
    <main id="home" title="YouDescribe home page">
      {/* <Announcement
          text={
            "Attention: YouDescribe will be down on for maintenance. We apologize for any inconvenience."
          }
        ></Announcement> */}
      <header role="banner" className="classic-header w3-container w3-indigo">
        <h2 id="home-heading" className="classic-h2" tabIndex={0}>
          {translate('RECENT DESCRIPTIONS')}
        </h2>

        {/* <UserStudyModal></UserStudyModal> */}
      </header>

      {showSpinner ? <Spinner /> : null}

      <div className="w3-row classic-container row">{videos}</div>

      {YDLoadMoreButton}
    </main>
  )
}

export default Home
