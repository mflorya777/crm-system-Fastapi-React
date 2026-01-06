import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

interface TestConnectionApiResponse {
  status: boolean
  data?: {
    success: boolean
    message: string
  }
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useZoomConnection = () => {
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const { showNotification } = useNotificationContext()

  const testConnection = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TestConnectionApiResponse> = await httpClient.post(
        '/integrations/zoom/test-connection',
      )

      if (response.data.status && response.data.data) {
        const success = response.data.data.success
        setIsConnected(success)
        
        if (success) {
          showNotification({ message: 'Соединение с Zoom успешно установлено!', variant: 'success' })
        } else {
          showNotification({ message: 'Не удалось установить соединение с Zoom', variant: 'warning' })
        }
        
        return success
      } else {
        const errors = response.data.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((err) => err.text).join('. ')
          : response.data.message?.text || 'Ошибка при проверке соединения'
        showNotification({ message: errorMessage, variant: 'danger' })
        setIsConnected(false)
        return false
      }
    } catch (err: any) {
      console.error('Error testing Zoom connection:', err)
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при проверке соединения'
      showNotification({ message: errorMessage, variant: 'danger' })
      setIsConnected(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  return {
    testConnection,
    isConnected,
    loading,
  }
}

