const parseISO8601Duration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  if (!match) {
    return '00:00:00' // Return default if no match found
  }

  const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0
  const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0
  const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0

  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}

export default parseISO8601Duration
