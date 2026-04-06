import { useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tutorialStore } from './tutorialStore'
import { getActiveSteps, type TutorialMode } from './tutorialSteps'
import { INSTANT_SCROLL_RESET, TUTORIAL_EXIT_ROUTE } from './tutorialConstants'
import TutorialOverlay from './TutorialOverlay'
import MockVideoPage from './MockVideoPage'
import MockEditorPage from './MockEditorPage'
import './tutorial.scss'

const TutorialPage = () => {
  const navigate = useNavigate()
  // Tracks whether startTutorial() has been called so we don't
  // accidentally redirect on the first render when isActive is still false.
  const hasStarted = useRef(false)
  // Only redirect when tutorial was active and then ended (skip/complete).
  const wasActiveRef = useRef(false)

  const isActive = tutorialStore((state) => state.isActive)
  const currentStepIndex = tutorialStore((state) => state.currentStepIndex)
  const tutorialMode = tutorialStore((state) => state.tutorialMode)
  const nextStep = tutorialStore((state) => state.nextStep)
  const prevStep = tutorialStore((state) => state.prevStep)
  const skipTutorial = tutorialStore((state) => state.skipTutorial)
  const setTutorialMode = tutorialStore((state) => state.setTutorialMode)

  const activeSteps = getActiveSteps(tutorialMode)
  const currentStep = activeSteps[currentStepIndex]

  // Start the tutorial on mount, stop on unmount
  useEffect(() => {
    tutorialStore.getState().startTutorial()
    hasStarted.current = true
    return () => {
      const { isActive: stillActive } = tutorialStore.getState()
      if (stillActive) {
        tutorialStore.getState().skipTutorial()
      }
    }
  }, [])

  useEffect(() => {
    if (isActive) {
      wasActiveRef.current = true
      return
    }
    if (!hasStarted.current || !wasActiveRef.current) return
    navigate(TUTORIAL_EXIT_ROUTE, { replace: true })
  }, [isActive, navigate])

  const isVideoPage = currentStep.page === 'video'

  // Reset scroll to top whenever we switch pages (e.g. Video -> Editor at Step 6)
  useLayoutEffect(() => {
    // Force instant scroll to bypass CSS scroll-behavior: smooth
    window.scrollTo(INSTANT_SCROLL_RESET)
  }, [isVideoPage])

  const handleChoose = (selectedMode: TutorialMode) => {
    setTutorialMode(selectedMode)
    nextStep()
  }

  return (
    <div className="tutorial-page-container">
      {/* Keep page content mounted before TutorialOverlay so target elements
          exist when the overlay queries data-tutorial selectors. */}
      {isVideoPage ? (
        <MockVideoPage />
      ) : (
        <MockEditorPage
          tutorialMode={tutorialMode}
          uiState={currentStep?.uiState}
        />
      )}

      {isActive && (
        <TutorialOverlay
          step={currentStep}
          onNext={nextStep}
          onBack={prevStep}
          onSkip={skipTutorial}
          onChoose={handleChoose}
          currentStepIndex={currentStepIndex}
          totalSteps={activeSteps.length}
        />
      )}
    </div>
  )
}

export default TutorialPage
