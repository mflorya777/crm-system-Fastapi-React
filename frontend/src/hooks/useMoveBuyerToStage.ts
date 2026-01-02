import type { AxiosResponse } from 'axios'
import { useState } from 'react'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { Buyer } from './useBuyersByCategory'

interface MoveBuyerToStageApiResponse {
  status: boolean
  data?: Buyer
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useMoveBuyerToStage = (onSuccess?: (buyer: Buyer) => void) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const moveBuyerToStage = async (buyerId: string, stageId: string, order?: number) => {
    setLoading(true)
    try {
      const response: AxiosResponse<MoveBuyerToStageApiResponse> = await httpClient.post(`/buyers/${buyerId}/move-to-stage`, {
        stage_id: stageId,
        order: order,
      })

      if (response.data.status && response.data.data) {
        if (onSuccess) {
          onSuccess(response.data.data)
        }
        return response.data.data
      } else {
        const errors = response.data.message?.errors || []
        let errorMessage = 'Ошибка при перемещении покупателя'
        if (errors.length > 0) {
          const errorMessages = errors.map((err) => err.text).join('. ')
          errorMessage = errorMessages
          showNotification({ message: errorMessages, variant: 'danger' })
        } else {
          errorMessage = response.data.message?.text || 'Ошибка при перемещении покупателя'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      console.error('Error moving buyer to stage:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при перемещении покупателя'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    moveBuyerToStage,
    loading,
  }
}

