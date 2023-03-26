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

const Home = () => {
  const [dbResult, setDbResult] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState<any[]>([])
  const [showSpinner, setShowSpinner] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    document.title = translate(
      'YouDescribe - Audio Description for YouTube Videos',
    )
    fetchingVideosToHome()
    checkUserPolicyReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchingVideosToHome = (page: number = currentPage) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const youDescribeVideosIds: any[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const youTubeVideosIds: any[] = []
    let ids = ''
    const url = `${apiUrl}/videos?page=${page}`
    ourFetch(url)
      .then((response) => {
        setDbResult(response.result)
        const result = response.result
        for (let i = 0; i < result.length; i += 1) {
          youTubeVideosIds.push(result[i].youtube_id)
          youDescribeVideosIds.push(result[i]._id)
        }
        ids = youTubeVideosIds.join(',')
      })
      .then(() => {
        const url = `${apiUrl}/videos/getyoutubedatafromcache?youtubeids=${ids}&key=home`
        setShowSpinner(false)
        ourFetch(url).then((response) => {
          parseFetchedData(JSON.parse(response.result), youDescribeVideosIds)
        })
      })
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
          alert(
            'YouDescribe has been updated, please update your notification preferences in the next page.',
          )
          navigate(`/profile/` + userDataStore.getState().userId)
        }
      })
    }
  }

  const YDLoadMoreButton =
    videos.length >= 20 ? (
      <div className="w3-margin-top w3-center load-more">
        <Button
          title={translate('Load more videos')}
          ariaLabel="Load More"
          color="w3-indigo"
          text="Load more"
          onClick={loadMoreResults}
        />
      </div>
    ) : (
      <div className="w3-margin-top w3-center load-more w3-hide">
        <Button
          title={translate('Load more videos')}
          color="w3-indigo"
          text="Load more"
          ariaLabel="Load More"
          onClick={loadMoreResults}
        />
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
