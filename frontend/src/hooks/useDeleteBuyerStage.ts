import { useState } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

interface DeleteBuyerStageApiResponse {
  status: boolean
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDeleteBuyerStage = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const deleteStage = async (categoryId: string, stageId: string) => {
    setLoading(true)
    try {
      const response: AxiosResponse<DeleteBuyerStageApiResponse> = await httpClient.delete(`/buyers/categories/${categoryId}/stages/${stageId}`)

      if (response.data.status) {
        showNotification({ message: 'Стадия успешно удалена!', variant: 'success' })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка при удалении стадии'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } catch (err: any) {
      console.error('Error deleting buyer stage:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка при удалении стадии'
      showNotification({ message: errorMessage, variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return { deleteStage, loading }
}

