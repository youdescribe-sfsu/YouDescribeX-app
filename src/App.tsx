import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import YDXHome from './pages/YDXHome'
import PageNotFound from './pages/PageNotFound'
import UserStudyHome from './pages/UserStudyHome'
import PlayVideo from './pages/PlayVideo'
import './assets/css/index.css'
import './app.scss'
import { ToastContainer } from 'react-toastify' // for toast messages
import 'react-toastify/dist/ReactToastify.css'
import LogRocket from 'logrocket'
import Home from './pages/Home/Home'
import Navbar from './shared/components/Navbar/Navbar'
import Polyglot from 'node-polyglot'
import getLanguage from './shared/utils/getLanguage'
import strings from './shared/strings'
import Video from './pages/Video/Video'
import Footer from './shared/components/Footer/Footer'
import Wishlist from './pages/Wishlist/Wishlist'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiUrl } from './shared/config'

const polyglot = new Polyglot({
  locale: getLanguage(),
  phrases: strings[`${getLanguage()}`],
})

export const translate = polyglot.t.bind(polyglot)

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
  })),
)

const App = () => {
  const { userId, userToken, userName, userPicture } = userDataStore(
    (state) => {
      return {
        userId: state.userId,
        userToken: state.userToken,
        userName: state.userName,
        userPicture: state.userPicture,
      }
    },
  )

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
    if (process.env.REACT_APP_ENVIRONMENT === 'production') {
      LogRocket.init(process.env.REACT_APP_LOGROCKET_ID || '', {
        mergeIframes: true,
        childDomains: ['*'],
      })
    }
    newGoogleLogin()
  }, [])

  const newGoogleAuth = () => {
    const url = `${apiUrl}/auth/google`
    window.open(url, '_self')
  }

  const newGoogleLogin = async () => {
    try {
      const url = `${apiUrl}/auth/login/success`
      const response = await fetch(url, { credentials: 'include' })
      const data = await response.json()
      setUserName(data.result.name)
      setUserId(data.result._id)
      setUserToken(data.result.token)
      setUserPicture(data.result.picture)
      setUserAdmin(data.result.admin)
      setSignedIn(true)
      setCookie(
        data.result._id,
        data.result.token,
        data.result.name,
        data.result.picture,
      )
    } catch (error) {
      console.log(error)
    }
  }

  const signOut = () => {
    setSignedIn(false)
    setUserId('')
    setUserName('')
    setUserToken('')
    setUserAdmin(0)
    resetCookie()
    const url = `${apiUrl}/auth/logout`
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

  const resetCookie = () => {
    document.cookie = `userId=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
    document.cookie = `userToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
    document.cookie = `userName=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
    document.cookie = `userPicture=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
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

  return (
    <html className="classic-html">
      <BrowserRouter>
        <Navbar newGoogleAuth={newGoogleAuth} signOut={signOut} />
        <body className="classic-body">
          <Routes>
            <Route path="/:youtubeVideoId/:userId" element={<YDXHome />} />
            <Route path="/home" element={<Home />} />
            <Route path="/video/:videoId" element={<Video />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/*" element={<PageNotFound />} />
            <Route
              path="/userstudy/:participantId"
              element={<UserStudyHome />}
            />
            <Route path="/videopage/:youtubeVideoId" element={<PlayVideo />} />
          </Routes>
        </body>
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
        <Footer />
      </BrowserRouter>
    </html>
  )
}

export default App
