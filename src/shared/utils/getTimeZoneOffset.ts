const getTimeZoneOffset = (date: Date, timeZone: string) => {
  //   let iso = date
  //     .toLocaleString('en-CA', { timeZone, hour12: false })
  //     .replace(', ', 'T')

  //   iso += '.' + date.getMilliseconds().toString().padStart(3, '0')

  //   const temp = new Date(iso + 'Z')

  //   return -(temp.getTime() - date.getTime()) / 60 / 1000
  const iso = date
    .toLocaleString('en-CA', { timeZone, hour12: false })
    .replace(', ', 'T')

  const temp = new Date(iso)

  return (temp.getTime() - date.getTime()) / 60000
}

export default getTimeZoneOffset
