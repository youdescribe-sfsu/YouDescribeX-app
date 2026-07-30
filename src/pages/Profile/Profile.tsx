import React, { useState, useEffect } from 'react'
import { Button, Form } from 'react-bootstrap'
import ourFetch from '@/shared/utils/ourFetch'
import { useNavigate, useParams } from 'react-router-dom'
import { translate, userDataStore } from '@/App'

import { apiUrl } from '@/shared/config'

interface ProfileParams {
  userId: string
}

const Profile = () => {
  const [optInChoices, setOptInChoices] = useState<boolean[]>([false, false])
  const [optIn, setOptIn] = useState<boolean>(false)
  const [reviewStatus, setReviewStatus] = useState<string>('')

  const userId = userDataStore.getState().userId
  const navigate = useNavigate()

  useEffect(() => {
    document.title = translate('My profile')
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUser = async () => {
    try {
      const url = `${apiUrl}/users/${userId}`
      const response = await ourFetch(url)
      const user = response.result
      // Each checkbox is persisted in its own field. choices[0] = wishlist
      // published, choices[1] = automated AI feedback.
      const choices = [
        user.opt_in_wishlist_published === true,
        user.opt_in_ai_feedback === true,
      ]
      setOptInChoices(choices)
      setOptIn(user.opt_in === true)
      setReviewStatus(user.policy_review)
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const handleCheckBoxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(event.target.id)
    const choices = [...optInChoices]
    choices[index] = event.target.checked
    setOptInChoices(choices)
    setOptIn(true)
    setReviewStatus('reviewed')
  }

  const handleRadioButtonChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
    if (value === 'off') {
      setOptInChoices([false, false])
      setOptIn(false)
    } else {
      setOptIn(true)
    }
    setReviewStatus('reviewed')
  }

  const handleSave = async () => {
    if (reviewStatus !== 'reviewed') {
      alert('Sorry, you have not made any choice yet.')
      return
    } else if (optIn && !optInChoices[0] && !optInChoices[1]) {
      alert('Sorry, you have not selected any opt-in checkbox.')
      return
    }
    try {
      const url = `${apiUrl}/users/updateoptin`
      const optionObj = {
        method: 'POST' as const,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          choices: optInChoices,
        }),
      }
      await ourFetch(url, true, optionObj)
      alert(
        'Your opt-in choices have been successfully saved! You will now be redirected to the home page',
      )
      navigate('/') // Redirect using useNavigate
    } catch (error) {
      console.error('Failed to save opt-in choices:', error)
    }
  }

  return (
    <main id="profile" className="profile">
      <div className="w3-container w3-indigo">
        <h2 className="classic-h2" tabIndex={-1}>
          {translate('MY PROFILE')}
        </h2>
      </div>

      <div className="w3-row container">
        <p tabIndex={0}>
          {translate(
            'YouDescribe is now using an optional email notification system. In the form below, please select your desired notification options. These can be changed later in the My Profile tab, found in your user menu.',
          )}
        </p>
        <p
          id="optin-ai-status-note"
          className="optin-note-text"
          style={{ fontSize: '0.9rem' }}
        >
          {translate(
            'Note: emails about the status of your AI description requests (processing and completed) cannot be turned off, and are not affected by the choices below.',
          )}
        </p>
        <Form.Check
          type="radio"
          checked={reviewStatus === 'reviewed' && optIn}
          label={translate('A. Yes I want to be notified by email when:')}
          id="yes"
          name="optionchoices"
          value="on"
          onChange={handleRadioButtonChange}
        />
        <p
          id="optin-required-hint"
          className="optin-helper-text"
          style={{ marginLeft: '1.5em', fontSize: '0.85rem' }}
        >
          {translate('(Please select at least one option below)')}
        </p>
        <div
          role="group"
          aria-label={translate('A. Yes I want to be notified by email when:')}
          aria-required={optIn}
          aria-describedby={optIn ? 'optin-required-hint' : undefined}
        >
          <Form.Check
            style={{ marginLeft: 20 }}
            type="checkbox"
            checked={optInChoices[0]}
            name="optinchoices"
            label={translate(
              'My wishlist selection has been described and published',
            )}
            id="0"
            onChange={handleCheckBoxChange}
          />
          <Form.Check
            style={{ marginLeft: 20 }}
            type="checkbox"
            checked={optInChoices[1]}
            name="optinchoices"
            label={translate(
              'I wish to receive automated feedback on my published audio descriptions',
            )}
            id="1"
            onChange={handleCheckBoxChange}
          />
        </div>
        <br />
        <Form.Check
          type="radio"
          checked={reviewStatus === 'reviewed' && !optIn}
          label={translate(
            "B. I don't want to receive notifications for any of the options above.",
          )}
          name="optin"
          value="off"
          id="no"
          onChange={handleRadioButtonChange}
        />
        <br />
        <b tabIndex={0}>
          {translate(
            'If you feel you are bothered by too many emails, you may opt out AT ANY TIME.',
          )}
        </b>
      </div>
      <div style={{ marginTop: 20, marginBottom: 20, textAlign: 'center' }}>
        <Button
          type="submit"
          style={{ marginTop: 20, marginBottom: 20 }}
          variant="outline-success"
          onClick={handleSave}
        >
          {translate('Save')}
        </Button>
      </div>
    </main>
  )
}

export default Profile
