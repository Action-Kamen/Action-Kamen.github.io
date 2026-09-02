/**
 * Optimises photographs in place.
 *
 * The workflow this protects: drop a photo into the right folder, commit, done — ideally
 * from a phone, through GitHub's web uploader. A photo straight off a phone is a 3120x4160
 * JPEG of a megabyte or more, and Vite will ship that byte for byte. This resizes to the
 * largest size the layout can actually display, re-encodes to WebP and deletes the original.
 *
 * Idempotent: anything already WebP and already within bounds is left alone.
 *
 * Where photos go:
 *   src/assets/gallery/solo/   photographs of Anirudh alone -- the large mosaic panel
 *   src/assets/gallery/group/  everything else -- the five smaller panels
 *   src/assets/hero/           the hero illustration (a single file; SVG is left untouched)
 *
 * Filenames become alt text when no entry exists in the ALT map in Mosaic.tsx, so name them
 * descriptively and prefix with a number to fix the order: `04-lake-brienz.jpg`.
 *
 * Run: npm run images
 */
import { readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import sharp from 'sharp'

const JOBS = [
  // Portrait crop: the large panel is tall.
  { dir: 'src/assets/gallery/solo', width: 820, height: 1090, quality: 72 },
  // Landscape crop: the small panels are wide.
  { dir: 'src/assets/gallery/group', width: 760, height: 570, quality: 74 },
  // The hero illustration keeps its own aspect ratio and is not cropped.
  { dir: 'src/assets/hero', width: 1200, quality: 82 },
]

const RASTER = /\.(jpe?g|png|webp)$/i

for (const { dir, width, height, quality } of JOBS) {
  let names
  try {
    names = await readdir(dir)
  } catch {
    continue
  }

  for (const name of names) {
    if (!RASTER.test(name)) continue // leaves .svg and README/PROMPT files alone

    const src = join(dir, name)
    const before = (await stat(src)).size
    const base = name.slice(0, -extname(name).length)
    const out = join(dir, `${base}.webp`)

    const image = sharp(src).rotate() // honour EXIF orientation before metadata is dropped
    const meta = await image.metadata()

    const resize = height
      ? { width, height, fit: 'cover' }
      : { width: Math.min(width, meta.width ?? width), withoutEnlargement: true }

    const buffer = await image.resize(resize).webp({ quality, effort: 6 }).toBuffer()

    // Skip the rewrite if it would make the file bigger and nothing needs cropping.
    if (src === out && buffer.length >= before && !height) {
      console.log(`${name.padEnd(30)} already optimal`)
      continue
    }

    await writeFile(out, buffer)
    if (src !== out) await unlink(src)

    const dims = await sharp(buffer).metadata()
    console.log(
      `${name.padEnd(30)} ${(before / 1024).toFixed(0).padStart(5)} KB -> ` +
        `${(buffer.length / 1024).toFixed(0).padStart(4)} KB  ${dims.width}x${dims.height}`,
    )
  }
}
