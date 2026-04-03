import type { TeamDetail } from '../types/api'

type TeamDetailModalProps = {
  item: TeamDetail | null
  loading: boolean
  errorMessage: string
  onClose: () => void
}

export function TeamDetailModal({ item, loading, errorMessage, onClose }: TeamDetailModalProps) {
  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-dialog team-modal" role="dialog" aria-live="polite" onClick={(event) => event.stopPropagation()}>
        <div className="team-modal-head">
          <h3 className="section-heading">{item?.name || 'Team Details'}</h3>
          <button type="button" className="outline-button" onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? <p className="muted">Loading team details...</p> : null}
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

        {!loading && !errorMessage && item ? (
          <>
            <section className="team-modal-grid" aria-label="Team detail summary">
              <article className="team-modal-card">
                <p>Mission</p>
                <strong>{item.competitionName || '-'}</strong>
              </article>
              <article className="team-modal-card">
                <p>Verification</p>
                <strong>
                  <span className={`competition-status-pill ${item.paymentStatus === 'Paid' ? 'is-verified' : ''}`}>
                    {item.paymentStatus}
                  </span>
                </strong>
              </article>
              <article className="team-modal-card">
                <p>Reference ID</p>
                <strong>{item.referenceId || '-'}</strong>
              </article>
              <article className="team-modal-card">
                <p>Payment Method</p>
                <strong>{item.paymentMethod || '-'}</strong>
              </article>
            </section>

            <section className="stack">
              <h4 className="section-heading">Team Members</h4>
              <div className="team-member-list">
                {item.members.map((member) => (
                  <article className="team-member-card" key={member.id}>
                    <div>
                      <p className="stream-title">
                        {member.fullName || 'Unknown'} {member.isLeader ? '(Leader)' : ''}
                      </p>
                      <p className="stream-subline">Joined: {new Date(member.joinedAt).toLocaleString()}</p>
                    </div>
                    <p className="objective-meta">Institution: {member.institution || '-'}</p>
                    <p className="objective-meta">Email: {member.email || '-'}</p>
                    <span className={`competition-status-pill ${member.isLeader ? 'is-verified' : ''}`}>
                      {member.isLeader ? 'Leader' : 'Member'}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
