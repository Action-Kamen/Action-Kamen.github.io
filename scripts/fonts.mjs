/**
 * Vendors, instances and subsets the typefaces this site uses.
 *
 * Three passes, each earning its place:
 *
 *   1. VENDOR. A <link> to fonts.googleapis.com costs a DNS lookup, a TLS handshake and a
 *      render-blocking stylesheet round-trip on an origin we do not control, all before a
 *      single glyph is requested. Self-hosting collapses that to one same-origin request.
 *
 *   2. INSTANCE. Most of a variable font's weight is `gvar` -- one set of outline deltas per
 *      axis. Newsreader ships wght AND opsz; pinning opsz alone takes it from 115 KB to 47 KB.
 *      So opsz is spent where it is visible (display sizes, pinned at 48) and Instrument Sans
 *      carries body prose, rather than running one serif at a compromise optical size.
 *
 *   3. SUBSET. Drop glyphs the site cannot render and OpenType features it does not use --
 *      JetBrains Mono's code ligatures alone are 18 KB of GSUB that would never fire here.
 *
 * Net: 332 KB -> ~107 KB across four faces. That is the difference between passing and
 * failing a mobile performance budget.
 *
 * Requires python3 with `fonttools` + `brotli`. Without them the script still runs and
 * emits the full latin faces, loudly.
 *
 * Run: npm run fonts   (only when a family, axis or glyph requirement changes)
 */
import { execFile } from 'node:child_process'
import { mkdir, writeFile, stat, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

/** Google's latin slice. The other subsets (cyrillic, greek, vietnamese) are dead weight. */
const LATIN = 'U+0000-00FF'

/**
 * Every codepoint the site can render. Latin-1 covers the umlaut in "Zurich"; the rest is
 * the typographic punctuation the copy and the figure labels actually use. Anything outside
 * this falls back to the system stack, which is correct behaviour, not a bug.
 */
const UNICODES = [
  'U+0020-007E', // basic latin
  'U+00A0-00FF', // latin-1 supplement: accents, x, division, degree, section
  'U+2010-2015', // hyphen, figure dash, en dash, em dash
  'U+2018-201A', // single quotes
  'U+201C-201E', // double quotes
  'U+2020-2022', // dagger, double dagger, bullet
  'U+2026', // ellipsis
  'U+2030', // per mille
  'U+2039-203A', // single guillemets
  'U+2044', // fraction slash
  'U+2190-2193', // arrows
  'U+2212', // true minus, not a hyphen
  'U+2248', // almost equal
  'U+2264-2265', // <=, >=
  'U+2713', // check
].join(',')

const FACES = [
  {
    file: 'Newsreader',
    query: 'Newsreader:opsz,wght@6..72,300..700',
    // Display only: the name, section heads, project titles. opsz 48 is where those live.
    axes: ['opsz=48', 'wght=300:700'],
    features: 'kern,liga,clig',
    css: { family: 'Newsreader', style: 'normal', weight: '300 700' },
  },
  {
    file: 'Newsreader-Italic',
    query: 'Newsreader:ital,opsz,wght@1,6..72,300..500',
    // A single static instance: italic appears only in pull quotes and the paper title.
    axes: ['opsz=28', 'wght=400'],
    features: 'kern,liga,clig',
    css: { family: 'Newsreader', style: 'italic', weight: '400' },
  },
  {
    file: 'InstrumentSans',
    query: 'Instrument+Sans:wdth,wght@75..100,400..700',
    // The width axis is never used; pinning it drops a whole set of deltas.
    axes: ['wdth=100'],
    features: 'kern,liga,clig,tnum',
    css: { family: 'Instrument Sans', style: 'normal', weight: '400 700' },
  },
  {
    file: 'JetBrainsMono',
    query: 'JetBrains+Mono:wght@400..700',
    axes: [],
    // No code ligatures: this site shows numbers and identifiers, not source to be read as code.
    features: 'kern,tnum',
    css: { family: 'JetBrains Mono', style: 'normal', weight: '400 700' },
  },
]

const FONT_DIR = join(process.cwd(), 'public', 'fonts')
const CSS_OUT = join(process.cwd(), 'src', 'styles', 'fonts.css')

/** Pull the @font-face blocks out of a Google Fonts stylesheet. */
function parseFaces(css) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
    range: body.match(/unicode-range:\s*([^;]+);/)?.[1].trim(),
    url: body.match(/url\((https:[^)]+\.woff2)\)/)?.[1],
  }))
}

const haveTooling = await run('python3', ['-c', 'import fontTools, brotli']).then(
  () => true,
  () => false,
)

const kb = async (p) => ((await stat(p)).size / 1024).toFixed(1).padStart(6)

await mkdir(FONT_DIR, { recursive: true })
if (!haveTooling) console.warn('! fonttools/brotli missing - shipping full latin faces\n')

const rules = []
let total = 0

for (const face of FACES) {
  const sheet = await fetch(
    `https://fonts.googleapis.com/css2?family=${face.query}&display=swap`,
    { headers: { 'User-Agent': UA } },
  ).then((r) => r.text())

  const src = parseFaces(sheet).find((f) => f.url && f.range?.includes(LATIN))
  if (!src) throw new Error(`no latin face resolved for ${face.file}`)

  const out = join(FONT_DIR, `${face.file}.woff2`)
  const raw = join(FONT_DIR, `.${face.file}.download`)
  const pinned = join(FONT_DIR, `.${face.file}.pinned`)

  await writeFile(raw, Buffer.from(await fetch(src.url).then((r) => r.arrayBuffer())))
  const before = await kb(raw)

  if (haveTooling) {
    let input = raw
    if (face.axes.length) {
      await run('python3', ['-m', 'fontTools.varLib.instancer', '-q', '-o', pinned, raw, ...face.axes])
      input = pinned
    }
    await run('python3', [
      '-m', 'fontTools.subset', input,
      `--output-file=${out}`,
      '--flavor=woff2',
      `--unicodes=${UNICODES}`,
      `--layout-features=${face.features}`,
      '--no-hinting',
      '--drop-tables+=DSIG',
    ])
    await rm(raw, { force: true })
    await rm(pinned, { force: true })
  } else {
    await run('mv', [raw, out])
  }

  const size = (await stat(out)).size
  total += size
  console.log(`${(face.file + '.woff2').padEnd(26)} ${before} KB -> ${(size / 1024).toFixed(1).padStart(6)} KB`)

  rules.push(
    [
      '@font-face {',
      `  font-family: '${face.css.family}';`,
      `  font-style: ${face.css.style};`,
      `  font-weight: ${face.css.weight};`,
      '  font-display: swap;',
      `  src: url('/fonts/${face.file}.woff2') format('woff2-variations');`,
      `  unicode-range: ${src.range};`,
      '}',
    ].join('\n'),
  )
}

await writeFile(
  CSS_OUT,
  `/* Generated by scripts/fonts.mjs -- do not edit by hand. */\n\n${rules.join('\n\n')}\n`,
)
console.log(`\n${rules.length} faces, ${(total / 1024).toFixed(1)} KB total -> src/styles/fonts.css`)
