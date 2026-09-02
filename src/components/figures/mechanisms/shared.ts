import type { DrawFn, Palette } from '../FigureCanvas'

/**
 * Drawing primitives shared by the project figures.
 *
 * Every figure is a pure, deterministic function of time, so a still frame is always a
 * valid frame -- which is what lets the harness freeze them under prefers-reduced-motion
 * and pause them offscreen without any figure needing to know it happened.
 */

export type { DrawFn, Palette }


export const TAU = Math.PI * 2

/** Smoothstep. Used everywhere so nothing arrives at constant velocity. */
export const ease = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/** Progress through a repeating window, plus which repetition we are in. */
export const phase = (t: number, period: number) => ({
  p: (t % period) / period,
  n: Math.floor(t / period),
})

/** Deterministic PRNG. Figures must draw the same thing every time they are seen. */
export function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function mono(ctx: CanvasRenderingContext2D, size: number, weight = 400) {
  ctx.font = `${weight} ${size}px "JetBrains Mono", ui-monospace, monospace`
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  colour: string,
  size = 10,
  align: CanvasTextAlign = 'left',
) {
  mono(ctx, size)
  ctx.fillStyle = colour
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}

export function edge(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  colour: string,
  width = 1,
) {
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  // A gentle horizontal-first curve reads as a graph edge rather than a chart line.
  const mx = (x1 + x2) / 2
  ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2)
  ctx.stroke()
}

export function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke?: string,
) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

