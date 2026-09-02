import { TAU, dot, ease, mulberry, phase, text } from './shared'
import type { DrawFn } from './shared'

/* ----------------------------------------------- 4. crypto: regime switching */

/**
 * Two model classes reading the same tape, judged against the switches that actually
 * happened.
 *
 * The old figure drew a price with shaded bands and called the bands a result. The result
 * is not that regimes exist -- it is that the two families disagree about where they are,
 * and that the disagreement is the useful signal. Elastic net is linear: it cannot bend
 * around a switch, so it concedes one only once its smoothed features have moved, eight
 * bars late. It finds both switches where volatility rises and misses the one where
 * volatility falls, because by then its slow leg has already adapted up to the chop.
 * Boosted trees can cut anywhere, so they take all three inside four bars -- and also fire
 * four times on loud bars inside a regime that never changed.
 *
 * So the last row is the whole point: keep only the calls both families make within
 * seven bars of each other. That deletes all four false alarms and one real switch. A
 * figure that showed only the four saved would be selling something.
 *
 * Both scores are a fast/slow realised-volatility ratio off the same returns -- the same
 * statistic, the same slow leg, only the fast leg differs -- so the contrast on screen is
 * the contrast in model class and nothing else. Every row shares one time axis, so a spike
 * in |r| sits directly above the boosted-tree fire it caused, and the shaded block after
 * each fire is the hold-off window in which the detector is not listening.
 *
 * Below 560px the annotation rail and the verdict row are dropped, and agreement is drawn
 * instead as a tie between the two lanes. Five stacked rows with a rail cannot be read at
 * 335px, and half a legible figure beats a complete illegible one.
 */
export const drawRegime: DrawFn = (ctx, t, w, h, c) => {
  // Offset so the reduced-motion still frame (t = 6) lands in the hold, where the price,
  // both score tracks, every fire and the verdict are on screen at once. That frame is
  // the argument; the rest of the loop is the order to read it in.
  const { p } = phase(t + 7, 18)
  const pad = Math.max(12, w * 0.035)
  const compact = w < 560

  const A = (v: number) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, v))
  }
  const at = (a: number[], i: number) => a[i] ?? 0

  // --- the market ---------------------------------------------------------
  // 120 bars, not 200. Two score tracks at 200 bars are two hairballs on a phone, and a
  // detector you cannot see fire is not evidence of anything.
  const N = 120
  /** Where the generating process actually changes. Nothing on screen is allowed to know. */
  const CUTS = [28, 59, 90]
  const VOL = [0.013, 0.042]
  const DRIFT = [0.0038, -0.0021]
  const RAMP = 4
  const regimeAt = (i: number) => CUTS.filter((cut) => i >= cut).length

  const rng = mulberry(758015)
  const ret: number[] = []
  const px: number[] = []
  let v = 0.4
  for (let i = 0; i < N; i++) {
    const g = regimeAt(i) % 2
    let vol = VOL[g] ?? 0.01
    let drift = DRIFT[g] ?? 0
    // A regime does not turn over in one bar. Blending across five keeps the comparison
    // fair: against a step change every detector looks instant.
    for (const cut of CUTS) {
      if (i >= cut && i < cut + RAMP) {
        const u = (i - cut + 1) / (RAMP + 1)
        const q = regimeAt(cut - 1) % 2
        vol = (VOL[q] ?? 0.01) + ((VOL[g] ?? 0.01) - (VOL[q] ?? 0.01)) * u
        drift = (DRIFT[q] ?? 0) + ((DRIFT[g] ?? 0) - (DRIFT[q] ?? 0)) * u
      }
    }
    let d = drift + (rng() - 0.5) * vol * 2
    v += d
    // Reflect at the edges rather than clip, so a bar at the boundary is not a fake
    // zero return that both detectors would then read as a regime change.
    if (v > 0.95) {
      v = 1.9 - v
      d = 0
    }
    if (v < 0.05) {
      v = 0.1 - v
      d = 0
    }
    ret.push(d)
    px.push(v)
  }

  // --- what the two model classes see -------------------------------------
  const ewma = (alpha: number) => {
    const out: number[] = []
    let e = Math.abs(at(ret, 0))
    for (let i = 0; i < N; i++) {
      e = alpha * Math.abs(at(ret, i)) + (1 - alpha) * e
      out.push(e)
    }
    return out
  }
  // Deviation of fast realised vol from slow. It moves on a switch in either direction,
  // which a volatility *level* does not -- chop going quiet is a regime change too.
  const score = (fast: number, slow: number) => {
    const f = ewma(fast)
    const s = ewma(slow)
    return f.map((x, i) => Math.abs(x / (at(s, i) || 1e-9) - 1))
  }
  // Same statistic, same slow leg. Only the fast leg differs: the linear model needs its
  // numerator smoothed to stay stable, the tree ensemble is free to cut on one bar.
  const EN = score(0.19, 0.05)
  const GB = score(0.6, 0.05)
  const THR = 0.5
  const WARM = 12

  /** Rising crossings only, with a refractory gap -- a detector that re-fires every bar
   * inside one regime is not reporting switches, it is reporting volatility. */
  const fires = (s: number[], refractory: number) => {
    const out: number[] = []
    let last = -999
    for (let i = WARM; i < N; i++) {
      if (at(s, i - 1) < THR && at(s, i) >= THR && i - last > refractory) {
        out.push(i)
        last = i
      }
    }
    return out
  }
  const enFires = fires(EN, 15)
  const gbFires = fires(GB, 14)

  // A fire is credited to a switch only if it lands after it and within 18 bars, and each
  // switch can be claimed once. Anything left over is a false alarm, not a late call.
  const claim = (f: number[]) => {
    const taken = new Set<number>()
    return f.map((i) => {
      const cut = CUTS.find((k) => i >= k && i - k <= 18 && !taken.has(k))
      if (cut !== undefined) taken.add(cut)
      return { i, cut }
    })
  }
  const enMarks = claim(enFires)
  const gbMarks = claim(gbFires)

  // The cross-model test. Seven bars is tight on purpose: agreeing eventually is not
  // agreeing, and a loose window would confirm a boosted fire against an unrelated one.
  const AGREE = 7
  const agrees = (i: number) => enFires.some((j) => Math.abs(j - i) <= AGREE)
  const kept = gbFires.filter(agrees).length
  const lagOf = (m: { i: number; cut: number | undefined }[]) => {
    const l = m.filter((x) => x.cut !== undefined).map((x) => x.i - (x.cut ?? 0))
    return l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : 0
  }
  const enHits = enMarks.filter((m) => m.cut !== undefined).length
  const gbHits = gbMarks.filter((m) => m.cut !== undefined).length
  const gbFalse = gbMarks.length - gbHits
  // Switches only the boosted model found, thrown away by the confirmation rule. Naming
  // this number is the difference between a result and a sales pitch.
  const lost = gbMarks.filter((m) => m.cut !== undefined && !agrees(m.i)).length

  const sd = (a: number[]) => {
    const m = a.reduce((x, y) => x + y, 0) / a.length
    return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length)
  }
  const trendR = ret.filter((_, i) => regimeAt(i) % 2 === 0)
  const chopR = ret.filter((_, i) => regimeAt(i) % 2 === 1)
  const volRatio = (sd(chopR) / (sd(trendR) || 1e-9)).toFixed(1)

  // One straight fit over the whole history, with one pooled residual sigma -- the model
  // the prose says the data does not support. Drawn so the reader can watch it fail.
  let sx = 0
  let sy = 0
  let sxy = 0
  let sxx = 0
  for (let i = 0; i < N; i++) {
    sx += i
    sy += at(px, i)
    sxy += i * at(px, i)
    sxx += i * i
  }
  const slope = (N * sxy - sx * sy) / (N * sxx - sx * sx)
  const icept = (sy - slope * sx) / N
  const fitAt = (i: number) => icept + slope * i
  const resid = sd(px.map((y, i) => y - fitAt(i)))

  // --- geometry -----------------------------------------------------------
  const labelW = compact ? 26 : 64
  const railW = compact ? 0 : 92
  const x0 = pad + labelW
  const x1 = w - pad - railW
  const top = pad + (compact ? 10 : 20)
  const bot = h - pad - (compact ? 11 : 17)
  const H = bot - top
  const xOf = (i: number) => x0 + (i / (N - 1)) * (x1 - x0)

  const chartY1 = top + H * 0.46
  const barY1 = chartY1
  const barY0 = chartY1 - H * 0.46 * 0.32
  const priceY0 = top
  const priceY1 = barY0 - 4
  const enY0 = top + H * (compact ? 0.56 : 0.545)
  const enY1 = top + H * (compact ? 0.73 : 0.69)
  const gbY0 = top + H * (compact ? 0.81 : 0.775)
  const gbY1 = top + H * (compact ? 0.98 : 0.92)
  const tieY = (enY1 + gbY0) / 2
  const confY = bot

  const lo = Math.min(...px, ...px.map((_, i) => fitAt(i) - resid))
  const hi = Math.max(...px, ...px.map((_, i) => fitAt(i) + resid))
  const yPx = (val: number) => priceY1 - ((val - lo) / (hi - lo)) * (priceY1 - priceY0)
  const rMax = Math.max(...ret.map(Math.abs))

  /** Score to lane height. The threshold sits mid-lane in both lanes so the two tracks
   * are read against the same line; above it the scale compresses, because the boosted
   * score runs four times the threshold and clipping it would hide exactly that. */
  const yScore = (s: number, y0: number, y1: number) => {
    const u = s / THR
    const f = u <= 1 ? u * 0.5 : 0.5 + 0.5 * (1 - Math.exp(-(u - 1) * 0.75))
    return y1 - f * (y1 - y0)
  }

  // --- timeline -----------------------------------------------------------
  const draw = ease(p / 0.1)
  const bands = ease((p - 0.1) / 0.08)
  const enIn = ease((p - 0.2) / 0.14)
  const gbIn = ease((p - 0.38) / 0.14)
  const conf = ease((p - 0.56) / 0.12)
  const fade = 1 - ease((p - 0.965) / 0.035)
  const stage = p < 0.1 ? 0 : p < 0.2 ? 1 : p < 0.38 ? 2 : p < 0.56 ? 3 : 4
  const shown = Math.max(2, Math.floor(draw * N))

  const CAPTIONS = compact
    ? [
        'one fit, all of it',
        `σ chop ${volRatio}× trend`,
        'slow detector · late',
        'fast detector · noisy',
        'both agree → keep',
      ]
    : [
        'one fit · whole history',
        `two regimes · σ chop ${volRatio}× σ trend`,
        'slow band · smooth, late, no false calls',
        'fast band · early, and fires on noise',
        `confirm: both within ${AGREE} bars`,
      ]
  const READOUTS = compact
    ? [
        `${N} bars`,
        `${CUTS.length} switches`,
        `${enHits}/${CUTS.length} · lag ${lagOf(enMarks)}`,
        `${gbHits}/${CUTS.length} · ${gbFalse} false`,
        `kept ${kept} of ${gbFires.length}`,
      ]
    : [
        `${N} bars · resid ±σ pooled`,
        `${CUTS.length} true switches`,
        `${enHits}/${CUTS.length} found · lag ${lagOf(enMarks)} bars`,
        `${gbHits}/${CUTS.length} found · lag ${lagOf(gbMarks)} · ${gbFalse} false`,
        `kept ${kept} of ${gbFires.length} · ${lost} real switch lost`,
      ]
  const CAPTION = CAPTIONS[stage] ?? ''
  const READOUT = READOUTS[stage] ?? ''

  // --- regime shading, behind every row -----------------------------------
  // Full column height, not just the chart: the rows share a time axis, so tinting the
  // whole stack is what makes "this fire happened inside chop" readable at a glance.
  for (let g = 0; g <= CUTS.length; g++) {
    const s = g === 0 ? 0 : CUTS[g - 1] ?? 0
    const e = g === CUTS.length ? N - 1 : (CUTS[g] ?? N) - 1
    const vis = Math.min(e, shown - 1)
    if (vis <= s) continue
    A(fade * (g % 2 === 0 ? 0.05 : 0.115) * (0.35 + 0.65 * bands))
    ctx.fillStyle = c.accent
    ctx.fillRect(xOf(s), top, xOf(vis) - xOf(s), H)
  }

  // --- ground truth -------------------------------------------------------
  CUTS.forEach((cut, k) => {
    if (cut > shown) return
    if (k === 0 && !compact) {
      A(fade * bands * 0.9)
      text(ctx, 'true switch', xOf(cut) + 5, priceY0 + 6, c.faint, 9)
    }
    A(fade * bands * 0.45)
    ctx.strokeStyle = c.bone
    ctx.lineWidth = 1
    ctx.setLineDash([1, 4])
    ctx.beginPath()
    ctx.moveTo(xOf(cut), top)
    ctx.lineTo(xOf(cut), compact ? gbY1 : confY)
    ctx.stroke()
    ctx.setLineDash([])
  })

  // --- the one-market fit -------------------------------------------------
  // Left in faintly after its stage rather than removed. The path wandering outside a
  // pooled sigma band for whole stretches is the claim the rest of the figure answers.
  const fitA = fade * (stage === 0 ? 1 : 0.5)
  const fx1 = xOf(shown - 1)
  A(fitA * 0.09)
  ctx.fillStyle = c.bone
  ctx.beginPath()
  ctx.moveTo(xOf(0), yPx(fitAt(0) + resid))
  ctx.lineTo(fx1, yPx(fitAt(shown - 1) + resid))
  ctx.lineTo(fx1, yPx(fitAt(shown - 1) - resid))
  ctx.lineTo(xOf(0), yPx(fitAt(0) - resid))
  ctx.closePath()
  ctx.fill()
  A(fitA * 0.4)
  ctx.strokeStyle = c.bone
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  ctx.moveTo(xOf(0), yPx(fitAt(0)))
  ctx.lineTo(fx1, yPx(fitAt(shown - 1)))
  ctx.stroke()
  ctx.setLineDash([])

  // --- |r|, which is where the clustering actually lives ------------------
  ctx.fillStyle = c.accentSoft
  for (let i = 0; i < shown; i++) {
    const bh = (Math.abs(at(ret, i)) / rMax) * (barY1 - barY0)
    A(fade * 0.5)
    ctx.fillRect(xOf(i) - 0.6, barY1 - bh, 1.2, bh)
  }

  // --- price --------------------------------------------------------------
  A(fade)
  ctx.strokeStyle = c.bone
  ctx.lineWidth = 1.2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < shown; i++) {
    if (i === 0) ctx.moveTo(xOf(i), yPx(at(px, i)))
    else ctx.lineTo(xOf(i), yPx(at(px, i)))
  }
  ctx.stroke()

  // --- the two score lanes ------------------------------------------------
  const lane = (
    s: number[],
    marks: { i: number; cut: number | undefined }[],
    y0: number,
    y1: number,
    reveal: number,
    refractory: number,
    colour: string,
    ring: boolean,
  ) => {
    const upto = Math.max(2, Math.floor(reveal * N))
    const ty = yScore(THR, y0, y1)

    // Both lanes are ruled from the first frame, empty. The stack is the shape of the
    // argument, and revealing the shape a row at a time leaves the pane half blank for
    // half the loop -- which is worse than showing a reader where the answer will go.
    A(fade * draw * 0.35)
    ctx.strokeStyle = c.ghost
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0, y1)
    ctx.lineTo(x1, y1)
    ctx.stroke()

    A(fade * draw * (0.2 + 0.3 * reveal))
    ctx.strokeStyle = c.accentSoft
    ctx.setLineDash([2, 4])
    ctx.beginPath()
    ctx.moveTo(x0, ty)
    ctx.lineTo(x1, ty)
    ctx.stroke()
    ctx.setLineDash([])
    if (reveal <= 0.01) return

    // The hold-off after each fire, drawn as a muted run of the threshold itself. Without
    // it a reader counts peaks touching the line with no marker on them and concludes the
    // figure is lying; drawn across the whole lane instead, it swallows the lane -- the
    // boosted detector spends almost the entire series inside one.
    marks.forEach((m) => {
      if (m.i > upto) return
      const xe = xOf(Math.min(N - 1, m.i + refractory))
      A(fade * 0.5)
      ctx.fillStyle = c.accentSoft
      ctx.fillRect(xOf(m.i), ty - 1, xe - xOf(m.i), 2)
    })

    A(fade * 0.9)
    ctx.strokeStyle = colour
    ctx.lineWidth = 1.1
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let i = 0; i < upto; i++) {
      const y = yScore(at(s, i), y0, y1)
      if (i === 0) ctx.moveTo(xOf(i), y)
      else ctx.lineTo(xOf(i), y)
    }
    ctx.stroke()

    marks.forEach((m) => {
      if (m.i > upto) return
      const x = xOf(m.i)
      // The lag is drawn, not asserted: a bar from the true switch to the call. The two
      // lanes carry the same bar at very different lengths, which is the trade.
      if (m.cut !== undefined) {
        A(fade * 0.75)
        ctx.strokeStyle = c.accent
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(xOf(m.cut), y1 - 2.5)
        ctx.lineTo(x, y1 - 2.5)
        ctx.stroke()
      }
      A(fade)
      ctx.strokeStyle = colour
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, ty)
      ctx.lineTo(x, y1 - 2.5)
      ctx.stroke()
      // Hollow where the other model class never agreed. No colour in this palette can
      // carry right-versus-wrong, so weight and fill carry it instead.
      if (ring && !agrees(m.i)) {
        ctx.beginPath()
        ctx.arc(x, ty, 2.6, 0, TAU)
        ctx.strokeStyle = c.faint
        ctx.lineWidth = 1
        ctx.stroke()
      } else {
        dot(ctx, x, ty, 2.6, c.accent)
      }
    })
  }

  lane(EN, enMarks, enY0, enY1, enIn, 15, c.dim, false)
  lane(GB, gbMarks, gbY0, gbY1, gbIn, 14, c.dim, true)

  // --- the verdict --------------------------------------------------------
  if (conf > 0.01) {
    gbFires.forEach((i) => {
      const ok = agrees(i)
      const x = xOf(i)
      if (ok) {
        // Tie the two calls together across the gap between lanes. The horizontal run is
        // the disagreement in timing that the rule tolerates.
        const near = (b: number, k: number) => (Math.abs(k - i) < Math.abs(b - i) ? k : b)
        const j = enFires.reduce(near, enFires[0] ?? i)
        A(fade * conf * 0.8)
        ctx.strokeStyle = c.accent
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, gbY0)
        ctx.lineTo(x, tieY)
        ctx.lineTo(xOf(j), tieY)
        ctx.lineTo(xOf(j), enY1)
        ctx.stroke()
      }
      if (compact) return
      A(fade * conf * (ok ? 0.9 : 0.5))
      ctx.strokeStyle = ok ? c.accent : c.faint
      ctx.lineWidth = 1
      if (!ok) ctx.setLineDash([1.5, 2.5])
      ctx.beginPath()
      ctx.moveTo(x, gbY1)
      ctx.lineTo(x, confY)
      ctx.stroke()
      ctx.setLineDash([])
      // The one rejected call that was sitting on a real switch gets its lag drawn, so the
      // cost of the rule is visible as a thing on the page and not only as a count.
      const m = gbMarks.find((g) => g.i === i)
      if (!ok && m?.cut !== undefined) {
        A(fade * conf * 0.7)
        ctx.strokeStyle = c.accentSoft
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(xOf(m.cut), confY)
        ctx.lineTo(x, confY)
        ctx.stroke()
      }
      A(fade * conf)
      if (ok) dot(ctx, x, confY, 3, c.accent)
      else {
        ctx.beginPath()
        ctx.arc(x, confY, 2.4, 0, TAU)
        ctx.strokeStyle = c.faint
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })
  }

  // --- row labels ---------------------------------------------------------
  const rowLabel = (s: string, y: number, on: boolean, a = 1) => {
    A(fade * a)
    text(ctx, s, pad, y, on ? c.dim : c.faint, 9)
  }
  rowLabel(compact ? 'px' : 'price', (priceY0 + priceY1) / 2, true)
  rowLabel('|r|', (barY0 + barY1) / 2, true, 0.8)
  rowLabel(compact ? 'slow' : 'slow band', (enY0 + enY1) / 2, enIn > 0.02, draw)
  rowLabel(compact ? 'fast' : 'fast band', (gbY0 + gbY1) / 2, gbIn > 0.02, draw)
  if (!compact) rowLabel('both', confY, conf > 0.02, draw)

  // --- stage strip and annotation rail, wide only -------------------------
  if (!compact) {
    const STAGES = ['series', 'regimes', 'slow band', 'fast band', 'confirm']
    let sxp = pad
    STAGES.forEach((s, i) => {
      A(fade * (i <= stage ? 1 : 0.45))
      text(ctx, s, sxp, pad + 4, i === stage ? c.accent : c.faint, 9)
      sxp += ctx.measureText(s).width + 6
      if (i < STAGES.length - 1) {
        A(fade * 0.45)
        ctx.strokeStyle = c.ghost
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(sxp, pad + 4)
        ctx.lineTo(sxp + 9, pad + 4)
        ctx.moveTo(sxp + 6, pad + 1.5)
        ctx.lineTo(sxp + 9, pad + 4)
        ctx.lineTo(sxp + 6, pad + 6.5)
        ctx.stroke()
        sxp += 15
      }
    })

    // The rail carries the reason for each row, not a restatement of it.
    const rail = (lines: [string, string][], y: number, a: number) => {
      lines.forEach(([s, col], i) => {
        A(fade * a)
        text(ctx, s, w - pad, y + i * 12, col, 9, 'right')
      })
    }
    rail(
      [
        ['one fit, pooled ±σ', c.faint],
        ['σ chop', c.faint],
        [`= ${volRatio}× σ trend`, c.accent],
      ],
      priceY0 + 4,
      0.95,
    )
    rail(
      [
        [`${enHits} of ${CUTS.length} switches`, c.dim],
        [`lag ${lagOf(enMarks)} bars`, c.faint],
        ['0 false', c.accent],
      ],
      enY0 + 2,
      enIn,
    )
    rail(
      [
        [`${gbHits} of ${CUTS.length} switches`, c.dim],
        [`lag ${lagOf(gbMarks)} bars`, c.faint],
        [`${gbFalse} false`, c.accent],
      ],
      gbY0 + 2,
      gbIn,
    )
    rail([[`${kept} kept · ${gbFires.length - kept} cut`, c.dim]], confY - 4, conf)
  }

  // --- readout ------------------------------------------------------------
  A(fade * 0.95)
  text(ctx, CAPTION, pad, h - pad + 2, c.dim, 9)
  A(fade * 0.95)
  text(ctx, READOUT, w - pad, h - pad + 2, stage === 4 ? c.accent : c.faint, 9, 'right')
  ctx.globalAlpha = 1
  ctx.setLineDash([])
}
