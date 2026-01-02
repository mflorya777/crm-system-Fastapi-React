import { useCallback, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'

interface ApiResponse {
  status: boolean
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDeleteDealCategory = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteCategory = useCallback(async (categoryId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response: AxiosResponse<ApiResponse> = await httpClient.delete(`/deals/categories/${categoryId}`)

      if (response.data.status) {
        onSuccess?.()
        return true
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка удаления категории'
        setError(errorMessage)
        return false
      }
    } catch (err: any) {
      console.error('Error deleting category:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка удаления категории'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { deleteCategory, loading, error }
}

