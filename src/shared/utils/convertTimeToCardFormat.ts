const convertTimeToCardFormat = (time: number): string => {
  const year = 31536000000
  const month = 2629740000
  const day = 86400000
  const hour = 3600000
  const min = 60000

  let timeString = ''

  if (time >= year) {
    const years = Math.floor(time / year)
    years === 1
      ? (timeString = `${years} year ago`)
      : (timeString = `${years} years ago`)
  } else if (time >= month) {
    const months = Math.floor(time / month)
    months === 1
      ? (timeString = `${months} month ago`)
      : (timeString = `${months} months ago`)
  } else if (time >= day) {
    const days = Math.floor(time / day)
    days === 1
      ? (timeString = `${days} day ago`)
      : (timeString = `${days} days ago`)
  } else if (time >= hour) {
    const hours = Math.floor(time / hour)
    hours === 1
      ? (timeString = `${hours} hour ago`)
      : (timeString = `${hours} hours ago`)
  } else {
    const minutes = Math.floor(time / min)
    minutes === 1
      ? (timeString = `${minutes} minutes ago`)
      : (timeString = `${minutes} minutes ago`)
  }

  return timeString
}

export default convertTimeToCardFormat
