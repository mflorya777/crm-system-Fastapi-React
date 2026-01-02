import { useState } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

interface DeleteBuyerCategoryApiResponse {
  status: boolean
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDeleteBuyerCategory = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const deleteCategory = async (categoryId: string) => {
    setLoading(true)
    try {
      const response: AxiosResponse<DeleteBuyerCategoryApiResponse> = await httpClient.delete(`/buyers/categories/${categoryId}`)

      if (response.data.status) {
        showNotification({ message: 'Категория успешно удалена!', variant: 'success' })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка при удалении категории'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } catch (err: any) {
      console.error('Error deleting buyer category:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка при удалении категории'
      showNotification({ message: errorMessage, variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return { deleteCategory, loading }
}

