import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { api } from '../lib/api'
import type {
    ActivityKind,
    ActivitySubmission,
    ActivityType,
    AdminParticipantDetail,
    PointsAuditLog,
    PointsLeaderboardItem,
    RankingItem,
} from '../types/api'

type AdminTab = 'participant-workflow' | 'activities' | 'audit'

type ParticipantWorkflowTab =
    | 'participant-info'
    | 'competitions'
    | 'mark-completion'
    | 'adjust-points'
    | 'submissions'
    | 'completed-activities'

type ParticipantLookup = {
    participantId: string
    fullName: string
    institution: string | null
}

type ActionDialogState = {
    isOpen: boolean
    title: string
    status: 'loading' | 'success' | 'error'
    detail: string
}

const PARTICIPANT_LOOKUP_LIMIT = 100

export function AdminPointsPage() {
    const { accessToken, staffProfile, logout } = useAdminAuth()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState<AdminTab>('participant-workflow')
    const [activeParticipantWorkflowTab, setActiveParticipantWorkflowTab] = useState<ParticipantWorkflowTab>('participant-info')
    const [participants, setParticipants] = useState<ParticipantLookup[]>([])
    const [activities, setActivities] = useState<ActivityType[]>([])
    const [activityKinds, setActivityKinds] = useState<ActivityKind[]>([])
    const [auditLogs, setAuditLogs] = useState<PointsAuditLog[]>([])
    const [selectedParticipantId, setSelectedParticipantId] = useState('')
    const [participantDetail, setParticipantDetail] = useState<AdminParticipantDetail | null>(null)
    const [participantDetailLoading, setParticipantDetailLoading] = useState(false)
    const [participantDetailError, setParticipantDetailError] = useState('')

    const [participantSearch, setParticipantSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [initialLoadError, setInitialLoadError] = useState('')
    const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({})

    const [newActivityCode, setNewActivityCode] = useState('')
    const [newActivityName, setNewActivityName] = useState('')
    const [newActivityDescription, setNewActivityDescription] = useState('')
    const [newActivityPoints, setNewActivityPoints] = useState('5')
    const [newActivityTypeId, setNewActivityTypeId] = useState('')
    const [newActivityCorrectAnswer, setNewActivityCorrectAnswer] = useState('')

    const [completionActivityId, setCompletionActivityId] = useState('')
    const [completionNote, setCompletionNote] = useState('')

    const [adjustPointsDelta, setAdjustPointsDelta] = useState('')
    const [adjustReason, setAdjustReason] = useState('')

    const [dialogState, setDialogState] = useState<ActionDialogState>({
        isOpen: false,
        title: '',
        status: 'loading',
        detail: '',
    })

    const openActionDialog = (title: string, detail = 'Please wait while we process your request...') => {
        setDialogState({ isOpen: true, title, status: 'loading', detail })
    }

    const showActionSuccess = (title: string, detail: string) => {
        setDialogState({ isOpen: true, title, status: 'success', detail })
    }

    const showActionError = (title: string, detail: string) => {
        setDialogState({ isOpen: true, title, status: 'error', detail })
    }

    const closeDialog = () => {
        if (dialogState.status === 'loading') return
        setDialogState((prev) => ({ ...prev, isOpen: false }))
    }

    const toParticipantLookup = (items: Array<RankingItem | PointsLeaderboardItem>): ParticipantLookup[] => {
        const lookup = new Map<string, ParticipantLookup>()
        for (const item of items) {
            if (!lookup.has(item.participantId)) {
                lookup.set(item.participantId, {
                    participantId: item.participantId,
                    fullName: item.fullName,
                    institution: item.institution,
                })
            }
        }

        return Array.from(lookup.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
    }

    const refreshGlobalData = async () => {
        if (!accessToken) return

        const [activityData, kindsData, auditData, rankingsResult, leaderboardResult] = await Promise.all([
            api.getAdminActivityTypes(accessToken, true),
            api.getAdminActivityKinds(accessToken),
            api.getAdminAuditLogs(accessToken, 30, 0),
            api.getRankings(PARTICIPANT_LOOKUP_LIMIT, 0),
            api.getPointsLeaderboard(PARTICIPANT_LOOKUP_LIMIT, 0),
        ])

        setActivities(activityData)
        setActivityKinds(kindsData)
        setAuditLogs(auditData)
        setParticipants(toParticipantLookup([...rankingsResult.items, ...leaderboardResult.items]))

        if (!newActivityTypeId && kindsData[0]) {
            setNewActivityTypeId(kindsData[0].id)
        }
    }

    const refreshParticipantDetails = async (participantId: string) => {
        if (!accessToken || !participantId) {
            setParticipantDetail(null)
            setParticipantDetailError('')
            return
        }

        const detail = await api.getAdminParticipantDetails(accessToken, participantId)
        const pending = await api.getAdminPendingSubmissions(accessToken, participantId)
        setParticipantDetail({ ...detail, pendingSubmissions: pending })
    }

    useEffect(() => {
        async function load() {
            if (!accessToken) return

            setLoading(true)
            setInitialLoadError('')
            try {
                await refreshGlobalData()
            } catch (error) {
                setInitialLoadError(error instanceof Error ? error.message : 'Failed to load admin data')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [accessToken])

    useEffect(() => {
        if (!selectedParticipantId) {
            setParticipantDetail(null)
            setParticipantDetailError('')
            setParticipantDetailLoading(false)
            return
        }

        let isCurrent = true

        const run = async () => {
            setParticipantDetailLoading(true)
            setParticipantDetailError('')
            try {
                await refreshParticipantDetails(selectedParticipantId)
            } catch (error) {
                if (!isCurrent) return
                setParticipantDetail(null)
                setParticipantDetailError(error instanceof Error ? error.message : 'Could not load participant details')
            } finally {
                if (isCurrent) {
                    setParticipantDetailLoading(false)
                }
            }
        }

        void run()

        return () => {
            isCurrent = false
        }
    }, [accessToken, selectedParticipantId])

    const filteredParticipants = useMemo(() => {
        const needle = participantSearch.trim().toLowerCase()
        if (!needle) return participants.slice(0, 20)

        return participants
            .filter((item) => {
                return (
                    item.fullName.toLowerCase().includes(needle) ||
                    (item.institution || '').toLowerCase().includes(needle) ||
                    item.participantId.toLowerCase().includes(needle)
                )
            })
            .slice(0, 30)
    }, [participantSearch, participants])

    const activityOptions = useMemo(
        () => activities.map((item) => ({ value: item.id, label: `${item.code} - ${item.name} (${item.activityTypeCode})` })),
        [activities],
    )

    const selectedNewActivityKind = useMemo(
        () => activityKinds.find((kind) => kind.id === newActivityTypeId) || null,
        [activityKinds, newActivityTypeId],
    )

    const selectedParticipant = useMemo(
        () => participants.find((item) => item.participantId === selectedParticipantId) || null,
        [participants, selectedParticipantId],
    )

    const onLogout = () => {
        logout()
        navigate('/admin/login', { replace: true })
    }

    const onCreateActivity = async (event: FormEvent) => {
        event.preventDefault()
        if (!accessToken) return

        try {
            openActionDialog('Creating Activity')
            await api.createAdminActivityType(accessToken, {
                code: newActivityCode.trim().toUpperCase(),
                name: newActivityName.trim(),
                description: newActivityDescription.trim() || undefined,
                points: Number(newActivityPoints),
                activityTypeId: newActivityTypeId,
                correctAnswerCanonical:
                    selectedNewActivityKind?.code === 'CORRECT_ANSWER'
                        ? (newActivityCorrectAnswer.trim() || undefined)
                        : undefined,
                isActive: true,
            })
            await refreshGlobalData()
            setNewActivityCode('')
            setNewActivityName('')
            setNewActivityDescription('')
            setNewActivityPoints('5')
            setNewActivityCorrectAnswer('')
            showActionSuccess('Activity Created', 'Activity was created successfully.')
        } catch (error) {
            showActionError('Could Not Create Activity', error instanceof Error ? error.message : 'Create failed')
        }
    }

    const onMarkCompletion = async (event: FormEvent) => {
        event.preventDefault()
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Marking Completion')
            await api.markAdminCompletion(accessToken, {
                participantId: selectedParticipantId,
                activityId: completionActivityId,
                note: completionNote.trim() || undefined,
            })
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            setCompletionNote('')
            showActionSuccess('Completion Marked', 'Points have been granted to the participant.')
        } catch (error) {
            showActionError('Could Not Mark Completion', error instanceof Error ? error.message : 'Completion failed')
        }
    }

    const onAdjustPoints = async (event: FormEvent) => {
        event.preventDefault()
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Applying Points Adjustment')
            await api.adjustAdminPoints(accessToken, {
                participantId: selectedParticipantId,
                pointsDelta: Number(adjustPointsDelta),
                reason: adjustReason.trim() || undefined,
            })
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            setAdjustPointsDelta('')
            setAdjustReason('')
            showActionSuccess('Points Updated', 'Points adjustment completed.')
        } catch (error) {
            showActionError('Could Not Adjust Points', error instanceof Error ? error.message : 'Adjustment failed')
        }
    }

    const onRevokeCompletion = async (completionId: string) => {
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Reversing Completion')
            await api.revokeAdminCompletion(accessToken, completionId, 'Reversed by admin review')
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            showActionSuccess('Completion Reversed', 'Completion and points were reverted and logged.')
        } catch (error) {
            showActionError('Could Not Reverse Completion', error instanceof Error ? error.message : 'Reversal failed')
        }
    }

    const onApproveSubmission = async (submission: ActivitySubmission) => {
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Approving Submission')
            await api.approveAdminSubmission(accessToken, submission.id, submissionNotes[submission.id]?.trim() || undefined)
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            showActionSuccess('Submission Approved', 'Submission approved and points awarded.')
        } catch (error) {
            showActionError('Could Not Approve Submission', error instanceof Error ? error.message : 'Approval failed')
        }
    }

    const onRejectSubmission = async (submission: ActivitySubmission) => {
        if (!accessToken || !selectedParticipantId) return

        try {
            openActionDialog('Rejecting Submission')
            await api.rejectAdminSubmission(accessToken, submission.id, submissionNotes[submission.id]?.trim() || 'Rejected by admin')
            await refreshParticipantDetails(selectedParticipantId)
            await refreshGlobalData()
            showActionSuccess('Submission Rejected', 'Submission has been rejected and logged.')
        } catch (error) {
            showActionError('Could Not Reject Submission', error instanceof Error ? error.message : 'Rejection failed')
        }
    }

    return (
        <section className="stack admin-workspace" style={{ width: 'min(1260px, calc(100% - 24px))', margin: '20px auto' }}>
            <div className="section-head admin-hero">
                <div className="actions-row portal-title-wrap">
                    <img
                        src="/devday-logo.png"
                        alt="DevDay logo"
                        className="portal-heading-logo"
                        style={{ width: 52, height: 72, objectFit: 'contain' }}
                    />
                    <div className="portal-title-block">
                        <p className="eyebrow">DEVDAY '26</p>
                        <h2 className="admin-title-main">Admin Panel</h2>
                        <p className="muted tiny">
                            Signed in as <strong>{staffProfile?.fullName || 'Admin'}</strong> ({staffProfile?.staffRole || 'STAFF'})
                        </p>
                    </div>
                </div>
                <div className="actions-row">
                    <Link className="link-button" to="/">
                        Participant Portal
                    </Link>
                    <button className="outline-button" onClick={onLogout} type="button">
                        Logout
                    </button>
                </div>
            </div>

            {loading ? <div className="center-state">Loading admin data...</div> : null}
            {initialLoadError ? <div className="error-banner">{initialLoadError}</div> : null}

            <div className="admin-subtabs" role="tablist" aria-label="Admin workflows">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'participant-workflow'}
                    className={`admin-subtab ${activeTab === 'participant-workflow' ? 'active' : ''}`}
                    onClick={() => setActiveTab('participant-workflow')}
                >
                    Participant Workflow
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'activities'}
                    className={`admin-subtab ${activeTab === 'activities' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activities')}
                >
                    Activities
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'audit'}
                    className={`admin-subtab ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit')}
                >
                    Audit Logs
                </button>
            </div>

            {activeTab === 'participant-workflow' ? (
                <div className="admin-layout">
                    <aside className="card admin-left-panel stack">
                        <div className="section-head">
                            <h3>Participants</h3>
                            <p className="muted tiny">Search and select</p>
                        </div>
                        <input
                            value={participantSearch}
                            onChange={(event) => setParticipantSearch(event.target.value)}
                            placeholder="Search by name, institution, or id"
                        />
                        <div className="participant-search-results">
                            {filteredParticipants.map((item) => (
                                <button
                                    key={item.participantId}
                                    type="button"
                                    className={`participant-item ${selectedParticipantId === item.participantId ? 'selected' : ''}`}
                                    aria-pressed={selectedParticipantId === item.participantId}
                                    onClick={() => setSelectedParticipantId(item.participantId)}
                                >
                                    <span>
                                        <strong>{item.fullName}</strong>
                                        <small>{item.institution || 'No institution'}</small>
                                    </span>
                                    {selectedParticipantId === item.participantId ? (
                                        <span className="selection-badge">Selected</span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="stack admin-right-panel">
                        <div className="admin-subtabs admin-inner-subtabs" role="tablist" aria-label="Participant workflow sections">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'participant-info'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'participant-info' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('participant-info')}
                            >
                                Participant Info
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'competitions'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'competitions' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('competitions')}
                            >
                                Competitions
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'mark-completion'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'mark-completion' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('mark-completion')}
                            >
                                Mark Completion
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'adjust-points'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'adjust-points' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('adjust-points')}
                            >
                                Adjust Points
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'submissions'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'submissions' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('submissions')}
                            >
                                Pending Submissions
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParticipantWorkflowTab === 'completed-activities'}
                                className={`admin-subtab ${activeParticipantWorkflowTab === 'completed-activities' ? 'active' : ''}`}
                                onClick={() => setActiveParticipantWorkflowTab('completed-activities')}
                            >
                                Completed Activities
                            </button>
                        </div>

                        {activeParticipantWorkflowTab === 'participant-info' ? (
                            <article className={`card selected-participant-card ${selectedParticipant ? 'active' : ''}`}>
                                <p className="tiny muted">Current Participant</p>
                                {participantDetailLoading ? (
                                    <div className="actions-row">
                                        <div className="admin-spinner" aria-hidden="true" />
                                        <p className="muted">Loading participant details...</p>
                                    </div>
                                ) : participantDetailError ? (
                                    <div className="error-banner">{participantDetailError}</div>
                                ) : participantDetail ? (
                                    <div className="data-list compact">
                                        <div>
                                            <dt>Name</dt>
                                            <dd>{participantDetail.participant.fullName}</dd>
                                        </div>
                                        <div>
                                            <dt>Total Points</dt>
                                            <dd>{participantDetail.summary.totalPoints}</dd>
                                        </div>
                                        <div>
                                            <dt>Institution</dt>
                                            <dd>{participantDetail.participant.institution || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt>Email</dt>
                                            <dd>{participantDetail.participant.email || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt>Phone</dt>
                                            <dd>{participantDetail.participant.phone || '-'}</dd>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="muted">Select a participant from the left panel.</p>
                                )}
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'competitions' ? (
                            <article className="card admin-flow-card table-wrap">
                                <h3>Participant Competitions</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Competition</th>
                                            <th>Team</th>
                                            <th>Date & Time</th>
                                            <th>Venue</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(participantDetail?.competitions || []).map((item) => (
                                            <tr key={`${item.teamId}-${item.competitionId}`}>
                                                <td>{item.competitionName}</td>
                                                <td>
                                                    {item.teamName} {item.isLeader ? '(Leader)' : ''}
                                                </td>
                                                <td>
                                                    {new Date(item.compDay).toLocaleDateString()} | {item.startTime || '-'} - {item.endTime || '-'}
                                                </td>
                                                <td>{item.venueName || 'TBA'}</td>
                                                <td>{item.paymentStatus}</td>
                                            </tr>
                                        ))}
                                        {!participantDetail?.competitions.length ? (
                                            <tr>
                                                <td colSpan={5} className="muted">
                                                    No competition registrations found.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'mark-completion' ? (
                            <article className="card admin-flow-card stack">
                                <h3>Mark Activity Completion</h3>
                                <form className="grid two" onSubmit={onMarkCompletion}>
                                    <select
                                        value={completionActivityId}
                                        onChange={(event) => setCompletionActivityId(event.target.value)}
                                        required
                                    >
                                        <option value="">Select Activity</option>
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
                                    <button type="submit" disabled={!selectedParticipantId || !completionActivityId}>
                                        Mark Completion
                                    </button>
                                </form>
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'adjust-points' ? (
                            <article className="card admin-flow-card stack">
                                <h3>Adjust Points</h3>
                                <form className="grid two" onSubmit={onAdjustPoints}>
                                    <input
                                        type="number"
                                        min={-1000}
                                        max={1000}
                                        value={adjustPointsDelta}
                                        onChange={(event) => setAdjustPointsDelta(event.target.value)}
                                        placeholder="Points Delta"
                                        required
                                    />
                                    <input
                                        value={adjustReason}
                                        onChange={(event) => setAdjustReason(event.target.value)}
                                        placeholder="Reason (optional)"
                                    />
                                    <button type="submit" disabled={!selectedParticipantId}>
                                        Apply Adjustment
                                    </button>
                                </form>
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'submissions' ? (
                            <article className="card admin-flow-card table-wrap">
                                <h3>Pending Submissions</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Submitted At</th>
                                            <th>Submission</th>
                                            <th>Review Note</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(participantDetail?.pendingSubmissions || []).map((submission) => (
                                            <tr key={submission.id}>
                                                <td>{submission.activityName}</td>
                                                <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                                                <td>
                                                    {submission.submissionLink ? (
                                                        <a href={submission.submissionLink} target="_blank" rel="noreferrer">
                                                            Open Link
                                                        </a>
                                                    ) : (
                                                        <span>{submission.submissionText || '-'}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        value={submissionNotes[submission.id] || ''}
                                                        onChange={(event) =>
                                                            setSubmissionNotes((prev) => ({ ...prev, [submission.id]: event.target.value }))
                                                        }
                                                        placeholder="Review note"
                                                    />
                                                </td>
                                                <td>
                                                    <div className="actions-row">
                                                        <button type="button" onClick={() => onApproveSubmission(submission)}>
                                                            Approve
                                                        </button>
                                                        <button type="button" className="outline-button" onClick={() => onRejectSubmission(submission)}>
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!participantDetail?.pendingSubmissions.length ? (
                                            <tr>
                                                <td colSpan={5} className="muted">
                                                    No pending submissions for this participant.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </article>
                        ) : null}

                        {activeParticipantWorkflowTab === 'completed-activities' ? (
                            <article className="card admin-flow-card table-wrap">
                                <h3>Completed Activities</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Points</th>
                                            <th>Completed At</th>
                                            <th>Source Link</th>
                                            <th>Reverse</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(participantDetail?.completions || []).map((completion) => (
                                            <tr key={completion.id}>
                                                <td>{completion.activityName}</td>
                                                <td>{completion.points}</td>
                                                <td>{new Date(completion.completedAt).toLocaleString()}</td>
                                                <td>
                                                    {completion.submissionLink ? (
                                                        <a href={completion.submissionLink} target="_blank" rel="noreferrer">
                                                            Open
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    <button type="button" className="outline-button" onClick={() => onRevokeCompletion(completion.id)}>
                                                        Reverse
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {!participantDetail?.completions.length ? (
                                            <tr>
                                                <td colSpan={5} className="muted">
                                                    No completed activities yet.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </article>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {activeTab === 'activities' ? (
                <div className="stack admin-layout-single">
                    <div className="stack admin-right-panel">
                        <div className="stack">
                            <article className="card admin-flow-card stack">
                                <h3>Create Activity</h3>
                                <form className="grid two" onSubmit={onCreateActivity}>
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
                                    <select
                                        value={newActivityTypeId}
                                        onChange={(event) => setNewActivityTypeId(event.target.value)}
                                        required
                                    >
                                        <option value="">Select Activity Type</option>
                                        {activityKinds.map((kind) => (
                                            <option key={kind.id} value={kind.id}>
                                                {kind.name} ({kind.code})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min={1}
                                        max={1000}
                                        value={newActivityPoints}
                                        onChange={(event) => setNewActivityPoints(event.target.value)}
                                        placeholder="Points"
                                        required
                                    />
                                    <input
                                        value={newActivityDescription}
                                        onChange={(event) => setNewActivityDescription(event.target.value)}
                                        placeholder="Description (optional)"
                                    />
                                    {selectedNewActivityKind?.code === 'CORRECT_ANSWER' ? (
                                        <input
                                            value={newActivityCorrectAnswer}
                                            onChange={(event) => setNewActivityCorrectAnswer(event.target.value)}
                                            placeholder="Canonical correct answer"
                                            required
                                        />
                                    ) : null}
                                    <button type="submit">Create Activity</button>
                                </form>
                            </article>

                            <article className="card table-wrap admin-flow-card">
                                <h3>Activities</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Points</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.code}</td>
                                                <td>{item.name}</td>
                                                <td>{item.activityTypeCode}</td>
                                                <td>{item.points}</td>
                                                <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </article>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeTab === 'audit' ? (
                <div className="stack admin-layout-single">
                    <article className="card table-wrap admin-flow-card">
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
                                        <td>
                                            {log.targetType || '-'} / {log.targetId || '-'}
                                        </td>
                                        <td>{log.note || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </article>
                </div>
            ) : null}

            {dialogState.isOpen ? (
                <div className="admin-dialog-backdrop" role="presentation">
                    <div className="admin-dialog" role="dialog" aria-live="polite" aria-busy={dialogState.status === 'loading'}>
                        <h3>{dialogState.title}</h3>
                        <p className="muted">{dialogState.detail}</p>
                        {dialogState.status === 'loading' ? <div className="admin-spinner" /> : null}
                        {dialogState.status === 'success' ? <p className="status">Action completed successfully.</p> : null}
                        {dialogState.status === 'error' ? <p className="error-banner">Action failed.</p> : null}
                        <button type="button" onClick={closeDialog} disabled={dialogState.status === 'loading'}>
                            {dialogState.status === 'loading' ? 'Processing...' : 'Close'}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
