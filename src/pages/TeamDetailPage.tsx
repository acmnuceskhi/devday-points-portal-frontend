import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
    <section className="dashboard-shell stack">
      <div className="section-head">
        <div className="panel-header">
          <h2 className="panel-title">{item.name}</h2>
          <p className="muted tiny">Squad profile and payment verification state.</p>
        </div>
        {item.competitionId ? (
          <a className="link-button" href="https://devday26.com/modules" target="_blank" rel="noreferrer">
            Open Modules Info
          </a>
        ) : null}
      </div>

      <section className="dashboard-metrics-strip" aria-label="Team metrics">
        <article className="metric-block">
          <p>Mission</p>
          <strong>{item.competitionName || '-'}</strong>
        </article>
        <article className="metric-block">
          <p>Verification</p>
          <strong>
            <span className={`competition-status-pill ${item.paymentStatus === 'Paid' ? 'is-verified' : ''}`}>
              {item.paymentStatus}
            </span>
          </strong>
        </article>
        <article className="metric-block">
          <p>Reference ID</p>
          <strong>{item.referenceId || '-'}</strong>
        </article>
        <article className="metric-block">
          <p>Payment Method</p>
          <strong>{item.paymentMethod || '-'}</strong>
        </article>
      </section>

      <section className="dashboard-panel stack">
      <h3 className="panel-title">Squad Members</h3>
      <div className="stream-list">
        {item.members.map((member) => (
          <article className="stream-row" key={member.id}>
            <div>
              <p className="stream-title">
                {member.fullName || 'Unknown'} {member.isLeader ? '(Leader)' : ''}
              </p>
              <p className="stream-subline">Joined: {new Date(member.joinedAt).toLocaleString()}</p>
            </div>
            <p className="mission-team">{member.institution || '-'}</p>
            <p className="mission-venue">{member.email || '-'}</p>
            <span className={`competition-status-pill ${member.isLeader ? 'is-verified' : ''}`}>
              {member.isLeader ? 'Leader' : 'Member'}
            </span>
          </article>
        ))}
      </div>
      </section>
    </section>
  )
}
