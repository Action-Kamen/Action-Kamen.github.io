/**
 * Optimises the photographs in place.
 *
 * The workflow this protects: drop a photo into src/assets/gallery, commit, done -- ideally
 * from a phone, through GitHub's web uploader. A photo straight off a phone is a 3120x4160
 * JPEG of roughly a megabyte, and Vite will happily ship that byte for byte. This script
 * resizes to the largest size the layout can actually display, re-encodes to WebP, and
 * deletes the original, so forgetting to optimise costs one command rather than the
 * performance budget.
 *
 * Idempotent: files already WebP and already within bounds are left alone.
 *
 * Run: npm run images
 */
import { readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import sharp from 'sharp'

const JOBS = [
  { dir: 'src/assets/gallery', width: 1170, quality: 78 },
  { dir: 'src/assets', width: 900, quality: 82, only: /^portrait-src\./, renameTo: 'portrait' },
]

const IMAGE = /\.(jpe?g|png|webp)$/i

for (const { dir, width, quality, only, renameTo } of JOBS) {
  let names
  try {
    names = await readdir(dir)
  } catch {
    continue
  }

  for (const name of names) {
    if (!IMAGE.test(name)) continue
    if (only && !only.test(name)) continue

    const src = join(dir, name)
    const before = (await stat(src)).size
    const base = renameTo ?? name.slice(0, -extname(name).length)
    const out = join(dir, `${base}.webp`)

    const image = sharp(src).rotate() // honour EXIF orientation before dropping the metadata
    const meta = await image.metadata()

    const buffer = await image
      .resize({ width: Math.min(width, meta.width ?? width), withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer()

    await writeFile(out, buffer)
    if (src !== out) await unlink(src)

    const dims = await sharp(buffer).metadata()
    console.log(
      `${name.padEnd(26)} ${(before / 1024).toFixed(0).padStart(5)} KB -> ` +
        `${(buffer.length / 1024).toFixed(0).padStart(4)} KB  ${dims.width}x${dims.height}  ${base}.webp`,
    )
  }
}
