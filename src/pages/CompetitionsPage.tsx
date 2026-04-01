import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Competition } from '../types/api'

export function CompetitionsPage() {
  const [items, setItems] = useState<Competition[]>([])
  const [activeOnly, setActiveOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setErrorMessage('')
        const data = await api.getCompetitions(activeOnly)
        setItems(data)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load competitions')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [activeOnly])

  return (
    <section className="stack">
      <div className="section-head">
        <div>
          <h2>Mission Grid</h2>
          <p className="muted tiny">Browse available mission nodes in the simulation map.</p>
        </div>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          Active nodes only
        </label>
      </div>

      {loading ? <div className="center-state">Syncing mission grid...</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      {!loading && !errorMessage ? (
        <div className="grid">
          {items.map((item) => (
            <article className="card sim-panel" key={item.id}>
              <h3>{item.name}</h3>
              <p className="muted">{item.description || 'No description available.'}</p>
              <p className="muted">Date: {new Date(item.compDay).toLocaleDateString()}</p>
              <p className="muted">
                Team Size: {item.minTeamSize || '-'} to {item.maxTeamSize || '-'}
              </p>
              <p className="status">
                Open slots: <strong>{item.availableSeats}</strong>
              </p>
              <Link className="link-button" to={`/competitions/${item.id}`}>
                Inspect Mission
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
