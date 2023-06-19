import { translate } from '@/App'
import Button from '@/shared/components/Button/Button'
import { audioDescriptionFeedbacks } from '@/shared/config'
import React, { ReactNode } from 'react'
import './feedbackPopup.scss'

interface Props {
  handleFeedbackSubmit: (feedback: number[]) => void
  handleFeedbackPopupClose: () => void
}

const FeedbackPopup = ({
  handleFeedbackSubmit,
  handleFeedbackPopupClose,
}: Props) => {
  const getFeedbackList = () => {
    const components: ReactNode[] = []
    Object.keys(audioDescriptionFeedbacks).forEach((key) => {
      const value = audioDescriptionFeedbacks[Number(key)]
      const component = (
        <div key={key}>
          <input
            id={'feedback-input-' + key}
            name="feedback-input"
            type="checkbox"
            value={key}
          />
          <label htmlFor={'feedback-input-' + key}> {translate(value)}</label>
        </div>
      )
      components.push(component)
    })
    return components
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFeedbackChange = (e: any) => {
    e.preventDefault()
    const feedback = []
    const checkboxes = document.getElementsByName(
      'feedback-input',
    ) as NodeListOf<HTMLInputElement>
    for (let i = 0; i < checkboxes.length; i += 1) {
      if (checkboxes[i]?.checked) {
        feedback.push(+checkboxes[i]?.value)
      }
    }
    handleFeedbackSubmit(feedback)
  }

  return (
    <div id="feedback-popup" tabIndex={-1}>
      <div id="feedback-popup-contents">
        <a href="#" onClick={handleFeedbackPopupClose}>
          <i className="fa fa-window-close" />
        </a>
        <h2>{translate('Optional feedback')}</h2>
        <p>
          {translate(
            'Please give additional feedback to help describers make adjustments',
          )}
        </p>
        <p>{translate('Check all that apply')}</p>
        <form onSubmit={handleFeedbackChange}>
          {getFeedbackList()}
          <center>
            <Button
              ariaLabel={translate('Submit feedback')}
              text={translate('Submit')}
              title={translate('Submit feedback')}
              color="w3-indigo w3-margin-top w3-center"
            />
          </center>
        </form>
      </div>
    </div>
  )
}

export default FeedbackPopup
