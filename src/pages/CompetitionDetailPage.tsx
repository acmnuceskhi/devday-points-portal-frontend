import { useEffect } from 'react'

const MODULES_URL = 'https://devday26.com/modules'

export function CompetitionDetailPage() {
  useEffect(() => {
    window.location.replace(MODULES_URL)
  }, [])

  return (
    <section className="stack">
      <article className="card sim-panel stack">
        <h2>Competition Detail Moved</h2>
        <p className="muted">Competition details are hosted on the official modules page.</p>
        <a className="link-button" href={MODULES_URL} target="_blank" rel="noreferrer">
          Open DevDay Modules
        </a>
      </article>
    </section>
  )
}
