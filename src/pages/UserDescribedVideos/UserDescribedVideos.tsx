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
import { useParams, useSearchParams } from 'react-router-dom'

const UserDescribedVideos = () => {
  const [showSpinner, setShowSpinner] = useState(true)
  const [userName, setUserName] = useState('')
  const [userVideosArray, setUserVideosArray] = useState([])
  const [videos, setVideos] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const { userId } = useParams()

  const getUserInfo = async () => {
    const url = `${apiUrl}/users/${userId}`
    ourFetch(url).then((response) => {
      if (response.result) {
        const user = response.result
        setUserName(user.name)
      }
    })
  }

  const getUserVideos = async () => {
    let youTubeIds = ''
    const youTubeVideoIds: string[] = []
    const youDescribeVideosIds: string[] = []
    const audioDescriptionIds: string[] = []
    let url
    if (process.env.REACT_APP_USE_YDX) {
      url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/videos/user/${userId}`
    } else {
      url = `${apiUrl}/videos/user/${userId}`
    }
    axios
      .get(url)
      .then((response) => {
        const videosArray = response.data
        setUserVideosArray(videosArray)
        for (let i = 0; i < videosArray.length; i += 1) {
          youTubeVideoIds.push(videosArray[i].youtube_video_id)
          youDescribeVideosIds.push(videosArray[i].video_id)
          audioDescriptionIds.push(videosArray[i].audio_description_id)
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
          )
        })
      })
  }

  const parseResponseData = (
    youTubeVideosArray: any,
    youDescribeVideosIds: string[],
    audioDescriptionIds: string[],
  ) => {
    const videoComponents = []
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
          />
        </div>,
      )
    }
    setShowSpinner(false)
    setVideos(videoComponents)
  }

  const loadMoreResults = () => {
    setCurrentPage(currentPage + 1)
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

  useEffect(() => {
    if (userId) {
      getUserInfo()
      getUserVideos()
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

            <div className="w3-row classic-container row">{videos}</div>

            {YDLoadMoreButton}
          </section>
        </main>
      </div>
    )
  }
}

export default UserDescribedVideos
