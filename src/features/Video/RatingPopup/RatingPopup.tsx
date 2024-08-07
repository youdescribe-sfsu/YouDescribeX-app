import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import './ratingPopup.scss'
import { apiUrl } from '@/shared/config'
import ourFetch from '@/shared/utils/ourFetch'

interface Props {
  audioDescriptionId: string
  rating: number
  setRating: Dispatch<SetStateAction<number>>
  handleRatingSubmit: (rating: number) => void
  handleRatingPopupClose: () => void
}

const RatingPopup = ({
  audioDescriptionId,
  rating,
  setRating,
  handleRatingSubmit,
  handleRatingPopupClose,
}: Props) => {
  const [userRating, setUserRating] = useState<number | null>(null)

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const userId = userDataStore.getState().userId
        const url = `${apiUrl}/audio-descriptions/ratings/user/${audioDescriptionId}?userId=${userId}`
        const response = await ourFetch(url)
        setUserRating(response.result)
        if (response.result !== null) {
          setRating(response.result)
        }
      } catch (error) {
        console.error('Error fetching user rating:', error)
      }
    }

    fetchUserRating()
  }, [audioDescriptionId, setRating])

  const renderStars = () => {
    const stars = []
    for (let i = 5; i >= 1; i--) {
      stars.push(
        <button
          key={i}
          onClick={() => handleRatingSubmit(i)}
          className={`star ${i <= (rating || userRating || 0) ? 'filled' : ''}`}
          tabIndex={-1}
        >
          ★
        </button>,
      )
    }
    return stars
  }

  return (
    <div id="rating-popup" tabIndex={-1}>
      <div id="rating-popup-contents">
        <a aria-label="close window" href="#" onClick={handleRatingPopupClose}>
          <i className="fa fa-window-close" />
        </a>
        <h2>{translate('Rate description')}</h2>
        <p>
          {translate(
            'Please rate this description with 1 star being unusable and 5 stars being perfect',
          )}
        </p>
        <div className="rating" aria-hidden="true">
          {renderStars()}
        </div>
        <form
          className="skip"
          onSubmit={(event) => {
            event.preventDefault()
            handleRatingSubmit(rating)
          }}
        >
          <input
            id="rating-1"
            type="radio"
            name="rating"
            value="1"
            onChange={() => setRating(1)}
            checked={rating === 1}
          />
          <label htmlFor="rating-1"> 1 star</label>
          <br />
          <input
            id="rating-2"
            type="radio"
            name="rating"
            value="2"
            onChange={() => setRating(2)}
            checked={rating === 2}
          />
          <label htmlFor="rating-2"> 2 stars</label>
          <br />
          <input
            id="rating-3"
            type="radio"
            name="rating"
            value="3"
            onChange={() => setRating(3)}
            checked={rating === 3}
          />
          <label htmlFor="rating-3"> 3 stars</label>
          <br />
          <input
            id="rating-4"
            type="radio"
            name="rating"
            value="4"
            onChange={() => setRating(4)}
            checked={rating === 4}
          />
          <label htmlFor="rating-4"> 4 stars</label>
          <br />
          <input
            id="rating-5"
            type="radio"
            name="rating"
            value="5"
            onChange={() => setRating(5)}
            checked={rating === 5}
          />
          <label htmlFor="rating-5"> 5 stars</label>
          <br />
          <Button
            ariaLabel="Submit rating"
            text="Submit rating"
            color="w3-indigo w3-margin-top w3-center"
          />
        </form>
      </div>
    </div>
  )
}

export default RatingPopup
