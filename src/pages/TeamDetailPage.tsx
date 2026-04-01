import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { TeamDetail } from '../types/api'

export function TeamDetailPage() {
  const { teamId } = useParams()
  const { accessToken } = useAuth()
  const [item, setItem] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      if (!teamId || !accessToken) {
        setErrorMessage('Missing team id or session')
        setLoading(false)
        return
      }

      try {
        setErrorMessage('')
        const data = await api.getTeamDetail(teamId, accessToken)
        setItem(data)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load team')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [teamId, accessToken])

  if (loading) {
    return <div className="center-state">Loading team details...</div>
  }

  if (errorMessage) {
    return <div className="error-banner">{errorMessage}</div>
  }

  if (!item) {
    return <div className="center-state">Team not found.</div>
  }

  return (
    <section className="stack">
      <div className="section-head">
        <h2>{item.name}</h2>
        {item.competitionId ? (
          <Link className="link-button" to={`/competitions/${item.competitionId}`}>
            Open Mission
          </Link>
        ) : null}
      </div>

      <article className="card sim-panel">
        <p className="muted">Mission: {item.competitionName || '-'}</p>
        <p className="muted">Verification State: {item.paymentStatus}</p>
        <p className="muted">Reference ID: {item.referenceId || '-'}</p>
        <p className="muted">Payment Method: {item.paymentMethod || '-'}</p>
      </article>

      <h3>Squad Members</h3>
      <div className="grid">
        {item.members.map((member) => (
          <article className="card" key={member.id}>
            <h4>
              {member.fullName || 'Unknown'} {member.isLeader ? '(Leader)' : ''}
            </h4>
            <p className="muted">Institution: {member.institution || '-'}</p>
            <p className="muted">Email: {member.email || '-'}</p>
            <p className="muted">Joined: {new Date(member.joinedAt).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
