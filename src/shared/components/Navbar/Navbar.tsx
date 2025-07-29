import { translate, userDataStore } from '@/App'
import path from 'path-browserify'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'
import SearchBar from './SearchBar/SearchBar'
import SignInButton from './SignInButton/SignInButton'
import UserAvatar from './UserAvatar/UserAvatar'

interface Props {
  newGoogleAuth: () => void
  signOut: () => void
}

const Navbar = ({ newGoogleAuth, signOut }: Props) => {
  const location = useLocation()

  const navMenuOpen = () => {
    const mySidenav = document.getElementById('mySidenav')
    if (mySidenav) {
      if (mySidenav.style.display === 'block') {
        mySidenav.style.display = 'none'
      } else {
        mySidenav.style.display = 'block'
      }
    }
  }

  const navMenuClose = () => {
    const mySidenav = document.getElementById('mySidenav')
    mySidenav && (mySidenav.style.display = 'none')
  }

  const userMenuToggle = () => {
    const userMenu = document.getElementById('user-menu')
    if (userMenu) {
      if (userMenu.style.display === 'block') {
        userMenu.style.display = 'none'
      } else {
        userMenu.style.display = 'block'
        document.getElementById('user-menu')?.focus()
      }
    }
  }

  const signInComponent = () => {
    if (userDataStore.getState().isSignedIn) {
      return <UserAvatar userMenuToggle={userMenuToggle} signOut={signOut} />
    } else {
      return <SignInButton newGoogleAuth={newGoogleAuth} />
    }
  }
  const myHistoryUrl = `/videos/history`

  return (
    <nav id="navbar" className="classic-nav navbar">
      {/* Navbar (sit on top) */}
      <div
        className=""
        style={{
          position: location.pathname.includes('editor') ? undefined : 'fixed',
          width: '100%',
          zIndex: 1,
        }}
      >
        <div className="w3-bar w3-white w3-card-2 w3-text-indigo">
          <Link
            to="/home"
            id="logo"
            className="w3-bar-item w3-hide-small w3-hide-medium logo"
          >
            <img
              alt="YouDescribe home"
              height="100%"
              src={path.join(
                __dirname,
                'assets',
                'img',
                'youdescribe_logo_full_(indigo_and_grey).png',
              )}
            />
          </Link>

          <Link to="/home" id="logo" className="w3-bar-item w3-hide-large logo">
            <img
              alt="YouDescribe home"
              height="100%"
              src={path.join(
                __dirname,
                'assets',
                'img',
                'youdescribe_logo_small_(indigo_and_grey).png',
              )}
            />
          </Link>

          <div className="w3-left">
            <SearchBar />
          </div>

          {/* Right-sided navbar links */}
          <div className="w3-right w3-hide-small w3-hide-medium">
            <Link
              to={myHistoryUrl}
              className="classic-link w3-bar-item w3-small"
              style={{ position: 'relative', top: '11px' }}
            >
              <i className="fa fa-home" aria-hidden="true">
                &nbsp;&nbsp;
              </i>
              {translate('HISTORY')}
            </Link>
            <Link
              to="/wishlist"
              className="classic-link w3-bar-item w3-small"
              style={{ position: 'relative', top: '11px' }}
            >
              <i className="fa fa-heart" aria-hidden="true">
                &nbsp;&nbsp;
              </i>
              {translate('WISHLIST')}
            </Link>
            {/* <a
              // href={`${process.env.REACT_APP_REDIRECT_URL}support`}
              href={`${apiUrl}support`}
              target="_self"
              className="classic-link w3-bar-item w3-small"
              style={{ position: 'relative', top: '11px', padding: '8px' }}
              rel="noreferrer"
            >
              <i className="fa fa-question-circle" aria-hidden="true">
                &nbsp;&nbsp;
              </i>
              {translate('SUPPORT')}
            </a> */}
            <Link
              to="/support"
              className="classic-link w3-bar-item w3-small"
              style={{ position: 'relative', top: '11px' }}
            >
              <i className="fa fa-question-circle" aria-hidden="true">
                &nbsp;&nbsp;
              </i>
              {translate('SUPPORT')}
            </Link>
            <div
              className="w3-bar-item"
              style={{ position: 'relative', top: '2px' }}
            >
              {signInComponent()}
            </div>
          </div>

          {/* Hide right-floated links on small screens and replace them with a menu icon */}
          <a
            aria-hidden="true"
            className="w3-bar-item w3-right w3-hide-large"
            style={{ position: 'relative', top: '8px' }}
            onClick={navMenuOpen}
          >
            <i className="fa fa-bars" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Sidenav on small screens when clicking the menu icon */}
      <div
        id="mySidenav"
        className="w3-sidenav w3-card-2 w3-animate-left w3-hide-large sidenav"
        style={{ display: 'none' }}
      >
        <a onClick={navMenuClose} className="w3-large w3-padding-16">
          {translate('Close')} ×
        </a>
        <Link
          to="/"
          className="w3-bar-item w3-button"
          onClick={() => document.getElementById('home-heading')?.focus()}
        >
          <i className="fa fa-home" aria-hidden="true" /> {translate('HOME')}
        </Link>
        <Link
          to="/wishlist"
          className="w3-bar-item w3-button"
          onClick={() => document.getElementById('wish-list-heading')?.focus()}
        >
          <i className="fa fa-heart" aria-hidden="true" />{' '}
          {translate('WISHLIST')}
        </Link>
        {signInComponent()}
      </div>
    </nav>
  )
}

export default Navbar
