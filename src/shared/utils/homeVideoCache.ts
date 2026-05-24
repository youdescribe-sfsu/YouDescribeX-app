// Constants and helpers for the home page's "Recent Descriptions" localStorage cache.
// Keep these key names and the CACHE_VERSION in sync with src/pages/Home/Home.tsx.

const CACHE_VERSION = 'v2'
const MAX_PAGES_TO_CACHE = 3

export const invalidateHomeVideoCache = (): void => {
  try {
    for (let i = 1; i <= MAX_PAGES_TO_CACHE; i++) {
      localStorage.removeItem(`ydx-home-page-${i}-${CACHE_VERSION}`)
    }
    localStorage.removeItem('ydx-home-videos-data')
    localStorage.removeItem('ydx-home-max-page')
  } catch (error) {
    console.error('Error invalidating home video cache:', error)
  }
}
