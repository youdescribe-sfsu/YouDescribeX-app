import React from 'react'
import Button from '../../Button/Button'
import { translate } from '@/App'

interface Props {
  newGoogleAuth: () => void
}

const SignInButton = ({ newGoogleAuth }: Props) => (
  <Button
    id="btn-sign-in"
    color="w3-indigo"
    ariaLabel="Sign in with Google"
    onClick={newGoogleAuth}
    text={translate('Sign in with Google')}
  />
)

export default SignInButton
