import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { MakeCallParams } from '@/types/telephony'

interface MakeCallApiResponse {
  status: boolean
  data?: {
    success: boolean
    data: any
  }
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useMakeCall = () => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const makeCall = useCallback(
    async (params: MakeCallParams, onSuccess?: (data: any) => void): Promise<boolean> => {
      setLoading(true)
      try {
        const response: AxiosResponse<MakeCallApiResponse> = await httpClient.post(
          '/integrations/telephony/make-call',
          params,
        )

        if (response.data.status && response.data.data?.success) {
          showNotification({ message: 'Звонок успешно инициирован!', variant: 'success' })
          if (onSuccess) {
            onSuccess(response.data.data.data)
          }
          return true
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при инициации звонка'
          showNotification({ message: errorMessage, variant: 'danger' })
          return false
        }
      } catch (err: any) {
        console.error('Error making call:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при инициации звонка'
        showNotification({ message: errorMessage, variant: 'danger' })
        return false
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  return {
    makeCall,
    loading,
  }
}

