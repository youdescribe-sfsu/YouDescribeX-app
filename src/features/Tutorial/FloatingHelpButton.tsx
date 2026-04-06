import { useNavigate } from 'react-router-dom'
import { tutorialStore } from './tutorialStore'
import { TUTORIAL_ROUTE } from './tutorialConstants'
import './tutorial.scss'

const FloatingHelpButton = () => {
  const navigate = useNavigate()
  const isActive = tutorialStore((state) => state.isActive)

  // hide the button while the tutorial is running
  if (isActive) return null

  const handleClick = () => {
    navigate(TUTORIAL_ROUTE)
  }

  return (
    <button
      className="tutorial-float-btn"
      onClick={handleClick}
      aria-label="Learn how to describe videos for visually impaired viewers"
    >
      Learn how to describe
    </button>
  )
}

export default FloatingHelpButton
