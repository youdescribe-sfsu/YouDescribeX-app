import React, { useState, useEffect } from 'react'
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
  // destructuring props
  // props which handles clicks of New Inline and New Extended buttons from Button Component
  const navigate = useNavigate()
  const [showInlineACComponent, setShowInlineACComponent] = useState(false)
  const [showNewACComponent, setShowNewACComponent] = useState(false)
  const [isModal, setIsModal] = useState(false)
  const [enrollInCollabEdit, setEnrollInCollabEdit] = useState(false)

  const handleClickInsertInline = (e: any) => {
    e.preventDefault()
    setShowNewACComponent(true)
    setShowInlineACComponent(true)
  }

  const handleClickInsertExtended = (e: any) => {
    e.preventDefault()
    setShowNewACComponent(true)
    setShowInlineACComponent(false)
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

  const handlePublish = async (e: any, checkbox: boolean | undefined) => {
    // console.log('publish')

    axios
      .post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api//create-user-links/calculate-contributions`,
        {
          audioDescriptionId: audioDescriptionId,
        },
        {
          withCredentials: true,
        },
      )
      .then(function (response) {
        console.log(response)
      })
      .catch(function (error) {
        console.error(error)
        toast.error('Error calculate contribution!')
      })
    axios
      .post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-descriptions/publish-audio-description`,
        {
          audioDescriptionId,
          youtube_id: youtubeVideoId,
          enrolled_in_collaborative_editing: enrollInCollabEdit,
        },
        {
          withCredentials: true,
        },
      )
      .then(function (response) {
        setNeedRefresh(true)
        toast.success('Audio description published successfully!')
      })
      .catch(function (error) {
        console.error(error)
        toast.error('Error publishing audio description!')
      })
  }

  useEffect(() => {
    if (handleClicksFromParent === 'inline') {
      setShowNewACComponent(true)
      setShowInlineACComponent(true)
      setHandleClicksFromParent('') // reset it back to empty
    } else if (handleClicksFromParent === 'extended') {
      setShowNewACComponent(true)
      setShowInlineACComponent(false)
      setHandleClicksFromParent('') // reset it back to empty
    }
  }, [handleClicksFromParent, setHandleClicksFromParent])

  return (
    <React.Fragment>
      <hr />
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
            currentTime={currentTime}
            videoLength={videoLength}
            audioDescriptionId={audioDescriptionId}
            setShowSpinner={setShowSpinner}
            setNeedRefresh={setNeedRefresh}
          />
        </>
      ) : null}

      <div className="d-flex justify-content-between my-3">
        <div>
          <button
            type="button"
            className="btn inline-bg text-dark ydx-button"
            onClick={handleClickInsertInline}
          >
            <i className="fa fa-plus" /> {'   '}
            Insert Inline
          </button>
          <button
            type="button"
            className="btn mx-5 extended-bg text-white ydx-button"
            onClick={handleClickInsertExtended}
          >
            <i className="fa fa-plus" /> {'   '}
            Insert Extended
          </button>
        </div>
        <div className="mx-4 d-flex align-items-center">
          <input
            type="checkbox"
            checked={enrollInCollabEdit}
            onChange={(e) => setEnrollInCollabEdit(e.target.checked)}
            id="collabEditCheckbox"
            className="form-check-input me-2"
          />
          <label
            htmlFor="collabEditCheckbox"
            className="form-check-label text-white me-3"
          >
            Enroll in Collaborative Editing
          </label>
          <button
            type="button"
            className="btn publish-bg text-white ydx-button"
            data-bs-toggle="modal"
            data-bs-target="#publishModal"
            onClick={() => setIsModal(true)}
          >
            <i className="fa fa-upload" /> {'   '}
            Publish
          </button>
        </div>
      </div>
      {/* Publish Modal Confirmation Modal - opens when user hits Publish button and asks for a confirmation */}
      <ModalComponent
        id="publishModal"
        title="Publish"
        text="Are you sure you want to publish this audio description?"
        modalTask={handlePublish}
        show={isModal}
        handleClose={() => setIsModal(false)}
      />
    </React.Fragment>
  )
}

export default InsertPublish
