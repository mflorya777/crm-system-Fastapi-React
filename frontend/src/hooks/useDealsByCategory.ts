import { useCallback, useEffect, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'

export interface Deal {
  id: string
  category_id: string
  stage_id: string
  title: string
  description?: string
  amount?: number
  currency?: string
  client_id?: string
  responsible_user_id: string
  order: number
  created_at: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  revision: number
  is_active: boolean
  closed_at?: string
}

interface DealsApiResponse {
  status: boolean
  data?: Deal[]
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDealsByCategory = (categoryId: string | undefined, activeOnly: boolean = true) => {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeals = useCallback(async () => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response: AxiosResponse<DealsApiResponse> = await httpClient.get(`/deals/category/${categoryId}/deals`, {
        params: {
          active_only: activeOnly,
        },
      })

      if (response.data.status && response.data.data) {
        setDeals(response.data.data)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки сделок'
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching deals:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки сделок'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [categoryId, activeOnly])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  return { deals, loading, error, refetch: fetchDeals }
}

