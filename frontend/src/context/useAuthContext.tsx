import type { UserType } from '@/types/auth'
import { deleteCookie, getCookie, hasCookie, setCookie } from 'cookies-next'
import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import httpClient from '@/helpers/httpClient'
import type { ChildrenType } from '../types/component-props'

export type AuthContextType = {
  user: UserType | undefined
  isAuthenticated: boolean
  saveSession: (session: UserType) => void
  removeSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

const authSessionKey = '_REBACK_AUTH_KEY_'

export function AuthProvider({ children }: ChildrenType) {
  const navigate = useNavigate()

  const getSession = (): AuthContextType['user'] => {
    const fetchedCookie = getCookie(authSessionKey)?.toString()
    if (!fetchedCookie) return
    else return JSON.parse(fetchedCookie)
  }

  const [user, setUser] = useState<UserType | undefined>(getSession())

  const saveSession = (user: UserType) => {
    setCookie(authSessionKey, JSON.stringify(user))
    setUser(user)
  }

  const removeSession = async () => {
    try {
      // Вызываем API для выхода (удаляет cookie на сервере)
      await httpClient.post('/logout')
    } catch (error) {
      // Игнорируем ошибки при выходе, все равно очищаем локальную сессию
      console.error('Logout error:', error)
    } finally {
      // Очищаем локальную сессию независимо от результата API запроса
      deleteCookie(authSessionKey)
      setUser(undefined)
      navigate('/auth/sign-in')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: hasCookie(authSessionKey) && user !== undefined,
        saveSession,
        removeSession,
      }}>
      {children}
    </AuthContext.Provider>
  )
}
