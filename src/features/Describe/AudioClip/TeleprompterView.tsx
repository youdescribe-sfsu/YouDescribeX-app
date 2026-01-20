import React from 'react'
import '@/assets/css/teleprompter.css'

interface TeleprompterViewProps {
  text: string
}

const TeleprompterView: React.FC<TeleprompterViewProps> = ({ text }) => {
  return (
    <div className="teleprompter-container">
      <div className="teleprompter-text-area">
        <p className="teleprompter-text">{text}</p>
      </div>
    </div>
  )
}

export default TeleprompterView
