import { translate } from '@/App'
import Button from '@/shared/components/Button/Button'
import ClassicSpinner from '@/shared/components/ClassicSpinner/ClassicSpinner'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import { apiUrl, youTubeApiKey, youTubeApiUrl } from '@/shared/config'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import ourFetch from '@/shared/utils/ourFetch'
import React, { ReactNode, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

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
    // console.log('Search Params updated', searchParams.get('q'))
    setLoadingYDVideos(true)
    setLoadingYTVideos(true)
    setVideosNotOnYD([])
    setVideoAlreadyOnYD([])
    getSearchResultsFromYd(1)
    // getSearchResultsFromYt(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const getSearchResultsFromYd = (page: number = currentPage) => {
    const value = searchParams.get('q') ?? ''
    // console.log('Search Params,', value)

    let query = (value || '').trim()
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
    // const url = `https://api.youdescribe.org/v1/videos/search?q=${q}&page=${page}`;
    ourFetch(url)
      .then((response) => {
        const videoDbResponseVideos = response.result
        setVideoDBResponseVideos(videoDbResponseVideos)
        for (let i = 0; i < videoDbResponseVideos.length; i += 1) {
          serverVideoIds.push(videoDbResponseVideos[i].youtube_id)
        }

        const videoIds = serverVideoIds.join(',')
        setVideoIDs(videoIds)
        return { videoDbResponseVideos, videoIds, query }
      })
      .then(({ videoDbResponseVideos, videoIds }) => {
        fetchAndRenderVideoFromYD(videoDbResponseVideos, videoIds, page)
      })
  }
  const getSearchResultsFromYt = (page = 1) => {
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
    const urlForYD = `${youTubeApiUrl}/search?part=snippet&q=${query}&maxResults=50&key=${youTubeApiKey}`
    ourFetch(urlForYD).then((videos: any) => {
      const videoFoundOnYTIds = []
      for (let i = 0; i < videos.items.length; i++) {
        const video = videos.items[i]
        videoFoundOnYTIds.push(video.id.videoId)
      }
      const idsYTvideo = videoFoundOnYTIds.join(',')
      const urlForYT = `${youTubeApiUrl}/videos?id=${idsYTvideo}&part=contentDetails,snippet,statistics&key=${youTubeApiKey}`
      ourFetch(urlForYT).then((videosFromYouTube: any) => {
        const videoFromYoutube = videosFromYouTube.items
        setVideosNotOnYD([])
        renderVideosFromYT(videoFromYoutube)
      })
    })
  }

  const fetchAndRenderVideoFromYD = (
    videoDbResponseVideos: any[],
    videoIds: string,
    page = 1,
  ) => {
    const urlfForYT = `${youTubeApiUrl}/videos?id=${videoIds}&part=contentDetails,snippet,statistics&key=${youTubeApiKey}`
    ourFetch(urlfForYT).then((videoDataFromYDdatabase: any) => {
      const videoFromYDdatabase = videoDataFromYDdatabase.items
      console.log({ videoFromYDdatabase })
      // const videosAlreadyOnYD =
      //   currentPage === 1 ? [] : videoAlreadyOnYD.slice()
      const videosAlreadyOnYD = [...videoAlreadyOnYD]
      for (let i = 0; i < videoFromYDdatabase.length; i += 1) {
        const item = videoFromYDdatabase[i]
        if (!item.statistics || !item.snippet) {
          continue
        }
        const _id = videoDbResponseVideos[i]._id
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
      setVideoAlreadyOnYD(videosAlreadyOnYD)

      console.log({ testing: videoDataFromYDdatabase.length })

      if (videoFromYDdatabase.length > 20) {
        console.log('inside')
        setShowLoadMoreButton(true) // Show the "Load more" button
      } else {
        console.log('else')
        setShowLoadMoreButton(false)
      }
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
    getSearchResultsFromYd(currentPage + 1)
    setCurrentPage(currentPage + 1)
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
                ariaLabel={translate('Search on Youtube')}
                title={translate('Search on Youtube')}
                color="w3-indigo"
                text={translate('Search on Youtube')}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Search
