import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { ActivityProgressItem, PointsSummary } from '../types/api'
import { TechLoader } from '../components/TechLoader'

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
    const [activeObjectiveTab, setActiveObjectiveTab] = useState<'main' | 'side'>('main')
    const [showCompletedMainOnly, setShowCompletedMainOnly] = useState(true)
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

    const sideMissionCompletedCount = useMemo(
        () => activities.filter((item) => !item.code.endsWith('_PARTICIPATION') && item.isCompleted).length,
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

    const mainObjectives = useMemo(
        () => filteredActivities.filter((item) => item.code.endsWith('_PARTICIPATION')),
        [filteredActivities],
    )

    const sideObjectives = useMemo(
        () => filteredActivities.filter((item) => !item.code.endsWith('_PARTICIPATION')),
        [filteredActivities],
    )

    const displayedMainObjectives = useMemo(
        () => (showCompletedMainOnly ? mainObjectives.filter((item) => item.isCompleted) : mainObjectives),
        [mainObjectives, showCompletedMainOnly],
    )

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
        return <TechLoader label="Loading signal score..." />
    }

    if (errorMessage) {
        return <div className="error-banner">{errorMessage}</div>
    }

    return (
        <section className="dashboard-shell stack">
            <header className="panel-header">
                <h2 className="page-heading">Simulation Score Grid</h2>
                <p className="muted tiny">Track your points and objective progress across the runtime.</p>
            </header>

            <section className="dashboard-metrics-strip" aria-label="Points metrics">
                <article className="metric-block">
                    <p>Total Signal Score</p>
                    <strong>{summary?.totalPoints ?? 0}</strong>
                </article>
                <article className="metric-block">
                    <p>Side Mission Progress</p>
                    <strong>{sideMissionCompletedCount}</strong>
                </article>
            </section>

            <section className="dashboard-panel stack">
                <div className="section-head objective-console-head">
                    <h3 className="section-heading">Objective Console</h3>
                    <input
                        value={activitySearch}
                        onChange={(event) => setActivitySearch(event.target.value)}
                        placeholder="Search objectives"
                        style={{ maxWidth: 280 }}
                    />
                </div>

                <div className="stack">
                    <div className="section-head">
                        <div className="objective-tabs" role="tablist" aria-label="Objective categories">
                            <button
                                type="button"
                                className={activeObjectiveTab === 'main' ? 'objective-tab active' : 'objective-tab'}
                                role="tab"
                                aria-selected={activeObjectiveTab === 'main'}
                                onClick={() => setActiveObjectiveTab('main')}
                            >
                                Main Objectives ({mainObjectives.length})
                            </button>
                            <button
                                type="button"
                                className={activeObjectiveTab === 'side' ? 'objective-tab active' : 'objective-tab'}
                                role="tab"
                                aria-selected={activeObjectiveTab === 'side'}
                                onClick={() => setActiveObjectiveTab('side')}
                            >
                                Side Objectives ({sideObjectives.length})
                            </button>
                        </div>
                        <label className="objective-mobile-filter" htmlFor="objective-category-select">
                            <span className="tiny muted">Objective Category</span>
                            <select
                                id="objective-category-select"
                                value={activeObjectiveTab}
                                onChange={(event) =>
                                    setActiveObjectiveTab(event.target.value === 'main' ? 'main' : 'side')
                                }
                            >
                                <option value="main">Main Objectives ({mainObjectives.length})</option>
                                <option value="side">Side Objectives ({sideObjectives.length})</option>
                            </select>
                        </label>
                        <p className="muted tiny">
                            {activeObjectiveTab === 'main'
                                ? 'Core participation checkpoints.'
                                : 'Optional and bonus mission tasks.'}
                        </p>
                    </div>

                    {activeObjectiveTab === 'main' ? (
                        <label className="toggle-row">
                            <input
                                type="checkbox"
                                checked={showCompletedMainOnly}
                                onChange={(event) => setShowCompletedMainOnly(event.target.checked)}
                            />
                            Completed main missions only
                        </label>
                    ) : null}

                    {activeObjectiveTab === 'main' ? (
                    <div className="objective-grid">
                        {displayedMainObjectives.map((item) => {
                            const statusLabel = item.isCompleted
                                ? 'Completed'
                                : item.submissionStatus
                                    ? `Submitted (${item.submissionStatus})`
                                    : item.isActive
                                        ? 'Pending'
                                        : 'Inactive'

                            return (
                                <article key={item.id} className="objective-row points-objective-row">
                                    <div>
                                        <p className="stream-title">{item.name}</p>
                                        <p className="objective-meta">{item.description || 'No description provided.'}</p>
                                    </div>
                                    <div>
                                        <p className="objective-meta">Points: {item.points}</p>
                                        <span className={`competition-status-pill ${item.isCompleted ? 'is-verified' : ''}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <button type="button" className="outline-button" onClick={() => openActivityDialog(item.id)}>
                                        Details
                                    </button>
                                </article>
                            )
                        })}
                        {!displayedMainObjectives.length ? <p className="muted">No completed main missions match your current filter.</p> : null}
                    </div>
                    ) : null}

                    {activeObjectiveTab === 'side' ? (
                    <div className="objective-grid">
                        {sideObjectives.map((item) => {
                            const statusLabel = item.isCompleted
                                ? 'Completed'
                                : item.submissionStatus
                                    ? `Submitted (${item.submissionStatus})`
                                    : item.isActive
                                        ? 'Pending'
                                        : 'Inactive'

                            return (
                                <article key={item.id} className="objective-row points-objective-row">
                                    <div>
                                        <p className="stream-title">{item.name}</p>
                                        <p className="objective-meta">{item.description || 'No description provided.'}</p>
                                    </div>
                                    <div>
                                        <p className="objective-meta">Points: {item.points}</p>
                                        <span className={`competition-status-pill ${item.isCompleted ? 'is-verified' : ''}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <button type="button" className="outline-button" onClick={() => openActivityDialog(item.id)}>
                                        Details
                                    </button>
                                </article>
                            )
                        })}
                        {!sideObjectives.length ? <p className="muted">No side objectives match your search.</p> : null}
                    </div>
                    ) : null}
                </div>
            </section>

            {selectedActivity ? (
                <div className="admin-dialog-backdrop" role="presentation" onClick={closeActivityDialog}>
                    <div className="admin-dialog" role="dialog" aria-live="polite" onClick={(event) => event.stopPropagation()}>
                        <h3>{selectedActivity.name}</h3>
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
