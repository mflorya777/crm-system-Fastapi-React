import { useCallback, useEffect, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'

export interface BuyerCategory {
  id: string
  name: string
  description?: string
  stages: Array<{
    id: string
    name: string
    order: number
    color?: string
    is_active?: boolean
    created_at: string
    updated_at?: string
  }>
  created_at: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  revision: number
  is_active: boolean
}

interface BuyerCategoriesApiResponse {
  status: boolean
  data?: BuyerCategory[]
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useBuyerCategories = (activeOnly: boolean = true) => {
  const [categories, setCategories] = useState<BuyerCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response: AxiosResponse<BuyerCategoriesApiResponse> = await httpClient.get('/buyers/categories', {
        params: {
          active_only: activeOnly,
        },
      })

      if (response.data.status && response.data.data) {
        setCategories(response.data.data)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки категорий'
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching buyer categories:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки категорий'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, loading, error, refetch: fetchCategories }
}

