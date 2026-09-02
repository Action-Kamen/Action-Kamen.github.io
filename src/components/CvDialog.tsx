import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { profile } from '../data/content'
import { Overlay } from './Overlay'

import page1 from '../assets/cv/page-1.webp'
import page2 from '../assets/cv/page-2.webp'

const PAGES = [page1, page2]

const CvContext = createContext<{ open: () => void }>({ open: () => {} })

/** Lets the nav, the hero and the contact section all open the same viewer. */
export const useCv = () => useContext(CvContext)

/**
 * Shows the CV instead of downloading it.
 *
 * The pages are rendered images rather than an embedded PDF on purpose. An <iframe> or
 * <embed> pointing at a PDF is unreliable exactly where it matters most — iOS Safari
 * frequently renders a blank frame or only the first page, and that is a large share of the
 * people who will open this. Images always display. The PDF itself is still one click away
 * for anyone who wants the real file.
 */
export function CvProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const value = useMemo(() => ({ open: () => setOpen(true) }), [])
  const close = useCallback(() => setOpen(false), [])

  return (
    <CvContext.Provider value={value}>
      {children}

      <Overlay open={open} onClose={close} label="Curriculum vitae" className="overlay--cv">
        <div className="sheet">
          <header className="sheet__bar">
            <p className="meta">Curriculum vitae</p>
            <div className="sheet__actions">
              <a href={profile.resume} download>
                Download PDF
              </a>
              <a href={profile.resume} target="_blank" rel="noreferrer">
                Open PDF
              </a>
              <button type="button" className="sheet__close" onClick={close}>
                <span className="meta">Close</span>
                <span className="sheet__x" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="sheet__body">
            <p className="meta sheet__hint">Scroll sideways to read · or download the PDF</p>
            {PAGES.map((src, i) => (
              <img
                key={src}
                className="cv-page"
                src={src}
                alt={`Curriculum vitae, page ${i + 1} of ${PAGES.length}`}
                width={1240}
                height={1754}
                // Only fetched when the viewer is opened, which is why the CV costs nothing
                // to the visitors who never ask for it.
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </Overlay>
    </CvContext.Provider>
  )
}
