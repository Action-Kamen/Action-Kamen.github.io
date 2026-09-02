import { useEffect, useRef, useState } from 'react'

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

/**
 * The large panel draws from the solo photographs; the other five all share the whole group
 * pool. They deliberately do NOT get separate slices: with a no-duplicates rule in force,
 * overlapping slices can paint themselves into a corner where a panel has no legal photo
 * left to turn to. Five panels drawing from eight photographs always leaves at least three
 * free.
 */
const PANELS: PanelSpec[] = [
  { area: 'a', pool: SOLO },
  { area: 'b', pool: GROUP },
  { area: 'c', pool: GROUP },
  { area: 'd', pool: GROUP },
  { area: 'e', pool: GROUP },
  { area: 'f', pool: GROUP },
]

type PanelState = { front: Photo | undefined; back: Photo | undefined; flipped: boolean }

const showing = (p: PanelState) => (p.flipped ? p.back : p.front)

/** Deal distinct photographs so no two panels start on the same image. */
function initialBoard(): PanelState[] {
  const used = new Set<string>()
  return PANELS.map((spec) => {
    const front = spec.pool.find((ph) => !used.has(ph.url)) ?? spec.pool[0]
    if (front) used.add(front.url)
    const back = spec.pool.find((ph) => !used.has(ph.url)) ?? front
    return { front, back, flipped: false }
  })
}

/**
 * Turn one panel over, onto a photograph nothing else is currently showing.
 *
 * The constraint is checked against what is *visible*, not what is loaded: the hidden face
 * of another panel may hold the same image without anyone being able to tell.
 */
function turn(board: PanelState[], index: number): PanelState[] {
  const spec = PANELS[index]
  const panel = board[index]
  if (!spec || !panel || spec.pool.length < 2) return board

  const visible = new Set(
    board.flatMap((p, i) => (i === index ? [] : [showing(p)?.url]).filter(Boolean) as string[]),
  )
  const current = showing(panel)?.url
  const candidates = spec.pool.filter((ph) => ph.url !== current && !visible.has(ph.url))
  const next = candidates[Math.floor(Math.random() * candidates.length)]
  if (!next) return board

  return board.map((p, i) =>
    i !== index
      ? p
      : p.flipped
        ? { ...p, front: next, flipped: false }
        : { ...p, back: next, flipped: true },
  )
}

function Panel({ spec, state }: { spec: PanelSpec; state: PanelState }) {
  return (
    <div className="mosaic__cell" style={{ gridArea: spec.area }}>
      <div className="mosaic__panel" data-flipped={state.flipped}>
        <img
          className="mosaic__face"
          src={state.front?.url}
          alt={state.front?.alt ?? ''}
          loading="lazy"
          decoding="async"
        />
        <img
          className="mosaic__face mosaic__face--back"
          src={state.back?.url}
          alt={state.back?.alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  )
}

export function Mosaic() {
  const reduced = useReducedMotion()
  const [board, setBoard] = useState<PanelState[]>(initialBoard)
  const visible = useRef(true)

  useEffect(() => {
    if (reduced) return

    // Turning photographs over in a background tab is pure battery cost.
    const onVisibility = () => {
      visible.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)

    let timer: number

    const schedule = () => {
      /**
       * A random gap rather than a metronome, but a bounded one. Uniform over 2.6-6.4s
       * averages the same ~4.5s pause as the fixed interval it replaces, while never
       * bunching turns so close that the section looks agitated.
       */
      const delay = 2600 + Math.random() * 3800

      timer = window.setTimeout(() => {
        if (visible.current) {
          setBoard((prev) => {
            const order = prev.map((_, i) => i).sort(() => Math.random() - 0.5)
            // Usually one panel. One time in five, a second one goes with it -- enough to
            // feel unscripted, rare enough that it still reads as an accident.
            const count = Math.random() < 0.2 ? 2 : 1
            return order.slice(0, count).reduce(turn, prev)
          })
        }
        schedule()
      }, delay)
    }

    schedule()

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  return (
    <div className="mosaic">
      {PANELS.map((spec, i) => {
        const state = board[i]
        return state ? <Panel key={spec.area} spec={spec} state={state} /> : null
      })}
    </div>
  )
}
