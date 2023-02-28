import React, { ReactNode } from 'react'

interface Props {
  ariaLabel: string
  id?: string
  title?: string
  color: string
  onClick: (e: any) => void
  text: ReactNode
}

const Button = ({ ariaLabel, id, title, color, onClick, text }: Props) => {
  return (
    <div id="button">
      <button
        aria-label={ariaLabel}
        id={id}
        title={title}
        className={`w3-btn ${color}`}
        onClick={onClick}
      >
        {text}
      </button>
    </div>
  )
}

export default Button
