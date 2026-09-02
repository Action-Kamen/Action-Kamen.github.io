import { lazy, Suspense, useState } from 'react'

import { otherWork, specimens, type Specimen } from '../data/content'
import { Section } from './Section'

const Figure = lazy(() => import('./figures/Figure'))

const CAPTIONS: Partial<Record<Specimen['figure'], { label: string; caption: string }>> = {
  pointer: {
    label:
      'Diagram in three panels. A field of a hundred dots, one per hundred Tranco sites, ' +
      'with 89.2% marked as using eval and 25.5% as DOM-tainted. Then forty-two test cases ' +
      'across three vulnerability families feeding three tools — ESLint on AST rules, ' +
      'Semgrep on patterns, ODGen on a partial graph — all converging on a single shared ' +
      'cause, weak pointer analysis. Then the engine that answers it: a points-to graph, a ' +
      'copy-on-write clone in which one object is copied and two are shared, and a rolling ' +
      'XOR digest that repeats itself on the fourth round, marking the fixpoint.',
    caption: '10,000 sites → 3 tools, one shared cause → points-to, CoW clone, XOR fixpoint',
  },
  tiling: {
    label:
      'Diagram: two implementations of attention laid over one GPU memory hierarchy — SRAM ' +
      'at roughly 20 megabytes aggregate and 19 terabytes per second above HBM at 40 ' +
      'gigabytes and 1.5 terabytes per second, a ' +
      'thirteen-fold bandwidth gap. On the left, textbook attention writes the full N by N ' +
      'score matrix into HBM and crosses the bus four times, because at sequence length ' +
      '4096 one fp16 score matrix is 33 megabytes per head, while SRAM is 192 kilobytes ' +
      'per streaming multiprocessor. On the right, the tiled kernel ' +
      'never writes it: one block at a time is resident in SRAM with a running maximum, sum ' +
      'and accumulator, and only K, V and the output cross. A ledger below compares 40.3 ' +
      'against 4.4 gigabytes of memory traffic, and 66.6 against 75.2 billion floating-point operations — the ' +
      'thirteen per cent of extra arithmetic, recomputed in the backward pass, that buys ' +
      'the bandwidth back. The measurements are Dao et al.’s, not his.',
    caption:
      'Textbook vs tiled over one memory hierarchy · 9× less HBM traffic for 13% more arithmetic',
  },
  regime: {
    label:
      'Diagram with five rows on a shared time axis. A price path under a single fitted line ' +
      'and one pooled standard-deviation band. Absolute returns, showing volatility ' +
      'clustering. Then two volatility-ratio detectors at different bandwidths: a slow ' +
      'band, which catches two of the three ' +
      'true regime switches with a lag of eight bars and no false calls, and a fast band, ' +
      'which catches all three with a lag of four bars but fires four times ' +
      'on noise. A final row keeps only the calls both bands make, retaining two of the ' +
      'fast band’s seven ' +
      'and losing one genuine switch in the process. The series is simulated.',
    caption:
      'A slow and a fast volatility-ratio detector · confirming across both costs a real switch',
  },
}

function SpecimenEntry({ item, index, open }: { item: Specimen; index: number; open: boolean }) {
  const [expanded, setExpanded] = useState(open)
  const figure = CAPTIONS[item.figure]
  if (!figure) return null

  return (
    <article className="spec" data-expanded={expanded}>
      <h3 className="spec__head">
        {/*
          A real button toggling real content, not a div with a click handler. That buys
          keyboard operation, the correct role, and expanded state announced to a screen
          reader, for free.
        */}
        <button
          type="button"
          className="spec__toggle"
          aria-expanded={expanded}
          aria-controls={`spec-${item.id}`}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="meta spec__index">{String(index + 1).padStart(2, '0')}</span>
          <span className="spec__title">{item.title}</span>
          <span className="spec__kind meta">{item.kind}</span>
          <span className="spec__chevron" aria-hidden="true" />
        </button>
      </h3>

      <p className="spec__summary">{item.summary}</p>

      <div id={`spec-${item.id}`} className="spec__body" hidden={!expanded}>
        {/* The canvas only exists while the entry is open: a paused animation still costs
            a compositor layer, and four of them would cost four. */}
        {expanded && (
          <Suspense fallback={<div className="figure figure--placeholder" />}>
            <Figure figure={item.figure} label={figure.label} caption={figure.caption} />
          </Suspense>
        )}

        <div className="spec__prose">
          <div className="spec__block">
            <h4 className="meta">The problem</h4>
            <p className="prose">{item.problem}</p>
          </div>

          <div className="spec__block">
            <h4 className="meta">What I built</h4>
            <ul className="spec__list">
              {item.built.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="spec__block">
            <h4 className="meta">The trade</h4>
            <p className="prose">{item.tradeoff}</p>
          </div>
        </div>

        <div className="spec__foot">
          <ul className="tags">
            {item.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {item.links && (
            <ul className="spec__links">
              {item.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="meta spec__context">
          {item.year} · {item.context}
        </p>
      </div>
    </article>
  )
}

export function Work() {
  return (
    <Section id="work" index="02" label="Selected work" hue="work">
      <div className="specs">
        {/*
          Open by default, all of them.

          They were collapsed with only the first expanded, which reads as tidy and behaves
          badly: a visitor skimming a portfolio does not click, so three of the four best
          things on the site were invisible to most people who opened it. The toggle stays
          for anyone who wants to collapse the page down to an index -- but the default
          should show the work, not file it.
        */}
        {specimens.map((item, i) => (
          <SpecimenEntry key={item.id} item={item} index={i} open />
        ))}
      </div>

      <h3 className="work__more meta">Also</h3>
      <ul className="index">
        {otherWork.map((entry) => (
          <li key={entry.title} className="index__item">
            <div className="index__head">
              <h4 className="index__title">
                {entry.repo ? <a href={entry.repo}>{entry.title}</a> : entry.title}
              </h4>
              <span className="meta index__year">{entry.year}</span>
            </div>
            <p className="index__context meta">{entry.context}</p>
            <p className="index__blurb">{entry.blurb}</p>
            <ul className="tags">
              {entry.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  )
}
