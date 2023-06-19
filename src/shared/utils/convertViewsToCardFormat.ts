const convertViewsToCardFormat = (views: number): string => {
  let viewsString = ''

  if (views >= 1000000000)
    viewsString = `${(views / 1000000000).toFixed(1)}B views`
  else if (views >= 1000000)
    viewsString = `${(views / 1000000).toFixed(1)}M views`
  else if (views >= 1000) viewsString = `${(views / 1000).toFixed(0)}K views`
  else if (views === 1) viewsString = `${views} view`
  else viewsString = `${views} views`

  return viewsString
}

export default convertViewsToCardFormat
