import React, { ReactNode, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { translate } from '@/App'
import Button from '@/shared/components/Button/Button'
import ClassicSpinner from '@/shared/components/ClassicSpinner/ClassicSpinner'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl, youTubeApiUrl, youTubeApiKey } from '@/shared/config'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import ourFetch from '@/shared/utils/ourFetch'
import YouTubeService from '@/shared/utils/YouTubeService'
import axios from 'axios'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [videoDBResponseVideos, setVideoDBResponseVideos] = useState<any[]>()
  const [videoIDs, setVideoIDs] = useState<string>()
  const [loadingYDVideos, setLoadingYDVideos] = useState<boolean>(true)
  const [LoadMoreYDVideos, setLoadMoreYDVideos] = useState<boolean>(false)
  const [loadingYTVideos, setLoadingYTVideos] = useState<boolean>(true)
  const [showYTButton, setShowYTButton] = useState(false)
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(true)
  const [videoAlreadyOnYD, setVideoAlreadyOnYD] = useState<ReactNode[]>([])
  const [videosNotOnYD, setVideosNotOnYD] = useState<ReactNode[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    setLoadingYDVideos(true)
    setLoadingYTVideos(true)
    setVideoAlreadyOnYD([]) // Reset videoAlreadyOnYD to an empty array
    setVideosNotOnYD([]) // Reset videosNotOnYD to an empty array
    setShowYTButton(false) // Reset showYTButton state
    getSearchResultsFromYd(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const getSearchResultsFromYd = (page: number = currentPage) => {
    return new Promise<void>((resolve, reject) => {
      const value = searchParams.get('q') ?? ''
      let query = (value || '').trim()

      // Handle YouTube URL search
      if (
        value.match(
          /^https:\/\/(?:www\.)?youtube.com\/watch\?(?=v=\w+)(?:\S+)?$/g,
        )
      ) {
        const url = new URL(value)
        query = url.searchParams.get('v') ?? ''
      }

      const serverVideoIds: any[] = []
      const url = `${apiUrl}/videos/search?q=${query}&page=${page}`

      ourFetch(url)
        .then((response) => {
          const videoDbResponseVideos = response.result.videos
          const totalVideos = response.result.total
          setVideoDBResponseVideos(videoDbResponseVideos)
          setShowLoadMoreButton(totalVideos > page * 20)
          setCurrentPage(page)

          for (let i = 0; i < videoDbResponseVideos.length; i += 1) {
            serverVideoIds.push(videoDbResponseVideos[i].youtube_id)
          }

          const videoIds = serverVideoIds
          setVideoIDs(videoIds.join(','))
          return { videoDbResponseVideos, videoIds, query }
        })
        .then(({ videoDbResponseVideos, videoIds }) => {
          // Use the new service to fetch video details
          YouTubeService.getVideoDetails(videoIds)
            .then((videoDetails) => {
              // Create a map for easy access by ID
              const videoMap = new Map()
              videoDetails.forEach((video) => {
                videoMap.set(video.id, video)
              })

              // Render videos
              const videosAlreadyOnYD = page === 1 ? [] : [...videoAlreadyOnYD]

              for (let i = 0; i < videoDbResponseVideos.length; i += 1) {
                const video = videoDbResponseVideos[i]
                const item = videoMap.get(video.youtube_id)

                if (!item || !item.statistics || !item.snippet) {
                  continue
                }

                const _id = video._id
                const youTubeId = item.id
                const thumbnailMedium = item.snippet.thumbnails.medium
                const duration = convertSecondsToCardFormat(
                  convertISO8601ToSeconds(item.contentDetails.duration),
                )
                const title = item.snippet.title
                const description = item.snippet.description
                const author = item.snippet.channelTitle
                const views = convertViewsToCardFormat(
                  Number(item.statistics.viewCount),
                )
                const publishedAt = new Date(item.snippet.publishedAt)
                const now = Date.now()
                const time = convertTimeToCardFormat(
                  Number(now - publishedAt.getMilliseconds()),
                )

                videosAlreadyOnYD.push(
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

              setLoadingYDVideos(false)
              setLoadMoreYDVideos(false)
              setVideoAlreadyOnYD(videosAlreadyOnYD)
              resolve()
            })
            .catch((error) => {
              console.error('Error fetching video details:', error)
              setLoadingYDVideos(false)
              reject(error)
            })
        })
        .catch((error) => {
          console.error('Error fetching search results:', error)
          setLoadingYDVideos(false)
          reject(error)
        })
    })
  }

  const getSearchResultsFromYt = (page = 1) => {
    setLoadingYTVideos(true)
    const value = searchParams.get('q') ?? ''
    let query = (value || '').trim()

    if (
      value.match(
        /^https:\/\/(?:www\.)?youtube.com\/watch\?(?=v=\w+)(?:\S+)?$/g,
      )
    ) {
      const url = new URL(value)
      query = url.searchParams.get('v') ?? ''
    }

    // Direct call to YouTube's API for search
    const searchUrl = `${youTubeApiUrl}/search?part=snippet&q=${query}&maxResults=50&key=${youTubeApiKey}`

    ourFetch(searchUrl)
      .then((videos: any) => {
        const videoFoundOnYTIds = []
        for (let i = 0; i < videos.items.length; i++) {
          const video = videos.items[i]
          if (video.id.kind === 'youtube#video') {
            // Make sure we only get videos
            videoFoundOnYTIds.push(video.id.videoId)
          }
        }
        const idsYTvideo = videoFoundOnYTIds.join(',')

        // Direct call to YouTube's API for video details
        const videoDetailsUrl = `${youTubeApiUrl}/videos?id=${idsYTvideo}&part=contentDetails,snippet,statistics&key=${youTubeApiKey}`
        return ourFetch(videoDetailsUrl)
      })
      .then((videosFromYouTube: any) => {
        const videoFromYoutube = videosFromYouTube.items
        setVideosNotOnYD([])
        renderVideosFromYT(videoFromYoutube)
      })
      .catch((error) => {
        console.error('Error fetching YouTube results:', error)
        setLoadingYTVideos(false)
      })
  }

  const renderVideosFromYT = (videoFromYoutube: any) => {
    const videoNotOnYD = currentPage === 1 ? [] : videosNotOnYD.slice()
    for (let i = 0; i < videoFromYoutube.length; i += 1) {
      const item = videoFromYoutube[i]
      if (!item.statistics || !item.snippet) {
        continue
      }
      const youTubeId = item.id
      const thumbnailMedium = item.snippet.thumbnails.medium
      const duration = convertSecondsToCardFormat(
        convertISO8601ToSeconds(item.contentDetails.duration),
      )
      const title = item.snippet.title
      const description = item.snippet.description
      const author = item.snippet.channelTitle
      const views = convertViewsToCardFormat(Number(item.statistics.viewCount))
      const publishedAt = new Date(item.snippet.publishedAt)
      // let describer;

      const now = Date.now()
      const time = convertTimeToCardFormat(
        Number(now - publishedAt.getMilliseconds()),
      )

      videoNotOnYD.push(
        <div className="col-sm-6 col-md-4 col-lg-3" key={i}>
          <VideoCard
            key={i}
            youTubeId={youTubeId}
            description={description}
            thumbnailMediumUrl={thumbnailMedium.url}
            duration={duration}
            title={title}
            author={author}
            views={views}
            time={time}
            buttons="upvote-describe"
            votes={0}
          />
        </div>,
      )
    }

    setLoadingYTVideos(false)
    setVideosNotOnYD(videoNotOnYD)
  }

  const loadMoreVideosFromYD = () => {
    setLoadMoreYDVideos(true)
    const nextPage = currentPage + 1
    getSearchResultsFromYd(nextPage)
      .then(() => {
        setLoadMoreYDVideos(false)
      })
      .catch((error) => {
        console.error('Error loading more videos:', error)
        setLoadMoreYDVideos(false)
      })
  }

  const loadMoreVideosFromYT = () => {
    toast.error('Under Development')
  }

  const showYTButtonHandler = () => {
    setShowYTButton(true)
    getSearchResultsFromYt(1)
  }

  return (
    <div id="search-page" title={translate('Search results page')}>
      <main>
        <section>
          <header className="w3-container w3-indigo">
            <h2 id="search-page-heading" className="classic-h2" tabIndex={-1}>
              {translate('DESCRIBED VIDEOS')}
            </h2>
          </header>

          {loadingYDVideos ? (
            <div className="w3-row classic-container">
              <ClassicSpinner />
            </div>
          ) : (
            <div id="on-yd" className="w3-row classic-container row">
              {videoAlreadyOnYD}
              {videoAlreadyOnYD.length ? null : (
                <div className="w3-center no-videos">
                  {translate(
                    'There are no described videos that match your search',
                  )}
                </div>
              )}
              {showLoadMoreButton && (
                <div className="w3-margin-top w3-center load-more">
                  {LoadMoreYDVideos ? (
                    <ClassicSpinner />
                  ) : (
                    <Button
                      ariaLabel={translate('Load more videos')}
                      title={translate('Load more videos')}
                      color="w3-indigo"
                      text={translate('Load more')}
                      onClick={loadMoreVideosFromYD}
                      disabled={LoadMoreYDVideos} // Disable the button while loading
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <header className="w3-container w3-indigo">
            <h2 className="classic-h2">{translate('NON-DESCRIBED VIDEOS')}</h2>
          </header>

          {showYTButton ? (
            <div>
              {loadingYTVideos ? (
                <div className="w3-row classic-container">
                  <ClassicSpinner />
                </div>
              ) : (
                <div className="w3-row classic-container row">
                  {videosNotOnYD}
                </div>
              )}
              {!loadingYTVideos && videoAlreadyOnYD.length > 20 ? (
                <div className="w3-margin-top w3-center load-more">
                  <Button
                    ariaLabel={translate('Load more videos')}
                    title={translate('Load more videos')}
                    color="w3-indigo"
                    text={translate('Load more')}
                    onClick={loadMoreVideosFromYT}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="w3-margin-top w3-center load-more">
              <Button
                onClick={showYTButtonHandler}
                ariaLabel={translate('Search on YouTube')}
                title={translate('Search on YouTube')}
                color="w3-indigo"
                text={translate('Search on YouTube')}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Search
