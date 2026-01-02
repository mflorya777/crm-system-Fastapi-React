import { useCallback, useEffect, useRef, useState } from 'react'
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
  const isInitialLoad = useRef(true)

  const fetchDeals = useCallback(async (showLoading = false) => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    // Показываем loading только при первой загрузке или если явно запрошено
    if (isInitialLoad.current || showLoading) {
      setLoading(true)
    }
    
    try {
      const response: AxiosResponse<DealsApiResponse> = await httpClient.get(`/deals/category/${categoryId}/deals`, {
        params: {
          active_only: activeOnly,
        },
      })

      if (response.data.status && response.data.data) {
        setDeals(response.data.data)
        setError(null)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки сделок'
        // Не сбрасываем deals при ошибке, чтобы UI не пропадал
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching deals:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки сделок'
      // Не сбрасываем deals при ошибке
      setError(errorMessage)
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [categoryId, activeOnly])

  useEffect(() => {
    isInitialLoad.current = true
    fetchDeals(true)
  }, [fetchDeals])

  // refetch без показа loading, чтобы не мигал UI
  const refetch = useCallback(() => fetchDeals(false), [fetchDeals])

  return { deals, loading, error, refetch }
}

