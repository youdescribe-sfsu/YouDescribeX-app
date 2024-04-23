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
  const [videosAI, setAIVideos] = useState<any[]>([])
  const [videosDraft, setVideosDraft] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageAI, setCurrentPageAI] = useState(1)
  const [currentPageDraft, setCurrentPageDraft] = useState(1)
  const [LoadMoreVideos, setLoadMoreVideos] = useState<boolean>(false)
  const [LoadMoreAIVideos, setLoadMoreAIVideos] = useState<boolean>(false)
  const [LoadMoreDraftVideos, setLoadMoreDraftVideos] = useState<boolean>(false)
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(true)
  const [showLoadMoreAIButton, setShowLoadMoreAIButton] = useState(true)
  const [showLoadMoreDraftButton, setShowLoadMoreDraftButton] = useState(true)
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

  const myDescribedVideosUrl = process.env.REACT_APP_USE_YDX
    ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-my-descriptions`
    : `${apiUrl}/api/audio-descriptions/get-my-descriptions`

  const myDraftVideosUrl = process.env.REACT_APP_USE_YDX
    ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-my-draft-descriptions`
    : `${apiUrl}/api/audio-descriptions/get-my-draft-descriptions`

  const aiRequestedVideosUrl = process.env.REACT_APP_USE_YDX
    ? `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/get-All-AI-descriptions`
    : `${apiUrl}/api/audio-descriptions/get-All-AI-descriptions`

  const getUserVideos = async (
    url: string,
    setStateFunction: React.Dispatch<React.SetStateAction<any[]>>,
    page: number,
  ) => {
    let youTubeIds = ''
    const youTubeVideoIds: string[] = []
    const youDescribeVideosIds: string[] = []
    const audioDescriptionIds: string[] = []

    axios
      .get(url, {
        params: {
          paginate: 'false',
          page: page,
        },
        withCredentials: true,
      })
      .then((response) => {
        const videosArray = response.data.videos
        const totalVideos = response.data.total
        for (let i = 0; i < videosArray.length; i += 1) {
          youTubeVideoIds.push(videosArray[i].youtube_video_id)
          youDescribeVideosIds.push(videosArray[i].video_id)
          audioDescriptionIds.push(videosArray[i].audio_description_id)
        }
        youTubeIds = youTubeVideoIds.join(',')
        return { youTubeIds, totalVideos }
      })
      .then(({ youTubeIds, totalVideos }) => {
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
            setStateFunction,
            totalVideos,
            page,
          )
        })
      })
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
          />
        </div>,
      )
    }

    const updatedVideos = [...existingVideos, ...videoComponents]

    const loadMoreFlag =
      setStateFunction === setVideos
        ? setShowLoadMoreButton
        : setStateFunction === setAIVideos
        ? setShowLoadMoreAIButton
        : setShowLoadMoreDraftButton

    loadMoreFlag(totalVideos > page * 20)

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
      getUserInfo()
      getUserVideos(myDescribedVideosUrl, setVideos, currentPage)
    }
  }, [userId, currentPage])

  useEffect(() => {
    if (userId) {
      getUserVideos(myDraftVideosUrl, setVideosDraft, currentPageDraft)
    }
  }, [userId, currentPageDraft])

  useEffect(() => {
    if (userId) {
      getUserVideos(aiRequestedVideosUrl, setAIVideos, currentPageAI)
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
          <section>
            <header className="w3-container w3-indigo">
              <h2 className="classic-h2">{translate('MY DRAFT VIDEOS')}</h2>
            </header>

            {showSpinner ? <Spinner /> : null}

            <div className="w3-row classic-container row">{videosDraft}</div>

            {YDLoadMoreButtonDraft}
          </section>
          <section>
            <header className="w3-container w3-indigo">
              <h2 className="classic-h2">{translate('AI REQUESTED VIDEOS')}</h2>
            </header>

            {showSpinner ? <Spinner /> : null}

            <div className="w3-row classic-container row">{videosAI}</div>

            {YDLoadMoreButtonAI}
          </section>
        </main>
      </div>
    )
  }
}

export default UserDescribedVideos
