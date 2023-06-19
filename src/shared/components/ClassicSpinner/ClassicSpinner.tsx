import { translate } from '@/App'
import React from 'react'
import './classicSpinner.scss'

const ClassicSpinner = () => {
  return (
    <div className="spinner">
      <img
        className="spinner-loader"
        src="/assets/img/YT_spinner.gif"
        width="10px"
        alt="Loading video"
      />
      <div className="loading-text">{translate('Loading')}...</div>
    </div>
  )
}

export default ClassicSpinner
