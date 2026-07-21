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
  const authStatus = userDataStore((s) => s.authStatus) // xiao: reactive subscription — re-renders when auth state changes

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

  // xiao: three-state rendering — nothing while checking, avatar when confirmed, sign-in button when denied
  const signInComponent = () => {
    if (authStatus === 'loading') {
      return null
    }
    if (authStatus === 'authenticated') {
      return <UserAvatar userMenuToggle={userMenuToggle} signOut={signOut} />
    }
    return <SignInButton newGoogleAuth={newGoogleAuth} />
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
        <div className="navbar-bar">
          <Link to="/home" id="logo" className="navbar-logo-link">
            <img
              alt="YouDescribe home"
              className="navbar-logo-img"
              src={path.join(
                __dirname,
                'assets',
                'img',
                'YD_Logo_Horizontal.png',
              )}
            />
          </Link>

          <div className="navbar-search-area">
            <SearchBar />
          </div>

          {/* Right-sided navbar links (desktop) */}
          <div className="navbar-links w3-hide-small w3-hide-medium">
            <Link to={myHistoryUrl} className="nav-link-item">
              <i className="fa fa-home" aria-hidden="true" />
              {translate('HISTORY')}
            </Link>
            <Link to="/wishlist" className="nav-link-item">
              <i className="fa fa-heart" aria-hidden="true" />
              {translate('WISHLIST')}
            </Link>
            <Link to="/support" className="nav-link-item">
              <i className="fa fa-question-circle" aria-hidden="true" />
              {translate('SUPPORT')}
            </Link>
            <div className="nav-sign-in">{signInComponent()}</div>
          </div>

          {/* Hamburger menu for mobile */}
          <a
            aria-hidden="true"
            className="navbar-hamburger w3-hide-large"
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
          {translate('Close')} &times;
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
