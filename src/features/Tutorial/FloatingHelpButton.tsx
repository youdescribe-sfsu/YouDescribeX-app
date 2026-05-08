import { useLocation, useNavigate } from 'react-router-dom'
import { tutorialStore } from './tutorialStore'
import { TUTORIAL_ROUTE } from './tutorialConfig'
import './tutorial.scss'

const HIDDEN_FLOATING_HELP_PATH_PREFIXES = [
  '/videos/user',
  '/videos/history',
  '/wishlist',
  '/editor',
  '/profile',
  '/support',
]

const shouldHideFloatingHelpButton = (pathname: string) =>
  HIDDEN_FLOATING_HELP_PATH_PREFIXES.some(
    (pathPrefix) =>
      pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`),
  )

const FloatingHelpButton = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isActive = tutorialStore((state) => state.isActive)

  if (isActive || shouldHideFloatingHelpButton(pathname)) return null

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
