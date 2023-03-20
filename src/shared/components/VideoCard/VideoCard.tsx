import React from 'react'
import ourFetch from '../../utils/ourFetch'
import { apiUrl } from '../../config'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../Button/Button'
import { translate } from '@/App'
import './VideoCard.css'

interface Props {
  youTubeId: string
  getAppState?: () => any
  description?: string
  buttons: string
  votes?: number
  title: string
  thumbnailMediumUrl: string
  author: string
  duration?: string
  views?: string
  time: string
}

const VideoCard = ({
  description,
  youTubeId,
  buttons,
  votes,
  title,
  thumbnailMediumUrl,
  author,
  duration,
  views,
  time,
}: Props) => {
  const navigate = useNavigate()
  const getAppState = () => {
    return {
      isSignedIn: true,
      userId: '123',
      userToken: '123',
    }
  }

  const upVote = (e: any) => {
    if (!getAppState().isSignedIn) {
      alert(translate('You have to be logged in in order to vote'))
    } else {
      e.currentTarget.className =
        'w3-btn w3-white w3-text-indigo w3-left w3-text-red'
      const url = `${apiUrl}/wishlist`
      ourFetch(url, true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youTubeId: youTubeId,
          userId: getAppState().userId,
          userToken: getAppState().userToken,
        }),
      })
        .then((res) => {
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
    if (getAppState().isSignedIn) {
      navigate('/authoring-tool/' + youTubeId)
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
          text={<i className="fa fa-heart" />}
          classNames="card-button"
          color="w3-white w3-text-indigo w3-left"
          onClick={upVote}
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
          onClick={describeThisVideo}
          classNames="card-button"
        />
      </div>
    ) : null

  return (
    <div id="video-card" className="w3-left video-card h-100 w-100" title="">
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
              <span className="card-span">
                {'Votes'}: {votes}
              </span>
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
