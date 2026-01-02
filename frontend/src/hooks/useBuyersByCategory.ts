import { useCallback, useEffect, useRef, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'

export interface Buyer {
  id: string
  category_id: string
  stage_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  potential_value?: number
  currency?: string
  source?: string
  responsible_user_id: string
  order: number
  created_at: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  converted_at?: string
  revision: number
  is_active: boolean
  closed_at?: string
}

interface BuyersApiResponse {
  status: boolean
  data?: Buyer[]
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export interface BuyersFetchParams {
  activeOnly?: boolean
  search?: string
  stageId?: string
  sortField?: 'order' | 'created_at' | 'potential_value' | 'name'
  sortDirection?: 'asc' | 'desc'
}

export const useBuyersByCategory = (
  categoryId: string | undefined,
  params: BuyersFetchParams = {}
) => {
  const {
    activeOnly = true,
    search,
    stageId,
    sortField = 'order',
    sortDirection = 'asc',
  } = params

  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialLoad = useRef(true)

  const fetchBuyers = useCallback(async (showLoading = false) => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    // Показываем loading только при первой загрузке или если явно запрошено
    if (isInitialLoad.current || showLoading) {
      setLoading(true)
    }
    
    try {
      const response: AxiosResponse<BuyersApiResponse> = await httpClient.get(`/buyers/category/${categoryId}/buyers`, {
        params: {
          active_only: activeOnly,
          search: search || undefined,
          stage_id: stageId || undefined,
          sort_field: sortField,
          sort_direction: sortDirection,
        },
      })

      if (response.data.status && response.data.data) {
        setBuyers(response.data.data)
        setError(null)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки покупателей'
        // Не сбрасываем buyers при ошибке, чтобы UI не пропадал
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching buyers:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки покупателей'
      // Не сбрасываем buyers при ошибке
      setError(errorMessage)
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [categoryId, activeOnly, search, stageId, sortField, sortDirection])

  useEffect(() => {
    isInitialLoad.current = true
    fetchBuyers(true)
  }, [fetchBuyers])

  // refetch без показа loading, чтобы не мигал UI
  const refetch = useCallback(() => fetchBuyers(false), [fetchBuyers])

  return { buyers, loading, error, refetch }
}

