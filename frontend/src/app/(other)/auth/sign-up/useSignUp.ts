import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import * as yup from 'yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

const useSignUp = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { showNotification } = useNotificationContext()

  const signUpSchema = yup.object({
    name: yup.string().required('пожалуйста, введите ваше имя'),
    soname: yup.string().required('пожалуйста, введите вашу фамилию'),
    father_name: yup.string().required('пожалуйста, введите ваше отчество'),
    phone: yup.string().required('пожалуйста, введите ваш номер телефона'),
    email: yup.string().email('Пожалуйста, введите действительный email').required('пожалуйста, введите ваш email'),
    password: yup
      .string()
      .required('Пожалуйста, введите ваш пароль')
      .min(8, 'Пароль должен содержать не менее 8 символов')
      .matches(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
      .matches(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')
      .matches(/[!@#$%&]/, 'Пароль должен содержать хотя бы один специальный символ (!@#$%&)')
      .matches(/^[A-Za-z0-9!@#$%&]+$/, 'Пароль должен содержать только латинские символы'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(signUpSchema),
  })

  type SignUpFormFields = yup.InferType<typeof signUpSchema>

  const register = handleSubmit(async (values: SignUpFormFields) => {
    setLoading(true)
    try {
      const res: AxiosResponse<{ status: boolean; message?: { text?: string; errors?: Array<{ code: number; text: string }> } }> = await httpClient.post('/register', values)
      console.log('Registration response:', res.data)
      if (res.data.status) {
        showNotification({ message: 'Регистрация успешна! Теперь вы можете войти.', variant: 'success' })
        navigate('/auth/sign-in')
      } else {
        // Собираем все ошибки валидации
        const errors = res.data.message?.errors || []
        if (errors.length > 0) {
          const errorMessages = errors.map((err) => err.text).join('. ')
          showNotification({ message: errorMessages, variant: 'danger' })
        } else {
          const errorMessage = res.data.message?.text || 'Ошибка при регистрации'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('Registration error:', e)
      console.error('Error response:', e.response?.data)
      const errors = e.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((err: { text: string }) => err.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = e.response?.data?.message?.text || e.message || 'Ошибка при регистрации'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return { loading, register, control }
}

export default useSignUp

