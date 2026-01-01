import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'

import { useAuthContext } from '@/context/useAuthContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { UserType } from '@/types/auth'

const useSignIn = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { saveSession } = useAuthContext()
  const [searchParams] = useSearchParams()

  const { showNotification } = useNotificationContext()

  const loginFormSchema = yup.object({
    email: yup.string().email('Пожалуйста, введите корректный email').required('Пожалуйста, введите ваш email'),
    password: yup.string().required('Пожалуйста, введите ваш пароль'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
  })

  type LoginFormFields = yup.InferType<typeof loginFormSchema>

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/')
  }

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true)
    try {
      // Отправляем запрос на вход
      const loginRes: AxiosResponse<{ status: boolean; message?: { text?: string; errors?: Array<{ code: number; text: string }> } }> = await httpClient.post('/login', values)
      
      if (loginRes.data.status) {
        // После успешного входа получаем данные пользователя
        try {
          const userRes: AxiosResponse<{ status: boolean; data?: any; message?: { text?: string; errors?: Array<{ code: number; text: string }> } }> = await httpClient.get('/me')
          
          if (userRes.data.status && userRes.data.data) {
            // Адаптируем данные пользователя из бэкенда к формату фронтенда
            const userData = userRes.data.data
            const adaptedUser: UserType = {
              id: userData.id || '',
              username: userData.email || '', // Используем email как username
              email: userData.email || '',
              password: '', // Пароль не нужен после входа
              firstName: userData.name || '',
              lastName: userData.soname || '',
              role: userData.is_backoffice_user ? 'Admin' : 'User',
              token: 'cookie', // Маркер, что токен в cookie
            }
            // Сохраняем данные пользователя в сессию
            // Токен уже установлен в cookie бэкендом
            saveSession(adaptedUser)
            redirectUser()
            showNotification({ message: 'Успешный вход. Перенаправление....', variant: 'success' })
          } else {
            const errorMessage = userRes.data.message?.text || userRes.data.message?.errors?.[0]?.text || 'Ошибка получения данных пользователя'
            showNotification({ message: errorMessage, variant: 'danger' })
          }
        } catch (userError: any) {
          console.error('Error fetching user data:', userError)
          const errorMessage = userError.response?.data?.message?.text || userError.response?.data?.message?.errors?.[0]?.text || 'Ошибка получения данных пользователя'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      } else {
        // Ошибка входа
        const errors = loginRes.data.message?.errors || []
        if (errors.length > 0) {
          const errorMessages = errors.map((err) => err.text).join('. ')
          showNotification({ message: errorMessages, variant: 'danger' })
        } else {
          const errorMessage = loginRes.data.message?.text || 'Ошибка авторизации'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('Login error:', e)
      console.error('Error response:', e.response?.data)
      const errors = e.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((err: { text: string }) => err.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = e.response?.data?.message?.text || e.message || 'Ошибка авторизации'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return { loading, login, control }
}

export default useSignIn
