import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { exportElementAsImage } from '../lib/exportAsImage'
import type { ParticipantCompetition } from '../types/api'

export function MyCompetitionsPage() {
  const { accessToken } = useAuth()
  const [items, setItems] = useState<ParticipantCompetition[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    async function load() {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        setErrorMessage('')
        const data = await api.getMyCompetitions(accessToken)
        setItems(data)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load competitions')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [accessToken])

  const onExport = async () => {
    try {
      setExportError('')
      setExporting(true)
      await exportElementAsImage('my-competitions-export', 'simulation-missions')
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not export competitions snapshot.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="center-state">Loading your competitions...</div>
  }

  if (errorMessage) {
    return <div className="error-banner">{errorMessage}</div>
  }

  if (items.length === 0) {
    return <div className="center-state">You are not assigned to any teams yet.</div>
  }

  return (
    <section className="stack">
      <div className="section-head">
        <div>
          <h2>Mission Queue</h2>
          <p className="muted tiny">Live schedule from the simulation runtime.</p>
        </div>
        <button type="button" onClick={() => void onExport()} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Download Mission Snapshot'}
        </button>
      </div>
      {exportError ? <div className="error-banner">{exportError}</div> : null}

      <div className="grid" id="my-competitions-export">
        {items.map((item) => (
          <article key={`${item.teamId}-${item.competitionId}`} className="card sim-panel">
            <h3>{item.competitionName}</h3>
            <p className="muted">
              Squad: <strong>{item.teamName}</strong> {item.isLeader ? '(Leader Node)' : ''}
            </p>
            <p className="muted">
              Date: {new Date(item.compDay).toLocaleDateString()} | Time: {item.startTime || '-'} -{' '}
              {item.endTime || '-'}
            </p>
            <p className="muted">
              Venue:{' '}
              {item.venues?.length
                ? item.venues.map((venue) => venue.name).join(', ')
                : item.venueName || 'TBA'}
            </p>
            <p className="status">Verification State: {item.paymentStatus}</p>
            <div className="actions-row">
              <Link className="link-button" to={`/teams/${item.teamId}`}>
                Open Squad Profile
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
