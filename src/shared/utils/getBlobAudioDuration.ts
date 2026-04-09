const getBlobAudioDuration = (blobUrl: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(blobUrl)

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve(audio.duration)
        return
      }

      // Some browsers report Infinity until the audio is seeked once.
      audio.currentTime = 1e101
      audio.ontimeupdate = () => {
        audio.ontimeupdate = null
        audio.currentTime = 0
        resolve(audio.duration)
      }
    })

    audio.addEventListener('error', () => {
      reject(new Error('Unable to read audio duration'))
    })
  })
}

export default getBlobAudioDuration
