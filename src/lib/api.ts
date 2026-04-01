import type {
  ApiErrorResponse,
  ActivityKind,
  ActivitySubmission,
  ActivitySubmissionListParams,
  AdminLoginResponse,
  AdminParticipantDetail,
  ActivityType,
  CompetitionActivityPointsConfig,
  ActivityProgressItem,
  AdjustPointsPayload,
  Competition,
  CompetitionDetail,
  CreateActivityTypePayload,
  LoginResponse,
  MarkCompletionPayload,
  SignupRequestResponse,
  SignupVerifyResponse,
  SubmitActivityPayload,
  UpdateActivityPayload,
  ParticipantCompetition,
  ParticipantProfile,
  PointsAuditLog,
  PointsLeaderboardResponse,
  PointsSummary,
  RankingsResponse,
  TeamDetail,
} from '../types/api'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  accessToken?: string | null
}

export class ApiRequestError extends Error {
  code: string | null
  status: number | null
  details: unknown

  constructor(message: string, options: { code?: string | null; status?: number | null; details?: unknown } = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = options.code ?? null
    this.status = options.status ?? null
    this.details = options.details
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    let code: string | null = null
    let details: unknown = null
    try {
      const body = (await response.json()) as ApiErrorResponse
      if (body.error?.message) {
        message = body.error.message
      }
      code = body.error?.code ?? null
      details = body.error?.details ?? null
    } catch {
      // Keep fallback message when backend returns non-JSON body.
    }
    throw new ApiRequestError(message, { code, status: response.status, details })
  }

  return response.json() as Promise<T>
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  },
  signupRequest(email: string, fullName: string) {
    return request<SignupRequestResponse>('/auth/signup/request', {
      method: 'POST',
      body: { email, fullName },
    })
  },
  signupVerify(email: string, token: string, password: string, confirmPassword: string) {
    return request<SignupVerifyResponse>('/auth/signup/verify', {
      method: 'POST',
      body: { email, token, password, confirmPassword },
    })
  },
  adminLogin(email: string, password: string) {
    return request<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    })
  },
  getMe(accessToken: string) {
    return request<ParticipantProfile>('/participants/me', { accessToken })
  },
  getMyCompetitions(accessToken: string) {
    return request<ParticipantCompetition[]>('/participants/me/competitions', { accessToken })
  },
  getCompetitions(active = true) {
    const params = new URLSearchParams({ active: active ? 'true' : 'false', limit: '100' })
    return request<Competition[]>(`/competitions?${params.toString()}`)
  },
  getCompetitionDetail(competitionId: string) {
    return request<CompetitionDetail>(`/competitions/${competitionId}`)
  },
  getTeamDetail(teamId: string, accessToken: string) {
    return request<TeamDetail>(`/teams/${teamId}`, { accessToken })
  },
  getRankings(limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return request<RankingsResponse>(`/participants/rankings?${params.toString()}`)
  },
  getMyPointsSummary(accessToken: string) {
    return request<PointsSummary>('/points/me/summary', { accessToken })
  },
  getMyActivityProgress(accessToken: string) {
    return request<ActivityProgressItem[]>('/points/me/activities', { accessToken })
  },
  getPointsLeaderboard(limit = 100, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return request<PointsLeaderboardResponse>(`/points/leaderboard?${params.toString()}`)
  },
  getAdminActivityTypes(accessToken: string, includeInactive = true) {
    const params = new URLSearchParams({ includeInactive: String(includeInactive) })
    return request<ActivityType[]>(`/points/admin/activities?${params.toString()}`, {
      accessToken,
    })
  },
  getAdminActivityKinds(accessToken: string) {
    return request<ActivityKind[]>('/points/admin/activity-kinds', { accessToken })
  },
  createAdminActivityType(accessToken: string, payload: CreateActivityTypePayload) {
    return request<ActivityType>('/points/admin/activities', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  updateAdminActivityType(accessToken: string, activityId: string, payload: UpdateActivityPayload) {
    return request<ActivityType>(`/points/admin/activities/${activityId}`, {
      method: 'PATCH',
      accessToken,
      body: payload,
    })
  },
  toggleAdminActivityStatus(accessToken: string, activityId: string, isActive: boolean) {
    return request<ActivityType>(`/points/admin/activities/${activityId}/status`, {
      method: 'PATCH',
      accessToken,
      body: { isActive },
    })
  },
  markAdminCompletion(accessToken: string, payload: MarkCompletionPayload) {
    return request('/points/admin/completions', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  adjustAdminPoints(accessToken: string, payload: AdjustPointsPayload) {
    return request('/points/admin/adjustments', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  revokeAdminCompletion(accessToken: string, completionId: string, note?: string) {
    return request(`/points/admin/completions/${completionId}`, {
      method: 'DELETE',
      accessToken,
      body: { note },
    })
  },
  getAdminParticipantDetails(accessToken: string, participantId: string) {
    return request<AdminParticipantDetail>(`/points/admin/participants/${participantId}/details`, {
      accessToken,
    })
  },
  getAdminPendingSubmissions(accessToken: string, participantId?: string) {
    const params = new URLSearchParams({ limit: '30', offset: '0' })
    if (participantId) {
      params.set('participantId', participantId)
    }
    return request<ActivitySubmission[]>(`/points/admin/submissions/pending?${params.toString()}`, {
      accessToken,
    })
  },
  getAdminSubmissionsByActivity(accessToken: string, params: ActivitySubmissionListParams) {
    const query = new URLSearchParams({
      activityId: params.activityId,
      limit: String(params.limit ?? 50),
      offset: String(params.offset ?? 0),
    })
    if (params.status) {
      query.set('status', params.status)
    }

    return request<ActivitySubmission[]>(`/points/admin/submissions/by-activity?${query.toString()}`, {
      accessToken,
    })
  },
  getAdminLatestParticipantActivitySubmission(accessToken: string, participantId: string, activityId: string) {
    return request<ActivitySubmission | null>(
      `/points/admin/participants/${participantId}/activities/${activityId}/submission-latest`,
      { accessToken },
    )
  },
  getAdminCompetitionActivityPointsConfig(accessToken: string) {
    return request<CompetitionActivityPointsConfig>('/points/admin/config/competition-activity-points', {
      accessToken,
    })
  },
  updateAdminCompetitionActivityPointsDefault(accessToken: string, points: number) {
    return request<CompetitionActivityPointsConfig>('/points/admin/config/competition-activity-points/default', {
      method: 'PATCH',
      accessToken,
      body: { points },
    })
  },
  upsertAdminCompetitionActivityPointsOverride(accessToken: string, competitionId: string, points: number) {
    return request<CompetitionActivityPointsConfig>(`/points/admin/config/competition-activity-points/overrides/${competitionId}`, {
      method: 'PUT',
      accessToken,
      body: { points },
    })
  },
  deleteAdminCompetitionActivityPointsOverride(accessToken: string, competitionId: string) {
    return request<CompetitionActivityPointsConfig>(`/points/admin/config/competition-activity-points/overrides/${competitionId}`, {
      method: 'DELETE',
      accessToken,
    })
  },
  approveAdminSubmission(accessToken: string, submissionId: string, note?: string) {
    return request(`/points/admin/submissions/${submissionId}/approve`, {
      method: 'POST',
      accessToken,
      body: { note },
    })
  },
  rejectAdminSubmission(accessToken: string, submissionId: string, note?: string) {
    return request(`/points/admin/submissions/${submissionId}/reject`, {
      method: 'POST',
      accessToken,
      body: { note },
    })
  },
  submitMyActivity(accessToken: string, payload: SubmitActivityPayload) {
    return request('/points/me/submissions', {
      method: 'POST',
      accessToken,
      body: payload,
    })
  },
  getMySubmissions(accessToken: string) {
    return request<ActivitySubmission[]>('/points/me/submissions', { accessToken })
  },
  getAdminAuditLogs(accessToken: string, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return request<PointsAuditLog[]>(`/points/admin/audit-logs?${params.toString()}`, {
      accessToken,
    })
  },
}
