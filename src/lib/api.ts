import type {
  Competition,
  CompetitionDetail,
  LoginResponse,
  ParticipantCompetition,
  ParticipantProfile,
  RankingsResponse,
  TeamDetail,
} from '../types/api'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1'

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  accessToken?: string | null
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
    try {
      const body = (await response.json()) as {
        error?: { message?: string }
      }
      if (body.error?.message) {
        message = body.error.message
      }
    } catch {
      // Keep fallback message when backend returns non-JSON body.
    }
    throw new Error(message)
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
}
