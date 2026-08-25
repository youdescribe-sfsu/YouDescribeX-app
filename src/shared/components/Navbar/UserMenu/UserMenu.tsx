import { translate, userDataStore } from '@/App'
import { Link } from 'react-router-dom'
import Button from '../../Button/Button'
import { chromeWebStoreUrl } from '@/shared/config'
import './userMenu.scss'

interface Props {
  signOut: () => void
  userMenuToggle: () => void
}

const UserMenu = ({ userMenuToggle, signOut }: Props) => {
  const myVideosUrl = `/videos/user/${userDataStore.getState().userId}`
  const myHistoryUrl = `/videos/history`

  return (
    <div id="user-menu" tabIndex={-1} className="user-menu">
      <div className="arrow-up"></div>
      <div className="w3-card-4">
        <div className="user-menu-header">
          <span aria-hidden="true">{userDataStore.getState().userName}</span>
        </div>
        <div className="my-described-videos-button">
          <Link
            to={myVideosUrl}
            title={translate('View my described videos')}
            onClick={userMenuToggle}
            className="usermenu-link"
          >
            <i
              style={{ width: 50 }}
              className="fa fa-audio-description"
              aria-hidden="true"
            ></i>
            <span className="usermenu-span">
              {translate('My descriptions')}
            </span>
          </Link>
        </div>
        {/* <div className="my-described-videos-button">
          <Link
            to={myHistoryUrl}
            title={translate('View my historty')}
            onClick={userMenuToggle}
            className="usermenu-link"
          >
            <i
              style={{ width: 50 }}
              className="fa fa-audio-description"
              aria-hidden="true"
            ></i>
            <span className="usermenu-span">{translate('History')}</span>
          </Link>
        </div> */}
        <div className="my-described-videos-button">
          <a
            href={`/profile/${userDataStore.getState().userId}`}
            target="_self"
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
        <div className="my-described-videos-button">
          <a
            href={chromeWebStoreUrl}
            target="_blank"
            title="Get the YouDescribeX Wishlist Chrome extension"
            onClick={userMenuToggle}
            className="usermenu-link"
            rel="noopener noreferrer"
          >
            <i
              style={{ width: 50 }}
              className="fa fa-puzzle-piece"
              aria-hidden="true"
            ></i>
            <span className="usermenu-span">
              {translate('Chrome extension')}
            </span>
          </a>
        </div>
        {userDataStore.getState().userAdmin ? (
          <div className="my-described-videos-button">
            <a
              href={`${process.env.REACT_APP_REDIRECT_URL}/admin`}
              target="_self"
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
