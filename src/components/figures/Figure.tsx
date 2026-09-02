import { FigureCanvas } from './FigureCanvas'
import { FIGURES } from './mechanisms/index'

type Props = {
  figure: keyof typeof FIGURES
  label: string
  caption: string
}

/**
 * The lazy boundary for everything figure-related.
 *
 * Work.tsx imports only this module, dynamically. That keeps FigureCanvas, the four draw
 * functions and their helpers inside one `figures` chunk which is never fetched until a
 * visitor actually opens an entry -- as opposed to importing the registry at the top of
 * Work.tsx, which would hoist all of it into the main bundle and make the split cosmetic.
 */
export default function Figure({ figure, label, caption }: Props) {
  const draw = FIGURES[figure]
  if (!draw) return null
  return <FigureCanvas draw={draw} label={label} caption={caption} />
}
