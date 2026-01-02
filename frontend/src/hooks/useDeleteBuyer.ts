import { useState } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

interface DeleteBuyerApiResponse {
  status: boolean
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDeleteBuyer = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const deleteBuyer = async (buyerId: string) => {
    setLoading(true)
    try {
      const response: AxiosResponse<DeleteBuyerApiResponse> = await httpClient.delete(`/buyers/${buyerId}`)

      if (response.data.status) {
        showNotification({ message: 'Покупатель успешно удален!', variant: 'success' })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка при удалении покупателя'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } catch (err: any) {
      console.error('Error deleting buyer:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка при удалении покупателя'
      showNotification({ message: errorMessage, variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return { deleteBuyer, loading }
}

