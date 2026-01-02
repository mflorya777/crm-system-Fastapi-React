import { useCallback, useEffect, useRef, useState } from 'react'
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
  const isInitialLoad = useRef(true)

  const fetchCategory = useCallback(async (showLoading = false) => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    // Показываем loading только при первой загрузке или если явно запрошено
    if (isInitialLoad.current || showLoading) {
      setLoading(true)
    }
    
    try {
      const response: AxiosResponse<DealCategoryApiResponse> = await httpClient.get(`/deals/categories/${categoryId}`)

      if (response.data.status && response.data.data) {
        setCategory(response.data.data)
        setError(null)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка загрузки категории'
        // Не сбрасываем category при ошибке, чтобы UI не пропадал
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching deal category:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка загрузки категории'
      // Не сбрасываем category при ошибке
      setError(errorMessage)
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [categoryId])

  useEffect(() => {
    isInitialLoad.current = true
    fetchCategory(true)
  }, [fetchCategory])

  // refetch без показа loading, чтобы не мигал UI
  const refetch = useCallback(() => fetchCategory(false), [fetchCategory])

  return { category, loading, error, refetch }
}

