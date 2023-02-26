import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import path from 'path-browserify'
import styles from './Navbar.css'
import clsx from 'clsx'

interface Props {
  translate: (text: string) => string
}

const Navbar = ({ translate }: Props) => {
  const [isSignedIn, setSignedIn] = useState(false)

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

  const signInComponent = isSignedIn ? (
    // TODO: Add a User Avatar
    // <UserAvatar
    //   translate={translate}
    //   //   signOut={signOut}
    //   userMenuToggle={userMenuToggle}
    //   //   getAppState={this.props.getAppState}
    // />
    <div>Already Signed In</div>
  ) : (
    // TODO: Add a Sign in Button
    <div>Sign In</div>
  )

  return (
    <nav id="navbar" className={styles.navbar}>
      {/* Navbar (sit on top) */}
      <div className="w3-top">
        <div className="w3-bar w3-white w3-card-2 w3-text-indigo">
          <Link
            to="/"
            id="logo"
            className={clsx([
              'w3-bar-item w3-hide-small w3-hide-medium',
              styles.logo,
            ])}
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

          <Link to="/" id="logo" className="w3-bar-item w3-hide-large">
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
            {/* TODO: Add a Search Bar */}
            {/* <SearchBar
              updateSearch={(searchValue) =>
                this.props.updateSearch(searchValue)
              }
              translate={this.props.translate}
            /> */}
          </div>

          {/* Right-sided navbar links */}
          <div className="w3-right w3-hide-small w3-hide-medium">
            <Link
              to="/"
              className="w3-bar-item w3-small"
              style={{ position: 'relative', top: '11px', padding: '8px' }}
            >
              <i className="fa fa-home" aria-hidden="true">
                &nbsp;&nbsp;
              </i>
              {translate('RECENT DESCRIPTIONS')}
            </Link>
            <Link
              to="/wishlist"
              className="w3-bar-item w3-small"
              style={{ position: 'relative', top: '11px', padding: '8px' }}
            >
              <i className="fa fa-heart" aria-hidden="true">
                &nbsp;&nbsp;
              </i>
              {translate('WISH LIST')}
            </Link>
            <Link
              to="/support"
              className="w3-bar-item w3-small"
              style={{ position: 'relative', top: '11px', padding: '8px' }}
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
              {signInComponent}
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
        className="w3-sidenav w3-black w3-card-2 w3-animate-left w3-hide-large"
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
          {translate('WISH LIST')}
        </Link>
        {signInComponent}
      </div>
    </nav>
  )
}

export default Navbar
