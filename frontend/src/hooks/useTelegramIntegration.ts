import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type {
  TelegramIntegration,
  CreateTelegramIntegrationParams,
  UpdateTelegramIntegrationParams,
} from '@/types/telegram'

interface TelegramIntegrationApiResponse {
  status: boolean
  data?: {
    integration_id?: string
    id?: string
    type?: string
    name?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
    has_chat_id?: boolean
  }
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useTelegramIntegration = () => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const createIntegration = useCallback(
    async (params: CreateTelegramIntegrationParams): Promise<TelegramIntegration | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelegramIntegrationApiResponse> = await httpClient.post(
          '/integrations/telegram/',
          params,
        )

        if (response.data.status && response.data.data?.integration_id) {
          showNotification({ message: 'Интеграция Telegram успешно создана!', variant: 'success' })
          // Получаем созданную интеграцию
          const integration = await getIntegration()
          return integration
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0 
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при создании интеграции'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error creating Telegram integration:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при создании интеграции'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const getIntegration = useCallback(async (): Promise<TelegramIntegration | null> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TelegramIntegrationApiResponse> = await httpClient.get(
        '/integrations/telegram/',
      )

      if (response.data.status && response.data.data) {
        return {
          id: response.data.data.id || '',
          type: response.data.data.type || 'telegram',
          name: response.data.data.name || '',
          is_active: response.data.data.is_active || false,
          created_at: response.data.data.created_at || '',
          updated_at: response.data.data.updated_at,
          has_chat_id: response.data.data.has_chat_id,
        }
      }
      return null
    } catch (err: any) {
      console.error('Error getting Telegram integration:', err)
      // Если интеграция не найдена, это не ошибка
      if (err.response?.status === 404 || err.response?.status === 200) {
        return null
      }
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при получении интеграции'
      showNotification({ message: errorMessage, variant: 'danger' })
      return null
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const updateIntegration = useCallback(
    async (
      integrationId: string | null | undefined,
      params: UpdateTelegramIntegrationParams,
    ): Promise<TelegramIntegration | null> => {
      setLoading(true)
      try {
        // Если ID не указан, используем endpoint без ID (обновит активную интеграцию)
        const url = integrationId 
          ? `/integrations/telegram/${integrationId}`
          : `/integrations/telegram/`
        
        console.log('Updating Telegram integration:', url, params)
        const response: AxiosResponse<TelegramIntegrationApiResponse> = await httpClient.patch(
          url,
          params,
        )

        if (response.data.status) {
          showNotification({ message: 'Интеграция Telegram успешно обновлена!', variant: 'success' })
          // Получаем обновленную интеграцию
          const integration = await getIntegration()
          return integration
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при обновлении интеграции'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error updating Telegram integration:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при обновлении интеграции'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification, getIntegration],
  )

  const deleteIntegration = useCallback(
    async (integrationId: string): Promise<boolean> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelegramIntegrationApiResponse> = await httpClient.delete(
          `/integrations/telegram/${integrationId}`,
        )

        if (response.data.status) {
          showNotification({ message: 'Интеграция Telegram успешно удалена!', variant: 'success' })
          return true
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при удалении интеграции'
          showNotification({ message: errorMessage, variant: 'danger' })
          return false
        }
      } catch (err: any) {
        console.error('Error deleting Telegram integration:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при удалении интеграции'
        showNotification({ message: errorMessage, variant: 'danger' })
        return false
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  return {
    loading,
    createIntegration,
    getIntegration,
    updateIntegration,
    deleteIntegration,
  }
}

