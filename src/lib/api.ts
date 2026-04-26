import type {
  ApiErrorResponse,
  AdminLoginResponse,
  Competition,
  CompetitionDetail,
  LoginResponse,
  SignupRequestResponse,
  SignupVerifyResponse,
  ParticipantCompetition,
  ParticipantProfile,
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
  // Points/activity/rankings/admin-points APIs are intentionally disabled in the active build.
  // The preserved implementation remains in `src/lib/api.legacy.ts` for future restoration.
  // getRankings(limit = 50, offset = 0) {
  //   const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  //   return request<RankingsResponse>(`/participants/rankings?${params.toString()}`)
  // },
  // getMyPointsSummary(accessToken: string) {
  //   return request<PointsSummary>('/points/me/summary', { accessToken })
  // },
  // getMyActivityProgress(accessToken: string) {
  //   return request<ActivityProgressItem[]>('/points/me/activities', { accessToken })
  // },
  // getPointsLeaderboard(limit = 100, offset = 0) {
  //   const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  //   return request<PointsLeaderboardResponse>(`/points/leaderboard?${params.toString()}`)
  // },
  // ... all admin points/activity methods migrated to `api.legacy.ts`.
}
