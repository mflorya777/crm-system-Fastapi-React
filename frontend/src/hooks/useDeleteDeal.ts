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

export const useDeleteDeal = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteDeal = useCallback(async (dealId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response: AxiosResponse<ApiResponse> = await httpClient.delete(`/deals/${dealId}`)

      if (response.data.status) {
        onSuccess?.()
        return true
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка удаления сделки'
        setError(errorMessage)
        return false
      }
    } catch (err: any) {
      console.error('Error deleting deal:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка удаления сделки'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { deleteDeal, loading, error }
}

