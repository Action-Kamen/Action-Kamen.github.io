import { useEffect, useMemo, useRef, useState } from 'react'

import { useReducedMotion } from '../hooks/useReducedMotion'

/** Filename slug → a description worth reading aloud. */
const ALT: Record<string, string> = {
  '01-jungfraujoch': 'On the Jungfraujoch viewing platform, the Aletsch glacier behind',
  '02-lake-brienz': 'On the deck of a boat on Lake Brienz',
  '03-cycling-singapore': 'Riding a mountain bike on a wooded trail in Singapore',
  '01-campus': 'A large group of friends on campus',
  '02-lake': 'Friends by a lake after the rain',
  '03-gateway': 'Four of us at the Gateway of India',
  '04-monsoon': 'Friends out in the monsoon',
  '05-formal': 'Friends dressed up for a formal',
  '06-beach': 'A group at the beach',
  '07-dinner': 'A long table of friends at dinner',
  '08-auditorium': 'The contingent filling an auditorium',
}

type Photo = { url: string; alt: string }

function load(glob: Record<string, string>): Photo[] {
  return Object.entries(glob)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, url]) => {
      const slug = path.split('/').pop()!.replace(/\.\w+$/, '')
      return { url, alt: ALT[slug] ?? slug.replace(/^\d+-/, '').replace(/-/g, ' ') }
    })
}

const SOLO = load(
  import.meta.glob('../assets/gallery/solo/*.webp', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
)

const GROUP = load(
  import.meta.glob('../assets/gallery/group/*.webp', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
)

/**
 * Six panels of different shapes; every few seconds one of them turns over and comes back
 * with a different photograph.
 *
 * One panel at a time, never all of them: a wall of simultaneous animation is a screensaver,
 * whereas a single quiet turn in the corner of your eye is the thing that makes you look.
 * The large panel is reserved for photographs of him alone; the rest carry the group shots.
 */
type PanelSpec = { area: string; pool: Photo[] }

const PANELS: PanelSpec[] = [
  { area: 'a', pool: SOLO },
  { area: 'b', pool: GROUP.slice(0, 3) },
  { area: 'c', pool: GROUP.slice(3, 5) },
  { area: 'd', pool: GROUP.slice(5, 7) },
  { area: 'e', pool: GROUP.slice(1, 4) },
  { area: 'f', pool: GROUP.slice(4, 8) },
]

function Panel({ spec, flipSignal }: { spec: PanelSpec; flipSignal: number }) {
  const [faces, setFaces] = useState<[number, number]>([0, 1 % spec.pool.length])
  const [flipped, setFlipped] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    // Skip the initial render, otherwise every panel turns the moment it mounts.
    if (first.current) {
      first.current = false
      return
    }
    if (spec.pool.length < 2) return
    setFlipped((wasFlipped) => {
      // Load the next photograph onto the face that is about to come forward.
      setFaces(([front, back]) =>
        wasFlipped ? [(back + 1) % spec.pool.length, back] : [front, (front + 1) % spec.pool.length],
      )
      return !wasFlipped
    })
  }, [flipSignal, spec.pool.length])

  const front = spec.pool[faces[0]]
  const back = spec.pool[faces[1]]

  return (
    <div className="mosaic__cell" style={{ gridArea: spec.area }}>
      <div className="mosaic__panel" data-flipped={flipped}>
        <img className="mosaic__face" src={front?.url} alt={front?.alt ?? ''} loading="lazy" decoding="async" />
        <img
          className="mosaic__face mosaic__face--back"
          src={back?.url}
          alt={back?.alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  )
}

export function Mosaic() {
  const reduced = useReducedMotion()
  const [signals, setSignals] = useState<number[]>(() => PANELS.map(() => 0))
  const visible = useRef(true)

  useEffect(() => {
    if (reduced) return

    // Pause while the tab is hidden. Turning photographs over in a background tab is pure
    // battery cost.
    const onVisibility = () => {
      visible.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)

    let order = 0
    const id = setInterval(() => {
      if (!visible.current) return
      // Walk the panels rather than picking at random, so no panel is ever left untouched
      // and two never turn at once.
      const next = order++ % PANELS.length
      setSignals((s) => s.map((v, i) => (i === next ? v + 1 : v)))
    }, 4200)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  const panels = useMemo(() => PANELS.filter((p) => p.pool.length > 0), [])

  return (
    <div className="mosaic">
      {panels.map((spec, i) => (
        <Panel key={spec.area} spec={spec} flipSignal={signals[i] ?? 0} />
      ))}
    </div>
  )
}
