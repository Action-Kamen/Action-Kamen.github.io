/**
 * Rebuilds everything that depends on the CV PDF.
 *
 * The CV exists in three places: the downloadable PDF, and one rendered image per page for
 * the in-page viewer. Replacing only the PDF leaves the viewer showing the previous CV,
 * which is worse than showing nothing — the page and the download would disagree, and a
 * reader who noticed would trust neither.
 *
 * So: drop a new PDF at public/doc/Anirudh-Garg-CV.pdf and run this. It re-renders every
 * page, writes as many images as the document has, and deletes images left over from a
 * shorter version.
 *
 * Requires python3 with `pymupdf`.  Run: npm run cv
 */
import { execFile } from 'node:child_process'
import { readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import sharp from 'sharp'

const run = promisify(execFile)

const PDF = 'public/doc/Anirudh-Garg-CV.pdf'
const OUT = 'src/assets/cv'
/** Wide enough that 10pt type survives being panned at phone width. */
const WIDTH = 1240

const script = `
import fitz, sys, os
doc = fitz.open(${JSON.stringify(PDF)})
os.makedirs(${JSON.stringify(OUT)}, exist_ok=True)
for i, page in enumerate(doc):
    zoom = ${WIDTH} / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    pix.save(os.path.join(${JSON.stringify(OUT)}, f"raw-{i+1}.png"))
print(doc.page_count)
`

const { stdout } = await run('python3', ['-c', script])
const pages = Number(stdout.trim())
console.log(`${PDF}: ${pages} page${pages === 1 ? '' : 's'}`)

for (let i = 1; i <= pages; i++) {
  const raw = join(OUT, `raw-${i}.png`)
  const webp = await sharp(raw).webp({ quality: 80, effort: 6 }).toBuffer()
  await writeFile(join(OUT, `page-${i}.webp`), webp)
  await rm(raw)
  console.log(`  page-${i}.webp  ${(webp.length / 1024).toFixed(0)} KB`)
}

// A shorter CV must not leave the old final page behind for the viewer to render.
for (const name of await readdir(OUT)) {
  const n = Number(name.match(/^page-(\d+)\.webp$/)?.[1] ?? 0)
  if (n > pages) {
    await rm(join(OUT, name))
    console.log(`  removed stale ${name}`)
  }
}
