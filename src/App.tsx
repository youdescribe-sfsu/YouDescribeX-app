import React, { useEffect } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import YDXHome from './pages/YDXHome'
import PageNotFound from './pages/NotFound/PageNotFound'
import UserStudyHome from './pages/UserStudyHome'
import PlayVideo from './pages/PlayVideo'
import './assets/css/index.css'
import './app.scss'
import { ToastContainer } from 'react-toastify' // for toast messages
import 'react-toastify/dist/ReactToastify.css'
import LogRocket from 'logrocket'
import Home from './pages/Home/Home'
import VideoEmbed from './pages/VideoEmbed/VideoEmbed'
import Navbar from './shared/components/Navbar/Navbar'
import Polyglot from 'node-polyglot'
import getLanguage from './shared/utils/getLanguage'
import strings from './shared/strings'
import Video from './pages/Video/Video'
import Footer from './shared/components/Footer/Footer'
import Wishlist from './pages/Wishlist/Wishlist'
import Profile from './pages/Profile/Profile'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiUrl } from './shared/config'
import Search from './pages/Search/Search'
import Support from './pages/Support/Support'
import About from './pages/Support/About'
import Describers from './pages/Support/Describers'
import EmbedTutorial from './pages/Support/EmbedTutorial'
import Tutorial from './pages/Support/Tutorial'
import Viewers from './pages/Support/Viewers'
import Privacy from './pages/Support/Privacy'
import SystemUpgradeWarning from './pages/Support/SystemUpgradeWarning'
import UnsupportedBrowser from './pages/UnsupportedBrowser/UnsupportedBrowser'
import { detect } from 'detect-browser'
import Credits from './pages/Credits/Credits'
import CreditsDetails from './pages/CreditsDetails/CreditsDetails'
import UserDescribedVideos from './pages/UserDescribedVideos/UserDescribedVideos'
import History from './pages/History/History'
import ReactGA from 'react-ga'
import ReactGA4 from 'react-ga4'
import { createBrowserHistory } from 'history'
import PublishedAudioDescriptions from './pages/PublishedAudioDescriptions/PublishedAudioDescriptions'
import Contact from './pages/Contact/Contact'

const history = createBrowserHistory()
//const trackingId = "UA-171142756-3"; //live site key
const trackingIdUA = 'UA-174046676-1' //dev key
const trackingIdGA = 'G-46Y1989R9T' // GA4 key
ReactGA.initialize(trackingIdUA)
ReactGA4.initialize(trackingIdGA)

history.listen((location) => {
  ReactGA.set({ page: location.location.pathname }) // Update the user's current page
  ReactGA.pageview(location.location.pathname) // Record a pageview for the given page

  // Google Analytics 4
  ReactGA4.set({ page: location.location.pathname }) // Update the user's current page
  ReactGA4.send(location.location.pathname) // Record a pageview for the given page
})

const polyglot = new Polyglot({
  locale: getLanguage(),
  phrases: strings[`${getLanguage()}`],
})

export const translate = polyglot.t.bind(polyglot)

const resetCookie = () => {
  document.cookie = `userId=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  document.cookie = `userToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  document.cookie = `userName=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  document.cookie = `userPicture=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}
interface UserStore {
  isSignedIn: boolean
  userId: string
  userToken: string
  userName: string
  userPicture: string
  userAdmin: number
  setSignedIn: (isSignedIn: boolean) => void
  setUserId: (userId: string) => void
  setUserToken: (userToken: string) => void
  setUserName: (userName: string) => void
  setUserPicture: (userPicture: string) => void
  setUserAdmin: (userAdmin: number) => void
  clearUserData: () => void // New action to clear all data
}

export const userDataStore = create<UserStore>()(
  devtools((set) => ({
    isSignedIn: false,
    userId: '',
    userToken: '',
    userName: '',
    userPicture: '',
    userAdmin: 0,
    setSignedIn: (isSignedIn: boolean) => set({ isSignedIn }),
    setUserId: (userId: string) => set({ userId }),
    setUserToken: (userToken: string) => set({ userToken }),
    setUserName: (userName: string) => set({ userName }),
    setUserPicture: (userPicture: string) => set({ userPicture }),
    setUserAdmin: (userAdmin: number) => set({ userAdmin }),
    clearUserData: () => {
      set({
        isSignedIn: false,
        userId: '',
        userToken: '',
        userName: '',
        userPicture: '',
        userAdmin: 0,
      })
      localStorage.clear()
      resetCookie()
    },
  })),
)

const App = () => {
  const { userId, userToken, userName, userPicture, clearUserData } =
    userDataStore((state) => {
      return {
        userId: state.userId,
        userToken: state.userToken,
        userName: state.userName,
        userPicture: state.userPicture,
        clearUserData: state.clearUserData,
      }
    })
  const navigate = useNavigate()
  const location = useLocation()

  const {
    setSignedIn,
    setUserId,
    setUserToken,
    setUserName,
    setUserPicture,
    setUserAdmin,
  } = userDataStore((state) => {
    return {
      setSignedIn: state.setSignedIn,
      setUserId: state.setUserId,
      setUserToken: state.setUserToken,
      setUserName: state.setUserName,
      setUserPicture: state.setUserPicture,
      setUserAdmin: state.setUserAdmin,
    }
  })

  useEffect(() => {
    const browser = detect()
    const unsupportedOs = ['ios', 'Android OS']
    const supportedBrowsers = ['chrome', 'firefox']
    if (
      (browser?.os && unsupportedOs.indexOf(browser.os) !== -1) ||
      (browser?.name && supportedBrowsers.indexOf(browser.name) === -1)
    ) {
      navigate(`/unsupported-browser`)
    }
    if (process.env.REACT_APP_ENVIRONMENT === 'production') {
      LogRocket.init(process.env.REACT_APP_LOGROCKET_ID || '', {
        mergeIframes: true,
        childDomains: ['*'],
      })
    }
    newGoogleLogin()
  }, [])

  const newGoogleAuth = () => {
    // Get the full current URL to preserve query parameters
    const currentPath = window.location.pathname + window.location.search

    // Create the full return URL
    const returnUrl = `${window.location.origin}${currentPath}`

    let url
    if (process.env.REACT_APP_USE_YDX) {
      // Pass the encoded return URL as a query parameter
      url = `${
        process.env.REACT_APP_YDX_BACKEND_URL
      }/api/auth/google?returnTo=${encodeURIComponent(returnUrl)}`
    } else {
      url = `${apiUrl}/auth/google?returnTo=${encodeURIComponent(returnUrl)}`
    }
    window.open(url, '_self')
  }

  const newGoogleLogin = async () => {
    try {
      let url
      if (process.env.REACT_APP_USE_YDX) {
        url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/auth/login/success`
      } else {
        url = `${apiUrl}/auth/login/success`
      }

      if (process.env.REACT_APP_ENVIRONMENT === 'development') {
        const authUser = process.env.REACT_APP_USER_ID || ''
        url = `${process.env.REACT_APP_YDX_BACKEND_URL}/api/auth/google/localhost`
        if (authUser) {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: authUser,
            },
            credentials: 'include',
          })
          const data = await response.json()

          setUserData(data.result)
          handleRedirect()
        }
      } else {
        const response = await fetch(url, {
          credentials: 'include',
        })
        const data = await response.json()

        setUserData(data.result)
        handleRedirect()
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  // New helper function to set user data
  const setUserData = (result: any) => {
    setUserName(result.name)
    setUserId(result._id)
    setUserToken(result.token)
    setUserPicture(result.picture)
    setUserAdmin(result.admin)
    setSignedIn(true)
    setCookie(result._id, result.token, result.name, result.picture)
  }

  const handleRedirect = () => {
    // First try to get return path from URL
    const urlParams = new URLSearchParams(window.location.search)
    const returnTo = urlParams.get('returnTo')

    if (returnTo) {
      window.location.href = decodeURIComponent(returnTo)
    } else {
      // If no returnTo in URL, use the path we stored (you can remove this if you prefer)
      const storedPath = localStorage.getItem('authReturnPath')
      if (storedPath) {
        localStorage.removeItem('authReturnPath') // Clean up
        window.location.href = `${window.location.origin}${storedPath}`
      }
    }
  }

  const signOut = () => {
    clearUserData()
    const url = `${apiUrl}/auth/logout?url=${window.location.href}`
    window.open(url, '_self')
  }

  const getUserInfo = () => {
    const userId = getCookie('userId')
    const userToken = getCookie('userToken')
    const userName = getCookie('userName')
    const userPicture = getCookie('userPicture')

    if (userId && userToken && userName && userPicture) {
      setSignedIn(true)
      setUserId(userId)
      setUserToken(userToken)
      setUserName(userName)
      setUserPicture(userPicture)
      setUserAdmin(0)
    }
  }

  const setCookie = (
    id: string,
    token: string,
    name: string,
    picture: string,
  ) => {
    const now = new Date()
    let time = now.getTime()
    time += 20 * 1000
    now.setTime(time)
    const exp = now.toUTCString()
    document.cookie = `userId=${id};path=/`
    document.cookie = `userToken=${token};path=/`
    document.cookie = `userName=${name};path=/`
    document.cookie = `userPicture=${picture};path=/`
  }

  const getCookie = (cname: string) => {
    const name = cname + '='
    const decodedCookie = decodeURIComponent(document.cookie)
    const ca = decodedCookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) == ' ') {
        c = c.substring(1)
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length)
      }
    }
    return ''
  }

  const isEmbedRoute = window.location.pathname.includes('/embed/')

  return (
    <>
      {!isEmbedRoute && (
        <Navbar newGoogleAuth={newGoogleAuth} signOut={signOut} />
      )}
      <div
        className="classic-body"
        style={{
          paddingTop:
            location.pathname.includes('editor') ||
            location.pathname.includes('embed')
              ? '0px'
              : '54px',
        }}
      >
        <Routes>
          <Route
            path="/editor/:youtubeVideoId/:audioDescriptionId"
            element={<YDXHome />}
          />
          <Route path="/home" element={<Home />} />
          <Route path="/video/:videoId" element={<Video />} />
          {/* <Route path="/video/v2/:videoId" element={<Video_v2 />} /> */}
          <Route path="/embed/:videoId" element={<VideoEmbed />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/support" element={<Support />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/credits-details" element={<CreditsDetails />} />
          <Route path="/unsupported-browser" element={<UnsupportedBrowser />} />
          <Route
            path="/videos/user/:userId"
            element={<UserDescribedVideos />}
          />
          <Route path="/videos/history" element={<History />} />
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/userstudy/:participantId" element={<UserStudyHome />} />
          <Route path="/videopage/:youtubeVideoId" element={<PlayVideo />} />
          <Route path="/*" element={<PageNotFound />} />
          <Route path="/support/about" element={<About />} />
          <Route path="/support/describers" element={<Describers />} />
          <Route path="/support/tutorial" element={<Tutorial />} />
          <Route path="/support/embed_tutorial" element={<EmbedTutorial />} />
          <Route path="/support/viewers" element={<Viewers />} />
          <Route path="/support/privacy" element={<Privacy />} />
          <Route
            path="/support/system-upgrade-warning"
            element={<SystemUpgradeWarning />}
          />
          <Route
            path="/audio-description/:youtubeVideoId/:audioDescriptionId"
            element={<PublishedAudioDescriptions />}
          />
          <Route
            path="/audio-description/preview/:youtubeVideoId/:audioDescriptionId"
            element={<PublishedAudioDescriptions />}
          />
        </Routes>
      </div>
      <ToastContainer
        className="toast-btn"
        position="top-center"
        autoClose={1000}
        closeOnClick
        draggable
        pauseOnFocusLoss
        pauseOnHover
        theme="colored"
      />
      {!isEmbedRoute && <Footer />}
    </>
  )
}

export default App
