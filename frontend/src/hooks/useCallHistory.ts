import { useState, useCallback, useEffect } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { CallInfo, CallHistoryParams } from '@/types/telephony'

interface CallHistoryApiResponse {
  status: boolean
  data?: {
    calls: CallInfo[]
    total: number
  }
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useCallHistory = (params?: CallHistoryParams, autoFetch: boolean = false) => {
  const [calls, setCalls] = useState<CallInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const { showNotification } = useNotificationContext()

  const fetchCallHistory = useCallback(
    async (fetchParams?: CallHistoryParams): Promise<CallInfo[]> => {
      setLoading(true)
      setError(null)
      
      try {
        const requestParams = fetchParams || params || {}
        const response: AxiosResponse<CallHistoryApiResponse> = await httpClient.post(
          '/integrations/telephony/call-history',
          requestParams,
        )

        if (response.data.status && response.data.data) {
          const callList = response.data.data.calls || []
          setCalls(callList)
          setTotal(response.data.data.total || callList.length)
          return callList
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при получении истории звонков'
          setError(errorMessage)
          showNotification({ message: errorMessage, variant: 'danger' })
          return []
        }
      } catch (err: any) {
        console.error('Error fetching call history:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при получении истории звонков'
        setError(errorMessage)
        showNotification({ message: errorMessage, variant: 'danger' })
        return []
      } finally {
        setLoading(false)
      }
    },
    [params, showNotification],
  )

  useEffect(() => {
    if (autoFetch) {
      fetchCallHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch])

  return {
    calls,
    loading,
    error,
    total,
    fetchCallHistory,
    refetch: () => fetchCallHistory(),
  }
}

