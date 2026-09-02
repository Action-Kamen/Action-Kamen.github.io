import { useEffect, useRef, useState } from 'react'

type Options = {
  /** Fire once and disconnect. True for reveals, false for anything that pauses offscreen. */
  once?: boolean
  rootMargin?: string
  threshold?: number
}

/**
 * Reports whether the returned ref is on screen.
 *
 * Used for two different jobs: revealing content as it settles into view, and pausing the
 * animated figures when they scroll away -- an offscreen requestAnimationFrame loop is
 * pure battery cost on a phone, which is most of the traffic here.
 */
export function useInView<T extends Element>({
  once = true,
  rootMargin = '0px 0px -12% 0px',
  threshold = 0,
}: Options = {}) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No IntersectionObserver: show everything rather than hide it behind a reveal.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) io.disconnect()
      },
      { rootMargin, threshold },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, inView }
}
