import { useState, useCallback, useEffect } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type {
  ZoomMeeting,
  CreateMeetingParams,
  UpdateMeetingParams,
  MeetingListParams,
  MeetingListResponse,
  ParticipantListResponse,
  RecordingListResponse,
} from '@/types/zoom'

interface MeetingApiResponse {
  status: boolean
  data?: ZoomMeeting | MeetingListResponse | ParticipantListResponse | RecordingListResponse
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useZoomMeetings = (autoFetch = false) => {
  const [loading, setLoading] = useState(false)
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([])
  const { showNotification } = useNotificationContext()

  const fetchMeetings = useCallback(
    async (params?: MeetingListParams): Promise<MeetingListResponse | null> => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()
        if (params?.user_id) queryParams.append('user_id', params.user_id)
        if (params?.type) queryParams.append('type', params.type)
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
        if (params?.next_page_token) queryParams.append('next_page_token', params.next_page_token)

        const response: AxiosResponse<MeetingApiResponse> = await httpClient.get(
          `/integrations/zoom/meetings?${queryParams.toString()}`,
        )

        if (response.data.status && response.data.data) {
          const data = response.data.data as MeetingListResponse
          setMeetings(data.meetings)
          return data
        }
        return null
      } catch (err: any) {
        console.error('Error fetching meetings:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при получении встреч'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const createMeeting = useCallback(
    async (params: CreateMeetingParams): Promise<ZoomMeeting | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<MeetingApiResponse> = await httpClient.post(
          '/integrations/zoom/meetings',
          params,
        )

        if (response.data.status && response.data.data) {
          const meeting = response.data.data as ZoomMeeting
          showNotification({ message: 'Встреча успешно создана!', variant: 'success' })
          // Обновляем список встреч
          await fetchMeetings()
          return meeting
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при создании встречи'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error creating meeting:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при создании встречи'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification, fetchMeetings],
  )

  const getMeeting = useCallback(
    async (meetingId: string): Promise<ZoomMeeting | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<MeetingApiResponse> = await httpClient.get(
          `/integrations/zoom/meetings/${meetingId}`,
        )

        if (response.data.status && response.data.data) {
          return response.data.data as ZoomMeeting
        }
        return null
      } catch (err: any) {
        console.error('Error getting meeting:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при получении встречи'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const updateMeeting = useCallback(
    async (meetingId: string, params: UpdateMeetingParams): Promise<boolean> => {
      setLoading(true)
      try {
        const response: AxiosResponse<MeetingApiResponse> = await httpClient.patch(
          `/integrations/zoom/meetings/${meetingId}`,
          params,
        )

        if (response.data.status) {
          showNotification({ message: 'Встреча успешно обновлена!', variant: 'success' })
          // Обновляем список встреч
          await fetchMeetings()
          return true
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при обновлении встречи'
          showNotification({ message: errorMessage, variant: 'danger' })
          return false
        }
      } catch (err: any) {
        console.error('Error updating meeting:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при обновлении встречи'
        showNotification({ message: errorMessage, variant: 'danger' })
        return false
      } finally {
        setLoading(false)
      }
    },
    [showNotification, fetchMeetings],
  )

  const deleteMeeting = useCallback(
    async (meetingId: string): Promise<boolean> => {
      setLoading(true)
      try {
        const response: AxiosResponse<MeetingApiResponse> = await httpClient.delete(
          `/integrations/zoom/meetings/${meetingId}`,
        )

        if (response.data.status) {
          showNotification({ message: 'Встреча успешно удалена!', variant: 'success' })
          // Обновляем список встреч
          await fetchMeetings()
          return true
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при удалении встречи'
          showNotification({ message: errorMessage, variant: 'danger' })
          return false
        }
      } catch (err: any) {
        console.error('Error deleting meeting:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при удалении встречи'
        showNotification({ message: errorMessage, variant: 'danger' })
        return false
      } finally {
        setLoading(false)
      }
    },
    [showNotification, fetchMeetings],
  )

  const getParticipants = useCallback(
    async (meetingId: string, pageSize = 30, nextPageToken?: string): Promise<ParticipantListResponse | null> => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()
        queryParams.append('page_size', pageSize.toString())
        if (nextPageToken) queryParams.append('next_page_token', nextPageToken)

        const response: AxiosResponse<MeetingApiResponse> = await httpClient.get(
          `/integrations/zoom/meetings/${meetingId}/participants?${queryParams.toString()}`,
        )

        if (response.data.status && response.data.data) {
          return response.data.data as ParticipantListResponse
        }
        return null
      } catch (err: any) {
        console.error('Error getting participants:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при получении участников'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const getRecordings = useCallback(
    async (meetingId: string, pageSize = 30, nextPageToken?: string): Promise<RecordingListResponse | null> => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()
        queryParams.append('page_size', pageSize.toString())
        if (nextPageToken) queryParams.append('next_page_token', nextPageToken)

        const response: AxiosResponse<MeetingApiResponse> = await httpClient.get(
          `/integrations/zoom/meetings/${meetingId}/recordings?${queryParams.toString()}`,
        )

        if (response.data.status && response.data.data) {
          return response.data.data as RecordingListResponse
        }
        return null
      } catch (err: any) {
        console.error('Error getting recordings:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при получении записей'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  useEffect(() => {
    if (autoFetch) {
      fetchMeetings()
    }
  }, [autoFetch, fetchMeetings])

  return {
    meetings,
    fetchMeetings,
    createMeeting,
    getMeeting,
    updateMeeting,
    deleteMeeting,
    getParticipants,
    getRecordings,
    loading,
  }
}

