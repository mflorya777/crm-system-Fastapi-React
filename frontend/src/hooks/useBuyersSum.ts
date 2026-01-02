import { useCallback, useEffect, useRef, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'

interface BuyersSumData {
  sum: number
  category_id: string
}

interface BuyersSumApiResponse {
  status: boolean
  data?: BuyersSumData
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useBuyersSum = (categoryId: string | undefined, activeOnly: boolean = true) => {
  const [sum, setSum] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialLoad = useRef(true)

  const fetchSum = useCallback(async (showLoading = false) => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    if (isInitialLoad.current || showLoading) {
      setLoading(true)
    }

    try {
      const response: AxiosResponse<BuyersSumApiResponse> = await httpClient.get(`/buyers/category/${categoryId}/buyers/sum`, {
        params: {
          active_only: activeOnly,
        },
      })

      if (response.data.status && response.data.data) {
        setSum(response.data.data.sum)
        setError(null)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки суммы покупателей'
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching buyers sum:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки суммы покупателей'
      setError(errorMessage)
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [categoryId, activeOnly])

  useEffect(() => {
    isInitialLoad.current = true
    fetchSum(true)
  }, [fetchSum])

  const refetch = useCallback(() => fetchSum(false), [fetchSum])

  return { sum, loading, error, refetch }
}

