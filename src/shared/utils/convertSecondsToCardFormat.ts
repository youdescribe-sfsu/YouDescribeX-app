import padNumber from './padNumber'

const convertSecondsToCardFormat = (timeInSeconds: number): string => {
  let hours: number = Math.floor(timeInSeconds / 3600)
  let minutes: number = Math.floor(timeInSeconds / 60)
  let seconds: number = Math.floor(timeInSeconds)
  let milliseconds: number = Math.floor(
    (timeInSeconds - Math.floor(timeInSeconds)) * 100,
  )
  if (hours >= 24) hours = Math.floor(hours % 24)
  if (minutes >= 60) minutes = Math.floor(minutes % 60)
  if (minutes < 10 && timeInSeconds >= 3600) minutes = parseInt(`0${minutes}`)
  if (seconds >= 60) seconds = Math.floor(seconds % 60)
  if (seconds < 10) seconds = parseInt(`0${seconds}`)
  if (milliseconds < 10) milliseconds = parseInt(`0${milliseconds}`)
  if (minutes < 10) minutes = parseInt(`0${minutes}`)
  if (hours < 10) hours = parseInt(`0${hours}`)
  return `${padNumber(hours)}:${padNumber(hours)}:${padNumber(
    seconds,
  )}:${padNumber(milliseconds)}`
}

export default convertSecondsToCardFormat
