import { useEffect, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'

export interface DealCategory {
  id: string
  name: string
  description?: string
  stages: Array<{
    id: string
    name: string
    order: number
    color?: string
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

interface DealCategoriesApiResponse {
  status: boolean
  data?: DealCategory[]
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDealCategories = (activeOnly: boolean = true) => {
  const [categories, setCategories] = useState<DealCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      setError(null)
      try {
        const response: AxiosResponse<DealCategoriesApiResponse> = await httpClient.get('/deals/categories', {
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
        console.error('Error fetching deal categories:', err)
        const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки категорий'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [activeOnly])

  return { categories, loading, error }
}

