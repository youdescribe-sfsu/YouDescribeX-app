import React, { useState, useEffect } from 'react'
import '@/assets/css/timer.module.css'

const Timer = () => {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)

  function toggle() {
    setIsActive(!isActive)
  }

  function reset() {
    setSeconds(0)
    setIsActive(false)
  }

  useEffect(() => {
    let interval: any = null
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1)
      }, 1000)
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  return (
    <div className="app">
      <div className="col">
        <div className="time">
          User Study Timer : {seconds}s
          <button
            className={`button button-primary button-primary-${
              isActive ? 'active' : 'inactive'
            }`}
            onClick={toggle}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button className="button" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default Timer
