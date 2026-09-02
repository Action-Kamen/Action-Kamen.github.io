import { dot, ease, edge, mulberry, phase, text } from './shared'
import type { DrawFn } from './shared'

/* ----------------------------------------- 2. prakriti: the diagnosis and the cure */

/**
 * Why three unrelated scanners miss real bugs, and what the engine built in answer does.
 *
 * The thesis is one argument rather than three projects, so the figure is one sentence
 * read left to right: 10,000 sites measured, three tools run against 42 cases, and the
 * single reason all three fail -- no points-to information -- becomes the thing prakriti
 * computes. The old version of this figure drew only the engine, which is the cure with
 * the diagnosis cut off; the connector out of the shared-cause node is the whole reason
 * the first two panels are here at all.
 *
 * The right panel is the mechanism claim. Each iteration adds edges and rehashes, so the
 * digest changes while the graph is still growing and repeats the moment it stops -- which
 * is why the fixpoint test is a comparison of two 8-digit words instead of two graphs.
 * The clone shares every set it does not write, so a fork costs one copied row and not
 * three. The caveat rides on the readout because it is part of the claim and not a
 * footnote to it: equal digests mean equal graphs only up to collision.
 *
 * Below 560px the three panels stack and lose what cannot survive the shrink -- the
 * bench ticks, the object names, the clone's tally -- rather than being scaled down
 * together into three illegible thirds.
 */
export const drawPointer: DrawFn = (ctx, t, w, h, c) => {
  // Offset so the reduced-motion still frame (t = 6) lands in the hold, where the survey,
  // the three failures, the converged graph, the clone and the repeated digest are all on
  // screen at once. That frame is the argument; every other one is a step through it.
  const { p } = phase(t + 7, 15)
  const pad = Math.max(12, w * 0.035)
  const compact = w < 560

  const A = (v: number) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, v))
  }

  // --- timeline -----------------------------------------------------------
  const measured = ease(p / 0.15)
  const benched = ease((p - 0.17) / 0.11)
  const blamed = ease((p - 0.3) / 0.09)
  const built = ease((p - 0.41) / 0.08)
  // One window per analysis round. The fourth adds no edge, which is the point of it.
  const round = (i: number) => ease((p - (0.5 + i * 0.065)) / 0.05)
  const settled = ease((p - 0.755) / 0.05)
  const cow = ease((p - 0.8) / 0.06)
  const fade = 1 - ease((p - 0.955) / 0.045)

  // --- geometry -----------------------------------------------------------
  const hy = pad + (compact ? 2 : 6)
  const ry = h - pad + 2
  const gy0 = pad + (compact ? 16 : 26)

  const ax0 = pad
  const aw = compact ? w - pad * 2 : w * 0.215
  const bx0 = compact ? pad : pad + w * 0.25
  const bw = compact ? w - pad * 2 : w * 0.23
  const cx0 = compact ? pad : pad + w * 0.535
  const cw = w - pad - cx0

  // --- small drawing helpers ---------------------------------------------
  const line = (x1: number, y1: number, x2: number, y2: number, colour: string) => {
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
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

  // --- stage strip --------------------------------------------------------
  // Wide anchors each label over its own panel; compact flows them, because three panel
  // origins on a phone are three x values within 40px of each other.
  const STAGES: [string, number, number][] = compact
    ? [
        ['10k sites', measured, bx0],
        ['42 cases', benched, 0],
        ['prakriti', built, 0],
      ]
    : [
        ['10,000 sites', measured, ax0],
        ['42 cases · 3 tools', benched, bx0],
        ['prakriti · points-to', built, cx0],
      ]

  let sx = pad
  STAGES.forEach(([s, on, at], i) => {
    const x = compact ? sx : at
    A(fade)
    text(ctx, s, x, hy, on > 0.05 ? c.accent : c.faint, 9)
    sx = x + ctx.measureText(s).width + 8
    const next = STAGES[i + 1]
    if (next) {
      A(fade * 0.55)
      const to = compact ? sx + 11 : next[2] - 8
      arrow(sx, to, hy, c.ghost)
      sx = to + 8
    }
  })

  /* ------------------------------------------------- panel A: what was measured */
  // 100 cells, one per 100 Tranco sites. 89 light up because 89.2% of them call eval,
  // and the 26 brightest are the ones where DOM-controlled text reaches the call.
  const cells = 100
  const cols = compact ? 25 : 10
  // Cells are square on a phone and taller than they are wide on desktop: the column is
  // width-limited there, and a square grid would leave the bottom third of the panel bare.
  const cellW = compact ? Math.min(6.6, (aw * 0.58) / cols) : Math.min(15, (aw - 6) / cols)
  const cellH = compact ? cellW : 19
  const gridX = ax0 + (compact ? 0 : 4)
  const gridY = gy0 + (compact ? 1 : 14)

  // Shuffled by sort key rather than in place, and resolved on a per-cell threshold: a
  // crawl of 10,000 sites comes back in no order worth drawing.
  const rng = mulberry(0x5eed)
  const grid = Array.from({ length: cells }, (_, i) => ({
    kind: i < 26 ? 2 : i < 89 ? 1 : 0,
    key: rng(),
    at: rng(),
  })).sort((a, b) => a.key - b.key)

  grid.forEach((g, i) => {
    const x = gridX + ((i % cols) + 0.5) * cellW
    const y = gridY + (Math.floor(i / cols) + 0.5) * cellH
    const on = g.at < measured
    A(fade * (on ? 0.95 : 0.55))
    if (on && g.kind === 2) dot(ctx, x, y, compact ? 1.9 : 2.6, c.bone)
    else if (on && g.kind === 1) dot(ctx, x, y, compact ? 1.8 : 2.4, c.accent)
    else dot(ctx, x, y, compact ? 1 : 1.4, c.ghost)
  })

  // The two colours in the grid are the first two lines, so the lines are the legend.
  const statX = compact ? gridX + cols * cellW + 16 : ax0 + 13
  const statY = compact ? gy0 + 4 : gy0 + 224
  const statStep = compact ? 12 : 18
  const STATS: [string, string, boolean][] = [
    ['89.2% eval', c.accent, true],
    ['25.5% DOM-tainted', c.bone, true],
    ['90.8% risky calls', c.dim, false],
  ]
  STATS.forEach(([s, colour, swatch], i) => {
    const y = statY + i * statStep
    A(fade * ease((measured - 0.4 - i * 0.1) / 0.4))
    if (swatch) dot(ctx, statX - 9, y, 2.4, colour)
    text(ctx, s, statX, y, i === 0 ? c.accent : i === 1 ? c.dim : c.faint, 9)
  })

  /* -------------------------------------- panel B: three tools, one shared reason */
  const toolY = (i: number) => gy0 + (compact ? 42 + i * 12 : 96 + i * 44)

  if (!compact) {
    // The bench itself: 42 cases in three families. Drawn, not asserted, because "42"
    // with no shape to it is a number a reader has to take on trust.
    const gap = 11
    const pitch = (bw - gap * 2) / 42
    const FAM = ['proto', 'ipt', 'file']
    FAM.forEach((f, g) => {
      const x0 = bx0 + g * (14 * pitch + gap)
      for (let i = 0; i < 14; i++) {
        A(fade * ease((benched - (g * 14 + i) / 60) / 0.5) * 0.85)
        ctx.fillStyle = c.accentSoft
        ctx.fillRect(x0 + i * pitch, gy0 + 12, 1.4, 7)
      }
      A(fade * benched * 0.9)
      text(ctx, f, x0 + 7 * pitch, gy0 + 30, c.faint, 9, 'center')
    })
    // The bench drops onto the same spine the three tools hang off, so the panel reads as
    // one run -- these cases, through these tools, to this one answer.
    A(fade * benched * 0.45)
    line(bx0 + 4, gy0 + 42, bx0 + 4, toolY(0), c.accentSoft)
  }

  // Each tool carries the shape of analysis it actually does, because that is what makes
  // the shared failure a diagnosis rather than a coincidence.
  const TOOLS: [string, string][] = [
    ['eslint', 'ast rules'],
    ['semgrep', 'patterns'],
    ['odgen', 'partial graph'],
  ]
  TOOLS.forEach(([name, how], i) => {
    const y = toolY(i)
    const vis = fade * ease((benched - i * 0.12) / 0.6)
    A(vis)
    dot(ctx, bx0 + 4, y, 3, c.accentSoft)
    text(ctx, name, bx0 + 13, y, c.dim, compact ? 9 : 10)
    A(vis * 0.85)
    if (compact) text(ctx, how, bx0 + 62, y, c.faint, 9)
    else text(ctx, how, bx0 + bw, y, c.faint, 9, 'right')
  })

  // The bus. Wide drops out of the three tools and turns right; compact runs the three
  // rows into a join to their right, which is the only free space a phone has here.
  const causeX = compact ? bx0 + bw * 0.56 : bx0 + bw - 8
  const causeY = compact ? toolY(1) : gy0 + 240
  A(fade * blamed * 0.6)
  if (compact) {
    const joinX = causeX - 18
    TOOLS.forEach((_, i) => {
      line(joinX - 12, toolY(i), joinX, toolY(i), c.accentSoft)
    })
    line(joinX, toolY(0), joinX, toolY(2), c.accentSoft)
    line(joinX, causeY, causeX - 6, causeY, c.accentSoft)
  } else {
    line(bx0 + 4, toolY(0), bx0 + 4, causeY, c.accentSoft)
    line(bx0 + 4, causeY, causeX, causeY, c.accentSoft)
  }

  A(fade * blamed)
  dot(ctx, causeX, causeY, 4, c.accent)
  if (compact) text(ctx, 'weak pointer analysis', causeX + 10, causeY, c.accent, 9)
  else text(ctx, 'weak pointer analysis', bx0 + bw, gy0 + 226, c.accent, 9, 'right')

  /* ------------------------------------------------------ panel C: what it builds */
  const xVar = cx0 + (compact ? 18 : 16)
  const xObj = cx0 + cw * (compact ? 0.19 : 0.4)
  const xClone = cx0 + cw * (compact ? 0.37 : 0.78)
  const rowY = (i: number) => gy0 + (compact ? 91 + i * 12 : 30 + i * 50)

  const VARS = ['p', 'q', 'r']
  const OBJS = ['o₁', 'o₂', 'o₃']
  // p and q are allocations, so they are known in the first round. r = q copies q's set
  // in the second, and a field read adds o₃ to r in the third. The fourth round derives
  // nothing new -- which is exactly the condition the digest is there to detect.
  const PTS: [number, number, number][] = [
    [0, 0, 0],
    [1, 1, 0],
    [2, 1, 1],
    [2, 2, 2],
  ]

  A(fade * built * 0.8)
  text(ctx, 'points-to', xObj, compact ? rowY(0) - 14 : gy0 + 8, c.faint, 9, 'center')

  PTS.forEach(([v, o, it]) => {
    A(fade * built * round(it) * 0.5)
    edge(ctx, xVar + 5, rowY(v), xObj - 6, rowY(o), c.accentSoft)
  })

  VARS.forEach((v, i) => {
    A(fade * built)
    dot(ctx, xVar, rowY(i), 3, c.bone)
    text(ctx, v, xVar - 9, rowY(i), c.dim, 9, 'right')
  })

  OBJS.forEach((o, i) => {
    A(fade * built)
    dot(ctx, xObj, rowY(i), 4, 'transparent', c.accentSoft)
    // Object names are the first thing to go on a phone: three rows 12px apart have no
    // clear side to hang a label on, and the shape of the graph carries the idea anyway.
    if (!compact) text(ctx, o, xObj, rowY(i) - 12, c.faint, 9, 'center')
  })

  // The clone. Only the set the callee writes is copied; the rest stay the base's rows,
  // drawn as a tether rather than a second allocation, which is the storage claim.
  if (cow > 0.01) {
    A(fade * cow * 0.8)
    text(ctx, 'clone', xClone, compact ? rowY(0) - 14 : gy0 + 8, c.accent, 9, 'center')
    OBJS.forEach((_, i) => {
      const copied = i === 1
      const y = rowY(i)
      A(fade * cow * (copied ? 1 : 0.6))
      if (copied) {
        dot(ctx, xClone, y, 4, c.accent)
        text(ctx, 'copied', xClone + 9, y, c.accent, 9)
      } else {
        ctx.setLineDash([2, 3])
        line(xObj + 6, y, xClone - 6, y, c.ghost)
        ctx.setLineDash([])
        dot(ctx, xClone, y, 3, 'transparent', c.ghost)
        if (i === 0) text(ctx, 'shared', xClone + 9, y, c.faint, 9)
      }
    })
    if (!compact) {
      A(fade * cow * 0.9)
      text(ctx, '1 copied · 2 shared', xClone, gy0 + 168, c.dim, 9, 'center')
    }
  }

  // --- the digests --------------------------------------------------------
  // Seeded off the round, not off the loop, so the last two are the same word every time
  // the figure is seen. Two graphs that are equal have to hash equal; the figure would be
  // lying if the repeat were only true on some passes.
  const hex = (seed: number) => {
    const r = mulberry(seed)
    let s = ''
    for (let i = 0; i < 8; i++) s += '0123456789abcdef'[Math.floor(r() * 16)]
    return s
  }
  const DIGESTS = [hex(0x9e37), hex(0x51ed), hex(0xc2b2), hex(0xc2b2)]

  // Sits under the clone rather than under the variables: the digest is what the round
  // just produced, and the panel is otherwise bottom-heavy on its left.
  const dx = compact ? cx0 + cw * 0.53 : cx0 + cw * 0.26
  const dy0 = compact ? gy0 + 85 : gy0 + 200
  const dStep = compact ? 11 : 21
  const dSize = compact ? 9 : 10

  A(fade * built * 0.7)
  if (!compact) text(ctx, 'xor digest', dx, gy0 + 182, c.faint, 9)

  DIGESTS.forEach((d, i) => {
    const y = dy0 + i * dStep
    // The pair that matters is lit and the rounds that were still moving are not, so the
    // held frame says which comparison ended the analysis without needing a caption to.
    const repeated = i >= 2
    A(fade * round(i))
    text(ctx, String(i + 1), dx, y, c.faint, 9)
    text(ctx, d, dx + (compact ? 10 : 14), y, repeated ? c.accent : c.dim, dSize)
  })

  // The bracket is the O(1) check itself: round 4 rehashed to round 3's word, so nothing
  // was added, so the analysis is done -- without either graph being walked.
  if (settled > 0.01) {
    const bx = dx + (compact ? 62 : 82)
    const y2 = dy0 + 2 * dStep
    const y3 = dy0 + 3 * dStep
    A(fade * settled * 0.9)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(bx - 3, y2)
    ctx.lineTo(bx, y2)
    ctx.lineTo(bx, y3)
    ctx.lineTo(bx - 3, y3)
    ctx.stroke()
    A(fade * settled)
    text(ctx, '= fixpoint', bx + 5, (y2 + y3) / 2, c.accent, 9)
  }

  // --- the connector ------------------------------------------------------
  // Wide only: the diagnosis physically reaching the engine, routed through the one empty
  // column on the canvas. On compact the stage strip already says the panels are in order.
  if (!compact && blamed > 0.01) {
    const mx = cx0 - 22
    A(fade * blamed * 0.7)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(causeX + 8, causeY)
    ctx.lineTo(mx, causeY)
    ctx.lineTo(mx, rowY(1))
    ctx.stroke()
    arrow(mx, cx0 - 6, rowY(1), c.accent)
  }

  // --- readout ------------------------------------------------------------
  const CAPTION =
    p < 0.17
      ? '10,000 Tranco sites'
      : p < 0.3
        ? '42 cases · eslint, semgrep, odgen'
        : p < 0.41
          ? 'all three miss the same thing'
          : p < 0.5
            ? 'points-to graph'
            : p < 0.755
              ? 'add edges · rehash · repeat'
              : p < 0.8
                ? 'digest repeats → fixpoint'
                : 'clone · copy-on-write'

  A(fade * 0.95)
  text(ctx, CAPTION, pad, ry, c.dim, 9)
  if (settled > 0.05) {
    A(fade * settled * 0.9)
    text(
      ctx,
      compact ? 'equal up to collision' : 'equal digest = equal graph, up to collision',
      w - pad,
      ry,
      c.faint,
      9,
      'right',
    )
  }

  ctx.globalAlpha = 1
  ctx.setLineDash([])
}
