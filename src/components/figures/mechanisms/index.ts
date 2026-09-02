import type { DrawFn } from './shared'

import { drawLowering } from './lowering'
import { drawPointer } from './pointer'
import { drawRegime } from './regime'
import { drawTiling } from './tiling'

/**
 * One module per figure.
 *
 * They were a single file until three of them needed reworking at once and the file became
 * the bottleneck. Splitting also means a change to one diagram cannot break another.
 */
export const FIGURES: Record<string, DrawFn> = {
  lowering: drawLowering,
  pointer: drawPointer,
  tiling: drawTiling,
  regime: drawRegime,
}

export type { DrawFn, Palette } from './shared'
