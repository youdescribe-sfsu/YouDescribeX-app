import { translate, userDataStore } from '@/App'
import Button from '@/shared/components/Button/Button'
import React, { ReactNode } from 'react'
import Accordion from 'react-bootstrap/Accordion'
import { useNavigate } from 'react-router-dom'
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
  // Optional feedback UI disabled — data field (`feedback`) kept on the rating payload.
  // handleFeedbackPopup: () => void
  handleNewCollabEdit: (describerId: string) => void
  videoId?: string
  collaborativeEdit?: boolean
  contributions: Map<string, number>
  displayContributions?: { [key: string]: number }
}

/**
 * Accessible name for the star widget, applied via role="img" + aria-label.
 *
 * The average blends comprehension and enjoyment, so it lands on halves —
 * reported to one decimal rather than rounded to the number of filled stars.
 */
const getRatingLabel = (average: number): string => {
  if (average === null || average === undefined || Number.isNaN(average)) {
    return 'no ratings'
  }
  return `${Math.round(average * 10) / 10} out of 5 star rating`
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
  // handleFeedbackPopup,
  handleNewCollabEdit,
  videoId,
  collaborativeEdit,
  contributions,
  displayContributions, // Add this new prop
}: Props) => {
  const navigate = useNavigate()

  const ratingLabel = getRatingLabel(overall_rating_average)
  // Unique per card so each describer's button describes its own rating.
  const ratingLabelId = `describer-rating-${describerId}`

  const getButton = (): ReactNode => {
    const userName = userDataStore.getState().userName
    const isDescriber = name === userName
    if (describerId === selectedDescriberId) {
      return isDescriber ? (
        <Button
          ariaLabel={translate('Edit your audio description')}
          title={translate('Edit your audio description')}
          text={translate('Edit description')}
          color="w3-indigo w3-block w3-margin-top"
          onClick={() => navigate(`/editor/${videoId}/${selectedDescriberId}`)}
        />
      ) : (
        <>
          <Button
            ariaLabel={translate("Rate this describer's audio description")}
            ariaDescribedBy={ratingLabelId}
            title={translate("Rate this describer's audio description")}
            text={translate('Rate Description')}
            color="w3-indigo w3-block w3-margin-top"
            onClick={() => handleRatingPopup()}
          />
          {/* Optional feedback UI disabled — data field (`feedback`) kept on the rating payload.
          <Button
            ariaLabel={translate('Provide feedback for this describer')}
            title={translate('Provide feedback for this describer')}
            text={translate('Optional Feedback')}
            color="w3-indigo w3-block w3-margin-top"
            onClick={() => handleFeedbackPopup()}
          />
          */}
          {collaborativeEdit && (
            <Button
              ariaLabel={translate(
                'Provide Collaborative edit for this describer',
              )}
              title={translate('Provide Collaborative edit for this describer')}
              text={translate('Collaborative Edit')}
              color="w3-lime w3-block w3-margin-top"
              onClick={() => handleNewCollabEdit(describerId)}
            />
          )}
        </>
      )
    }
    return (
      <Button
        ariaLabel={translate("Select this describer's audio description")}
        ariaDescribedBy={ratingLabelId}
        title={translate("Select this describer's audio description")}
        text={translate('Use description')}
        color="w3-indigo w3-block"
        onClick={() => handleDescriberChange(describerId)}
      />
    )
  }

  const getStars = (): ReactNode[] => {
    // Snapped to the nearest half so a 4.5 average is visually distinct from a
    // perfect 5, matching the decimal the screen-reader label reports.
    const snapped = Math.round(overall_rating_average * 2) / 2
    const fullStars = Math.floor(snapped)
    // NaN comparisons are all false, so an absent average leaves every star grey.
    const halfIndex = snapped > fullStars ? fullStars : -1

    const starClass = (index: number): string | undefined => {
      if (index < fullStars) return 'star-full'
      if (index === halfIndex) return 'star-half'
      return undefined
    }

    return Array.from({ length: 5 }, (unused, i) => (
      <button
        key={i}
        className={starClass(i)}
        onClick={() => handleRating(5 - i)}
        tabIndex={-1}
      >
        ★
      </button>
    ))
  }

  const getDisplayedName = (): string => {
    // First check if displayContributions exists and has entries
    if (displayContributions && Object.keys(displayContributions).length > 1) {
      const keysArray = Array.from(Object.keys(displayContributions))
      return keysArray.join('/')
    }

    // Fall back to the original implementation for backward compatibility
    if (!contributions || contributions.size <= 1) {
      return name
    }
    const keysArray = Array.from(Object.keys(contributions))
    return keysArray.join('/')
  }

  const renderContributionBars = () => {
    // Use displayContributions if available, otherwise fall back to contributions
    const contribSource =
      displayContributions && Object.keys(displayContributions).length > 0
        ? displayContributions
        : contributions

    // Skip rendering if there's only one or no contributors
    if (
      !contribSource ||
      (typeof contribSource.size === 'number'
        ? contribSource.size <= 1
        : Object.keys(contribSource).length <= 1)
    ) {
      return null
    }

    // Get values to calculate max contribution
    const contribValues =
      typeof contribSource.size === 'number'
        ? Array.from(Object.values(contribSource))
        : Object.values(contribSource)

    const maxContribution = Math.max(...contribValues)

    return (
      <div className="contribution-bars">
        {(typeof contribSource.size === 'number'
          ? Array.from(Object.entries(contribSource))
          : Object.entries(contribSource)
        ).map(([id, contribution]) => (
          <div key={id} className="contribution-bar">
            <div>{id}</div>
            <div>
              <div style={{ width: `${contribution * 100}%` }}></div>
              <div>{contribution.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const needAvatar =
    name !== 'AI Description Draft' &&
    (!contributions || contributions.size <= 1)

  return (
    <div id="describer-card" className="describer-card">
      <div className="w3-card-2">
        <div className="w3-row">
          {needAvatar && (
            <>
              <div className="w3-col l3 m5 s3">
                <img src={picture} alt={`Profile picture of ${name}`} />
              </div>
              <div className="w3-col l9 m7 s9">
                {getDisplayedName()}
                {/* role="img" + aria-label makes the star row itself the
                    accessible node. Its descendants are dropped from the tree
                    automatically, so the individual stars need no aria-hidden. */}
                <div
                  className="rating-desc"
                  role="img"
                  aria-label={ratingLabel}
                >
                  {getStars()}
                </div>
                {/* aria-describedby reads the target's text, not its aria-label,
                    so the buttons point here rather than at the star row —
                    otherwise the description comes out as "★ ★ ★ ★ ★". */}
                <span className="visually-hidden" id={ratingLabelId}>
                  {ratingLabel}
                </span>
              </div>
            </>
          )}
          {!needAvatar && (
            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>{getDisplayedName()}</Accordion.Header>
                <Accordion.Body>
                  {/* <div className="w3-col l12 m12 s12"> */}
                  <div
                    className="rating-desc"
                    role="img"
                    aria-label={ratingLabel}
                  >
                    {getStars()}
                  </div>
                  <span className="visually-hidden" id={ratingLabelId}>
                    {ratingLabel}
                  </span>
                  {renderContributionBars()}
                  <hr aria-hidden="true" />
                  {getButton()}
                  {/* </div> */}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}
        </div>
        {needAvatar && <hr aria-hidden="true" />}
        {needAvatar && getButton()}
      </div>
    </div>
  )
}

export default DescriberCard
