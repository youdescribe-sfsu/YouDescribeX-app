import {
  Fragment,
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  Placement,
} from '@floating-ui/react-dom'
import { type TutorialMode, TutorialStep } from './tutorialStepRegistry'
import './tutorial.scss'

interface Props {
  step: TutorialStep
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onChoose?: (mode: TutorialMode) => void
  currentStepIndex: number
  totalSteps: number
  moveKeyboardToPanel: boolean
  navigationSource: 'tutorial-controls' | 'page-tab'
}

const DEFAULT_SPOTLIGHT_PADDING = {
  top: 6,
  right: 6,
  bottom: 6,
  left: 6,
}

// These delays are intentional: the tutorial waits for DOM paint/layout so
// querySelector and floating measurements can reliably find rendered targets.
const TARGET_POLL_INTERVAL_MS = 100
const TOOLTIP_FOCUS_DELAY_MS = 50
const SCROLL_AFTER_LAYOUT_DELAY_MS = 100
const TARGET_STABLE_FRAME_COUNT = 2
const TARGET_SETTLE_FALLBACK_MS = 500

const SCROLL_BLOCK_KEYS = [
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const INTERACTIVE_TAG_NAMES = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'SELECT',
  'SUMMARY',
  'TEXTAREA',
])

const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'listbox',
  'menuitem',
  'option',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
])

const toPlacement = (pos: TutorialStep['position']): Placement =>
  pos === 'center' ? 'bottom' : pos

const shouldAutoScroll = (autoScroll: TutorialStep['autoScroll']): boolean =>
  autoScroll !== false

const isScrollToTopStep = (autoScroll: TutorialStep['autoScroll']): boolean =>
  autoScroll === 'top'

const isInteractiveElement = (element: Element | null): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  const role = element.getAttribute('role')

  return (
    INTERACTIVE_TAG_NAMES.has(element.tagName) ||
    element.isContentEditable ||
    (role !== null && INTERACTIVE_ROLES.has(role))
  )
}

const getTargetFocusElement = (element: Element | null): HTMLElement | null => {
  if (!(element instanceof HTMLElement)) {
    return null
  }

  if (element.matches(FOCUSABLE_SELECTOR)) {
    return element
  }

  return element.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
}

const appendIdReference = (value: string | null, id: string): string => {
  const ids = value?.split(/\s+/).filter(Boolean) ?? []
  return ids.includes(id) ? ids.join(' ') : [...ids, id].join(' ')
}

const appendIdReferences = (value: string | null, ids: string[]): string =>
  ids.reduce(
    (currentValue, id) => appendIdReference(currentValue, id),
    value,
  ) ?? ''

const restoreAttribute = (
  element: HTMLElement,
  attributeName: string,
  previousValue: string | null,
) => {
  if (previousValue !== null) {
    element.setAttribute(attributeName, previousValue)
    return
  }

  element.removeAttribute(attributeName)
}

const isScrollBlockKey = (key: string): boolean =>
  SCROLL_BLOCK_KEYS.includes(key)

const getVisibleElement = (selector: string): Element | null => {
  const elements = Array.from(document.querySelectorAll(selector))

  for (const element of elements) {
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      return element
    }
  }

  return null
}

const areRectsEquivalent = (firstRect: DOMRect, secondRect: DOMRect) =>
  Math.abs(firstRect.top - secondRect.top) < 0.5 &&
  Math.abs(firstRect.left - secondRect.left) < 0.5 &&
  Math.abs(firstRect.width - secondRect.width) < 0.5 &&
  Math.abs(firstRect.height - secondRect.height) < 0.5

const waitForStableRect = (
  element: Element,
  onStable: () => void,
): (() => void) => {
  let animationFrameId: number | undefined
  let previousRect: DOMRect | null = null
  let stableFrameCount = 0
  let isCancelled = false

  const checkRect = () => {
    if (isCancelled) return

    const currentRect = element.getBoundingClientRect()
    if (currentRect.width <= 0 || currentRect.height <= 0) {
      previousRect = null
      stableFrameCount = 0
    } else if (previousRect && areRectsEquivalent(previousRect, currentRect)) {
      stableFrameCount += 1
    } else {
      previousRect = currentRect
      stableFrameCount = 0
    }

    if (stableFrameCount >= TARGET_STABLE_FRAME_COUNT) {
      onStable()
      return
    }

    animationFrameId = window.requestAnimationFrame(checkRect)
  }

  animationFrameId = window.requestAnimationFrame(checkRect)

  return () => {
    isCancelled = true
    if (animationFrameId !== undefined) {
      window.cancelAnimationFrame(animationFrameId)
    }
  }
}

const getSpotlightBox = (
  rect: DOMRect,
  spotlightPadding: TutorialStep['spotlightPadding'],
  spotlightOffsetX: TutorialStep['spotlightOffsetX'],
): { x: string; y: string; w: string; h: string } => {
  const padding = spotlightPadding ?? DEFAULT_SPOTLIGHT_PADDING
  const offsetX = spotlightOffsetX ?? 0

  return {
    x: String(rect.left - padding.left + offsetX),
    y: String(rect.top - padding.top),
    w: String(rect.width + padding.left + padding.right),
    h: String(rect.height + padding.top + padding.bottom),
  }
}

const getSpotlightRect = (
  targetRect: DOMRect,
  targetEl: Element,
  spotlightIncludeSelector: TutorialStep['spotlightIncludeSelector'],
): DOMRect => {
  if (!spotlightIncludeSelector) {
    return targetRect
  }

  const includeEl =
    targetEl.querySelector(spotlightIncludeSelector) ??
    document.querySelector(spotlightIncludeSelector)

  if (!includeEl) {
    return targetRect
  }

  const includeRect = includeEl.getBoundingClientRect()
  if (includeRect.width <= 0 || includeRect.height <= 0) {
    return targetRect
  }

  const left = Math.min(targetRect.left, includeRect.left)
  const top = Math.min(targetRect.top, includeRect.top)
  const right = Math.max(targetRect.right, includeRect.right)
  const bottom = Math.max(targetRect.bottom, includeRect.bottom)

  return new DOMRect(left, top, right - left, bottom - top)
}

const getCombinedViewportBounds = (
  targetEl: Element | null,
  tooltipEl: HTMLElement | null,
): { top: number; left: number; width: number; height: number } | null => {
  const rects: DOMRect[] = []

  if (targetEl) {
    rects.push(targetEl.getBoundingClientRect())
  }

  if (tooltipEl) {
    rects.push(tooltipEl.getBoundingClientRect())
  }

  if (rects.length === 0) {
    return null
  }

  const top = Math.min(...rects.map((rect) => rect.top))
  const bottom = Math.max(...rects.map((rect) => rect.bottom))
  const left = Math.min(...rects.map((rect) => rect.left))
  const right = Math.max(...rects.map((rect) => rect.right))

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  }
}

const TutorialOverlay = ({
  step,
  onNext,
  onBack,
  onSkip,
  onChoose,
  currentStepIndex,
  totalSteps,
  moveKeyboardToPanel,
  navigationSource,
}: Props) => {
  const [targetState, setTargetState] = useState<{
    element: Element | null
    stepId: string | null
  }>({ element: null, stepId: null })
  const [isTargetSettled, setIsTargetSettled] = useState(false)
  const holeRef = useRef<SVGRectElement>(null)
  const outlineRef = useRef<SVGRectElement>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const isTrulyCentered = step.position === 'center' || !step.targetSelector
  const shouldWaitForTargetSettling = step.waitForTargetSettle === true
  const targetEl = targetState.stepId === step.id ? targetState.element : null
  const isTargetReady =
    isTrulyCentered ||
    (targetEl !== null && (!shouldWaitForTargetSettling || isTargetSettled))
  const isOverlayReady = isTargetReady

  const handleTargetClick = useCallback(() => {
    onNext()
  }, [onNext])

  useEffect(() => {
    setTargetState({ element: null, stepId: null })
    setIsTargetSettled(false)

    if (!step.targetSelector) {
      return undefined
    }

    let interval: ReturnType<typeof setInterval> | undefined
    let clickTarget: Element | null = null

    const findTarget = () => {
      const element = getVisibleElement(step.targetSelector)
      if (!element) {
        return false
      }

      setIsTargetSettled(false)
      setTargetState({ element, stepId: step.id })

      if (step.action === 'click' && clickTarget !== element) {
        element.addEventListener('click', handleTargetClick)
        clickTarget = element
      }

      return true
    }

    const found = findTarget()
    if (!found) {
      interval = setInterval(() => {
        if (findTarget() && interval) {
          clearInterval(interval)
        }
      }, TARGET_POLL_INTERVAL_MS)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }

      if (clickTarget) {
        clickTarget.removeEventListener('click', handleTargetClick)
      }
    }
  }, [step.id, step.targetSelector, step.action, handleTargetClick])

  useEffect(() => {
    if (!shouldWaitForTargetSettling || isTrulyCentered || !targetEl) {
      setIsTargetSettled(false)
      return undefined
    }

    setIsTargetSettled(false)
    let isCancelled = false
    let cancelStableRectWait: (() => void) | undefined

    const settleTarget = () => {
      if (isCancelled) return
      setIsTargetSettled(true)
    }

    const waitForStableTargetRect = () => {
      if (isCancelled) return
      cancelStableRectWait = waitForStableRect(targetEl, settleTarget)
    }

    const activeAnimations =
      targetEl
        .getAnimations?.({ subtree: true })
        .filter(
          (animation) =>
            animation.playState !== 'finished' &&
            animation.playState !== 'idle',
        ) ?? []

    if (activeAnimations.length > 0) {
      Promise.allSettled(
        activeAnimations.map((animation) => animation.finished),
      ).then(waitForStableTargetRect)
    } else {
      waitForStableTargetRect()
    }

    const fallbackTimer = window.setTimeout(() => {
      cancelStableRectWait?.()
      settleTarget()
    }, TARGET_SETTLE_FALLBACK_MS)

    return () => {
      isCancelled = true
      window.clearTimeout(fallbackTimer)
      cancelStableRectWait?.()
    }
  }, [isTrulyCentered, shouldWaitForTargetSettling, targetEl, step.id])

  useEffect(() => {
    if (step.action !== 'click' || !targetEl) return

    const element = targetEl as HTMLElement
    const prevTabIndex = element.getAttribute('tabindex')
    const prevRole = element.getAttribute('role')
    const prevAriaLabel = element.getAttribute('aria-label')

    element.setAttribute('tabindex', '0')
    element.setAttribute('role', 'button')
    element.setAttribute(
      'aria-label',
      `${step.title} — press Enter to continue`,
    )

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleTargetClick()
      }
    }

    element.addEventListener('keydown', handleKeydown)

    return () => {
      element.removeEventListener('keydown', handleKeydown)

      if (prevRole !== null) {
        element.setAttribute('role', prevRole)
      } else {
        element.removeAttribute('role')
      }

      if (prevAriaLabel !== null) {
        element.setAttribute('aria-label', prevAriaLabel)
      } else {
        element.removeAttribute('aria-label')
      }

      if (prevTabIndex !== null) {
        element.setAttribute('tabindex', prevTabIndex)
      } else {
        element.removeAttribute('tabindex')
      }
    }
  }, [step.action, step.title, targetEl, handleTargetClick])

  useLayoutEffect(() => {
    const hole = holeRef.current
    const outline = outlineRef.current
    if (!hole || !outline) return

    const syncPosition = () => {
      if (isTrulyCentered || !targetEl || !isTargetReady) {
        hole.setAttribute('width', '0')
        hole.setAttribute('height', '0')
        outline.setAttribute('width', '0')
        outline.setAttribute('height', '0')
        return undefined
      }

      const targetRect = targetEl.getBoundingClientRect()
      if (targetRect.width <= 0 || targetRect.height <= 0) {
        return undefined
      }

      const spotlightRect = getSpotlightRect(
        targetRect,
        targetEl,
        step.spotlightIncludeSelector,
      )

      const { x, y, w, h } = getSpotlightBox(
        spotlightRect,
        step.spotlightPadding,
        step.spotlightOffsetX,
      )

      hole.setAttribute('x', x)
      hole.setAttribute('y', y)
      hole.setAttribute('width', w)
      hole.setAttribute('height', h)

      outline.setAttribute('x', x)
      outline.setAttribute('y', y)
      outline.setAttribute('width', w)
      outline.setAttribute('height', h)

      return { w, h }
    }

    const runAnimation = () => {
      const dimensions = syncPosition()
      if (!dimensions) return

      const width = parseFloat(dimensions.w)
      const height = parseFloat(dimensions.h)
      const perimeter = 2 * (width + height)

      outline.style.transition = 'none'
      outline.style.strokeDasharray = `${perimeter} ${perimeter}`
      outline.style.strokeDashoffset = `${perimeter}`

      outline.getBoundingClientRect()

      outline.style.transition =
        'stroke-dashoffset 0.8s ease-out, opacity 0.2s ease-out'
      outline.style.strokeDashoffset = '0'
    }

    runAnimation()

    const delayedPositionSync = step.spotlightIncludeSelector
      ? window.setTimeout(syncPosition, SCROLL_AFTER_LAYOUT_DELAY_MS)
      : undefined

    window.addEventListener('scroll', syncPosition, true)
    window.addEventListener('resize', syncPosition)

    return () => {
      if (delayedPositionSync) {
        window.clearTimeout(delayedPositionSync)
      }
      window.removeEventListener('scroll', syncPosition, true)
      window.removeEventListener('resize', syncPosition)
    }
  }, [
    targetEl,
    isTrulyCentered,
    step.id,
    step.spotlightPadding,
    step.spotlightOffsetX,
    step.spotlightIncludeSelector,
    isTargetReady,
  ])

  const { refs, floatingStyles, isPositioned, update } = useFloating({
    placement: toPlacement(step.position),
    strategy: 'fixed',
    middleware: [offset(16), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    refs.setReference(targetEl)
  }, [targetEl, refs])

  useEffect(() => {
    if (!isTargetReady || isTrulyCentered) return

    const animationFrame = window.requestAnimationFrame(() => {
      void update()
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [isTargetReady, isTrulyCentered, step.id, update])

  const isTooltipCentered = isTrulyCentered
  const isClickAction = step.action === 'click'
  const isFinish = step.action === 'finish'
  const isChooseAction = step.action === 'choose'
  const showBack =
    currentStepIndex !== 0 &&
    currentStepIndex !== 4 &&
    !isClickAction &&
    !isChooseAction
  const contentLines = step.content.split('\n')
  const legendText =
    step.legendItems
      ?.map((item) => `${item.label}: ${item.description}`)
      .join('. ') ?? ''
  const useIntroCenteredSize = step.centeredSize === 'intro'

  const isReady =
    isTooltipCentered || (targetEl !== null && isTargetReady && isPositioned)
  const shouldKeepKeyboardInPanel = moveKeyboardToPanel && isTooltipCentered
  const stepTitleId = `tutorial-step-${step.id}-title`
  const stepContentId = `tutorial-step-${step.id}-content`

  useEffect(() => {
    if (
      isTooltipCentered ||
      !isTargetReady ||
      !(targetEl instanceof HTMLElement)
    ) {
      return
    }

    const target = targetEl
    const existingFocusTarget = getTargetFocusElement(target)
    const focusTarget = existingFocusTarget ?? target
    const shouldMakeTargetFocusable = existingFocusTarget === null
    const shouldNameTarget =
      !isInteractiveElement(target) && !target.hasAttribute('aria-label')
    const shouldRoleTarget =
      !isInteractiveElement(target) && !target.hasAttribute('role')

    const previousTargetTabIndex = target.getAttribute('tabindex')
    const previousTargetRole = target.getAttribute('role')
    const previousTargetAriaLabel = target.getAttribute('aria-label')
    const previousFocusAriaDescribedBy =
      focusTarget.getAttribute('aria-describedby')

    if (shouldMakeTargetFocusable) {
      target.setAttribute('tabindex', '0')
    }

    if (shouldRoleTarget) {
      target.setAttribute('role', 'group')
    }

    if (shouldNameTarget) {
      target.setAttribute('aria-label', `Tutorial section: ${step.title}`)
    }

    focusTarget.setAttribute(
      'aria-describedby',
      appendIdReferences(previousFocusAriaDescribedBy, [
        stepTitleId,
        stepContentId,
      ]),
    )

    return () => {
      if (shouldMakeTargetFocusable) {
        restoreAttribute(target, 'tabindex', previousTargetTabIndex)
      }

      if (shouldRoleTarget) {
        restoreAttribute(target, 'role', previousTargetRole)
      }

      if (shouldNameTarget) {
        restoreAttribute(target, 'aria-label', previousTargetAriaLabel)
      }

      restoreAttribute(
        focusTarget,
        'aria-describedby',
        previousFocusAriaDescribedBy,
      )
    }
  }, [
    isTargetReady,
    isTooltipCentered,
    step.title,
    stepContentId,
    stepTitleId,
    targetEl,
  ])

  useEffect(() => {
    if (!isReady || !shouldKeepKeyboardInPanel) return

    const timer = setTimeout(() => {
      tooltipRef.current?.focus({ preventScroll: true })
    }, TOOLTIP_FOCUS_DELAY_MS)

    return () => clearTimeout(timer)
  }, [step.id, isReady, shouldKeepKeyboardInPanel])

  useEffect(() => {
    if (
      navigationSource !== 'tutorial-controls' ||
      isTooltipCentered ||
      shouldKeepKeyboardInPanel ||
      !isTargetReady
    ) {
      return
    }

    const focusTarget = getTargetFocusElement(targetEl) ?? tooltipRef.current
    if (!focusTarget) return

    const timer = setTimeout(() => {
      focusTarget.focus({ preventScroll: true })
    }, TOOLTIP_FOCUS_DELAY_MS)

    return () => clearTimeout(timer)
  }, [
    isTargetReady,
    isTooltipCentered,
    navigationSource,
    shouldKeepKeyboardInPanel,
    step.id,
    targetEl,
  ])

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    const preventManualScroll = (event: Event) => {
      event.preventDefault()
    }

    const preventSelectionOrDrag = (event: Event) => {
      event.preventDefault()
    }

    const preventKeys = (event: KeyboardEvent) => {
      if (!isScrollBlockKey(event.key)) {
        return
      }

      if (isInteractiveElement(document.activeElement)) {
        return
      }

      event.preventDefault()
    }

    window.addEventListener('wheel', preventManualScroll, { passive: false })
    window.addEventListener('touchmove', preventManualScroll, {
      passive: false,
    })
    document.addEventListener('selectstart', preventSelectionOrDrag, true)
    document.addEventListener('dragstart', preventSelectionOrDrag, true)
    window.addEventListener('keydown', preventKeys, { passive: false })

    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('wheel', preventManualScroll)
      window.removeEventListener('touchmove', preventManualScroll)
      document.removeEventListener('selectstart', preventSelectionOrDrag, true)
      document.removeEventListener('dragstart', preventSelectionOrDrag, true)
      window.removeEventListener('keydown', preventKeys)
    }
  }, [])

  useEffect(() => {
    if (!isReady) return

    const scrollToTarget = () => {
      if (!shouldAutoScroll(step.autoScroll)) {
        return
      }

      if (isScrollToTopStep(step.autoScroll)) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      const bounds = getCombinedViewportBounds(targetEl, tooltipRef.current)
      if (!bounds) return

      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const currentScrollY = window.scrollY
      const currentScrollX = window.scrollX

      const targetCenterY = currentScrollY + bounds.top + bounds.height / 2
      const targetCenterX = currentScrollX + bounds.left + bounds.width / 2

      const scrollToY = targetCenterY - viewportHeight / 2
      const scrollToX = targetCenterX - viewportWidth / 2

      window.scrollTo({
        top: scrollToY,
        left: scrollToX,
        behavior: 'smooth',
      })
    }

    const timer = setTimeout(scrollToTarget, SCROLL_AFTER_LAYOUT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [step.id, step.autoScroll, isReady, targetEl])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onSkip()
        return
      }

      if (event.key === 'Enter' && !isClickAction) {
        if (isInteractiveElement(document.activeElement)) {
          return
        }

        event.preventDefault()
        onNext()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [onSkip, onNext, isClickAction])

  const handleTrapKeydown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (!shouldKeepKeyboardInPanel || event.key !== 'Tab') return

      const container = tooltipRef.current
      if (!container) return

      const focusables =
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === container
        ) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [shouldKeepKeyboardInPanel],
  )

  const tooltipContent = (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Step {currentStepIndex + 1} of {totalSteps}: {step.title}.{' '}
        {step.content} {legendText}
      </div>
      {/*
      <p className="tutorial-tooltip__step-count" aria-hidden="true">
        Step {currentStepIndex + 1} of {totalSteps}
      </p>
      */}
      <h3 id={stepTitleId} className="tutorial-tooltip__title">
        {step.title}
      </h3>
      <p id={stepContentId} className="tutorial-tooltip__content">
        {contentLines.map((line, index) => (
          <Fragment key={`${step.id}-content-line-${index}`}>
            {line}
            {index < contentLines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
      {step.legendItems && (
        <dl className="tutorial-tooltip__legend">
          {step.legendItems.map((item) => (
            <div
              key={`${step.id}-${item.label}`}
              className="tutorial-tooltip__legend-row"
            >
              <dt
                className={`tutorial-tooltip__legend-label tutorial-tooltip__legend-label--${item.color}`}
              >
                {item.label}:
              </dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      )}
      {isClickAction && (
        <p className="tutorial-tooltip__click-hint">
          Click or press Enter on the highlighted element to continue
        </p>
      )}
      <div
        className={`tutorial-tooltip__actions${
          showBack ? ' tutorial-tooltip__actions--spaced' : ''
        }`}
      >
        {isChooseAction && step.choices ? (
          <div className="tutorial-tooltip__choices">
            {step.choices.map((choice) => (
              <button
                key={choice.value}
                className="tutorial-tooltip__choice-btn"
                onClick={() => onChoose?.(choice.value)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : (
          !isClickAction && (
            <>
              {showBack && (
                <button className="tutorial-tooltip__back-btn" onClick={onBack}>
                  Previous
                </button>
              )}
              <button className="tutorial-tooltip__next-btn" onClick={onNext}>
                {isFinish ? 'Finish' : 'Next'}
              </button>
            </>
          )
        )}
      </div>
    </>
  )

  return (
    <div
      className="tutorial-overlay-wrapper"
      data-tutorial-overlay="true"
      style={{ pointerEvents: isClickAction ? 'none' : 'auto' }}
    >
      <svg className="tutorial-mask-svg" aria-hidden="true">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect ref={holeRef} fill="black" rx="4" ry="4" />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          fillOpacity={step.hideOverlay ? 0 : isOverlayReady ? 1 : 0}
          mask="url(#tutorial-spotlight-mask)"
          style={{ transition: 'fill-opacity 0.25s ease-out' }}
        />

        <rect
          ref={outlineRef}
          className="tutorial-spotlight-outline"
          fill="none"
          stroke="#FFD54F"
          strokeWidth="2.5"
          rx="4"
          ry="4"
          style={{
            strokeDasharray: '0 10000',
            strokeDashoffset: '0',
            opacity: step.hideOverlay ? 0 : isOverlayReady ? 1 : 0,
            visibility: isOverlayReady ? 'visible' : 'hidden',
          }}
        />
      </svg>

      <div
        ref={(node) => {
          refs.setFloating(node)
          tooltipRef.current = node
        }}
        role="dialog"
        aria-modal={shouldKeepKeyboardInPanel ? true : undefined}
        aria-labelledby={stepTitleId}
        aria-describedby={stepContentId}
        tabIndex={-1}
        onKeyDown={handleTrapKeydown}
        className={
          isTooltipCentered
            ? `tutorial-tooltip--centered${
                useIntroCenteredSize ? ' tutorial-tooltip--centered--intro' : ''
              }`
            : 'tutorial-tooltip'
        }
        style={{
          ...(isTooltipCentered ? {} : isPositioned ? floatingStyles : {}),
          opacity: isReady ? 1 : 0,
          visibility: isReady ? 'visible' : 'hidden',
          pointerEvents: isReady ? 'auto' : 'none',
          ...(!isTooltipCentered && !isPositioned ? { left: -9999 } : {}),
        }}
      >
        <button className="tutorial-tooltip__skip-btn" onClick={onSkip}>
          Skip Tutorial
        </button>
        <div
          className={`tutorial-tooltip__inner ${isReady ? 'is-visible' : ''}`}
        >
          {tooltipContent}
        </div>
      </div>
    </div>
  )
}

export default TutorialOverlay
