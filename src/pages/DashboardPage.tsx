import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { participant } = useAuth()

  return (
    <section className="stack">
      <h2>Profile Snapshot</h2>
      <div className="grid two">
        <article className="card">
          <h3>Identity</h3>
          <dl className="data-list">
            <div>
              <dt>Name</dt>
              <dd>{participant?.fullName || '-'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{participant?.email || '-'}</dd>
            </div>
            <div>
              <dt>CNIC</dt>
              <dd>{participant?.cnic || '-'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{participant?.phone || '-'}</dd>
            </div>
          </dl>
        </article>

        <article className="card">
          <h3>Academic Info</h3>
          <dl className="data-list">
            <div>
              <dt>Institution</dt>
              <dd>{participant?.institution || '-'}</dd>
            </div>
            <div>
              <dt>Roll Number</dt>
              <dd>{participant?.rollNumber || '-'}</dd>
            </div>
            <div>
              <dt>Participant ID</dt>
              <dd>{participant?.id || '-'}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{participant?.createdAt ? new Date(participant.createdAt).toLocaleString() : '-'}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  )
}
