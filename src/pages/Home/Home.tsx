import { translate, userDataStore } from '@/App'
import Spinner from '@/shared/components/Spinner/Spinner'
import { apiUrl } from '@/shared/config'
import ourFetch from '@/shared/utils/ourFetch'
import './homePage.css'
import React, { useEffect, useState, useCallback } from 'react'
import convertTimeToCardFormat from '@/shared/utils/convertTimeToCardFormat'
import convertViewsToCardFormat from '@/shared/utils/convertViewsToCardFormat'
import convertSecondsToCardFormat from '@/shared/utils/convertSecondsToCardFormat'
import convertISO8601ToSeconds from '@/shared/utils/convertISO8601ToSeconds'
import VideoCard from '@/shared/components/VideoCard/VideoCard'
import Button from '@/shared/components/Button/Button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

// Cache configuration
const CACHE_VERSION = 'v2' // Incremented to invalidate old caches with incorrect sorting
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
const MAX_PAGES_TO_CACHE = 3

interface VideoData {
  youTubeId: string
  description: string
  thumbnailMediumUrl: string
  duration: string
  title: string
  author: string
  views: string
  time: string
  buttons: string
  audioDescriptionTimestamp?: number // New field to track sorting timestamp
}

interface VideoCache {
  videos: VideoData[]
  timestamp: number
  version: string
}

interface CachedPage {
  data: any
  timestamp: number
}

const Home = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [rawVideoData, setRawVideoData] = useState<VideoData[]>([])
  const [showSpinner, setShowSpinner] = useState(true)
  const [loadMoreVideos, setLoadMoreVideos] = useState<boolean>(false)
  const [hasMoreVideos, setHasMoreVideos] = useState<boolean>(true)
  const [renderKey, setRenderKey] = useState(0)

  const navigate = useNavigate()

  // Helper function to manage the video cache
  const videoCache = {
    getPageCache: (page: number): CachedPage | null => {
      try {
        const cacheKey = `ydx-home-page-${page}-${CACHE_VERSION}`
        const cachedData = localStorage.getItem(cacheKey)

        if (!cachedData) return null

        const parsedData = JSON.parse(cachedData) as CachedPage

        // Check if cache is still valid
        if (Date.now() - parsedData.timestamp > CACHE_TTL) {
          // Cache expired
          localStorage.removeItem(cacheKey)
          return null
        }

        return parsedData
      } catch (error) {
        console.error('Error retrieving from cache:', error)
        return null
      }
    },

    setPageCache: (page: number, data: any) => {
      try {
        const cacheKey = `ydx-home-page-${page}-${CACHE_VERSION}`
        const cacheData: CachedPage = {
          data,
          timestamp: Date.now(),
        }

        localStorage.setItem(cacheKey, JSON.stringify(cacheData))

        // Also store the max page seen for easy retrieval next time
        localStorage.setItem(
          'ydx-home-max-page',
          String(
            Math.max(
              page,
              parseInt(localStorage.getItem('ydx-home-max-page') || '0'),
            ),
          ),
        )

        // Cleanup old caches if we have too many
        cleanupOldCaches()
      } catch (error) {
        console.error('Error saving to cache:', error)
      }
    },

    getVideoData: (): VideoCache | null => {
      try {
        const cache = localStorage.getItem('ydx-home-videos-data')
        if (!cache) return null

        const parsedCache = JSON.parse(cache) as VideoCache

        // Validate cache version and TTL
        if (
          parsedCache.version !== CACHE_VERSION ||
          Date.now() - parsedCache.timestamp > CACHE_TTL
        ) {
          localStorage.removeItem('ydx-home-videos-data')
          return null
        }

        return parsedCache
      } catch (error) {
        console.error('Error retrieving video data from cache:', error)
        return null
      }
    },

    setVideoData: (videoData: VideoData[]) => {
      try {
        const cacheData = {
          videos: videoData,
          timestamp: Date.now(),
          version: CACHE_VERSION,
        }

        localStorage.setItem('ydx-home-videos-data', JSON.stringify(cacheData))
      } catch (error) {
        console.error('Error saving video data to cache:', error)
      }
    },

    invalidateCache: () => {
      try {
        for (let i = 1; i <= MAX_PAGES_TO_CACHE; i++) {
          localStorage.removeItem(`ydx-home-page-${i}-${CACHE_VERSION}`)
        }
        localStorage.removeItem('ydx-home-videos-data')
        localStorage.removeItem('ydx-home-max-page')
      } catch (error) {
        console.error('Error invalidating cache:', error)
      }
    },
  }

  // Helper function to clean up older caches if we have too many
  const cleanupOldCaches = () => {
    try {
      const maxPage = parseInt(localStorage.getItem('ydx-home-max-page') || '0')
      if (maxPage > MAX_PAGES_TO_CACHE) {
        // Remove caches for pages beyond our limit
        for (let i = 1; i <= maxPage - MAX_PAGES_TO_CACHE; i++) {
          localStorage.removeItem(`ydx-home-page-${i}-${CACHE_VERSION}`)
        }
      }
    } catch (error) {
      console.error('Error cleaning up caches:', error)
    }
  }

  // Initialize or restore videos from cache
  useEffect(() => {
    document.title = translate(
      'YouDescribe - Audio Description for YouTube Videos',
    )

    // Try to get videos from cache first
    const cachedVideos = videoCache.getVideoData()

    if (cachedVideos && cachedVideos.videos.length > 0) {
      console.log(
        'Loading from cache, video count:',
        cachedVideos.videos.length,
      )

      // Trust the order that was cached
      setRawVideoData(cachedVideos.videos)
      setShowSpinner(false)

      // Optionally, fetch fresh data in the background if cache is getting old
      const cacheAge = Date.now() - cachedVideos.timestamp
      if (cacheAge > CACHE_TTL / 2) {
        console.log('Cache is getting old, refreshing in background')
        fetchHomePageVideos(1, true) // Background refresh
      }
    } else {
      console.log('No cache found, fetching from API')
      // No cache available - fetch from API
      fetchHomePageVideos()
    }

    checkUserPolicyReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const fetchHomePageVideos = async (
    page: number = currentPage,
    isBackgroundFetch = false,
  ) => {
    try {
      const startTime = performance.now()

      // Check if we have this page cached
      const cachedPage = videoCache.getPageCache(page)
      if (cachedPage) {
        console.log(`Using cached data for page ${page}`)

        if (!isBackgroundFetch) {
          setShowSpinner(false)
          setLoadMoreVideos(false)

          const combinedData = cachedPage.data
          if (combinedData.videos) {
            parseHomePageData(combinedData, page === 1)
          }
        }

        console.log(
          `Page ${page} fetch from cache took ${
            performance.now() - startTime
          }ms`,
        )
        return
      }

      // Use the new combined endpoint
      const url = `${apiUrl}/videos/home-videos?page=${page}`
      const response = await ourFetch(url)

      // Check if we have more videos to load
      if (
        !response.result ||
        !response.result.videos ||
        response.result.videos.length === 0
      ) {
        setHasMoreVideos(false)
        setShowSpinner(false)
        setLoadMoreVideos(false)
        return
      }

      // Cache the combined results
      videoCache.setPageCache(page, response.result)

      if (!isBackgroundFetch) {
        setShowSpinner(false)
        setLoadMoreVideos(false)
        parseHomePageData(response.result, page === 1)
      }

      console.log(
        `Page ${page} fetch from API took ${performance.now() - startTime}ms`,
      )
    } catch (error) {
      // If the new endpoint fails, fall back to the original two-call approach
      console.error(
        'Error with combined endpoint, falling back to original approach:',
        error,
      )
      if (!isBackgroundFetch) {
        fallbackToOriginalFetch(page)
      }
    }
  }

  // Fallback method if new endpoint isn't available
  const fallbackToOriginalFetch = async (page: number) => {
    try {
      const url = `${apiUrl}/videos?page=${page}`
      const response = await ourFetch(url)

      if (!response.result || response.result.length === 0) {
        setHasMoreVideos(false)
        setShowSpinner(false)
        setLoadMoreVideos(false)
        return
      }

      const allResults = response.result
      const youDescribeVideosIds = allResults.map((result: any) => result._id)
      const youTubeVideosIds = allResults
        .map((result: any) => result.youtube_id)
        .join(',')

      const youtubeDataUrl = `${apiUrl}/videos/getyoutubedatafromcache?youtubeids=${youTubeVideosIds}&key=home-${page}`
      const youtubeDataResponse = await ourFetch(youtubeDataUrl)

      setShowSpinner(false)
      setLoadMoreVideos(false)

      // Create combined data in the same format as our expected endpoint
      const combinedData = {
        videos: allResults,
        youtubeData: youtubeDataResponse.result,
      }

      // Cache the combined results
      videoCache.setPageCache(page, combinedData)

      parseHomePageData(combinedData, page === 1)
    } catch (error) {
      toast.error('Error fetching videos. Please try again later.')
      console.error(error)

      setShowSpinner(false)
      setLoadMoreVideos(false)
    }
  }

  const parseHomePageData = useCallback(
    (combinedData: any, isFirstPage = false) => {
      const existingVideoData: VideoData[] = isFirstPage
        ? []
        : [...rawVideoData]
      const youtubeData = combinedData.youtubeData
      const ydxVideos = combinedData.videos

      // Handle error cases
      if (
        !youtubeData ||
        !youtubeData.items ||
        youtubeData.items.length === 0
      ) {
        if (rawVideoData.length === 0) {
          setRawVideoData([
            {
              youTubeId: 'error',
              description: 'API limit error',
              thumbnailMediumUrl: '',
              duration: '',
              title: 'API limit error',
              author: '',
              views: '',
              time: '',
              buttons: 'none',
              audioDescriptionTimestamp: 0,
            },
          ])
          setRenderKey((prev) => prev + 1)
        }
        return
      }

      // Create lookup map for YouTube data
      const youtubeDataMap = new Map<string, any>()
      youtubeData.items.forEach((item: any) => {
        youtubeDataMap.set(item.id, item)
      })

      // Track existing videos to prevent duplicates
      const existingIds = new Set(existingVideoData.map((v) => v.youTubeId))

      // ⭐ FIX: Also track videos being added in current batch
      const currentBatchIds = new Set<string>()

      // Process new videos maintaining backend order
      const newVideosData: VideoData[] = []

      for (const ydxVideo of ydxVideos) {
        const youtubeId = ydxVideo.youtube_id

        // ⭐ FIX: Check both existing AND current batch
        if (existingIds.has(youtubeId) || currentBatchIds.has(youtubeId)) {
          console.log(`Skipping duplicate video: ${youtubeId}`)
          continue
        }

        const youtubeItem = youtubeDataMap.get(youtubeId)
        if (!youtubeItem?.statistics || !youtubeItem?.snippet) {
          console.warn(`Missing YouTube data for video ${youtubeId}`)
          continue
        }

        // Build video data
        const videoData: VideoData = {
          youTubeId: youtubeId,
          description: youtubeItem.snippet.description,
          thumbnailMediumUrl:
            youtubeItem.snippet.thumbnails?.medium?.url ||
            youtubeItem.snippet.thumbnails?.default?.url ||
            '',
          duration: convertSecondsToCardFormat(
            convertISO8601ToSeconds(youtubeItem.contentDetails.duration),
            true,
          ),
          title: youtubeItem.snippet.title,
          author: youtubeItem.snippet.channelTitle,
          views: convertViewsToCardFormat(
            Number(youtubeItem.statistics.viewCount),
          ),
          time: convertTimeToCardFormat(
            Date.now() - new Date(youtubeItem.snippet.publishedAt).getTime(),
          ),
          buttons: 'none',
          audioDescriptionTimestamp:
            ydxVideo.latest_audio_description_updated_at || 0,
        }

        // ⭐ FIX: Mark this video as processed in current batch
        currentBatchIds.add(youtubeId)
        newVideosData.push(videoData)
      }

      // Combine videos maintaining order
      const allVideosData = isFirstPage
        ? newVideosData
        : [...existingVideoData, ...newVideosData]

      setRawVideoData(allVideosData)
      setRenderKey((prev) => prev + 1)

      // Cache the results
      if (allVideosData.length > 0) {
        videoCache.setVideoData(allVideosData)
      }
    },
    [rawVideoData, videoCache],
  )

  const loadMoreResults = () => {
    setLoadMoreVideos(true)
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchHomePageVideos(nextPage)
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
      {loadMoreVideos ? (
        <Spinner />
      ) : rawVideoData.length >= 20 && hasMoreVideos ? (
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

  // Special case for API limit error
  if (rawVideoData.length === 1 && rawVideoData[0].youTubeId === 'error') {
    return (
      <main id="home" title="YouDescribe home page">
        <header role="banner" className="classic-header w3-container w3-indigo">
          <h2 id="home-heading" className="classic-h2" tabIndex={0}>
            {translate('RECENT DESCRIPTIONS')}
          </h2>
        </header>
        <h1>
          Thank you for visiting YouDescribe. This video is not viewable at this
          time due to YouTube API key limits. Our key is reset by Google at
          midnight Pacific time
        </h1>
      </main>
    )
  }

  return (
    <main id="home" title="YouDescribe home page">
      <header role="banner" className="classic-header w3-container w3-indigo">
        <h2 id="home-heading" className="classic-h2" tabIndex={0}>
          {translate('RECENT DESCRIPTIONS')}
        </h2>
      </header>

      {showSpinner ? <Spinner /> : null}

      <div className="w3-row classic-container row" key={renderKey}>
        {rawVideoData.map((videoData, index) => (
          <div
            className="col-sm-6 col-md-4 col-lg-3"
            key={`${videoData.youTubeId}-pos-${index}`}
          >
            <VideoCard
              youTubeId={videoData.youTubeId}
              description={videoData.description}
              thumbnailMediumUrl={videoData.thumbnailMediumUrl}
              duration={videoData.duration}
              title={videoData.title}
              author={videoData.author}
              views={videoData.views}
              time={videoData.time}
              buttons="none"
              audioDescriptionTimestamp={videoData.audioDescriptionTimestamp}
            />
          </div>
        ))}
      </div>

      {YDLoadMoreButton}
    </main>
  )
}

export default Home
