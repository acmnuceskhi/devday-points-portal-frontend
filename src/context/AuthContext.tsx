import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from '../lib/storage'
import type { ParticipantProfile, UserSummary } from '../types/api'

type AuthContextValue = {
  isBootstrapping: boolean
  isAuthenticated: boolean
  accessToken: string | null
  user: UserSummary | null
  participant: ParticipantProfile | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken())
  const [user, setUser] = useState<UserSummary | null>(null)
  const [participant, setParticipant] = useState<ParticipantProfile | null>(null)

  useEffect(() => {
    async function bootstrap() {
      const token = getStoredAccessToken()
      if (!token) {
        setIsBootstrapping(false)
        return
      }

      try {
        const me = await api.getMe(token)
        setAccessToken(token)
        setParticipant(me)
        setUser({
          id: me.userId,
          email: me.email || '',
          type: 'participant',
        })
      } catch {
        clearStoredAccessToken()
        setAccessToken(null)
        setUser(null)
        setParticipant(null)
      } finally {
        setIsBootstrapping(false)
      }
    }

    void bootstrap()
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    setStoredAccessToken(result.accessToken)
    setAccessToken(result.accessToken)
    setUser(result.user)
    setParticipant(result.participant)
  }

  const logout = () => {
    clearStoredAccessToken()
    setAccessToken(null)
    setUser(null)
    setParticipant(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(accessToken),
      accessToken,
      user,
      participant,
      login,
      logout,
    }),
    [accessToken, isBootstrapping, participant, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
