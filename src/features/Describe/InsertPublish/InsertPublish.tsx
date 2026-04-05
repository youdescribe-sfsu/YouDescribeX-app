import React, { useState, useEffect, useCallback } from 'react'
import '@/assets/css/insertPublish.css'
import '@/assets/css/audioDesc.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import NewAudioClipComponent from '../NewAudioClip/NewAudioClip'
import ModalComponent from '../../../shared/components/Modal/Modal'
import { toast } from 'react-toastify'
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
  const navigate = useNavigate()
  const [showInlineACComponent, setShowInlineACComponent] = useState(false)
  const [showNewACComponent, setShowNewACComponent] = useState(false)
  const [isModal, setIsModal] = useState(false)
  const [insertClipStartTimeSnapshot, setInsertClipStartTimeSnapshot] =
    useState(currentTime)

  const openNewAudioClip = useCallback(
    (isInline: boolean) => {
      // Snapshot the visible timeline label time at open so the dialog does
      // not drift if playback state changes while the form is open.
      setInsertClipStartTimeSnapshot(currentTime)
      setShowInlineACComponent(isInline)
      setShowNewACComponent(true)
    },
    [currentTime],
  )

  const handleClickInsertInline = (e: any) => {
    e.preventDefault()
    openNewAudioClip(true)
  }

  const handleClickInsertExtended = (e: any) => {
    e.preventDefault()
    openNewAudioClip(false)
  }

  const handleClickPublish = (e: any) => {
    axios
      .post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/add-timedata-to-db/addtimedata`,
        {
          participant_id: participantId,
          time: seconds,
        },
      )
      .then(function (response) {
        reset()
      })
      .catch(function (error) {
        console.error(error)
      })
  }

  useEffect(() => {
    if (handleClicksFromParent === 'inline') {
      setHandleClicksFromParent('')
      openNewAudioClip(true)
    } else if (handleClicksFromParent === 'extended') {
      setHandleClicksFromParent('')
      openNewAudioClip(false)
    }
  }, [handleClicksFromParent, openNewAudioClip, setHandleClicksFromParent])

  return (
    <React.Fragment>
      {showNewACComponent ? (
        <>
          <h5 className="text-white">
            Insert {showInlineACComponent ? 'Inline' : 'Extended'} Audio Clip
          </h5>
          <NewAudioClipComponent
            userId={userDataStore.getState().userId}
            youtubeVideoId={youtubeVideoId}
            showInlineACComponent={showInlineACComponent}
            setShowNewACComponent={setShowNewACComponent}
            initialStartTime={insertClipStartTimeSnapshot}
            videoLength={videoLength}
            audioDescriptionId={audioDescriptionId}
            setShowSpinner={setShowSpinner}
            setNeedRefresh={setNeedRefresh}
          />
        </>
      ) : null}
    </React.Fragment>
  )
}

export default InsertPublish
