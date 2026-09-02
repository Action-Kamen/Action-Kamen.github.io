import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/**
 * Tracks the OS "reduce motion" setting, and keeps tracking it -- a user who flips the
 * switch mid-visit gets the change immediately rather than on next load.
 *
 * useSyncExternalStore rather than useState+useEffect so the value is correct on the very
 * first render instead of flashing the animated state for one frame.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true, // server/prerender default: assume reduced, animate only once proven safe
  )
}
