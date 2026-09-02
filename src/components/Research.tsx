import { lazy, Suspense, useState } from 'react'

import { flagship, publication, researchNotes } from '../data/content'
import { Section } from './Section'

const Figure = lazy(() => import('./figures/Figure'))

const FIGURE = {
  label:
    'Diagram in three stages. JavaScript source, where the binding, the environment and ' +
    'the temporal dead zone are invisible. The same program lowered into the IRI ' +
    'intermediate representation, where each is an explicit node. Then optimisation passes ' +
    'strike out four of the eight nodes — a folded constant, a TDZ barrier proved ' +
    'unnecessary, an unread binding and the environment that held it — and the remaining ' +
    'graph is emitted as executable code for QuickJS-NG.',
  caption: 'Source → IRI → QuickJS-NG · fold, TDZ removal, dead binding elimination',
}

/**
 * The publication, and the two smaller pieces of research beside it.
 *
 * IRIDIUM used to appear here as an abstract and again as the first entry under Selected
 * work, which made a reader meet it twice. The whole treatment now lives here: the
 * publication record, the engineering, and the figure. Selected work holds everything else.
 */
export function Research() {
  /**
   * Open by default, like the Selected work entries — the detail is the point, and a
   * recruiter who skims will not click. The toggle exists so a reader who has finished
   * with it can fold the section back to a citation.
   */
  const [open, setOpen] = useState(true)

  return (
    <Section id="research" index="01" label="Research" hue="research">
      <article className="paper">
        <p className="meta paper__venue">
          <span className="meta-accent">{publication.venueShort}</span> {publication.volume}{' '}
          <span className="paper__sep" aria-hidden="true">·</span>{' '}
          {publication.published}
        </p>

        <div className="paper__head">
          <h3 className="paper__title">
            <a href={publication.doiUrl}>{publication.title}</a>
          </h3>
          {/* A separate control rather than wrapping the title: the title is a link to the
              DOI and must stay one. */}
          <button
            type="button"
            className="paper__chevron-btn"
            aria-expanded={open}
            aria-controls="iridium-detail"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">
              {open ? 'Collapse' : 'Expand'} the IRIDIUM entry
            </span>
            <span className="spec__chevron" aria-hidden="true" />
          </button>
        </div>

        {/* Everything below the title folds away: citation, abstract, links, figure and
            prose. Collapsed, the entry is its venue line and its title. */}
        <div id="iridium-detail" className="paper__body" hidden={!open}>
          <ol className="paper__authors">
          {publication.authors.map((author) => (
            <li key={author.name} className={author.self ? 'is-self' : undefined}>
              <span className="paper__author-name">
                {'title' in author && author.title ? `${author.title} ` : ''}
                {author.name}
              </span>
              <span className="paper__affiliation">{author.affiliation}</span>
            </li>
          ))}
        </ol>

        <blockquote className="paper__abstract">
          <p>{publication.abstract}</p>
        </blockquote>

        <p className="paper__links">
          <a href={publication.doiUrl}>
            <span className="meta">DOI</span> {publication.doi}
          </a>
          <a href={publication.preprintUrl}>
            <span className="meta">PDF</span> Preprint
          </a>
        </p>

          {open && (
            <Suspense fallback={<div className="figure figure--placeholder" />}>
              <Figure figure={flagship.figure} label={FIGURE.label} caption={FIGURE.caption} />
            </Suspense>
          )}

          <div className="spec__prose paper__detail">
            <div className="spec__block">
              <h4 className="meta">The problem</h4>
              <p className="prose">{flagship.problem}</p>
            </div>
            <div className="spec__block">
              <h4 className="meta">What the work does</h4>
              <ul className="spec__list">
                {flagship.built.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="spec__block">
              <h4 className="meta">The trade</h4>
              <p className="prose">{flagship.tradeoff}</p>
            </div>
          </div>

          <p className="meta spec__context">
            {flagship.year} · {flagship.context}
          </p>
        </div>
      </article>

      <h3 className="work__more meta">Other research</h3>
      <ul className="index index--two">
        {researchNotes.map((note) => (
          <li key={note.title} className="index__item">
            <div className="index__head">
              <h4 className="index__title">{note.title}</h4>
              <span className="meta index__year">{note.year}</span>
            </div>
            <p className="index__context meta">{note.context}</p>
            <p className="index__blurb">{note.blurb}</p>
            <ul className="tags">
              {note.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            {note.links && (
              <ul className="spec__links">
                {note.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
