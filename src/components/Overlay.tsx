import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  /** Announced as the overlay's name. */
  label: string
  className?: string
  children: ReactNode
}

/**
 * A modal overlay built on the native <dialog> element.
 *
 * `showModal()` is doing real work here that a positioned <div> would have to reimplement,
 * badly: the dialog is promoted to the top layer so it cannot lose a z-index argument, the
 * rest of the document is made inert so tab never wanders behind it, focus is trapped and
 * restored on close, and Escape is handled by the browser.
 *
 * What it does NOT do is stop the page behind from scrolling, so that is handled here.
 * The previous version of this was a dropdown panel: it covered the top third of the
 * screen, let the page show through a backdrop-filter, and left the document scrolling
 * underneath. That is the specific failure this component exists to prevent.
 */
export function Overlay({ open, onClose, label, className = '', children }: Props) {
  const ref = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      // Scroll lock. Compensating for the scrollbar keeps the page from lurching sideways
      // as it disappears on desktop.
      const gap = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.overflow = 'hidden'
      if (gap > 0) document.documentElement.style.paddingRight = `${gap}px`
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (open) return
    document.documentElement.style.overflow = ''
    document.documentElement.style.paddingRight = ''
  }, [open])

  // Unmounting while open would otherwise leave the document locked forever.
  useEffect(
    () => () => {
      document.documentElement.style.overflow = ''
      document.documentElement.style.paddingRight = ''
    },
    [],
  )

  return (
    <dialog
      ref={ref}
      className={`overlay ${className}`}
      aria-label={label}
      // Fires for Escape as well as close(), so state stays in sync either way.
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        // The dialog element fills the viewport, so a click that lands on it rather than on
        // its inner panel is a click on the backdrop.
        if (e.target === ref.current) onClose()
      }}
    >
      {children}
    </dialog>
  )
}
