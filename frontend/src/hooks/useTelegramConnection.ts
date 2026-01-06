import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { TestConnectionResponse } from '@/types/telegram'

interface TestConnectionApiResponse {
  status: boolean
  data?: TestConnectionResponse
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useTelegramConnection = () => {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const { showNotification } = useNotificationContext()

  const testConnection = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TestConnectionApiResponse> = await httpClient.post(
        '/integrations/telegram/test-connection',
      )

      if (response.data.status && response.data.data) {
        const isConnected = response.data.data.connected
        setConnected(isConnected)
        
        if (isConnected) {
          showNotification({ 
            message: response.data.data.message || 'Соединение успешно установлено!', 
            variant: 'success' 
          })
        } else {
          showNotification({ 
            message: response.data.data.message || 'Не удалось установить соединение', 
            variant: 'warning' 
          })
        }
        
        return isConnected
      } else {
        const errors = response.data.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((err) => err.text).join('. ')
          : response.data.message?.text || 'Ошибка при проверке соединения'
        showNotification({ message: errorMessage, variant: 'danger' })
        setConnected(false)
        return false
      }
    } catch (err: any) {
      console.error('Error testing Telegram connection:', err)
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при проверке соединения'
      showNotification({ message: errorMessage, variant: 'danger' })
      setConnected(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  return {
    loading,
    connected,
    testConnection,
  }
}

