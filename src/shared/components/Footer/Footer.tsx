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
    <footer className="w3-center w3-indigo w3-padding-32 footer">
      <div>
        <a href="https://itunes.apple.com/app/id1177344886">
          <img
            alt="YouDescribe is also available for iphone at Itunes Store"
            src={path.join(__dirname, 'assets', 'img', 'logo-apple-store.jpg')}
          />
        </a>
      </div>
      <h5 className="classic-h5">
        {translate('YouDescribe is a project of')}{' '}
        <a href="http://www.ski.org" title="External link">
          The Smith-Kettlewell Eye Research Institute
        </a>
        .
      </h5>
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
