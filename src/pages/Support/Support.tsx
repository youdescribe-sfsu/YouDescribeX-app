import React from 'react'
import { Link } from 'react-router-dom'
import './support.scss'

const Support = () => (
  <div id="support">
    <header role="banner" className="w3-container w3-indigo">
      <h2
        style={{
          margin: '10px 0',
          fontSize: '1.25rem',
        }}
      >
        Help and Support page{' '}
      </h2>
    </header>
    <main className="support-main w3-row">
      <h2>Welcome to the YouDescribe Help and Support page.</h2>

      <p>We have many resources here for you.</p>

      <ul className="support-links">
        {/* <li>
          <Link to="/support/system-upgrade-warning">
            <b>Information regarding YouDescribe System Upgrade</b>
          </Link>
        </li> */}
        <li>
          <Link to="/support/about">General information about YouDescribe</Link>
        </li>
        <li>
          <Link to="/support/viewers">FAQ pages for viewers</Link>
        </li>
        <li>
          <Link to="/support/describers">FAQ for describers</Link>
        </li>
        <li>
          <Link to="/support/tutorial">
            A step-by-step audio description tutorial with a trouble shooting
            section
          </Link>
        </li>
        <li>
          <Link to="/support/embed_tutorial">
            A step-by-step embedding tutorial
          </Link>
        </li>
        <li>
          <Link to="/support/privacy">Privacy Policy</Link>
        </li>
      </ul>

      <p>
        If you cannot find an answer to your question, please email{' '}
        <a className="support-email" href="mailto:info@youdescribe.org">
          info@youdescribe.org
        </a>
      </p>
    </main>
  </div>
)

export default Support
