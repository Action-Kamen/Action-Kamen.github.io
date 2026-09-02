import { Contact } from './components/Contact'
import { CvProvider } from './components/CvDialog'
import { Experience } from './components/Experience'
import { Hero } from './components/Hero'
import { Human } from './components/Human'
import { Nav } from './components/Nav'
import { Research } from './components/Research'
import { Work } from './components/Work'

export function App() {
  return (
    <CvProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      {/* Sits above the content and below the nav, purely as surface texture. */}
      <div className="grain" aria-hidden="true" />
      <main id="main">
        <span id="top" />
        <Hero />
        <Research />
        <Work />
        <Experience />
        <Human />
        <Contact />
      </main>
    </CvProvider>
  )
}
