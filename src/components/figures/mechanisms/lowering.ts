import { TAU, dot, ease, phase, text } from './shared'
import type { DrawFn } from './shared'

/* ------------------------------------------------------- 1. IRIDIUM: lowering */

/**
 * Source in which nothing an optimiser needs is written down, the same program as IRI
 * where all of it is a node, and the code QuickJS is handed once passes have deleted the
 * four nodes that were only *provably* dead once they existed.
 *
 * The single claim this figure has to carry is that making the implicit explicit is what
 * makes the optimisation possible. So the left column is deliberately annotated with the
 * three questions the syntax does not answer -- which binding, which environment, is it
 * initialised -- and each of them turns into a labelled node in the middle. The four that
 * then disappear are exactly the ones whose deaths those nodes made provable.
 *
 * Edges are axis-aligned. Beziers between scattered nodes read as a mind map; an
 * instruction spine with environment stubs off to one side reads as an IR, which is what
 * this is. The one curved edge is the branch's fall-through, because it genuinely does
 * route around something.
 *
 * Below 560px the two code columns are dropped and the graph is re-laid out along its
 * other axis rather than shrunk. Three columns of monospace inside 300px cannot be done
 * honestly, and half a legible diagram beats a complete illegible one.
 */
export const drawLowering: DrawFn = (ctx, t, w, h, c) => {
  // Offset so the reduced-motion still frame (t = 6) lands in the hold at the end of the
  // loop, where the source, the reduced graph, the ghosts of what was removed and the
  // emitted code are all on screen together. That frame is the argument; every other one
  // is a step in it.
  const { p } = phase(t + 7, 15)
  const pad = Math.max(12, w * 0.035)
  const compact = w < 560

  const A = (v: number) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, v))
  }

  const SOURCE = ['let a = 2 * 3', 'if (p) {', '  const b = a', '}', 'g(a)']
  // `if (p) {}` keeps its empty body on purpose. Reading `p` can throw or hit a getter, so
  // deleting the test would not be sound -- only the binding inside it is dead. Being
  // right about that is the difference between this and an unsound optimiser.
  const EMIT = ['let a = 6', 'if (p) {}', 'g(a)']

  /**
   * One topology, two layouts. Wide flows top-to-bottom down an instruction spine with the
   * environments on a rail to its left; compact flows left-to-right, because six rows plus
   * a label each will not fit in 100px of height.
   */
  type Node = {
    id: string
    label: string
    /** Why the passes are allowed to delete it. Only the removable nodes carry one. */
    tag?: string
    wx: number
    wy: number
    cx: number
    cy: number
    env?: boolean
  }

  const NODES: Node[] = [
    { id: 'env', label: 'env', wx: 0.02, wy: 0.04, cx: 0.04, cy: 0.8, env: true },
    { id: 'bind', label: 'bind a', wx: 0.26, wy: 0.04, cx: 0.22, cy: 0.8 },
    { id: 'val', label: '2 * 3', tag: 'fold', wx: 0.8, wy: 0.04, cx: 0.22, cy: 0.24 },
    { id: 'tdz', label: 'tdz a', tag: 'init', wx: 0.26, wy: 0.27, cx: 0.42, cy: 0.8 },
    { id: 'br', label: 'br p', wx: 0.26, wy: 0.5, cx: 0.6, cy: 0.8 },
    { id: 'env2', label: 'env′', wx: 0.02, wy: 0.74, cx: 0.78, cy: 0.24, env: true },
    { id: 'bindb', label: 'bind b', tag: 'unread', wx: 0.26, wy: 0.74, cx: 0.78, cy: 0.8 },
    { id: 'call', label: 'call g(a)', wx: 0.26, wy: 0.96, cx: 0.95, cy: 0.8 },
  ]

  // Folded away, proven initialised, never read, and the environment that held only the
  // binding that was never read. Four out of eight, which is what the caption claims.
  const DEAD = new Set(['val', 'tdz', 'env2', 'bindb'])

  const EDGES: [string, string][] = [
    ['env', 'bind'],
    ['bind', 'val'],
    ['bind', 'tdz'],
    ['tdz', 'br'],
    ['br', 'bindb'],
    ['env2', 'bindb'],
    ['bindb', 'call'],
  ]

  const byId = new Map(NODES.map((n) => [n.id, n]))

  // --- geometry -----------------------------------------------------------
  const gx0 = compact ? pad + 4 : w * 0.285
  const gx1 = compact ? w - pad - 4 : w * 0.735
  const gy0 = compact ? pad + 22 : pad + 26
  const gy1 = h - pad - 26
  const srcX = pad
  const outX = w * 0.775
  const hy = pad + (compact ? 2 : 6)
  const ry = h - pad + 2
  // Line height tracks the canvas so the code blocks do not sit as a clot at the top of a
  // tall pane or overrun a short one.
  const step = Math.min(19, Math.max(15, h * 0.052))
  const codeTop = hy + 16

  const at = (n: Node) => ({
    x: gx0 + (compact ? n.cx : n.wx) * (gx1 - gx0),
    y: gy0 + (compact ? n.cy : n.wy) * (gy1 - gy0),
  })
  /** How far along the direction of flow a node sits. Drives the reveal and the scan. */
  const flow = (n: Node) => (compact ? n.cx : n.wy)

  // --- timeline -----------------------------------------------------------
  const src = ease(p / 0.1)
  const lower = ease((p - 0.14) / 0.2)
  const scan = ease((p - 0.36) / 0.16)
  const gone = ease((p - 0.54) / 0.1)
  const emit = ease((p - 0.66) / 0.12)
  // A short dip at the seam, so the loop restarts rather than cutting.
  const fade = 1 - ease((p - 0.955) / 0.045)
  const shrunk = gone > 0.5
  /** Nodes arrive in program order, so the lowering reads as a lowering. */
  const born = (n: Node) => ease((lower - flow(n) * 0.45) / 0.6)

  const CAPTION =
    p < 0.14
      ? 'implicit in the syntax'
      : p < 0.36
        ? 'normalise → IRI'
        : p < 0.54
          ? 'tdz · alias analysis'
          : p < 0.66
            ? 'fold · dce · dbe'
            : 'codegen → QuickJS'

  // --- small local drawing helpers ---------------------------------------
  const put = (
    s: string,
    x: number,
    y: number,
    colour: string,
    size: number,
    align: CanvasTextAlign = 'left',
    strike = 0,
  ) => {
    text(ctx, s, x, y, colour, size, align)
    if (strike <= 0.01) return
    // A struck-through label says "deleted" in a way a fade cannot: the still frame has to
    // show what the passes took out, not only what survived.
    const tw = ctx.measureText(s).width
    const x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0, y)
    ctx.lineTo(x0 + tw * strike, y)
    ctx.stroke()
  }

  const gap = compact ? 5.5 : 6.5
  const link = (a: { x: number; y: number }, b: { x: number; y: number }, colour: string) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const ux = (dx / len) * gap
    const uy = (dy / len) * gap
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(a.x + ux, a.y + uy)
    ctx.lineTo(b.x - ux, b.y - uy)
    ctx.stroke()
  }

  const arrow = (x0: number, x1: number, y: number, colour: string) => {
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
    ctx.moveTo(x1 - 3.5, y - 3)
    ctx.lineTo(x1, y)
    ctx.lineTo(x1 - 3.5, y + 3)
    ctx.stroke()
  }

  // --- stage headers ------------------------------------------------------
  if (compact) {
    // No room for three columns, so the pipeline itself becomes the header line and the
    // stage currently running is the one in accent.
    const STAGES: [string, boolean][] = [
      ['source', src > 0.05],
      ['IRI', lower > 0.05],
      ['QuickJS', emit > 0.05],
    ]
    let x = gx0
    STAGES.forEach(([s, on], i) => {
      A(fade)
      text(ctx, s, x, hy, on ? c.accent : c.faint, 9)
      x += ctx.measureText(s).width + 7
      if (i < 2) {
        A(fade * 0.6)
        arrow(x, x + 11, hy, c.ghost)
        x += 18
      }
    })
  } else {
    A(fade)
    text(ctx, 'source', srcX, hy, src > 0.05 ? c.accent : c.faint, 9)
    text(ctx, 'IRI · explicit', gx0, hy, lower > 0.05 ? c.accent : c.faint, 9)
    text(ctx, 'QuickJS', outX, hy, emit > 0.05 ? c.accent : c.faint, 9)
    A(fade * 0.6)
    arrow(srcX + 104, gx0 - 8, hy, c.ghost)
    arrow(gx1 - 6, outX - 8, hy, c.ghost)
  }

  // --- source, and the three things it does not say -----------------------
  if (!compact) {
    SOURCE.forEach((s, i) => {
      A(ease((src - i * 0.11) / 0.6) * fade * 0.95)
      text(ctx, s, srcX, codeTop + i * step, i === 0 ? c.bone : c.dim, 11)
    })
    A(ease((src - 0.55) / 0.45) * fade * 0.9)
    text(ctx, 'binding? env? tdz?', srcX, codeTop + 5 * step + 10, c.faint, 9)

    // --- what QuickJS is actually handed ----------------------------------
    // Deliberately on the same baselines as the source above, so the two are read against
    // each other: the multiply is gone, and so is the binding in the block.
    EMIT.forEach((s, i) => {
      A(ease((emit - i * 0.16) / 0.6) * fade * 0.95)
      text(ctx, s, outX, codeTop + i * step, i === 0 ? c.bone : c.dim, 11)
    })
  }

  // --- IRI edges ----------------------------------------------------------
  EDGES.forEach(([a, b]) => {
    const na = byId.get(a)
    const nb = byId.get(b)
    if (!na || !nb) return
    const dead = DEAD.has(a) || DEAD.has(b)
    const g = dead ? gone : 0
    // An edge is never further along than the later of its two endpoints, so nothing is
    // ever drawn pointing at a node that has not arrived.
    const in0 = Math.min(born(na), born(nb))
    A(in0 * fade * (1 - g) * 0.55)
    link(at(na), at(nb), c.accentSoft)
    if (g > 0.01) {
      // A deleted edge is left dashed rather than erased. The held frame has to show the
      // shape the passes cut away, not just the shape that survived it.
      A(in0 * fade * g * 0.4)
      ctx.setLineDash([1.5, 2.5])
      link(at(na), at(nb), c.faint)
      ctx.setLineDash([])
    }
  })

  // Removing the TDZ barrier heals the spine across the hole it left. Drawn straight
  // through the ghost of the barrier, which is the honest picture of what a pass does.
  const nBind = byId.get('bind')
  const nBr = byId.get('br')
  const nCall = byId.get('call')
  if (nBind && nBr) {
    A(gone * fade * 0.55)
    link(at(nBind), at(nBr), c.accentSoft)
  }

  // The branch's fall-through. It has to route around the block, so it is the one edge
  // that bends -- and after dead binding elimination it is the only path left to the call.
  if (nBr && nCall) {
    const a = at(nBr)
    const b = at(nCall)
    A(Math.min(born(nBr), born(nCall)) * fade * 0.55)
    ctx.strokeStyle = c.accentSoft
    ctx.lineWidth = 1
    ctx.beginPath()
    if (compact) {
      // Compact routes it over the top: the only band of the pane with nothing else in it.
      const my = gy0 + 0.02 * (gy1 - gy0)
      ctx.moveTo(a.x, a.y - gap)
      ctx.arcTo(a.x, my, a.x + 10, my, 5)
      ctx.arcTo(b.x, my, b.x, my + 10, 5)
      ctx.lineTo(b.x, b.y - gap)
    } else {
      const mx = gx0 + 0.6 * (gx1 - gx0)
      ctx.moveTo(a.x + gap, a.y)
      ctx.arcTo(mx, a.y, mx, a.y + 10, 5)
      ctx.arcTo(mx, b.y, mx - 10, b.y, 5)
      ctx.lineTo(b.x + gap, b.y)
    }
    ctx.stroke()
  }

  // --- the analyses sweeping the graph ------------------------------------
  // Along the flow axis, so the scan reads as running over the IR in program order rather
  // than as a decorative wipe.
  if (scan > 0 && scan < 1) {
    // The trail is a filled band, not a gradient stroke: a gradient along a one-pixel line
    // evaluates to a single flat colour, which is why the old pass read as a bare rule.
    const trail = 38
    const x = gx0 + scan * (gx1 - gx0)
    const y = gy0 + scan * (gy1 - gy0)
    const g = compact
      ? ctx.createLinearGradient(x - trail, 0, x, 0)
      : ctx.createLinearGradient(0, y - trail, 0, y)
    g.addColorStop(0, 'transparent')
    g.addColorStop(1, c.accent)
    A(fade * 0.1)
    ctx.fillStyle = g
    if (compact) ctx.fillRect(x - trail, gy0 - 6, trail, gy1 - gy0 + 12)
    else ctx.fillRect(gx0 - 6, y - trail, gx1 - gx0 + 10, trail)
    A(fade * 0.6)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1
    ctx.beginPath()
    if (compact) {
      ctx.moveTo(x, gy0 - 6)
      ctx.lineTo(x, gy1 + 6)
    } else {
      ctx.moveTo(gx0 - 6, y)
      ctx.lineTo(gx1 + 4, y)
    }
    ctx.stroke()
  }

  // --- IRI nodes ----------------------------------------------------------
  NODES.forEach((n) => {
    const { x, y } = at(n)
    const f = flow(n)
    const vis = born(n) * fade
    if (vis <= 0.01) return

    const dead = DEAD.has(n.id)
    const ghost = dead ? gone : 0
    const r = compact ? 3 : 3.5
    // Constant folding does not just delete the multiply; it puts the value in the binding.
    const label =
      n.id === 'bind' && shrunk ? 'bind a = 6' : compact && n.id === 'call' ? 'g(a)' : n.label

    // Environments are squares and operations are dots. One glyph distinction is enough to
    // say "these are a different kind of thing" without spending a legend on it.
    A(vis * (1 - ghost))
    if (n.env) {
      ctx.strokeStyle = c.accent
      ctx.lineWidth = 1.2
      ctx.strokeRect(x - r, y - r, r * 2, r * 2)
    } else {
      dot(ctx, x, y, r, c.accent)
    }

    if (ghost > 0.01) {
      A(vis * ghost * 0.6)
      ctx.setLineDash([1.5, 2.5])
      ctx.strokeStyle = c.faint
      ctx.lineWidth = 1
      ctx.beginPath()
      if (n.env) ctx.rect(x - r, y - r, r * 2, r * 2)
      else ctx.arc(x, y, r, 0, TAU)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Labels sit clear of every edge that touches the node: above the spine where the
    // spine runs vertically, below it where it runs horizontally.
    let lx = x + (compact ? 8 : 9)
    let ly = y
    let align: CanvasTextAlign = 'left'
    if (compact) {
      // The two nodes on the upper band label sideways; everything on the spine labels
      // underneath it, which is the one side no edge and no stub arrives from.
      if (n.cy > 0.4) {
        lx = x
        ly = y + 12
        align = 'center'
      }
    } else if (n.env) {
      lx = x
      ly = y + 13
      align = 'center'
    } else {
      ly = y - 11
    }
    A(vis)
    put(label, lx, ly, ghost > 0.5 ? c.faint : c.dim, compact ? 9 : 10, align, ghost)

    // The reason, arriving as the scan reaches the node -- and kept afterwards, faintly,
    // so the held frame still explains why each ghost is a ghost.
    if (n.tag) {
      A(vis * ease((scan - f) / 0.1) * (ghost > 0.5 ? 0.75 : 1))
      // Always on the side of the node its label is not, and clear of the stubs dropping
      // out of the upper band.
      const tc = ghost > 0.5 ? c.faint : c.accent
      if (compact) put(n.tag, x - 8, y - 12, tc, 9, 'right')
      else put(n.tag, x + 9, y + 11, tc, 9)
    }
  })

  // --- readout ------------------------------------------------------------
  A(fade * 0.95)
  text(ctx, CAPTION, compact ? gx0 : srcX, ry, c.dim, 9)
  if (lower > 0.05) {
    A(fade * 0.95)
    text(
      ctx,
      shrunk ? 'IRI 8 → 4 nodes' : 'IRI 8 nodes',
      compact ? gx1 : w - pad,
      ry,
      shrunk ? c.accent : c.faint,
      9,
      'right',
    )
  }
  ctx.globalAlpha = 1
}
