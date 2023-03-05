import React, { ReactNode } from 'react'

interface Props {
  ariaLabel: string
  id?: string
  title?: string
  color: string
  onClick?: (e: any) => void
  text: ReactNode
  classNames?: string
}

const Button = ({
  ariaLabel,
  id,
  title,
  color,
  onClick,
  text,
  classNames,
}: Props) => {
  return (
    <div id="button">
      <button
        aria-label={ariaLabel}
        id={id}
        title={title}
        className={`w3-btn ${color} ${classNames}`}
        onClick={onClick}
      >
        {text}
      </button>
    </div>
  )
}

export default Button
