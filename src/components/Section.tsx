import type { ReactNode } from 'react'

import { useInView } from '../hooks/useInView'

type Props = {
  id: string
  /** Two-digit index shown in the marginalia rail. */
  index: string
  label: string
  hue: string
  children: ReactNode
}

/**
 * A section with its marginalia rail.
 *
 * The rail is where a printed monograph puts running heads and figure numbers, and it is
 * doing the same job here: it tells you where you are without a sticky element following
 * you down the page. Below 900px it becomes a header row rather than vanishing.
 *
 * The `hue` sets the accent for everything inside, which is how the palette drifts as you
 * descend. `data-settled` drives the reveal, and because the token durations collapse to
 * 1ms under prefers-reduced-motion, the same markup is simply already settled for anyone
 * who asked for less movement.
 */
export function Section({ id, index, label, hue, children }: Props) {
  const { ref, inView } = useInView<HTMLElement>({ rootMargin: '0px 0px -8% 0px' })

  return (
    <section
      ref={ref}
      id={id}
      className="section"
      data-hue={hue}
      data-settled={inView ? 'true' : 'false'}
      aria-labelledby={`${id}-label`}
    >
      <div className="page rail-grid">
        <div className="rail">
          <span className="meta rail__index">{index}</span>
          <h2 id={`${id}-label`} className="meta rail__label">
            {label}
          </h2>
          <span className="rail__tick" aria-hidden="true" />
        </div>
        <div className="rail-body">{children}</div>
      </div>
    </section>
  )
}
