import { Suspense, lazy } from 'react'

import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { education, profile, publication } from '../data/content'
import { useCv } from './CvDialog'

/**
 * The field is the single heaviest thing on the site, it is decorative, and it is invisible
 * until it has painted. So it is code-split and requested after the document is interactive:
 * first paint is type on ink, and the shader arrives underneath it a moment later.
 */
const IridescenceField = lazy(() => import('./figures/IridescenceField'))

/**
 * The hero illustration, at three widths.
 *
 * Files are named `portrait-<width>.webp` and picked up automatically, so replacing the
 * artwork means dropping in new files and touching nothing here. An empty folder is a
 * supported state: the hero falls back to a purely typographic composition.
 *
 * Three widths and not one: the plate renders at most 480 CSS px on a desktop and about
 * 270 on a phone, so a single 1200px file was sending a phone roughly four times the pixels
 * it could display -- and since this is the largest thing above the fold, it is the LCP
 * element, and that waste showed up directly as a slower LCP.
 */
type Source = { url: string; width: number }

/**
 * Responsive sources, when they exist. Files named `portrait-<width>.webp` become a srcset;
 * this matters because the illustration is the largest thing above the fold and therefore
 * an LCP candidate, and a single large raster costs real milliseconds on a phone that
 * displays it at ~270px.
 */
const SOURCES: Source[] = Object.entries(
  import.meta.glob('../assets/hero/portrait-*.webp', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
)
  .map(([path, url]) => ({ url, width: Number(path.match(/portrait-(\d+)\./)?.[1] ?? 0) }))
  .filter((s) => s.width > 0)
  .sort((a, b) => a.width - b.width)

/**
 * Any other single file in the folder is used as-is. That is the path a vector takes: an
 * SVG has no useful widths to enumerate and needs no srcset, because it is resolution
 * independent and costs a few kilobytes at any size.
 */
const SINGLE =
  Object.values(
    import.meta.glob('../assets/hero/*.{svg,png,webp,jpg,jpeg,avif}', {
      eager: true,
      query: '?url',
      import: 'default',
    }) as Record<string, string>,
  ).filter((url) => !/portrait-\d+\./.test(url))[0] ?? null

const ILLUSTRATION = SOURCES.at(-1)?.url ?? SINGLE
const SRCSET = SOURCES.length ? SOURCES.map((s) => `${s.url} ${s.width}w`).join(', ') : undefined

export function Hero() {
  const cv = useCv()
  const reduced = useReducedMotion()
  const { ref, inView } = useInView<HTMLElement>({ once: false, threshold: 0 })

  return (
    <header ref={ref} className="hero" data-hue="intro">
      {/* CSS ground. Always painted; the canvas layers over it, or does not, and either
          way the hero is never empty. */}
      <div className="hero__ground" aria-hidden="true" />

      <Suspense fallback={null}>
        <IridescenceField still={reduced} active={inView} />
      </Suspense>

      <div className="page hero__inner" data-illustrated={ILLUSTRATION ? 'true' : 'false'}>
        <div className="hero__col">
        <p className="meta hero__eyebrow">
          {education.institution} <span className="meta-accent">/</span> Computer Science{' '}
          <span className="meta-accent">/</span> {education.years}
        </p>

        <h1 className="hero__name">
          Anirudh
          <br />
          Garg
        </h1>

        <p className="hero__statement">
          I work on the parts of a program that are hard to see — bindings, aliases,
          environments, memory — and build the representations that make them analysable. A
          paper at OOPSLA came out of it. In September I start trading at Jump in Singapore.{' '}
          <span className="hero__aside">
            Off the clock: a bicycle, a squash court, a piano and a harmonica that needs a
            lot of effort still.
          </span>
        </p>

        <dl className="hero__facts">
          <div className="fact">
            <dt className="meta">Now</dt>
            <dd>
              Quantitative Trader at <strong>Jump Trading</strong>, Singapore
              <span className="fact__sub">from September 2026</span>
            </dd>
          </div>
          <div className="fact">
            <dt className="meta">Published</dt>
            <dd>
              <a href={publication.doiUrl}>IRIDIUM</a> at <strong>OOPSLA 2026</strong>
              <span className="fact__sub">PACMPL {publication.volume}</span>
            </dd>
          </div>
          <div className="fact">
            <dt className="meta">Before</dt>
            <dd>
              Scientific Assistant, <strong>ETH Zürich</strong>
              <span className="fact__sub">D-INFK, summer 2026</span>
            </dd>
          </div>
        </dl>

        <p className="hero__links">
          <button type="button" className="linklike" onClick={cv.open}>
            Curriculum vitae
          </button>
          <span aria-hidden="true">·</span>
          <a href={profile.links.github}>GitHub</a>
          <span aria-hidden="true">·</span>
          <a href={profile.links.linkedin}>LinkedIn</a>
        </p>
        </div>

        {ILLUSTRATION && (
          <div className="hero__plate">
            <img
              src={ILLUSTRATION}
              {...(SRCSET ? { srcSet: SRCSET } : {})}
              // Below 900px the plate is 68vw; above it, a fixed 30rem column.
              sizes="(max-width: 900px) 68vw, 30rem"
              alt="Line drawing of a desk. A window looks onto alpine peaks in one pane and a
                   harbour skyline in the other; beside it a pinned board of pages, one of them a
                   control-flow graph. On the desk, a stack of books, a mug, a laptop showing that
                   same graph, a harmonica and a printed paper. In front, a bicycle wheel, a squash
                   racket and the near end of a piano keyboard."
              className="hero__illustration"
              width={1024}
              height={1024}
              // The one image above the fold, and a likely LCP element. Eager and high
              // priority: lazy-loading something already in the viewport only delays it.
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        )}
      </div>

      <div className="hero__cue" aria-hidden="true">
        <span className="meta">Scroll</span>
        <span className="hero__cue-line" />
      </div>
    </header>
  )
}
