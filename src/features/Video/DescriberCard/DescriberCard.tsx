import { translate } from '@/App'
import Button from '@/shared/components/Button/Button'
import React, { ReactNode } from 'react'
import './describerCard.scss'

interface Props {
  picture: string
  name: string
  describerId: string
  selectedDescriberId: string
  overall_rating_average: number
  handleDescriberChange: (describerId: string) => void
  handleRating: (rating: number) => void
  handleRatingPopup: () => void
}

const DescriberCard = ({
  picture,
  name,
  describerId,
  selectedDescriberId,
  overall_rating_average,
  handleDescriberChange,
  handleRating,
  handleRatingPopup,
}: Props) => {
  const getButton = (): ReactNode => {
    if (describerId === selectedDescriberId) {
      return (
        <Button
          ariaLabel={translate("Rate this describer's audio description")}
          title={translate("Rate this describer's audio description")}
          text={translate('Rate description')}
          color="w3-indigo w3-block"
          onClick={() => handleRatingPopup()}
        />
      )
    }
    return (
      <Button
        ariaLabel={translate("Select this describer's audio description")}
        title={translate("Select this describer's audio description")}
        text={translate('Use description')}
        color="w3-indigo w3-block"
        onClick={() => handleDescriberChange(describerId)}
      />
    )
  }

  const getStars = (): ReactNode[] => {
    const stars: ReactNode[] = []
    for (let i = 0; i < 5; i += 1) {
      if (i + 1 <= Math.round(overall_rating_average)) {
        stars.push(
          <button
            key={i}
            style={{ color: 'gold' }}
            onClick={() => handleRating(5 - i)}
            tabIndex={-1}
          >
            ★
          </button>,
        )
      } else {
        stars.push(
          <button key={i} onClick={() => handleRating(5 - i)} tabIndex={-1}>
            ★
          </button>,
        )
      }
    }
    return stars
  }

  return (
    <div id="describer-card" className="describer-card">
      <div className="w3-card-2">
        <div className="w3-row">
          <div className="w3-col l3 m5 s3">
            <img src={picture} alt={`Profile picture of ${name}`} />
          </div>
          <div className="w3-col l9 m7 s9">
            {name}
            <div className="rating" aria-hidden="true">
              {getStars()}
            </div>
            <div className="skip">
              {Number.isNaN(Math.round(overall_rating_average))
                ? 'no ratings'
                : `${Math.round(overall_rating_average)} star rating`}
            </div>
          </div>
        </div>
        <hr aria-hidden="true" />
        {getButton()}
      </div>
    </div>
  )
}

export default DescriberCard
