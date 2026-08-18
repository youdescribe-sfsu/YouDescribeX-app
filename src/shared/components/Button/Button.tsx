import React, { ReactNode } from 'react'

interface Props {
  ariaLabel: string
  /** Id of an element whose text is read after the label, e.g. a rating summary. */
  ariaDescribedBy?: string
  id?: string
  title?: string
  color: string
  onClick?: (e: any) => void
  text: ReactNode
  classNames?: string
  disabled?: boolean
}

const Button = ({
  ariaLabel,
  ariaDescribedBy,
  id,
  title,
  color,
  onClick,
  text,
  classNames,
  disabled = false,
}: Props) => {
  return (
    <div id="button">
      <button
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        id={id}
        title={title}
        className={`w3-btn ${color} ${classNames}`}
        onClick={onClick}
        disabled={disabled}
      >
        {text}
      </button>
    </div>
  )
}

export default Button
