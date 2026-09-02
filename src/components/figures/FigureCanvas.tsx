import { useEffect, useRef } from 'react'

import { useInView } from '../../hooks/useInView'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** Palette values pulled from CSS so figures cannot drift from the design tokens. */
export type Palette = {
  accent: string
  accentSoft: string
  bone: string
  dim: string
  faint: string
  ghost: string
  well: string
}

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  /** Seconds since the figure started. Frozen at `stillAt` under reduced motion. */
  t: number,
  w: number,
  h: number,
  palette: Palette,
) => void

type Props = {
  draw: DrawFn
  /** Describes what the figure shows, for anyone who cannot see it. */
  label: string
  caption: string
  /** The moment in the animation that best represents it as a single frame. */
  stillAt?: number
  ratio?: number
}

function readPalette(el: Element): Palette {
  const cs = getComputedStyle(el)
  const get = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    accent: get('--iri', '#9fc4e8'),
    accentSoft: get('--iri-soft', '#5d7a96'),
    bone: get('--bone', '#e9e5dd'),
    dim: get('--bone-dim', '#a6a29a'),
    faint: get('--bone-faint', '#6c6a66'),
    ghost: get('--bone-ghost', '#3a3a38'),
    well: get('--ink-850', '#0b0d10'),
  }
}

/**
 * The harness every project figure runs on.
 *
 * These are canvas 2D and not WebGL on purpose. A figure here is tens of nodes and edges;
 * canvas draws that in well under a millisecond, and reaching for WebGL would add a
 * pipeline, a shader and a context for no measurable gain. The one place a shader earns
 * its keep on this site is the hero, where there is an actual per-pixel function to evaluate.
 *
 * Every figure is paused while offscreen, capped at 2x device pixels, and reduced to a
 * single representative frame when the visitor prefers less motion. Each is also given a
 * text label, because a diagram that only exists as pixels is invisible to a screen reader.
 */
export function FigureCanvas({ draw, label, caption, stillAt = 6, ratio = 0.52 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { ref: wrapRef, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0 })
  const reduced = useReducedMotion()
  const activeRef = useRef(inView)
  activeRef.current = inView

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let palette = readPalette(canvas)
    let cssW = 0
    let cssH = 0

    const paint = (t: number) => {
      if (cssW < 1 || cssH < 1) return
      ctx.clearRect(0, 0, cssW, cssH)
      draw(ctx, t, cssW, cssH, palette)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cssW = canvas.clientWidth
      cssH = Math.round(cssW * ratio)
      canvas.style.height = `${cssH}px`
      // Assigning width or height resets the drawing buffer -- it clears the canvas AND
      // discards the transform, so both have to be re-established every time.
      canvas.width = Math.max(1, Math.round(cssW * dpr))
      canvas.height = Math.max(1, Math.round(cssH * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      palette = readPalette(canvas)

      /**
       * A still figure has to redraw here, and this is not an optimisation -- without it
       * reduced-motion visitors can get a permanently blank canvas.
       *
       * The animated path is self-healing: the next frame repaints whatever the resize
       * wiped. The still path paints exactly once, so if that paint happens before layout
       * has given the canvas its real width -- which is precisely what happens when a
       * figure mounts inside a project entry that was just expanded -- the only paint is
       * the wrong one, and the ResizeObserver that later supplies the true width silently
       * clears it.
       */
      if (reduced) paint(stillAt)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    if (reduced) {
      paint(stillAt)
      return () => observer.disconnect()
    }

    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!activeRef.current) return
      paint((now - start) / 1000)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [draw, reduced, ratio, stillAt])

  return (
    <figure className="figure" ref={wrapRef}>
      <canvas ref={canvasRef} className="figure__canvas" role="img" aria-label={label} />
      <figcaption className="figure__caption meta">{caption}</figcaption>
    </figure>
  )
}
