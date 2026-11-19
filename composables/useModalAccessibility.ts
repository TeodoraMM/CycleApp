import { onBeforeUnmount, watch, type Ref } from 'vue'

type ModalOptions = {
  allowEscape?: () => boolean
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModalAccessibility(open: Ref<boolean>, close: () => void, options: ModalOptions = {}) {
  let lastFocused: HTMLElement | null = null
  let previousOverflow = ''
  let previousPosition = ''
  let previousTop = ''
  let previousLeft = ''
  let previousRight = ''
  let previousWidth = ''
  let previousPaddingRight = ''
  let scrollY = 0
  let isLocked = false

  const getDialog = () => document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')

  const getFocusable = (dialog: HTMLElement) =>
    Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true' && element.offsetParent !== null,
    )

  const onKeydown = (event: KeyboardEvent) => {
    if (!open.value) return

    if (event.key === 'Escape') {
      if (options.allowEscape?.() === false) return
      event.preventDefault()
      close()
      return
    }

    if (event.key !== 'Tab') return

    const dialog = getDialog()
    if (!dialog) return

    const focusable = getFocusable(dialog)
    if (!focusable.length) {
      event.preventDefault()
      dialog.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (event.shiftKey) {
      if (!active || !dialog.contains(active) || active === first) {
        event.preventDefault()
        last.focus()
      }
    } else if (!active || !dialog.contains(active) || active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const lockScroll = () => {
    if (isLocked) return

    scrollY = window.scrollY
    previousOverflow = document.body.style.overflow
    previousPosition = document.body.style.position
    previousTop = document.body.style.top
    previousLeft = document.body.style.left
    previousRight = document.body.style.right
    previousWidth = document.body.style.width
    previousPaddingRight = document.body.style.paddingRight

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    isLocked = true
  }

  const unlockScroll = () => {
    if (!isLocked) return

    document.body.style.overflow = previousOverflow
    document.body.style.position = previousPosition
    document.body.style.top = previousTop
    document.body.style.left = previousLeft
    document.body.style.right = previousRight
    document.body.style.width = previousWidth
    document.body.style.paddingRight = previousPaddingRight
    window.scrollTo(0, scrollY)
    isLocked = false
  }

  const dispose = () => {
    if (!import.meta.client) return

    window.removeEventListener('keydown', onKeydown, true)
    unlockScroll()

    const target = lastFocused
    lastFocused = null
    if (target && document.contains(target)) {
      requestAnimationFrame(() => target.focus())
    }
  }

  watch(open, (isOpen) => {
    if (!import.meta.client) return

    if (isOpen) {
      lastFocused = document.activeElement as HTMLElement | null
      lockScroll()
      window.addEventListener('keydown', onKeydown, true)
      requestAnimationFrame(() => {
        const dialog = getDialog()
        if (!dialog) return
        dialog.setAttribute('tabindex', '-1')
        const focusable = getFocusable(dialog)
        ;(focusable[0] ?? dialog).focus()
      })
    } else {
      dispose()
    }
  })

  onBeforeUnmount(() => {
    dispose()
  })
}
