export const convertISO8601ToDate = (inputDate: string) => {
  const date = new Date(inputDate)
  const dateStr = String(date).split(' ').slice(1, 4)
  dateStr[1] += ','
  return dateStr.join(' ')
}
