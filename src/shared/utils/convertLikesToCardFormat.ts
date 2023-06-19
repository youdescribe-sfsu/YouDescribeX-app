export const convertLikesToCardFormat = (likes: number) => {
  let likesStr = ''
  if (likes >= 1000000000) likesStr = `${(likes / 1000000000).toFixed(1)}B`
  else if (likes >= 1000000) likesStr = `${(likes / 1000000).toFixed(1)}M`
  else if (likes >= 1000) likesStr = `${(likes / 1000).toFixed(0)}K`
  else if (likes === 1) likesStr = `${likes}`
  else likesStr = `${likes}`

  return likesStr
}
