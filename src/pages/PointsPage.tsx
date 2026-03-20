import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { ActivityProgressItem, PointsSummary } from '../types/api'

type SubmissionDialogState = {
    isOpen: boolean
    status: 'loading' | 'success' | 'error'
    title: string
    detail: string
}

export function PointsPage() {
    const { accessToken } = useAuth()
    const [summary, setSummary] = useState<PointsSummary | null>(null)
    const [activities, setActivities] = useState<ActivityProgressItem[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [submissionLinks, setSubmissionLinks] = useState<Record<string, string>>({})
    const [submittingActivityId, setSubmittingActivityId] = useState<string | null>(null)
    const [submissionDialog, setSubmissionDialog] = useState<SubmissionDialogState>({
        isOpen: false,
        status: 'loading',
        title: '',
        detail: '',
    })

    useEffect(() => {
        async function load() {
            if (!accessToken) {
                setErrorMessage('Session expired. Please login again.')
                setLoading(false)
                return
            }

            try {
                setErrorMessage('')
                const [summaryData, activitiesData] = await Promise.all([
                    api.getMyPointsSummary(accessToken),
                    api.getMyActivityProgress(accessToken),
                ])

                setSummary(summaryData)
                setActivities(activitiesData)
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Could not load points data')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [accessToken])

    const completedCount = useMemo(
        () => activities.filter((item) => item.isCompleted).length,
        [activities],
    )

    const onSubmitLink = async (event: FormEvent, activityId: string) => {
        event.preventDefault()
        if (!accessToken) return

        const link = (submissionLinks[activityId] || '').trim()
        if (!link) return

        try {
            setSubmittingActivityId(activityId)
            setSubmissionDialog({
                isOpen: true,
                status: 'loading',
                title: 'Submitting Link',
                detail: 'Please wait while we submit your activity link for review...',
            })
            await api.submitMyActivityLink(accessToken, {
                activityId,
                submissionLink: link,
            })
            const activitiesData = await api.getMyActivityProgress(accessToken)
            setActivities(activitiesData)
            setSubmissionLinks((prev) => ({ ...prev, [activityId]: '' }))
            setSubmissionDialog({
                isOpen: true,
                status: 'success',
                title: 'Submission Sent',
                detail: 'Your link was submitted successfully and is now pending admin review.',
            })
        } catch (error) {
            setSubmitMessage(error instanceof Error ? error.message : 'Submission failed')
            setSubmissionDialog({
                isOpen: true,
                status: 'error',
                title: 'Submission Failed',
                detail: error instanceof Error ? error.message : 'Could not submit your link. Please try again.',
            })
        } finally {
            setSubmittingActivityId(null)
        }
    }

    const closeSubmissionDialog = () => {
        if (submissionDialog.status === 'loading') return
        setSubmissionDialog((prev) => ({ ...prev, isOpen: false }))
    }

    if (loading) {
        return <div className="center-state">Loading points...</div>
    }

    if (errorMessage) {
        return <div className="error-banner">{errorMessage}</div>
    }

    return (
        <section className="stack">
            <h2>Your Points</h2>

            <div className="grid two">
                <article className="card">
                    <h3>Total Points</h3>
                    <p style={{ fontSize: 34, fontWeight: 700 }}>{summary?.totalPoints ?? 0}</p>
                    <p className="muted tiny">
                        Last updated:{' '}
                        {summary?.updatedAt ? new Date(summary.updatedAt).toLocaleString() : 'No points yet'}
                    </p>
                </article>

                <article className="card">
                    <h3>Activity Progress</h3>
                    <p className="muted">
                        Completed {completedCount} of {activities.length} activities
                    </p>
                </article>
            </div>

            <section className="stack">
                <h3>Your Activities</h3>
                <div className="grid">
                    {activities.map((item) => {
                        const isLinkBased = item.activityTypeCode === 'LINK_BASED'
                        const statusLabel = item.isCompleted
                            ? 'Completed'
                            : item.submissionStatus
                                ? `Submitted (${item.submissionStatus})`
                                : item.isActive
                                    ? 'Pending'
                                    : 'Inactive'

                        return (
                            <details key={item.id} className="card">
                                <summary className="section-head" style={{ cursor: 'pointer', listStyle: 'none' }}>
                                    <strong>{item.name}</strong>
                                    <span className="status">{statusLabel}</span>
                                </summary>

                                <div className="data-list compact">
                                    <div>
                                        <dt>Points</dt>
                                        <dd>{item.points}</dd>
                                    </div>
                                    <div>
                                        <dt>Type</dt>
                                        <dd>{item.activityTypeCode}</dd>
                                    </div>
                                    <div>
                                        <dt>Completed At</dt>
                                        <dd>{item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}</dd>
                                    </div>
                                    <div>
                                        <dt>Submission Status</dt>
                                        <dd>{item.submissionStatus || '-'}</dd>
                                    </div>
                                </div>

                                {item.description ? <p className="muted tiny">{item.description}</p> : null}

                                {isLinkBased ? (
                                    <div className="stack">
                                        <form className="actions-row" onSubmit={(event) => onSubmitLink(event, item.id)}>
                                            <input
                                                type="url"
                                                value={submissionLinks[item.id] || ''}
                                                onChange={(event) =>
                                                    setSubmissionLinks((prev) => ({
                                                        ...prev,
                                                        [item.id]: event.target.value,
                                                    }))
                                                }
                                                placeholder="Submission URL"
                                                required
                                                disabled={!item.isActive || item.isCompleted || submittingActivityId === item.id}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!item.isActive || item.isCompleted || !((submissionLinks[item.id] || '').trim()) || submittingActivityId === item.id}
                                            >
                                                {submittingActivityId === item.id ? 'Submitting...' : 'Submit Link'}
                                            </button>
                                        </form>
                                        <p className="tiny muted">
                                            Latest submission link: {item.submittedLink ? <a href={item.submittedLink} target="_blank" rel="noreferrer">Open</a> : '-'}
                                        </p>
                                        <p className="tiny muted">
                                            Approved evidence: {item.approvedSubmissionLink ? <a href={item.approvedSubmissionLink} target="_blank" rel="noreferrer">Open</a> : '-'}
                                        </p>
                                        <p className="tiny muted">
                                            Submitted at: {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '-'}
                                        </p>
                                    </div>
                                ) : null}
                            </details>
                        )
                    })}
                </div>
            </section>

            {submissionDialog.isOpen ? (
                <div className="admin-dialog-backdrop" role="presentation">
                    <div className="admin-dialog" role="dialog" aria-live="polite" aria-busy={submissionDialog.status === 'loading'}>
                        <h3>{submissionDialog.title}</h3>
                        <p className="muted">{submissionDialog.detail}</p>
                        {submissionDialog.status === 'loading' ? <div className="admin-spinner" /> : null}
                        {submissionDialog.status === 'success' ? <p className="status">Submission completed successfully.</p> : null}
                        {submissionDialog.status === 'error' ? <p className="error-banner">Submission failed.</p> : null}
                        <button type="button" onClick={closeSubmissionDialog} disabled={submissionDialog.status === 'loading'}>
                            {submissionDialog.status === 'loading' ? 'Submitting...' : 'Close'}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
