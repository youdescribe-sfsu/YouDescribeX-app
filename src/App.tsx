import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import YDXHome from './pages/YDXHome'
import PageNotFound from './pages/PageNotFound'
import UserStudyHome from './pages/UserStudyHome'
import PlayVideo from './pages/PlayVideo'
import './assets/css/index.css'
// import './app.scss'
import { ToastContainer } from 'react-toastify' // for toast messages
import 'react-toastify/dist/ReactToastify.css'
import LogRocket from 'logrocket'
import Home from './pages/Home'
import Navbar from './shared/components/Navbar/Navbar'

const App = () => {
  useEffect(() => {
    if (process.env.REACT_APP_ENVIRONMENT === 'production') {
      LogRocket.init(process.env.REACT_APP_LOGROCKET_ID || '', {
        mergeIframes: true,
        childDomains: ['*'],
      })
    }
  }, [])

  return (
    <>
      <BrowserRouter>
        {/* <Navbar translate={(string) => string} /> */}
        <Routes>
          <Route path="/:youtubeVideoId/:userId" element={<YDXHome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/*" element={<PageNotFound />} />
          <Route path="/userstudy/:participantId" element={<UserStudyHome />} />
          <Route path="/videopage/:youtubeVideoId" element={<PlayVideo />} />
        </Routes>
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
      </BrowserRouter>
    </>
  )
}

export default App
