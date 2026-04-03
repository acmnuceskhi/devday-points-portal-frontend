import { useEffect } from 'react'

const MODULES_URL = 'https://devday26.com/modules'

export function CompetitionsPage() {
  useEffect(() => {
    window.location.replace(MODULES_URL)
  }, [])

  return (
    <section className="stack">
      <article className="card sim-panel stack">
        <h2>Competition Information Moved</h2>
        <p className="muted">Redirecting you to the official modules page for competition details.</p>
        <a className="link-button" href={MODULES_URL} target="_blank" rel="noreferrer">
          Open DevDay Modules
        </a>
      </article>
    </section>
  )
}
