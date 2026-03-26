const getBlobAudioDuration = (blobUrl: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const audio = new Audio(blobUrl)

    const cleanup = () => {
      audio.onloadedmetadata = null
      audio.ontimeupdate = null
      audio.onerror = null
    }

    audio.onerror = () => {
      cleanup()
      reject(new Error('Unable to read recorded audio duration'))
    }

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const duration = Math.round(audio.duration * 1000) / 1000
        cleanup()
        resolve(duration)
        return
      }

      audio.currentTime = 1e101
      audio.ontimeupdate = () => {
        const duration = Math.round(audio.duration * 1000) / 1000
        audio.currentTime = 0
        cleanup()
        resolve(duration)
      }
    }
  })

export default getBlobAudioDuration
