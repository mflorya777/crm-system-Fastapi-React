import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type {
  TelephonyIntegration,
  CreateMangoOfficeIntegrationParams,
  UpdateMangoOfficeIntegrationParams,
} from '@/types/telephony'

interface TelephonyIntegrationApiResponse {
  status: boolean
  data?: {
    integration_id?: string
    integrations?: TelephonyIntegration[]
    id?: string
    type?: string
    name?: string
    is_active?: boolean
    config?: any
    created_at?: string
    updated_at?: string
  }
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useTelephonyIntegration = () => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const createIntegration = useCallback(
    async (params: CreateMangoOfficeIntegrationParams): Promise<TelephonyIntegration | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelephonyIntegrationApiResponse> = await httpClient.post(
          '/integrations/telephony/mango-office',
          params,
        )

        if (response.data.status && response.data.data?.integration_id) {
          showNotification({ message: 'Интеграция успешно создана!', variant: 'success' })
          // Получаем созданную интеграцию
          const integrations = await getIntegrations()
          return integrations.find((i) => i.id === response.data.data?.integration_id) || null
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0 
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при создании интеграции'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error creating telephony integration:', err)
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

  const getIntegrations = useCallback(async (): Promise<TelephonyIntegration[]> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TelephonyIntegrationApiResponse> = await httpClient.get(
        '/integrations/telephony/mango-office',
      )

      if (response.data.status && response.data.data?.integrations) {
        return response.data.data.integrations.map((item) => ({
          id: item.id || '',
          name: item.name || '',
          is_active: item.is_active || false,
          config: item.config || {},
          created_at: item.created_at || '',
          updated_at: item.updated_at,
        }))
      }
      return []
    } catch (err: any) {
      console.error('Error getting telephony integrations:', err)
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при получении интеграций'
      showNotification({ message: errorMessage, variant: 'danger' })
      return []
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const updateIntegration = useCallback(
    async (
      integrationId: string,
      params: UpdateMangoOfficeIntegrationParams,
    ): Promise<TelephonyIntegration | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelephonyIntegrationApiResponse> = await httpClient.patch(
          `/integrations/telephony/mango-office/${integrationId}`,
          params,
        )

        if (response.data.status && response.data.data?.integration_id) {
          showNotification({ message: 'Интеграция успешно обновлена!', variant: 'success' })
          // Получаем обновленную интеграцию
          const integrations = await getIntegrations()
          return integrations.find((i) => i.id === response.data.data?.integration_id) || null
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при обновлении интеграции'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error updating telephony integration:', err)
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
    [showNotification, getIntegrations],
  )

  return {
    createIntegration,
    getIntegrations,
    updateIntegration,
    loading,
  }
}

