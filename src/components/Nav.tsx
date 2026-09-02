import { useEffect, useRef, useState } from 'react'

import { profile } from '../data/content'
import { useCv } from './CvDialog'
import { Overlay } from './Overlay'

const SECTIONS = [
  { id: 'research', label: 'Research', note: 'IRIDIUM, OOPSLA 2026' },
  { id: 'work', label: 'Selected work', note: 'Four projects, with the reasoning' },
  { id: 'experience', label: 'Experience', note: 'Jump, ETH Zürich, Via, Jane Street' },
  { id: 'human', label: 'Off screen', note: 'Cycling, squash, piano, writing' },
  { id: 'contact', label: 'Contact', note: 'Email and links' },
] as const

export function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState<string>('')
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const cv = useCv()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mark the section currently occupying the upper half of the viewport.
  useEffect(() => {
    const targets = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (!targets.length || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id)
      },
      { rootMargin: '-20% 0px -55% 0px' },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <nav className={`nav${scrolled ? ' nav--solid' : ''}`} aria-label="Primary">
        <div className="page nav__inner">
          <a href="#top" className="nav__mark" aria-label="Anirudh Garg — top of page">
            AG
          </a>

          <div className="nav__right">
            <button type="button" className="nav__cv" onClick={cv.open}>
              CV
            </button>
            <button
              ref={buttonRef}
              type="button"
              className="nav__toggle"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <span className="meta">Contents</span>
              <span className="nav__glyph" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/*
        A full-screen contents overlay, not a dropdown.

        It was a panel hanging off the header: it covered a third of the screen, the page
        showed through its backdrop-filter, and the document kept scrolling underneath. The
        overlay covers the viewport on an opaque ground, scrolls internally when it has to,
        and locks the page behind it.
      */}
      <Overlay open={open} onClose={close} label="Contents" className="overlay--nav">
        <div className="sheet">
          <header className="sheet__bar">
            <p className="meta">Contents</p>
            <button type="button" className="sheet__close" onClick={close}>
              <span className="meta">Close</span>
              <span className="sheet__x" aria-hidden="true" />
            </button>
          </header>

          <div className="sheet__body">
            <ol className="toc">
              {SECTIONS.map(({ id, label, note }, i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={close}
                    aria-current={current === id ? 'true' : undefined}
                  >
                    <span className="meta toc__num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="toc__label">{label}</span>
                    <span className="toc__note meta">{note}</span>
                  </a>
                </li>
              ))}
            </ol>

            <div className="toc__foot">
              <button type="button" className="toc__cv" onClick={() => { close(); cv.open() }}>
                Curriculum vitae
              </button>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <a href={profile.links.github ?? '#'}>GitHub</a>
              <a href={profile.links.linkedin}>LinkedIn</a>
            </div>
          </div>
        </div>
      </Overlay>
    </>
  )
}
