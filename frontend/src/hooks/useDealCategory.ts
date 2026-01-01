import { useEffect, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'
import type { DealCategory } from './useDealCategories'

interface DealCategoryApiResponse {
  status: boolean
  data?: DealCategory
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useDealCategory = (categoryId: string | undefined) => {
  const [category, setCategory] = useState<DealCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    const fetchCategory = async () => {
      setLoading(true)
      setError(null)
      try {
        const response: AxiosResponse<DealCategoryApiResponse> = await httpClient.get(`/deals/categories/${categoryId}`)

        if (response.data.status && response.data.data) {
          setCategory(response.data.data)
        } else {
          const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки категории'
          setError(errorMessage)
        }
      } catch (err: any) {
        console.error('Error fetching deal category:', err)
        const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки категории'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchCategory()
  }, [categoryId])

  return { category, loading, error }
}

