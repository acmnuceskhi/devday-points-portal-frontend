import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { api } from '../lib/api'
import type { ActivityType, PointsAuditLog } from '../types/api'

export function AdminPointsPage() {
  const { accessToken, staffProfile, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [auditLogs, setAuditLogs] = useState<PointsAuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [newActivityCode, setNewActivityCode] = useState('')
  const [newActivityName, setNewActivityName] = useState('')
  const [newActivityDescription, setNewActivityDescription] = useState('')
  const [newActivityPoints, setNewActivityPoints] = useState('5')

  const [completionParticipantId, setCompletionParticipantId] = useState('')
  const [completionActivityTypeId, setCompletionActivityTypeId] = useState('')
  const [completionNote, setCompletionNote] = useState('')

  const [adjustParticipantId, setAdjustParticipantId] = useState('')
  const [adjustPointsDelta, setAdjustPointsDelta] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  useEffect(() => {
    async function loadAdminData() {
      if (!accessToken) {
        return
      }

      setLoading(true)
      setErrorMessage('')
      setMessage('')
      try {
        const [activityData, auditData] = await Promise.all([
          api.getAdminActivityTypes(accessToken, true),
          api.getAdminAuditLogs(accessToken, 30, 0),
        ])
        setActivities(activityData)
        setAuditLogs(auditData)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    void loadAdminData()
  }, [accessToken])

  const activityOptions = useMemo(
    () => activities.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
    [activities],
  )

  const onLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const onCreateActivity = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) return

    try {
      setErrorMessage('')
      setMessage('')
      await api.createAdminActivityType(accessToken, {
        code: newActivityCode.trim().toUpperCase(),
        name: newActivityName.trim(),
        description: newActivityDescription.trim() || undefined,
        points: Number(newActivityPoints),
        isActive: true,
      })
      const [activityData, auditData] = await Promise.all([
        api.getAdminActivityTypes(accessToken, true),
        api.getAdminAuditLogs(accessToken, 30, 0),
      ])
      setActivities(activityData)
      setAuditLogs(auditData)
      setNewActivityCode('')
      setNewActivityName('')
      setNewActivityDescription('')
      setNewActivityPoints('5')
      setMessage('Activity type created successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create activity type')
    }
  }

  const onMarkCompletion = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) return

    try {
      setErrorMessage('')
      setMessage('')
      await api.markAdminCompletion(accessToken, {
        participantId: completionParticipantId.trim(),
        activityTypeId: completionActivityTypeId.trim(),
        note: completionNote.trim() || undefined,
      })
      const auditData = await api.getAdminAuditLogs(accessToken, 30, 0)
      setAuditLogs(auditData)
      setCompletionNote('')
      setMessage('Completion marked successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not mark completion')
    }
  }

  const onAdjustPoints = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) return

    try {
      setErrorMessage('')
      setMessage('')
      await api.adjustAdminPoints(accessToken, {
        participantId: adjustParticipantId.trim(),
        pointsDelta: Number(adjustPointsDelta),
        reason: adjustReason.trim() || undefined,
      })
      const auditData = await api.getAdminAuditLogs(accessToken, 30, 0)
      setAuditLogs(auditData)
      setAdjustPointsDelta('')
      setAdjustReason('')
      setMessage('Points adjusted successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not adjust points')
    }
  }

  return (
    <section className="stack" style={{ width: 'min(1200px, calc(100% - 24px))', margin: '24px auto' }}>
      <div className="section-head">
        <h2>Admin Points Dashboard</h2>
        <div className="actions-row">
          <Link className="link-button" to="/">
            Participant Portal
          </Link>
          <button className="outline-button" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </div>

      <article className="card stack">
        <h3>Session</h3>
        <p className="muted tiny">
          Signed in as <strong>{staffProfile?.fullName || 'Admin'}</strong> ({staffProfile?.staffRole || 'STAFF'})
        </p>
        <p className="muted tiny">NU ID: {staffProfile?.nuId || '-'}</p>
      </article>

      {loading ? <div className="center-state">Loading admin data...</div> : null}
      {message ? <div className="card" style={{ color: '#0b5d58' }}>{message}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      {accessToken ? (
        <>
          <div className="grid two">
            <article className="card stack">
              <h3>Create Activity Type</h3>
              <form className="stack" onSubmit={onCreateActivity}>
                <input
                  value={newActivityCode}
                  onChange={(event) => setNewActivityCode(event.target.value)}
                  placeholder="Code (e.g. BOOTH_VISIT)"
                  required
                />
                <input
                  value={newActivityName}
                  onChange={(event) => setNewActivityName(event.target.value)}
                  placeholder="Name"
                  required
                />
                <input
                  value={newActivityDescription}
                  onChange={(event) => setNewActivityDescription(event.target.value)}
                  placeholder="Description (optional)"
                />
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={newActivityPoints}
                  onChange={(event) => setNewActivityPoints(event.target.value)}
                  placeholder="Points"
                  required
                />
                <button type="submit">Create Activity Type</button>
              </form>
            </article>

            <article className="card stack">
              <h3>Mark Completion</h3>
              <form className="stack" onSubmit={onMarkCompletion}>
                <input
                  value={completionParticipantId}
                  onChange={(event) => setCompletionParticipantId(event.target.value)}
                  placeholder="Participant ID"
                  required
                />
                <select
                  value={completionActivityTypeId}
                  onChange={(event) => setCompletionActivityTypeId(event.target.value)}
                  required
                >
                  <option value="">Select Activity Type</option>
                  {activityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={completionNote}
                  onChange={(event) => setCompletionNote(event.target.value)}
                  placeholder="Note (optional)"
                />
                <button type="submit">Mark Completion</button>
              </form>
            </article>
          </div>

          <article className="card stack">
            <h3>Manual Points Adjustment</h3>
            <form className="grid two" onSubmit={onAdjustPoints}>
              <input
                value={adjustParticipantId}
                onChange={(event) => setAdjustParticipantId(event.target.value)}
                placeholder="Participant ID"
                required
              />
              <input
                type="number"
                min={-1000}
                max={1000}
                value={adjustPointsDelta}
                onChange={(event) => setAdjustPointsDelta(event.target.value)}
                placeholder="Points Delta (non-zero)"
                required
              />
              <input
                value={adjustReason}
                onChange={(event) => setAdjustReason(event.target.value)}
                placeholder="Reason (optional)"
              />
              <button type="submit">Apply Adjustment</button>
            </form>
          </article>

          <article className="card table-wrap">
            <h3>Activity Types</h3>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.points}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card table-wrap">
            <h3>Recent Audit Logs</h3>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.actionType}</td>
                    <td>{log.targetType || '-'} / {log.targetId || '-'}</td>
                    <td>{log.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </>
      ) : null}
    </section>
  )
}
