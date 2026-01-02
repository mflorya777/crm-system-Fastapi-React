import { useCallback, useEffect, useRef, useState } from 'react'
import type { AxiosResponse } from 'axios'

import httpClient from '@/helpers/httpClient'
import type { BuyerCategory } from './useBuyerCategories'

interface BuyerCategoryApiResponse {
  status: boolean
  data?: BuyerCategory
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useBuyerCategory = (categoryId: string | undefined) => {
  const [category, setCategory] = useState<BuyerCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialLoad = useRef(true)

  const fetchCategory = useCallback(async (showLoading = false) => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    if (isInitialLoad.current || showLoading) {
      setLoading(true)
    }

    try {
      const response: AxiosResponse<BuyerCategoryApiResponse> = await httpClient.get(`/buyers/categories/${categoryId}`)

      if (response.data.status && response.data.data) {
        setCategory(response.data.data)
        setError(null)
      } else {
        const errorMessage = response.data.message?.text || response.data.message?.errors?.[0]?.text || 'Ошибка при получении категории'
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error fetching buyer category:', err)
      const errorMessage = err.response?.data?.message?.text || err.response?.data?.message?.errors?.[0]?.text || err.message || 'Ошибка при получении категории'
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

  const refetch = useCallback(() => fetchCategory(false), [fetchCategory])

  return { category, loading, error, refetch }
}

