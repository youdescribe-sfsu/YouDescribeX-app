import React from 'react'
import './unsupportedBrowser.scss'

const UnsupportedBrowser = () => {
  return (
    <div id="unsupported-browser" tabIndex={-1}>
      <header role="banner" className="w3-container w3-indigo">
        <h2 className="classic-h2">Welcome to YouDescribe!</h2>
      </header>

      <main className="w3-row">
        <h2 className="classic-h2">Unsupported device</h2>

        <p>
          If you are using your iPhone or iPad, and have reached this page
          please{' '}
          <a
            href="https://itunes.apple.com/app/id1177344886"
            className="classic-link"
          >
            download YouDescribe mobile app for Apple
          </a>
          .
        </p>

        <p>
          For desktop users, the YouDescribe platform does not work in your
          current web browser.
        </p>

        <p>
          We recommend&nbsp;
          <a href="https://www.google.com/chrome/" className="classic-link">
            Google Chrome
          </a>
          &nbsp;or&nbsp;
          <a
            href="https://www.mozilla.org/en-US/firefox/new/"
            className="classic-link"
          >
            Mozilla Firefox
          </a>{' '}
          to view, describe, and rate our current selection of videos.
        </p>

        <p>
          If you need other assistance please email us at{' '}
          <a href="mailto:info@youdescribe.org" className="classic-link">
            info@youdescribe.org
          </a>
        </p>
      </main>
    </div>
  )
}

export default UnsupportedBrowser
