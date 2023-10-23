import ourFetch from '../../utils/ourFetch'
import axios from 'axios'
import { apiUrl } from '../../config'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../Button/Button'
import { translate, userDataStore } from '@/App'
import './VideoCard.css'
import React from 'react'
import { toast } from 'react-toastify'

interface Props {
  youTubeId: string
  audioDescriptionId?: string
  description?: string
  buttons: string
  votes?: number
  title: string
  thumbnailMediumUrl: string
  author: string
  duration?: string
  views?: string
  statusVal?: string
  time: string
  userVote?: boolean
}

const VideoCard = ({
  // description,
  audioDescriptionId,
  youTubeId,
  buttons,
  votes,
  title,
  thumbnailMediumUrl,
  author,
  duration,
  statusVal,
  // views,
  // time,
  userVote = false,
}: Props) => {
  const navigate = useNavigate()
  const [voted, setVoted] = React.useState(userVote)
  const handleVideoClick = async () => {
    console.log("INSIDE HANDLECLICK")
    try {
      const url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/save-Visited-Videos-History`
      console.log('BACKEND URL', url)
      axios.post(
          url,
          {
            youtube_id: youTubeId,
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        .then((res) => {
          const data = res.data
          console.log('video click data => ', data)
          if (res.status != 201) {
            alert(
              translate(
                'Something went wrong, please try again later',
              ),
            )
            return
          }
        })
    } catch (error) {
      console.log(error)
      toast.error('Something went wrong, please try again later')
    }
  }
  const upVote = () => {
    if (!userDataStore.getState().isSignedIn) {
      alert(translate('You have to be logged in in order to vote'))
    } else {
      if (voted) {
        const url = `${apiUrl}/wishlist/removeone`
        ourFetch(url, true, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            youTubeId: youTubeId,
            userId: userDataStore.getState().userId,
            userToken: userDataStore.getState().userToken,
          }),
        })
          .then((res) => {
            setVoted(false)
            console.log('Succes remove', res)
          })
          .catch((err) => {
            switch (err.code) {
              case 67:
                alert(
                  translate('It is not possible to vote again for this video.'),
                )
                break
              default:
                alert(
                  translate(
                    'It was impossible to vote. Maybe your session has expired. Try to logout and login again.',
                  ),
                )
            }
          })
        return
      }
      // e.currentTarget.className =
      //   'w3-btn w3-white w3-text-indigo w3-left w3-text-red'
      const url = `${apiUrl}/wishlist`
      ourFetch(url, true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youTubeId: youTubeId,
          userId: userDataStore.getState().userId,
          userToken: userDataStore.getState().userToken,
        }),
      })
        .then((res) => {
          setVoted(true)
          console.log('Success upVote', res)
        })
        .catch((err) => {
          switch (err.code) {
            case 67:
              alert(
                translate('It is not possible to vote again for this video.'),
              )
              break
            default:
              alert(
                translate(
                  'It was impossible to vote. Maybe your session has expired. Try to logout and login again.',
                ),
              )
          }
        })
    }
  }

  const describeThisVideo = () => {
    if (userDataStore.getState().isSignedIn) {
      axios
        .post(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/create-user-links/create-new-user-ad`,
          {
            youtubeVideoId: youTubeId,
          },
          {
            withCredentials: true,
          },
        )
        .then((res) => {
          if (res.status != 201) {
            alert(
              translate(
                'Something went wrong or you may already have described this video. Please try again later!',
              ),
            )
            return
          }
          navigate('/editor/' + res.data.url)
        })
    } else {
      alert(
        translate('You have to be logged in in order to describe this video'),
      )
    }
  }

  const editThisVideo = () => {
    if (userDataStore.getState().isSignedIn) {
      if (audioDescriptionId == null || audioDescriptionId.length <= 0) {
        alert(
          translate(
            'Something went wrong when attempting to edit audio description.',
          ),
        )
      }
      navigate(`/editor/${youTubeId}/${audioDescriptionId}`)
    } else {
      alert(
        translate('You have to be logged in in order to describe this video'),
      )
    }
  }

  const buttonElements =
    buttons === 'upvote-describe' ? (
      <div>
        <Button
          ariaLabel={translate('Request an audio description for this video')}
          // text={<i className="fa fa-heart" />}
          classNames="card-button"
          color={'w3-white w3-text-indigo w3-left'}
          onClick={upVote}
          text={
            <i className={`fa fa-heart ${voted ? 'heart-selected' : ''}`} />
          } // Conditional class name based on isSelected
        />
        {/* <span id="vote-count">
          <div>{votes}</div>
        </span> */}
        <Button
          ariaLabel={translate('Create an audio description for this video')}
          text={translate('Describe')}
          classNames="card-button"
          color="w3-indigo w3-right"
          onClick={describeThisVideo}
        />
      </div>
    ) : buttons === 'edit' ? (
      <div>
        <Button
          ariaLabel={translate('Edit the audio description for this video')}
          text={translate('Edit')}
          color="w3-indigo w3-block"
          onClick={editThisVideo}
          classNames="card-button"
        />
      </div>
    ) : null

  return (
    <div
      id="video-card"
      className="w3-left video-card h-100 w-100"
      title=""
      onClick={handleVideoClick}
    >
      <div className="w3-card-2 w3-hover-shadow h-100">
        <div id="card-thumbnail" className="card-thumbnail" aria-hidden="true">
          <Link
            role="link"
            aria-hidden="true"
            to={'/video/' + youTubeId}
            className=""
          >
            <img alt={title} src={thumbnailMediumUrl} width="100%" />
          </Link>
          {duration ? (
            <div id="card-duration" className="card-duration">
              {duration}
            </div>
          ) : null}
        </div>
        <div className="w3-container w3-padding-bottom card-content">
          <div id="card-title-container" className="card-title-container">
            <div id="card-title" className="card-title">
              <h3 className="card-h3 classic-h3">
                <Link
                  role="link"
                  to={'/video/' + youTubeId}
                  className="classic-link"
                >
                  {title}
                </Link>
              </h3>
            </div>
            <div id="card-author" className="card-author">
              <span className="card-span">
                {translate('Author')}: {author}
              </span>
              <br />
              {votes ? (
                <span className="card-span">
                  {'Votes'}: {votes}
                </span>
              ) : null}
              {/* <span className="card-span">
                {'Votes'}: {votes}
              </span> */}
              {statusVal ? (
                <span className="w3-btn w3-indigo card-button ">
                  {'Status'}: {statusVal}
                </span>
              ) : null}
              {/* <span className="w3-btn w3-indigo w3-right card-button">
                {'Status'}: {statusVal}
              </span> */}
              {/* <a href="#">{this.props.describer}</a> */}
            </div>
          </div>
          {/* <div id="card-stats">
            <h4 className="classic-h4">
              <div className="w3-left">{views}</div>
              <div className="w3-right">{time}</div>
            </h4>
          </div> */}
          <div id="card-buttons">{buttonElements}</div>
        </div>
      </div>
    </div>
  )
}

export default VideoCard
