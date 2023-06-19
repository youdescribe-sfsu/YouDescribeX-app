import { translate } from '@/App'
import Button from '@/shared/components/Button/Button'
import React, { Dispatch, SetStateAction } from 'react'
import './ratingPopup.scss'

interface Props {
  rating: number
  setRating: Dispatch<SetStateAction<number>>
  handleRatingSubmit: (rating: number) => void
  handleRatingPopupClose: () => void
}

const RatingPopup = ({
  rating,
  setRating,
  handleRatingSubmit,
  handleRatingPopupClose,
}: Props) => {
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
          <button onClick={() => handleRatingSubmit(5)} tabIndex={-1}>
            ★
          </button>
          <button onClick={() => handleRatingSubmit(4)} tabIndex={-1}>
            ★
          </button>
          <button onClick={() => handleRatingSubmit(3)} tabIndex={-1}>
            ★
          </button>
          <button onClick={() => handleRatingSubmit(2)} tabIndex={-1}>
            ★
          </button>
          <button onClick={() => handleRatingSubmit(1)} tabIndex={-1}>
            ★
          </button>
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
          />
          <label htmlFor="rating-1"> 1 star</label>
          <br />
          <input
            id="rating-2"
            type="radio"
            name="rating"
            value="2"
            onChange={() => setRating(2)}
          />
          <label htmlFor="rating-2"> 2 stars</label>
          <br />
          <input
            id="rating-3"
            type="radio"
            name="rating"
            value="3"
            onChange={() => setRating(3)}
          />
          <label htmlFor="rating-3"> 3 stars</label>
          <br />
          <input
            id="rating-4"
            type="radio"
            name="rating"
            value="4"
            onChange={() => setRating(4)}
          />
          <label htmlFor="rating-4"> 4 stars</label>
          <br />
          <input
            id="rating-5"
            type="radio"
            name="rating"
            value="5"
            onChange={() => setRating(5)}
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
