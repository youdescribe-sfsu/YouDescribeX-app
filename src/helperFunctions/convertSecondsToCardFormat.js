// converts seconds to hh:mm:ss format
const convertSecondsToCardFormat = (timeInSeconds) => {
  let hours = Math.floor(timeInSeconds / 3600);
  let minutes = Math.floor(timeInSeconds / 60);
  let seconds = Math.floor(timeInSeconds);
  let milliseconds = Math.floor(
    (timeInSeconds - Math.floor(timeInSeconds)) * 100
   );
  if (hours >= 24) hours = Math.floor(hours % 24);
  if (minutes >= 60) minutes = Math.floor(minutes % 60);
  if (minutes < 10 && timeInSeconds >= 3600) minutes = `0${minutes}`;
  if (seconds >= 60) seconds = Math.floor(seconds % 60);
  if (seconds < 10) seconds = `0${seconds}`;
  if (milliseconds < 10) milliseconds = `0${milliseconds}`;
  if (minutes < 10) minutes = `0${minutes}`;
  if (hours < 10) hours = `0${hours}`;
  return `${hours}:${minutes}:${seconds}:${milliseconds}`;
};
export default convertSecondsToCardFormat;
