import { userDataStore } from '@/App'
import React from 'react'
import UserMenu from '../UserMenu/UserMenu'
import './userAvatar.scss'

interface Props {
  userMenuToggle: () => void
  signOut: () => void
}

const UserAvatar = ({ userMenuToggle, signOut }: Props) => {
  return (
    <div id="user-avatar" className="user-avatar">
      <button onClick={userMenuToggle} className="avatar-button">
        <img
          aria-label={`Logged in as ${userDataStore.getState().userName}`}
          alt={`Logged in as ${userDataStore.getState().userName}`}
          title={`Logged in as ${userDataStore.getState().userName}`}
          src={`${userDataStore.getState().userPicture}`}
          height="33px"
          className="avatar-img"
        />
      </button>
      <UserMenu signOut={signOut} userMenuToggle={userMenuToggle} />
    </div>
  )
}

export default UserAvatar
