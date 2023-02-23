const convertISO8601ToSeconds = (input: string): number | undefined => {
  const reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  let hours = 0
  let minutes = 0
  let seconds = 0
  let totalSeconds
  if (reptms.test(input)) {
    const matches = reptms.exec(input)
    if (matches) {
      if (matches[1]) hours = Number(matches[1])
      if (matches[2]) minutes = Number(matches[2])
      if (matches[3]) seconds = Number(matches[3])
    }
    totalSeconds = hours * 3600 + minutes * 60 + seconds
  }
  return totalSeconds
}

export default convertISO8601ToSeconds
