import { useState, useCallback } from 'react'
import type { AxiosResponse } from 'axios'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type {
  SendMessageParams,
  SendPhotoParams,
  SendDocumentParams,
  MessageResponse,
  BotInfo,
  WebhookInfo,
  ChatInfo,
} from '@/types/telegram'

interface TelegramApiResponse<T = any> {
  status: boolean
  data?: T
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

export const useTelegramMessages = () => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const sendMessage = useCallback(
    async (params: SendMessageParams): Promise<MessageResponse | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelegramApiResponse<MessageResponse>> = await httpClient.post(
          '/integrations/telegram/send-message',
          params,
        )

        if (response.data.status && response.data.data) {
          showNotification({ message: 'Сообщение успешно отправлено!', variant: 'success' })
          return response.data.data
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при отправке сообщения'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error sending message:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при отправке сообщения'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const sendPhoto = useCallback(
    async (params: SendPhotoParams): Promise<MessageResponse | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelegramApiResponse<MessageResponse>> = await httpClient.post(
          '/integrations/telegram/send-photo',
          params,
        )

        if (response.data.status && response.data.data) {
          showNotification({ message: 'Фото успешно отправлено!', variant: 'success' })
          return response.data.data
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при отправке фото'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error sending photo:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при отправке фото'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const sendDocument = useCallback(
    async (params: SendDocumentParams): Promise<MessageResponse | null> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelegramApiResponse<MessageResponse>> = await httpClient.post(
          '/integrations/telegram/send-document',
          params,
        )

        if (response.data.status && response.data.data) {
          showNotification({ message: 'Документ успешно отправлен!', variant: 'success' })
          return response.data.data
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при отправке документа'
          showNotification({ message: errorMessage, variant: 'danger' })
          return null
        }
      } catch (err: any) {
        console.error('Error sending document:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при отправке документа'
        showNotification({ message: errorMessage, variant: 'danger' })
        return null
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const getBotInfo = useCallback(async (): Promise<BotInfo | null> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TelegramApiResponse<BotInfo>> = await httpClient.get(
        '/integrations/telegram/bot-info',
      )

      if (response.data.status && response.data.data) {
        return response.data.data
      }
      return null
    } catch (err: any) {
      console.error('Error getting bot info:', err)
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при получении информации о боте'
      showNotification({ message: errorMessage, variant: 'danger' })
      return null
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const getWebhookInfo = useCallback(async (): Promise<WebhookInfo | null> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TelegramApiResponse<WebhookInfo>> = await httpClient.get(
        '/integrations/telegram/webhook-info',
      )

      if (response.data.status && response.data.data) {
        return response.data.data
      }
      return null
    } catch (err: any) {
      console.error('Error getting webhook info:', err)
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при получении информации о webhook'
      showNotification({ message: errorMessage, variant: 'danger' })
      return null
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const setWebhook = useCallback(
    async (url: string, maxConnections?: number, allowedUpdates?: string[]): Promise<boolean> => {
      setLoading(true)
      try {
        const response: AxiosResponse<TelegramApiResponse<{ success: boolean }>> = await httpClient.post(
          '/integrations/telegram/set-webhook',
          {
            url,
            max_connections: maxConnections,
            allowed_updates: allowedUpdates,
          },
        )

        if (response.data.status && response.data.data?.success) {
          showNotification({ message: 'Webhook успешно установлен!', variant: 'success' })
          return true
        } else {
          const errors = response.data.message?.errors || []
          const errorMessage = errors.length > 0
            ? errors.map((err) => err.text).join('. ')
            : response.data.message?.text || 'Ошибка при установке webhook'
          showNotification({ message: errorMessage, variant: 'danger' })
          return false
        }
      } catch (err: any) {
        console.error('Error setting webhook:', err)
        const errors = err.response?.data?.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((error: { text: string }) => error.text).join('. ')
          : err.response?.data?.message?.text || err.message || 'Ошибка при установке webhook'
        showNotification({ message: errorMessage, variant: 'danger' })
        return false
      } finally {
        setLoading(false)
      }
    },
    [showNotification],
  )

  const deleteWebhook = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TelegramApiResponse<{ success: boolean }>> = await httpClient.post(
        '/integrations/telegram/delete-webhook',
      )

      if (response.data.status && response.data.data?.success) {
        showNotification({ message: 'Webhook успешно удален!', variant: 'success' })
        return true
      } else {
        const errors = response.data.message?.errors || []
        const errorMessage = errors.length > 0
          ? errors.map((err) => err.text).join('. ')
          : response.data.message?.text || 'Ошибка при удалении webhook'
        showNotification({ message: errorMessage, variant: 'danger' })
        return false
      }
    } catch (err: any) {
      console.error('Error deleting webhook:', err)
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при удалении webhook'
      showNotification({ message: errorMessage, variant: 'danger' })
      return false
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const getChatInfo = useCallback(async (chatId: string): Promise<ChatInfo | null> => {
    setLoading(true)
    try {
      const response: AxiosResponse<TelegramApiResponse<ChatInfo>> = await httpClient.get(
        `/integrations/telegram/chat-info/${encodeURIComponent(chatId)}`,
      )

      if (response.data.status && response.data.data) {
        return response.data.data
      }
      return null
    } catch (err: any) {
      console.error('Error getting chat info:', err)
      const errors = err.response?.data?.message?.errors || []
      const errorMessage = errors.length > 0
        ? errors.map((error: { text: string }) => error.text).join('. ')
        : err.response?.data?.message?.text || err.message || 'Ошибка при получении информации о чате'
      showNotification({ message: errorMessage, variant: 'danger' })
      return null
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  return {
    loading,
    sendMessage,
    sendPhoto,
    sendDocument,
    getBotInfo,
    getWebhookInfo,
    setWebhook,
    deleteWebhook,
    getChatInfo,
  }
}

