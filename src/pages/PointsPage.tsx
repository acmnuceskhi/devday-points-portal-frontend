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
    const [submissionTexts, setSubmissionTexts] = useState<Record<string, string>>({})
    const [activitySearch, setActivitySearch] = useState('')
    const [submittingActivityId, setSubmittingActivityId] = useState<string | null>(null)
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
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

    const selectedActivity = useMemo(
        () => activities.find((item) => item.id === selectedActivityId) || null,
        [activities, selectedActivityId],
    )

    const filteredActivities = useMemo(() => {
        const needle = activitySearch.trim().toLowerCase()
        if (!needle) return activities

        return activities.filter((item) => {
            return (
                item.name.toLowerCase().includes(needle) ||
                item.code.toLowerCase().includes(needle) ||
                item.activityTypeCode.toLowerCase().includes(needle) ||
                (item.description || '').toLowerCase().includes(needle)
            )
        })
    }, [activities, activitySearch])

    const onSubmitActivity = async (event: FormEvent, item: ActivityProgressItem) => {
        event.preventDefault()
        if (!accessToken) return

        const isLinkBased = item.activityTypeCode === 'LINK_BASED'
        const isCorrectAnswer = item.activityTypeCode === 'CORRECT_ANSWER'
        const textInput = (submissionTexts[item.id] || '').trim()
        const linkInput = (submissionLinks[item.id] || '').trim()

        if (isLinkBased && !linkInput) return
        if (!isLinkBased && !textInput) return

        try {
            setSubmittingActivityId(item.id)
            setSubmissionDialog({
                isOpen: true,
                status: 'loading',
                title: isCorrectAnswer ? 'Checking Answer' : 'Submitting Activity',
                detail: isCorrectAnswer
                    ? 'Please wait while we validate your answer...'
                    : 'Please wait while we submit your activity for review...',
            })
            await api.submitMyActivity(accessToken, {
                activityId: item.id,
                submissionLink: isLinkBased ? linkInput : undefined,
                submissionText: !isLinkBased && !isCorrectAnswer ? textInput : undefined,
                answerText: isCorrectAnswer ? textInput : undefined,
            })
            const activitiesData = await api.getMyActivityProgress(accessToken)
            setActivities(activitiesData)
            setSubmissionLinks((prev) => ({ ...prev, [item.id]: '' }))
            setSubmissionTexts((prev) => ({ ...prev, [item.id]: '' }))
            setSubmissionDialog({
                isOpen: true,
                status: 'success',
                title: isCorrectAnswer ? 'Answer Submitted' : 'Submission Sent',
                detail: isCorrectAnswer
                    ? 'Your answer has been checked. Refresh status shown in the activity card.'
                    : 'Your submission was sent successfully and is now pending admin review.',
            })
        } catch (error) {
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

    const openActivityDialog = (activityId: string) => {
        setSelectedActivityId(activityId)
    }

    const closeActivityDialog = () => {
        setSelectedActivityId(null)
    }

    if (loading) {
        return <div className="center-state">Loading points...</div>
    }

    if (errorMessage) {
        return <div className="error-banner">{errorMessage}</div>
    }

    return (
        <section className="stack">
            <h2>Simulation Score Grid</h2>

            <div className="grid two">
                <article className="card sim-panel">
                    <h3>Total Signal Score</h3>
                    <p style={{ fontSize: 34, fontWeight: 700 }}>{summary?.totalPoints ?? 0}</p>
                    <p className="muted tiny">
                        Last updated:{' '}
                        {summary?.updatedAt ? new Date(summary.updatedAt).toLocaleString() : 'No points yet'}
                    </p>
                </article>

                <article className="card sim-panel">
                    <h3>Mission Progress</h3>
                    <p className="muted">
                        Completed {completedCount} of {activities.length} operations
                    </p>
                </article>
            </div>

            <section className="stack">
                <h3>Operations Feed</h3>
                <input
                    value={activitySearch}
                    onChange={(event) => setActivitySearch(event.target.value)}
                    placeholder="Search operations by name, code, type, or description"
                />
                <div className="grid">
                    {filteredActivities.map((item) => {
                        const statusLabel = item.isCompleted
                            ? 'Completed'
                            : item.submissionStatus
                                ? `Submitted (${item.submissionStatus})`
                                : item.isActive
                                    ? 'Pending'
                                    : 'Inactive'

                        return (
                            <article key={item.id} className="card stack" style={{ minHeight: 170 }}>
                                <div className="section-head">
                                    <strong>{item.name}</strong>
                                    <span className="status">{statusLabel}</span>
                                </div>
                                <p className="muted tiny">{item.activityTypeCode}</p>
                                <p className="muted tiny">Points: {item.points}</p>
                                <button type="button" onClick={() => openActivityDialog(item.id)}>
                                    View Details
                                </button>
                            </article>
                        )
                    })}
                    {!filteredActivities.length ? (
                        <article className="card">
                            <p className="muted">No activities match your search.</p>
                        </article>
                    ) : null}
                </div>
            </section>

            {selectedActivity ? (
                <div className="admin-dialog-backdrop" role="presentation" onClick={closeActivityDialog}>
                    <div className="admin-dialog" role="dialog" aria-live="polite" onClick={(event) => event.stopPropagation()}>
                        <h3>{selectedActivity.name}</h3>
                        <p className="muted tiny">{selectedActivity.activityTypeCode}</p>
                        <p className="muted tiny">{selectedActivity.description || 'No description'}</p>
                        <div className="data-list compact">
                            <div>
                                <dt>Points</dt>
                                <dd>{selectedActivity.points}</dd>
                            </div>
                            <div>
                                <dt>Status</dt>
                                <dd>{selectedActivity.submissionStatus || (selectedActivity.isCompleted ? 'COMPLETED' : 'PENDING')}</dd>
                            </div>
                            <div>
                                <dt>Completed At</dt>
                                <dd>{selectedActivity.completedAt ? new Date(selectedActivity.completedAt).toLocaleString() : '-'}</dd>
                            </div>
                        </div>

                        {selectedActivity.activityTypeCode === 'LINK_BASED' ? (
                            <form className="actions-row" onSubmit={(event) => onSubmitActivity(event, selectedActivity)}>
                                <input
                                    type="url"
                                    value={submissionLinks[selectedActivity.id] || ''}
                                    onChange={(event) =>
                                        setSubmissionLinks((prev) => ({
                                            ...prev,
                                            [selectedActivity.id]: event.target.value,
                                        }))
                                    }
                                    placeholder="Submission URL"
                                    required
                                    disabled={!selectedActivity.isActive || selectedActivity.isCompleted || submittingActivityId === selectedActivity.id}
                                />
                                <button
                                    type="submit"
                                    disabled={!selectedActivity.isActive || selectedActivity.isCompleted || !((submissionLinks[selectedActivity.id] || '').trim()) || submittingActivityId === selectedActivity.id}
                                >
                                    {submittingActivityId === selectedActivity.id ? 'Submitting...' : 'Submit Link'}
                                </button>
                            </form>
                        ) : null}

                        {(selectedActivity.activityTypeCode === 'CORRECT_ANSWER' || selectedActivity.activityTypeCode === 'MANUAL_TEXT_SUBMISSION') ? (
                            <form className="stack" onSubmit={(event) => onSubmitActivity(event, selectedActivity)}>
                                <textarea
                                    value={submissionTexts[selectedActivity.id] || ''}
                                    onChange={(event) =>
                                        setSubmissionTexts((prev) => ({
                                            ...prev,
                                            [selectedActivity.id]: event.target.value,
                                        }))
                                    }
                                    placeholder={selectedActivity.activityTypeCode === 'CORRECT_ANSWER' ? 'Type your answer' : 'Type your submission text (max 300 chars)'}
                                    maxLength={300}
                                    rows={5}
                                    required
                                    disabled={!selectedActivity.isActive || selectedActivity.isCompleted || submittingActivityId === selectedActivity.id}
                                />
                                <div className="actions-row">
                                    <p className="tiny muted">{(submissionTexts[selectedActivity.id] || '').length}/300</p>
                                    <button
                                        type="submit"
                                        disabled={!selectedActivity.isActive || selectedActivity.isCompleted || !((submissionTexts[selectedActivity.id] || '').trim()) || submittingActivityId === selectedActivity.id}
                                    >
                                        {submittingActivityId === selectedActivity.id ? 'Submitting...' : (selectedActivity.activityTypeCode === 'CORRECT_ANSWER' ? 'Submit Answer' : 'Submit Text')}
                                    </button>
                                </div>
                            </form>
                        ) : null}

                        <button type="button" className="outline-button" onClick={closeActivityDialog}>
                            Close
                        </button>
                    </div>
                </div>
            ) : null}

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
