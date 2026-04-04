import React, { useState, useEffect } from 'react'
import '@/assets/css/insertPublish.css'
import '@/assets/css/audioDesc.css'
import NewAudioClipComponent from '../NewAudioClip/NewAudioClip'
import { userDataStore } from '@/App'

interface Props {
  handleClicksFromParent: string
  setHandleClicksFromParent: React.Dispatch<React.SetStateAction<string>>
  seconds: number
  reset: () => void
  setShowSpinner: React.Dispatch<React.SetStateAction<boolean>>
  userId: string
  youtubeVideoId: string
  currentTime: number
  videoLength: number
  audioDescriptionId: string
  participantId: string
  setNeedRefresh: React.Dispatch<React.SetStateAction<boolean>>
}

const InsertPublish = ({
  handleClicksFromParent,
  setHandleClicksFromParent,
  seconds,
  reset,
  setShowSpinner,
  userId,
  youtubeVideoId,
  currentTime,
  videoLength,
  audioDescriptionId,
  participantId,
  setNeedRefresh,
}: Props) => {
  const [showInlineACComponent, setShowInlineACComponent] = useState(false)
  const [showNewACComponent, setShowNewACComponent] = useState(false)

  useEffect(() => {
    if (handleClicksFromParent === 'inline') {
      setShowNewACComponent(true)
      setShowInlineACComponent(true)
      setHandleClicksFromParent('')
    } else if (handleClicksFromParent === 'extended') {
      setShowNewACComponent(true)
      setShowInlineACComponent(false)
      setHandleClicksFromParent('')
    }
  }, [handleClicksFromParent, setHandleClicksFromParent])

  return (
    <React.Fragment>
      {showNewACComponent && (
        <>
          <hr />
          <h5 className="text-white">
            Insert {showInlineACComponent ? 'Inline' : 'Extended'} Audio Clip
          </h5>
          <NewAudioClipComponent
            userId={userDataStore.getState().userId}
            youtubeVideoId={youtubeVideoId}
            showInlineACComponent={showInlineACComponent}
            setShowNewACComponent={setShowNewACComponent}
            currentTime={currentTime}
            videoLength={videoLength}
            audioDescriptionId={audioDescriptionId}
            setShowSpinner={setShowSpinner}
            setNeedRefresh={setNeedRefresh}
          />
        </>
      )}
    </React.Fragment>
  )
}

export default InsertPublish