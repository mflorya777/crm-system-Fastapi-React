import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { CallStatistic, StatisticsParams } from '@/types/telephony'

interface StatisticsApiResponse {
  status: boolean
  data?: {
    statistics: CallStatistic
  }
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useCallStatistics = () => {
  const [statistics, setStatistics] = useState<CallStatistic | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotificationContext()

  const fetchStatistics = useCallback(
    async (params: StatisticsParams): Promise<CallStatistic | null> => {
      setLoading(true)
      setError(null)
      
      try {
        const response: AxiosResponse<StatisticsApiResponse> = await httpClient.post(
          '/integrations/telephony/statistics',
          params,
        )

        if (response.data.status && response.data.data?.statistics) {
          const stats = response.data.data.statistics
          setStatistics(stats)
          return stats
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при получении статистики'
          setError(errorMessage)
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error fetching statistics:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при получении статистики'
        setError(errorMessage)
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  }
}

