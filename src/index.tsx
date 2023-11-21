import React from 'react'
import ReactDOM from 'react-dom'
import './assets/css/index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { BrowserRouter } from 'react-router-dom'

import { tryLoadAndStartRecorder } from '@alwaysmeticulous/recorder-loader'

async function startApp() {
  // Record all sessions on localhost, staging stacks and preview URLs
  if (!isProduction()) {
    // Start the Meticulous recorder before you initialise your app.
    // Note: all errors are caught and logged, so no need to surround with try/catch
    await tryLoadAndStartRecorder({
      projectId: 'VJhstm4BWoFqSY6iayLo6WHvKEohMlajw92jcuda',
      isProduction: false,
    })
  }

  // Initalise app after the Meticulous recorder is ready, e.g.
  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root'),
  )
}

function isProduction() {
  // TODO: Update me with your production hostname
  return window.location.hostname.indexOf('your-production-site.com') > -1
}

startApp()

// ReactDOM.render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </React.StrictMode>,
//   document.getElementById('root'),
// )

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
