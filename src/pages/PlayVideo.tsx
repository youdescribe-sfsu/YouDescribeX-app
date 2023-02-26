import React, { useState } from 'react'
import YouTube from 'react-youtube'
import { useParams } from 'react-router-dom'
import '@/assets/css/playVideo.css'
import { Options } from 'youtube-player/dist/types'

const PlayVideo = () => {
  const { youtubeVideoId } = useParams()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentEvent, setCurrentEvent] = useState(0) //stores YouTube video's event
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentState, setCurrentState] = useState(-1) // stores YouTube video's PLAYING, CUED, PAUSED, UNSTARTED, BUFFERING, ENDED state values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTime, setCurrentTime] = useState(0.0) //stores current running time of the YouTube video

  const opts: Options = {
    height: '265',
    width: '500',
    playerVars: {
      autoplay: 0,
      enablejsapi: 1,
      cc_load_policy: 1,
      controls: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
    },
  }

  // YouTube Player Functions
  const onStateChange = (event: any) => {
    const currentTime = event.target.getCurrentTime()
    setCurrentEvent(event.target)
    setCurrentTime(currentTime)
    setCurrentState(event.data)
  }
  const onReady = (event: any) => {
    setCurrentEvent(event.target)
  }
  const onPlay = (event: any) => {
    setCurrentEvent(event.target)
    setCurrentTime(event.target.getCurrentTime())
  }
  const onPause = (event: any) => {
    event.target.pauseVideo()
  }

  return (
    <React.Fragment>
      <div className="container home-container">
        <div className="text-white">
          <h6 className="user-study-text text-center ">Youtube Video</h6>
        </div>
        <hr />
        <div className="youtube-video">
          <YouTube
            className="rounded"
            videoId={youtubeVideoId}
            opts={opts}
            onStateChange={onStateChange}
            onPlay={onPlay}
            onPause={onPause}
            onReady={onReady}
          />
        </div>
      </div>
    </React.Fragment>
  )
}

export default PlayVideo
