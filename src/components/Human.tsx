import { human, profile } from '../data/content'
import { Mosaic } from './Mosaic'
import { Section } from './Section'
import signature from '../assets/signature.png'

export function Human() {
  return (
    <Section id="human" index="04" label="Off screen" hue="human">
      <div className="human">
        <div className="human__text">
          <p className="lead">{human.intro}</p>
          <p className="prose">{human.reading}</p>
          <p className="prose">{human.writing}</p>

          {/* His actual signature, lifted off the paper it was scanned on. A real artifact
              beats a typeface pretending to be one. */}
          <img
            className="signature"
            src={signature}
            alt=""
            width={520}
            height={166}
            loading="lazy"
            decoding="async"
          />

          <ul className="human__links">
            {profile.links.medium && (
              <li>
                <a href={profile.links.medium}>Writing on Medium</a>
                <span className="meta">essays, longer form</span>
              </li>
            )}
            <li>
              <a href={profile.links.instagram}>@numberfivespeaks</a>
              <span className="meta">musings</span>
            </li>
          </ul>
        </div>



        <div className="human__media">
          <Mosaic />
        </div>
      </div>
    </Section>
  )
}
