import axios from 'axios'
import { apiUrl } from '../config'

// Define interface for YouTube video data
interface YouTubeVideo {
  id: string
  snippet?: {
    title?: string
    description?: string
    publishedAt?: string
    channelTitle?: string
    thumbnails?: {
      default?: { url: string; width: number; height: number }
      medium?: { url: string; width: number; height: number }
      high?: { url: string; width: number; height: number }
    }
    categoryId?: string
    tags?: string[]
  }
  contentDetails?: {
    duration?: string
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
    dislikeCount?: string
    commentCount?: string
  }
}

// Interface for cache entries
interface CacheEntry {
  data: YouTubeVideo
  timestamp: number
}

class YouTubeService {
  private static instance: YouTubeService
  private batchedVideoIds: Set<string> = new Set()
  private batchPromise: Promise<YouTubeVideo[]> | null = null
  private batchTimeoutId: NodeJS.Timeout | null = null
  private readonly BATCH_DELAY = 50 // ms to wait before sending batch request
  private readonly CACHE_PREFIX = 'ydx_cache_video_'
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  // Private constructor for singleton pattern
  private constructor() {
    // Intentionally empty - singleton initialization only
  }

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService()
    }
    return YouTubeService.instance
  }

  /**
   * Get video details with automatic batching and caching
   * @param videoIds Single ID or array of IDs
   * @returns Promise that resolves with video details
   */
  public async getVideoDetails(
    videoIds: string | string[],
  ): Promise<YouTubeVideo[]> {
    const ids = Array.isArray(videoIds) ? videoIds : [videoIds]

    if (!ids.length) return []

    // Check which IDs we already have in local cache
    const cachedResults: YouTubeVideo[] = []
    const missingIds: string[] = []

    ids.forEach((id) => {
      const cachedVideo = this.getFromCache(id)
      if (cachedVideo) {
        cachedResults.push(cachedVideo)
      } else {
        missingIds.push(id)
      }
    })

    // If all videos were in cache, return immediately
    if (missingIds.length === 0) {
      return cachedResults
    }

    // Add missing IDs to batch
    missingIds.forEach((id) => this.batchedVideoIds.add(id))

    // Start batch timeout if not already scheduled
    if (!this.batchPromise) {
      this.batchPromise = new Promise((resolve) => {
        this.batchTimeoutId = setTimeout(() => {
          this.processBatch().then(resolve)
        }, this.BATCH_DELAY)
      })
    }

    // Wait for batch to complete
    const batchResults = await this.batchPromise

    // Cache results
    batchResults.forEach((video: YouTubeVideo) => {
      if (video && video.id) {
        this.saveToCache(video.id, video)
      }
    })

    // Combine cached results with batch results
    const allResults = [...cachedResults]

    // Add missing results from batch
    missingIds.forEach((id) => {
      const batchVideo = batchResults.find(
        (item: YouTubeVideo) => item.id === id,
      )
      if (batchVideo) {
        allResults.push(batchVideo)
      }
    })

    // Filter to only return requested videos in the right order
    return ids
      .map((id) => allResults.find((item) => item.id === id))
      .filter(Boolean) as YouTubeVideo[]
  }

  /**
   * Process the current batch of video ID requests
   */
  private async processBatch(): Promise<YouTubeVideo[]> {
    try {
      const batchIds = Array.from(this.batchedVideoIds)

      // Reset for next batch
      this.batchedVideoIds.clear()
      this.batchPromise = null
      this.batchTimeoutId = null

      // No IDs to process
      if (!batchIds.length) {
        return []
      }

      // Make request to our backend proxy
      const backendUrl = process.env.REACT_APP_YDX_BACKEND_URL
      const response = await axios.get(
        `${backendUrl}/api/youtube-proxy/videos?id=${batchIds.join(',')}`,
        { withCredentials: false },
      )

      return response.data?.items || []
    } catch (error) {
      console.error('Error fetching video details:', error)
      return []
    }
  }

  /**
   * Get a video from local storage cache
   */
  private getFromCache(videoId: string): YouTubeVideo | null {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${videoId}`
      const cachedData = localStorage.getItem(cacheKey)

      if (!cachedData) return null

      const parsed = JSON.parse(cachedData) as CacheEntry

      // Check if cache is expired
      if (parsed.timestamp && Date.now() - parsed.timestamp > this.CACHE_TTL) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return parsed.data
    } catch (error) {
      console.error('Error reading from cache:', error)
      return null
    }
  }

  /**
   * Save a video to local storage cache
   */
  private saveToCache(videoId: string, data: YouTubeVideo): void {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${videoId}`
      const cacheData: CacheEntry = {
        data,
        timestamp: Date.now(),
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }

  /**
   * Clear the video cache
   */
  public clearCache(): void {
    // Clear only our video cache items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
  }
}

export default YouTubeService.getInstance()
