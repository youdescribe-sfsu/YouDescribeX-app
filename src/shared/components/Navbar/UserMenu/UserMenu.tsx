import { translate, userDataStore } from '@/App'
import { Link } from 'react-router-dom'
import Button from '../../Button/Button'
import './userMenu.scss'

interface Props {
  signOut: () => void
  userMenuToggle: () => void
}

const UserMenu = ({ userMenuToggle, signOut }: Props) => {
  const myVideosUrl = `/videos/user/${userDataStore.getState().userId}`

  return (
    <div id="user-menu" tabIndex={-1} className="user-menu">
      <div className="arrow-up"></div>
      <div className="w3-card-4">
        <div className="user-menu-header">
          <span aria-hidden="true">{userDataStore.getState().userName}</span>
        </div>
        <div className="my-described-videos-button">
          <a
            href={`${process.env.REACT_APP_REDIRECT_URL}${myVideosUrl}`}
            target="_blank"
            title={translate('View my described videos')}
            onClick={userMenuToggle}
            className="usermenu-link"
            rel="noreferrer"
          >
            <i
              style={{ width: 50 }}
              className="fa fa-audio-description"
              aria-hidden="true"
            ></i>
            <span className="usermenu-span">
              {translate('My descriptions')}
            </span>
          </a>
        </div>
        <div className="my-described-videos-button">
          <a
            href={`${process.env.REACT_APP_REDIRECT_URL}/profile/${
              userDataStore.getState().userId
            }`}
            target="_blank"
            title="View my profile"
            onClick={userMenuToggle}
            className="usermenu-link"
            rel="noreferrer"
          >
            <i
              style={{ width: 50 }}
              className="fa fa-cog"
              aria-hidden="true"
            ></i>
            <span className="usermenu-span">{translate('My profile')}</span>
          </a>
        </div>
        {userDataStore.getState().userAdmin ? (
          <div className="my-described-videos-button">
            <a
              href={`${process.env.REACT_APP_REDIRECT_URL}/admin`}
              target="_blank"
              title="Admin"
              onClick={userMenuToggle}
              rel="noreferrer"
            >
              <i
                style={{ width: 50 }}
                className="fa fa-user"
                aria-hidden="true"
              ></i>
              <span className="usermenu-span">{translate('Admin')}</span>
            </a>
          </div>
        ) : (
          ''
        )}
        <hr className="classic-hr usermenu-hr" />
        <div className="sign-out-button">
          <Button
            ariaLabel={translate('Sign out')}
            color="w3-indigo"
            text={translate('Sign out')}
            onClick={signOut}
          />
        </div>
      </div>
    </div>
  )
}

export default UserMenu
