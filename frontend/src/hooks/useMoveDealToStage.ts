import type { AxiosResponse } from 'axios'
import { useState } from 'react'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { Deal } from './useDealsByCategory'

interface MoveDealToStageApiResponse {
  status: boolean
  data?: Deal
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useMoveDealToStage = (onSuccess?: (deal: Deal) => void) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const moveDealToStage = async (dealId: string, stageId: string) => {
    setLoading(true)
    try {
      const response: AxiosResponse<MoveDealToStageApiResponse> = await httpClient.post(`/deals/${dealId}/move-to-stage`, {
        stage_id: stageId,
      })

      if (response.data.status && response.data.data) {
        if (onSuccess) {
          onSuccess(response.data.data)
        }
        return response.data.data
      } else {
        const errors = response.data.message?.errors || []
        if (errors.length > 0) {
          const errorMessages = errors.map((err) => err.text).join('. ')
          showNotification({ message: errorMessages, variant: 'danger' })
        } else {
          const errorMessage = response.data.message?.text || 'Ошибка при перемещении сделки'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      console.error('Error moving deal to stage:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при перемещении сделки'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    moveDealToStage,
    loading,
  }
}

