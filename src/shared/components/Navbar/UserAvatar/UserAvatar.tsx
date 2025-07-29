import { userDataStore } from '@/App'
import UserMenu from '../UserMenu/UserMenu'
import './userAvatar.scss'

interface Props {
  userMenuToggle: () => void
  signOut: () => void
}

const UserAvatar = ({ userMenuToggle, signOut }: Props) => {
  const userPicture = userDataStore.getState().userPicture

  return (
    <div id="user-avatar" className="user-avatar">
      <button onClick={userMenuToggle} className="avatar-button">
        <img
          aria-label={`Logged in as ${userDataStore.getState().userName}`}
          alt={`Logged in as ${userDataStore.getState().userName}`}
          src={`${userPicture}`}
          height="45px"
          className="avatar-img"
        />
      </button>
      <UserMenu signOut={signOut} userMenuToggle={userMenuToggle} />
    </div>
  )
}

export default UserAvatar
