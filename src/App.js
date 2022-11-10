import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import YDXHome from './pages/YDXHome';
import PageNotFound from './pages/PageNotFound';
import UserStudyHome from './pages/UserStudyHome';
import PlayVideo from './pages/PlayVideo';
import './assets/css/index.css';
import { ToastContainer, toast, Zoom } from 'react-toastify'; // for toast messages
import 'react-toastify/dist/ReactToastify.css';


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:youtubeVideoId/:userId" element={<YDXHome />} />
        <Route path="/*" element={<PageNotFound />} />
        <Route path="/userstudy/:participantId" element={<UserStudyHome/>}/>
        <Route path="/videopage/:youtubeVideoId" element={<PlayVideo/>}/>
      </Routes>
      <ToastContainer
        className="toast-btn"
        position="top-center"
        autoClose={4000}
        closeOnClick
        draggable
        pauseOnFocusLoss
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  );
};

export default App;
