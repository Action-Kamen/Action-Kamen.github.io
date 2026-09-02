import { profile } from '../data/content'
import { useCv } from './CvDialog'
import { Section } from './Section'

export function Contact() {
  const cv = useCv()

  return (
    <Section id="contact" index="05" label="Contact" hue="contact">
      <p className="contact__lead display">
        Best by email. I read everything, and I answer things that are actually about the work.
      </p>

      {/*
        Rendered plainly, on purpose.

        This was briefly an anti-scraper trick that reversed the address in the DOM and
        flipped it back with `unicode-bidi: bidi-override`. It rendered as
        "gmail.com@anirudhgarg.iitb" -- rtl reverses the order of the inline boxes as well
        as the glyphs inside them -- and copying it produced nonsense. It was also
        defending against nothing: this is a client-rendered app, so the served HTML holds
        no address at all and a scraper that does not run JavaScript finds none.
        An address that must be correct when read, copied and spoken does not get to be
        clever.
      */}
      <p className="contact__mail">
        <a href={`mailto:${profile.email}`} className="mailto">
          {profile.email}
        </a>
      </p>

      <ul className="contact__links">
        <li>
          <a href={profile.links.github}>GitHub</a>
          <span className="meta">Action-Kamen</span>
        </li>
        <li>
          <a href={profile.links.linkedin}>LinkedIn</a>
          <span className="meta">anirudh-garg</span>
        </li>
        <li>
          <button type="button" className="linklike" onClick={cv.open}>
            Curriculum vitae
          </button>
          <span className="meta">read here, or download</span>
        </li>
      </ul>

      {/*
        A colophon, because this site is a work sample and the reader may reasonably want
        to know how it was made.
      */}
      <footer className="colophon">
        <p className="meta">
          Set in Newsreader and Instrument Sans, with JetBrains Mono for figures — vendored,
          instanced and subset to 107 KB. The hero evaluates thin-film interference in a
          hand-written WebGL2 fragment shader; the project figures are canvas 2D. No UI
          framework beyond React, no CSS framework, no analytics, no cookies. Built with
          Vite, deployed to GitHub Pages.
        </p>
        <p className="meta colophon__year">© {new Date().getFullYear()} Anirudh Garg</p>
      </footer>
    </Section>
  )
}
