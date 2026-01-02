import { useCallback, useEffect, useRef, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'

interface DealsCountData {
  count: number
  category_id: string
}

interface DealsCountApiResponse {
  status: boolean
  data?: DealsCountData
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDealsCount = (categoryId: string | undefined, activeOnly: boolean = true) => {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialLoad = useRef(true)

  const fetchCount = useCallback(async (showLoading = false) => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    if (isInitialLoad.current || showLoading) {
      setLoading(true)
    }

    try {
      const response: AxiosResponse<DealsCountApiResponse> = await httpClient.get(`/deals/category/${categoryId}/deals/count`, {
        params: {
          active_only: activeOnly,
        },
      })

      if (response.data.status && response.data.data) {
        setCount(response.data.data.count)
        setError(null)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки количества сделок'
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching deals count:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки количества сделок'
      setError(errorMessage)
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [categoryId, activeOnly])

  useEffect(() => {
    isInitialLoad.current = true
    fetchCount(true)
  }, [fetchCount])

  const refetch = useCallback(() => fetchCount(false), [fetchCount])

  return { count, loading, error, refetch }
}

