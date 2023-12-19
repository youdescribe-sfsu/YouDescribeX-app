import React from 'react'
import './Contact.scss'

const Contact = (): React.ReactElement => (
  <div id="contact">
    <header role="banner" className="w3-container w3-indigo">
      <h2
        style={{
          margin: '10px 0',
          fontSize: '1.25rem',
        }}
      >
        Contact us
      </h2>
    </header>

    <main className="w3-row p-4">
      <p>
        YouDescribe is a project of:
        <br />
        The Smith-Kettlewell Eye Research Institute
        <br />
        2318 Fillmore St
        <br />
        San Francisco, CA 94115
        <br />
      </p>
      <p>
        Email questions, comments, bug reports, and feature requests to:{' '}
        <a href="mailto:info@youdescribe.org?subject=[YouDescribe Feedback]">
          info@youdescribe.org
        </a>
      </p>
    </main>
  </div>
)

export default Contact
