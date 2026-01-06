import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type {
  ZoomIntegration,
  CreateZoomIntegrationParams,
  UpdateZoomIntegrationParams,
} from '@/types/zoom'

interface ZoomIntegrationApiResponse {
  status: boolean
  data?: {
    integration_id?: string
    id?: string
    type?: string
    name?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useZoomIntegration = () => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const createIntegration = useCallback(
    async (params: CreateZoomIntegrationParams): Promise<ZoomIntegration | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<ZoomIntegrationApiResponse> = await httpClient.post(
          '/integrations/zoom/',
          params,
        )

        if (response.data.status && response.data.data?.integration_id) {
          showNotification({ message: 'Интеграция Zoom успешно создана!', variant: 'success' })
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
        console.error('Error creating Zoom integration:', err)
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

  const getIntegration = useCallback(async (): Promise<ZoomIntegration | null> => {
    setLoading(true)
    try {
      const response: AxiosResponse<ZoomIntegrationApiResponse> = await httpClient.get(
        '/integrations/zoom/',
      )

      if (response.data.status && response.data.data) {
        return {
          id: response.data.data.id || '',
          type: response.data.data.type || 'zoom',
          name: response.data.data.name || '',
          is_active: response.data.data.is_active || false,
          created_at: response.data.data.created_at || '',
          updated_at: response.data.data.updated_at,
        }
      }
      return null
    } catch (err: any) {
      console.error('Error getting Zoom integration:', err)
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
      params: UpdateZoomIntegrationParams,
    ): Promise<ZoomIntegration | null> => {
      setLoading(true)
      try {
        // Если ID не указан, используем endpoint без ID (обновит активную интеграцию)
        const url = integrationId 
          ? `/integrations/zoom/${integrationId}`
          : `/integrations/zoom/`
        
        console.log('Updating Zoom integration:', url, params)
        const response: AxiosResponse<ZoomIntegrationApiResponse> = await httpClient.patch(
          url,
          params,
        )

        if (response.data.status && response.data.data?.integration_id) {
          showNotification({ message: 'Интеграция Zoom успешно обновлена!', variant: 'success' })
          // Получаем обновленную интеграцию
          return await getIntegration()
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при обновлении интеграции'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error updating Zoom integration:', err)
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

  return {
    createIntegration,
    getIntegration,
    updateIntegration,
    loading,
  }
}

