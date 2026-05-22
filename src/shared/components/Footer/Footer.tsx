import { Link } from 'react-router-dom'
import path from 'path-browserify'
import { translate } from '@/App'
import '@/app.scss'
import './footer.scss'

const Footer = () => {
  const getYear = () => {
    const date = new Date()
    return date.getFullYear()
  }

  return (
    <footer className="w3-center w3-indigo footer">
      <div className="footer-partners">
        <p className="footer-partners__label">
          {translate('YouDescribe is a project of')}
        </p>
        <div className="footer-partners__names">
          <a
            href="https://www.northeastern.edu/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-partners__name footer-partners__name--neu"
          >
            Northeastern University
          </a>
          <span className="footer-partners__divider" aria-hidden="true"></span>

          <a
            href="https://www.ski.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-partners__name footer-partners__name--skeri"
          >
            Smith-Kettlewell Eye Research Institute
          </a>
          <span className="footer-partners__divider" aria-hidden="true"></span>

          <a
            href="https://www.sfsu.edu/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-partners__name footer-partners__name--sfsu"
          >
            San Francisco State University
          </a>
        </div>
      </div>

      <div>
        <Link to="/credits" className="footer-links">
          {translate('Credits')}
        </Link>
        <Link
          to="/contact"
          target="_self"
          className="footer-links"
          rel="noreferrer"
        >
          {translate('Contact Us')}
        </Link>
        <Link
          to={`/support`}
          target="_self"
          className="footer-links"
          rel="noreferrer"
        >
          {translate('Support')}
        </Link>
      </div>

      <h6 className="classic-h6">
        Copyright © {getYear()}, The Smith-Kettlewell Eye Research Institute,{' '}
        {translate('All rights reserved')}.
      </h6>
    </footer>
  )
}

export default Footer
