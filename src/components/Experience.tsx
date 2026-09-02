import { achievements, education, experience, leadership, skills } from '../data/content'
import { Section } from './Section'

export function Experience() {
  return (
    <Section id="experience" index="03" label="Experience" hue="exp">
      <ol className="roles">
        {experience.map((role) => (
          <li key={`${role.org}-${role.start}`} className="role" data-incoming={role.incoming}>
            <div className="role__when">
              <span className="meta">
                {role.from}
                {role.to && role.to !== role.from ? ` – ${role.to}` : ''}
              </span>
              {role.incoming && <span className="role__badge meta">Incoming</span>}
            </div>

            <div className="role__what">
              <h3 className="role__org">{role.org}</h3>
              <p className="role__title">{role.title}</p>
              <p className="role__where meta">{role.where}</p>

              {role.notes.length > 0 && (
                <ul className="role__notes">
                  {role.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}

              {role.links && (
                <ul className="spec__links">
                  {role.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="edu">
        <h3 className="edu__degree">{education.degree}</h3>
        <p className="edu__minor">{education.minor}</p>
        <p className="edu__where">
          {education.institution} <span className="meta">· {education.years} · CPI {education.cpi}</span>
        </p>
      </div>

      {/* Deliberately a quiet strip of figures rather than a wall of medals. The numbers
          matter to some readers and mean nothing to others; neither group should have to
          scroll past a trophy case. */}
      <ul className="marks" aria-label="Selected examination and olympiad results">
        {achievements.map((a) => (
          <li key={a.label} className="mark">
            <span className="mark__figure">{a.figure}</span>
            <span className="mark__label">{a.label}</span>
            <span className="mark__detail meta">
              {a.detail} · {a.year}
            </span>
          </li>
        ))}
      </ul>

      <div className="split">
        <div>
          <h3 className="meta split__head">Leading and teaching</h3>
          <ul className="lead-list">
            {leadership.map((l) => (
              <li key={l.role}>
                <strong>{l.role}</strong>
                <span className="meta"> {l.org} · {l.period}</span>
                {l.note && <p className="lead-list__note">{l.note}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="meta split__head">Tools</h3>
          <dl className="skills">
            {skills.map((group) => (
              <div key={group.group} className="skills__row">
                <dt className="meta">{group.group}</dt>
                <dd>
                  <ul className="tags">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  )
}
