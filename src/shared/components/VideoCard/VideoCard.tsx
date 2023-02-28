import React from 'react'
import ourFetch from '../../utils/ourFetch'
import { apiUrl } from '../../config'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../Button/Button'

interface Props {
  youTubeId: string
  getAppState: () => any
  translate: (text: string) => string
  buttons: string
  votes: number
  title: string
  thumbnailMediumUrl: string
  author: string
  duration: number
}

const VideoCard = ({
  getAppState,
  translate,
  youTubeId,
  buttons,
  votes,
  title,
  thumbnailMediumUrl,
  author,
  duration,
}: Props) => {
  const navigate = useNavigate()

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
          color="w3-white w3-text-indigo w3-left"
          onClick={upVote}
        />
        <span id="vote-count">
          <div>{votes}</div>
        </span>
        <Button
          ariaLabel={translate('Create an audio description for this video')}
          text={translate('Describe')}
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
        />
      </div>
    ) : null

  return (
    <div id="video-card" className="w3-margin-top w3-left" title="">
      <div className="w3-card-2 w3-hover-shadow">
        <div id="card-thumbnail" aria-hidden="true">
          <Link
            role="link"
            aria-hidden="true"
            to={'/video/' + youTubeId}
            className="ydx-link"
          >
            <img alt={title} src={thumbnailMediumUrl} width="100%" />
          </Link>
          <div id="card-duration">{duration}</div>
        </div>
        <div className="w3-container w3-padding-bottom">
          <div id="card-title-container">
            <div id="card-title">
              <h3>
                <Link
                  role="link"
                  to={'/video/' + youTubeId}
                  className="ydx-link"
                >
                  {title}
                </Link>
              </h3>
            </div>
            <div id="card-author">
              <span>
                {translate('Author')}: {author}
              </span>
              <br />
              <span>
                {'Votes'}: {votes}
              </span>
              {/* <a href="#">{this.props.describer}</a> */}
            </div>
          </div>
          {/*<div id="card-stats">
        <h4><div className="w3-left">{this.props.views}</div><div className="w3-right">{this.props.time}</div></h4>
      </div>*/}
          <div id="card-buttons">{buttons}</div>
        </div>
      </div>
    </div>
  )
}

export default VideoCard
