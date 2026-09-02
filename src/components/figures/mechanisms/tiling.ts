import { dot, ease, phase, text } from './shared'
import type { DrawFn } from './shared'

/* ----------------------------------------- 3. FlashAttention: SRAM/HBM tiling */

/**
 * Two implementations of the same attention, laid over one memory hierarchy.
 *
 * The claim the prose makes is that attention is memory-bound, so the figure is built
 * around the bus rather than around the maths. SRAM and HBM are bands; what matters is
 * what crosses between them. The textbook path writes the whole N×N score matrix down
 * into HBM and reads it back, so S crosses the slow bus four times. The tiled path
 * computes one block of S inside SRAM and consumes it there against a running max and
 * sum, so S never crosses at all -- and the slot it would have occupied is drawn dashed
 * and empty at the same place in the other column, so the two are read against each other.
 *
 * The ledger underneath is the part the old figure was missing entirely. Tiling does not
 * make the work smaller. It makes the traffic smaller and the arithmetic *larger*, and
 * that is the whole trade. The numbers are FlashAttention's own measurements rather than
 * an asymptotic bound, because the argument is empirical: the tiled kernel does more
 * FLOPs and is still several times faster. It is only a bargain because the kernel was
 * waiting on bandwidth -- on a compute-bound one the same trade runs backwards, which is
 * why the last caption says memory-bound out loud.
 *
 * Below 560px two columns of this cannot be read, so the contrast moves out of space and
 * into time: one hierarchy, the textbook path first and the tiled path replacing it, with
 * the materialised matrix left behind as a struck ghost so the held frame still shows both.
 */
export const drawTiling: DrawFn = (ctx, t, w, h, c) => {
  // Offset so the reduced-motion still (t = 6) lands in the hold, where both paths, the
  // empty slot where S would have been and the ledger pricing the trade are all on screen.
  const { p } = phase(t + 8.4, 16)
  const compact = w < 560
  const pad = Math.max(12, w * 0.035)

  const A = (v: number) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, v))
  }

  // Attention in GPT-2 medium, sequence length 1024, as measured in the FlashAttention
  // paper. Two numbers carry the figure: 9× less HBM traffic bought for 13% more FLOPs.
  const GB_NAIVE = 40.3
  const GB_TILED = 4.4
  const GF_NAIVE = 66.6
  const GF_TILED = 75.2

  // --- timeline -----------------------------------------------------------
  // The establishing beat is short on purpose: an empty hierarchy is the least
  // interesting frame in the loop, and the hold at the end is the most.
  const tiers = ease(p / 0.06)
  const naive = ease((p - 0.08) / 0.2)
  const tiled = ease((p - 0.34) / 0.22)
  const cost = ease((p - 0.62) / 0.13)
  // A short dip at the seam so the loop restarts rather than cuts.
  const fade = 1 - ease((p - 0.955) / 0.045)
  // Traffic keeps moving through the hold. The difference between the two columns is a
  // difference in *rate*, and a frozen bundle of arrows cannot say that.
  const flow = (p * 8) % 1

  const CAPTION = compact
    ? p < 0.08
      ? 'HBM is 13× slower'
      : p < 0.34
        ? 'textbook: S → HBM → back'
        : p < 0.62
          ? 'tiled: S lives in SRAM'
          : p < 0.78
            ? 'price: recompute'
            : 'memory-bound, so it pays'
    : p < 0.08
      ? 'one A100: SRAM is 13× the bandwidth of HBM, and 2000× smaller'
      : p < 0.34
        ? 'textbook: the N×N scores are written to HBM and read back'
        : p < 0.62
          ? 'tiled: each block of S is produced and consumed inside SRAM'
          : p < 0.78
            ? 'the price: values recomputed rather than stored'
            : 'memory-bound, so the trade pays — on a compute-bound kernel it would not'

  const READOUT =
    cost > 0.4 ? '41.7 ms → 7.3 ms' : tiled > 0.6 ? '40.3 → 4.4 GB' : naive > 0.6 ? '40.3 GB' : ''

  // --- geometry -----------------------------------------------------------
  // Wide keeps a label rail so the tier names and their bandwidths are said once for both
  // columns; compact has no width to spare and tags each band inline instead.
  const headY = pad + 2
  const railW = compact ? 0 : 74
  const bodyX = pad + (compact ? 0 : railW + 6)
  const bodyR = w - pad
  const gutter = 20
  const colW = compact ? bodyR - bodyX : (bodyR - bodyX - gutter) / 2
  const colX = (i: number) => bodyX + i * (colW + gutter)

  const sramY = pad + (compact ? 14 : 16)
  const sramH = h * (compact ? 0.135 : 0.105)
  const busH = h * (compact ? 0.135 : 0.13)
  const hbmY = sramY + sramH + busH
  const hbmH = h * (compact ? 0.235 : 0.26)
  const ledY = hbmY + hbmH + (compact ? h * 0.035 : 29)
  const footY = h - pad + 2

  // The score matrix occupies the same rectangle in both columns, so "materialised" and
  // "never written" land on identical geometry and the eye does the comparison for free.
  const sSize = Math.min(hbmH - (compact ? 14 : 30), compact ? 30 : 58)
  const sN = compact ? 6 : 8
  const sX = (cx: number) => cx + colW - sSize - (compact ? 4 : 8)
  const sY = hbmY + (hbmH - sSize) / 2 - (compact ? 0 : 5)

  const chipW = compact ? 11 : 13
  const chipH = compact ? 10 : 12
  const chipPitch = compact ? 14 : 17
  const chipX0 = (cx: number) => cx + (compact ? 66 : 6)
  const chipY = sY + sSize / 2

  // --- primitives ---------------------------------------------------------
  const frame = (x: number, y: number, fw: number, fh: number, colour: string, a: number) => {
    A(a)
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, fw - 1, fh - 1)
  }

  const chip = (x: number, s: string, a: number, live: boolean) => {
    A(a * (live ? 1 : 0.45))
    ctx.strokeStyle = live ? c.accent : c.ghost
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, chipY - chipH / 2 + 0.5, chipW - 1, chipH - 1)
    A(a * 0.95)
    text(ctx, s, x + chipW / 2, chipY, live ? c.accent : c.faint, 9, 'center')
  }

  /** The N×N scores. `fill` is how much of it has been written down, row-major. */
  const sGrid = (x: number, fillAmt: number, a: number) => {
    const cell = sSize / sN
    frame(x, sY, sSize, sSize, c.ghost, a * 0.9)
    const k = Math.round(fillAmt * sN * sN)
    A(a * 0.5)
    ctx.fillStyle = c.accent
    for (let i = 0; i < k; i++) {
      ctx.fillRect(
        x + (i % sN) * cell + 0.7,
        sY + Math.floor(i / sN) * cell + 0.7,
        cell - 1.4,
        cell - 1.4,
      )
    }
  }

  /** Traffic across the bus. `up` is HBM → SRAM; `pulse < 0` draws the arrow at rest. */
  const cross = (x: number, up: boolean, a: number, pulse: number) => {
    const y0 = sramY + sramH
    const y1 = hbmY
    A(a)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y0 + 2)
    ctx.lineTo(x, y1 - 2)
    const ty = up ? y0 + 2 : y1 - 2
    const d = up ? 1 : -1
    ctx.moveTo(x - 3, ty + d * 4.5)
    ctx.lineTo(x, ty)
    ctx.lineTo(x + 3, ty + d * 4.5)
    ctx.stroke()
    if (pulse < 0) return
    const py = up ? y1 - 2 - pulse * (y1 - y0 - 4) : y0 + 2 + pulse * (y1 - y0 - 4)
    A(a)
    dot(ctx, x, py, 2, c.accent)
  }

  const bar = (x: number, y: number, len: number, bh: number, colour: string, a: number) => {
    A(a)
    ctx.fillStyle = colour
    ctx.fillRect(x, y, Math.max(0, len), bh)
  }

  // --- memory tiers -------------------------------------------------------
  frame(bodyX, sramY, bodyR - bodyX, sramH, c.accentSoft, tiers * fade * 0.7)
  frame(bodyX, hbmY, bodyR - bodyX, hbmH, c.ghost, tiers * fade)

  if (compact) {
    A(tiers * fade)
    text(ctx, 'SRAM · 19 TB/s', bodyX + 5, sramY + sramH / 2, c.accent, 9)
    text(ctx, 'HBM', bodyX + 5, hbmY + 13, c.dim, 9)
    A(tiers * fade * 0.8)
    text(ctx, '1.5 TB/s', bodyX + 5, hbmY + 25, c.faint, 9)
  } else {
    // The rail is the reason the bus matters: two capacities, two bandwidths, one gap.
    const rail = (y: number, lines: [string, string][], head: string, headColour: string) => {
      A(tiers * fade)
      text(ctx, head, pad, y - 12, headColour, 10)
      lines.forEach(([s], i) => {
        A(tiers * fade * 0.8)
        text(ctx, s, pad, y + i * 12, c.faint, 9)
      })
    }
    rail(sramY + sramH / 2, [['20 MB', ''], ['19 TB/s', '']], 'SRAM', c.accent)
    rail(hbmY + hbmH / 2, [['40 GB', ''], ['1.5 TB/s', '']], 'HBM', c.dim)
    A(tiers * fade * 0.85)
    text(ctx, '13× gap', pad, sramY + sramH + busH / 2, c.accentSoft, 9)
  }

  // --- one implementation, drawn into one column --------------------------
  /**
   * `mode` picks which story the column tells, `prog` how far into it we are. Both columns
   * are the same routine because the point is that they are the same computation: same
   * inputs in HBM, same output in HBM, and one difference in the middle.
   */
  const path = (i: number, mode: 'naive' | 'tiled', prog: number, ghost: number) => {
    if (prog <= 0.005 && ghost <= 0.005) return
    const cx = colX(i)
    const a = fade * Math.min(1, prog / 0.1)
    const gx = sX(cx)
    const busMid = sramY + sramH + busH / 2

    // Q, K, V and O sit in HBM in both paths. Nothing about tiling changes that.
    const CHIPS = ['Q', 'K', 'V', 'O']
    CHIPS.forEach((s, k) => {
      const live = k < 3 || prog > 0.55
      chip(chipX0(cx) + k * chipPitch, s, a, live)
    })
    if (!compact) {
      A(a * 0.7)
      text(ctx, 'O(Nd) each', chipX0(cx), sY + sSize + 12, c.faint, 9)
    }

    if (mode === 'naive') {
      // Written down once, then read back for the softmax, written again, read again.
      sGrid(gx, ease(prog / 0.35), a)
      A(a * 0.9)
      // Captions on the matrix hang off its right edge in both columns. Centring them puts
      // the wider one across the gutter and into the neighbouring column's chip label.
      text(
        ctx,
        compact ? 'S materialised' : 'S · N×N materialised',
        compact ? gx - 8 : gx + sSize,
        compact ? chipY : sY + sSize + 12,
        c.dim,
        9,
        'right',
      )
      for (let k = 0; k < 4; k++) {
        cross(gx + 5 + (k * (sSize - 10)) / 3, k % 2 === 1, a * 0.8, (flow + k * 0.25) % 1)
      }
      A(a * 0.95)
      text(ctx, 'S crosses 4×', cx + 2, busMid - (compact ? 0 : 6), c.accent, 9)
      if (!compact) {
        // Naming the four passes is the whole reason the number is four: the softmax and
        // the second matmul each need S back after something else has written it.
        A(a * 0.8)
        text(ctx, 'write · read · write · read', cx + 2, busMid + 7, c.faint, 9)
      }

      // The concrete reason S will not fit, rather than an assertion that it does not:
      // at fp16 a single 4096×4096 score matrix is bigger than the whole of on-chip SRAM.
      const stageY = sramY + (compact ? sramH / 2 : 13)
      A(a * 0.85)
      text(ctx, 'staging only', cx + (compact ? 100 : 6), stageY, c.faint, 9)
      A(a * 0.8)
      if (compact) {
        text(ctx, 'S is 33 MB · SRAM 20', bodyR - 5, stageY, c.faint, 9, 'right')
      } else {
        text(ctx, 'at N=4096 one S is 33 MB · SRAM holds 20', cx + 6, sramY + 26, c.faint, 9)
      }
      return
    }

    // --- tiled -----------------------------------------------------------
    // Compact reuses the same rectangle for both stories, so the ghost of what the textbook
    // path left in HBM has to stay visible or the held frame loses half the argument.
    if (ghost > 0.01) {
      sGrid(gx, 1, ghost * fade * 0.3)
      A(ghost * fade * 0.5)
      ctx.strokeStyle = c.faint
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(gx, sY + sSize)
      ctx.lineTo(gx + sSize, sY)
      ctx.stroke()
    }

    // Nine blocks of S, one live at a time. The marker moves over the slot in HBM because
    // that is the block being computed -- but the slot stays empty, which is the point.
    const nb = 9
    const f = Math.min(0.9999, prog) * nb
    const bi = Math.floor(f)
    const bf = f - bi
    A(a * 0.75)
    ctx.setLineDash([2, 3])
    ctx.strokeStyle = c.accentSoft
    ctx.lineWidth = 1
    ctx.strokeRect(gx + 0.5, sY + 0.5, sSize - 1, sSize - 1)
    ctx.setLineDash([])
    const bs = sSize / 3
    A(a * 0.85)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1
    ctx.strokeRect(gx + (bi % 3) * bs + 0.5, sY + Math.floor(bi / 3) * bs + 0.5, bs - 1, bs - 1)
    A(a * 0.95)
    text(
      ctx,
      compact ? 'S never written' : 'S · never written',
      compact ? gx - 8 : gx + sSize,
      compact ? chipY - (ghost > 0.5 ? 6 : 0) : sY + sSize + 12,
      c.accent,
      9,
      'right',
    )
    // Compact never has both paths on screen at once, so the still frame would otherwise
    // lose the count that makes the contrast a contrast. The struck matrix keeps it.
    if (compact && ghost > 0.5) {
      A(ghost * fade * 0.85)
      text(ctx, 'textbook crossed it 4×', gx - 8, chipY + 6, c.faint, 9, 'right')
    }

    // Only blocks cross: K and V up, the finished O down. Two arrows, not four.
    cross(chipX0(cx) + chipPitch + chipW / 2, true, a * 0.8, bf)
    cross(chipX0(cx) + 3 * chipPitch + chipW / 2, false, a * 0.8, prog > 0.55 ? bf : -1)
    // The tiled column's two arrows rise from the chips on the left, so wide puts its bus
    // label at the far right -- the mirror of the textbook column, whose traffic is over
    // the matrix. Compact has one column and keeps the label beside its own arrows.
    A(a * 0.95)
    if (compact) text(ctx, 'K,V in · O out', chipX0(cx) + 3 * chipPitch + 18, busMid, c.accent, 9)
    else text(ctx, 'K,V in · O out', cx + colW, busMid, c.accent, 9, 'right')

    // The block of S, alive in SRAM and thrown away after use, plus the running statistics
    // that make throwing it away legal: an online softmax needs only a max and a sum.
    const tile = Math.min(sramH - 8, compact ? 16 : 26)
    const tx = cx + (compact ? 100 : 6)
    const ty = sramY + (sramH - tile) / 2
    frame(tx, ty, tile, tile, c.accent, a * 0.9)
    const tc = tile / 4
    const kk = Math.round(bf * 16)
    A(a * 0.55)
    ctx.fillStyle = c.accent
    for (let k = 0; k < kk; k++) {
      ctx.fillRect(tx + (k % 4) * tc + 0.6, ty + Math.floor(k / 4) * tc + 0.6, tc - 1.2, tc - 1.2)
    }

    // The max steps, the sum accumulates, and the output only commits a block at a time.
    // Three shapes rather than three copies of one, because they are three different things.
    const STAT: [string, number][] = [
      ['m', (bi + 1) / nb],
      ['ℓ', (bi + bf) / nb],
      ['O', bi / nb],
    ]
    const statX = tx + tile + (compact ? 8 : 12)
    const statW = compact ? 20 : 34
    STAT.forEach(([s, v], k) => {
      // Compact lays the three statistics along the band; wide stacks them, because a
      // 38px band has room for three rows and a 24px one does not.
      const bx = compact ? statX + k * (statW + 12) : statX
      const by = compact ? sramY + sramH / 2 : sramY + 8 + k * 11
      A(a * 0.9)
      text(ctx, s, bx, by, c.dim, 9)
      A(a * 0.4)
      ctx.fillStyle = c.ghost
      ctx.fillRect(bx + 8, by - 1.5, statW, 3)
      bar(bx + 8, by - 1.5, statW * v, 3, c.accent, a * 0.9)
    })
    if (!compact) {
      A(a * 0.8)
      text(ctx, 'running max, sum, accumulator', statX + statW + 12, sramY + 13, c.faint, 9)
      A(a * 0.8)
      text(ctx, 'block discarded after use', statX + statW + 12, sramY + 26, c.faint, 9)
    } else {
      A(a * 0.8)
      text(ctx, 'online softmax', bodyR - 5, sramY + sramH / 2, c.faint, 9, 'right')
    }
  }

  if (compact) {
    // One hierarchy, the textbook path first and the tiled path replacing it.
    path(0, 'naive', naive * (1 - ease((p - 0.3) / 0.04)), 0)
    path(0, 'tiled', tiled, tiled)
  } else {
    // A dashed rule down the middle, carried through the ledger, so the split between the
    // two implementations is one line rather than an inference from the headers.
    A(fade * tiers * 0.4)
    ctx.setLineDash([2, 4])
    ctx.strokeStyle = c.ghost
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(colX(1) - gutter / 2, headY + 10)
    ctx.lineTo(colX(1) - gutter / 2, footY - 12)
    ctx.stroke()
    ctx.setLineDash([])
    path(0, 'naive', naive, 0)
    path(1, 'tiled', tiled, 0)
  }

  // --- headers ------------------------------------------------------------
  if (compact) {
    // The pipeline itself is the header, with whichever path is on screen in accent.
    let x = bodyX
    const STAGES: [string, boolean][] = [
      ['textbook', naive > 0.05 && tiled < 0.05],
      ['tiled', tiled > 0.05],
    ]
    STAGES.forEach(([s, on], k) => {
      A(fade)
      text(ctx, s, x, headY, on ? c.accent : c.faint, 9)
      x += ctx.measureText(s).width + 6
      if (k === 0) {
        A(fade * 0.6)
        ctx.strokeStyle = c.ghost
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, headY)
        ctx.lineTo(x + 11, headY)
        ctx.moveTo(x + 8, headY - 2.5)
        ctx.lineTo(x + 11, headY)
        ctx.lineTo(x + 8, headY + 2.5)
        ctx.stroke()
        x += 18
      }
    })
  } else {
    A(fade)
    text(ctx, 'textbook attention', colX(0), headY, naive > 0.05 ? c.bone : c.faint, 10)
    text(ctx, 'FlashAttention · tiled', colX(1), headY, tiled > 0.05 ? c.bone : c.faint, 10)
  }

  // --- the ledger: what tiling costs to buy what it saves -----------------
  if (compact) {
    // Two tracks, one per metric. The textbook extent is an outline and the tiled one a
    // fill, so on FLOPs the fill visibly overruns the outline: that overhang is the price.
    const trackX = bodyX + 48
    const trackW = bodyR - trackX - 96
    const ROWS: [string, number, number, number, string][] = [
      ['traffic', GB_TILED / GB_NAIVE, 1, naive, '4.4 vs 40.3 GB'],
      ['FLOPs', 1, GF_NAIVE / GF_TILED, cost, '75.2 vs 66.6 GF'],
    ]
    ROWS.forEach(([s, fillFrac, refFrac, appear, note], k) => {
      // Row pitch tracks the canvas so a taller compact pane does not leave the ledger
      // clotted at the top of the space left for it.
      const y = ledY + 6 + k * Math.max(18, h * 0.105)
      A(fade * appear)
      text(ctx, s, bodyX, y + 2, c.faint, 9)
      // The reference outline has to survive the page's near-black ground -- in ghost it
      // reads as nothing, and then the tiled bar looks like a bar rather than a comparison.
      A(fade * appear * 0.8)
      ctx.strokeStyle = c.faint
      ctx.lineWidth = 1
      ctx.strokeRect(trackX + 0.5, y - 1.5, trackW * refFrac - 1, 6)
      const grow = k === 0 ? tiled : cost
      bar(trackX, y - 1, trackW * fillFrac * grow, 5, c.accent, fade * appear * 0.85)
      A(fade * grow * 0.95)
      text(ctx, note, bodyR, y + 2, k === 0 ? c.accent : c.dim, 9, 'right')
    })
  } else {
    const barH = 6
    const rowA = ledY + 6
    const rowB = ledY + 50
    A(fade * Math.max(naive, cost) * 0.9)
    text(ctx, 'HBM traffic', pad, rowA + 3, c.faint, 9)
    A(fade * cost * 0.9)
    text(ctx, 'FLOPs', pad, rowB + 3, c.faint, 9)

    // Row 0 grows with each path's own stage, so the traffic is read as the consequence of
    // the mechanism directly above it rather than as a summary bolted on at the end.
    bar(colX(0), rowA, colW * naive, barH, c.faint, fade * 0.75)
    A(fade * naive * 0.9)
    text(ctx, '40.3 GB read + written', colX(0), rowA + 17, c.dim, 9)

    bar(colX(1), rowA, colW * (GB_TILED / GB_NAIVE) * tiled, barH, c.accent, fade * 0.9)
    A(fade * tiled * 0.95)
    text(ctx, '4.4 GB · 9× less', colX(1), rowA + 17, c.accent, 9)

    const refW = colW * (GF_NAIVE / GF_TILED)
    bar(colX(0), rowB, refW * cost, barH, c.faint, fade * 0.75)
    A(fade * cost * 0.9)
    text(ctx, '66.6 GFLOP', colX(0), rowB + 17, c.dim, 9)

    bar(colX(1), rowB, refW * cost, barH, c.accent, fade * 0.9)
    // The overhang gets its own hatched block, because it is the only thing on the canvas
    // that got *worse* and should not read as more of the same bar. It rides the end of the
    // bar as that grows, or the price detaches and floats out to the right on its own.
    const over = (colW - refW) * cost
    bar(colX(1) + refW * cost, rowB, over, barH, c.accentSoft, fade * 0.9)
    A(fade * cost * 0.8)
    ctx.setLineDash([1.5, 2])
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1
    ctx.strokeRect(colX(1) + refW * cost + 0.5, rowB + 0.5, Math.max(0, over - 1), barH - 1)
    ctx.setLineDash([])
    A(fade * cost * 0.95)
    text(ctx, '75.2 GFLOP · +13% recomputed', colX(1), rowB + 17, c.accent, 9)

    /**
     * Attribution, on the canvas and not only in a comment.
     *
     * These are the FlashAttention paper's published measurements, not measurements taken
     * from this project. Rendered unattributed beside "what I built" a reader would
     * reasonably take them for the latter, and a figure on a personal site does not get to
     * borrow someone else's benchmark silently.
     */
    A(fade * cost * 0.7)
    text(ctx, 'measurements: Dao et al., GPT-2 medium, seq 1024, A100', colX(0), rowB + 34, c.faint, 8.5)
  }

  // --- readout ------------------------------------------------------------
  A(fade * 0.95)
  text(ctx, CAPTION, pad, footY, c.dim, 9)
  if (READOUT) {
    A(fade * 0.95)
    text(ctx, READOUT, bodyR, footY, cost > 0.4 ? c.accent : c.faint, 9, 'right')
  }
  ctx.globalAlpha = 1
  ctx.setLineDash([])
}
