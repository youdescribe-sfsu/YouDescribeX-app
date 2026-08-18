const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * The elements inside `root` that Tab will actually visit, in document order.
 *
 * Radio groups need special handling: only one radio per group is in the tab
 * sequence (the checked one, or the first when nothing is checked yet), so
 * treating every radio as tabbable would compute the wrong ring boundaries.
 */
export const getTabbableElements = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      if (el.getAttribute('aria-hidden') === 'true') {
        return false
      }
      if (el instanceof HTMLInputElement && el.type === 'radio') {
        const group = Array.from(
          root.querySelectorAll<HTMLInputElement>(
            `input[type="radio"][name="${el.name}"]`,
          ),
        )
        const checked = group.find((radio) => radio.checked)
        return el === (checked ?? group[0])
      }
      return true
    },
  )

/**
 * Keeps Tab inside `container`. `aria-modal` alone does not do this — it only
 * constrains a screen reader's own cursor, not the browser's focus order.
 */
export const trapTabKey = (
  event: KeyboardEvent | React.KeyboardEvent,
  container: HTMLElement,
) => {
  if (event.key !== 'Tab') {
    return
  }

  const tabbable = getTabbableElements(container)
  if (tabbable.length === 0) {
    event.preventDefault()
    container.focus()
    return
  }

  const first = tabbable[0]
  const last = tabbable[tabbable.length - 1]
  const active = document.activeElement

  if (event.shiftKey) {
    // Shift+Tab from the first control (or from the container itself, which is
    // where focus starts) would otherwise land on the page behind.
    if (active === first || active === container) {
      event.preventDefault()
      last.focus()
    }
    return
  }

  if (active === last) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * Hides everything outside `except` from assistive tech and from the tab order
 * for as long as the dialog is open. Returns the undo function.
 *
 * `inert` covers focus and pointer events in modern Safari/Chrome; `aria-hidden`
 * is the fallback that older VoiceOver builds honour. Elements that were already
 * hidden are left alone so we never un-hide something another component owns.
 */
export const hidePageBehind = (except: HTMLElement) => {
  const changed: HTMLElement[] = []

  Array.from(document.body.children).forEach((child) => {
    const el = child as HTMLElement
    if (el === except || el.getAttribute('aria-hidden') === 'true') {
      return
    }
    el.setAttribute('aria-hidden', 'true')
    el.setAttribute('inert', '')
    changed.push(el)
  })

  return () => {
    changed.forEach((el) => {
      el.removeAttribute('aria-hidden')
      el.removeAttribute('inert')
    })
  }
}
