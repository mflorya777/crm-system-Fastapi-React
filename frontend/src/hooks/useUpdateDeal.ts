import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { Deal } from './useDealsByCategory'

interface UpdateDealApiResponse {
  status: boolean
  data?: Deal
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

const updateDealSchema = yup.object({
  title: yup.string().optional(),
  description: yup.string().optional(),
  amount: yup.number().optional().min(0, 'Сумма не может быть отрицательной'),
  currency: yup.string().optional(),
  client_id: yup.string().optional(),
  responsible_user_id: yup.string().optional(),
})

type UpdateDealFormFields = yup.InferType<typeof updateDealSchema>

export const useUpdateDeal = (
  dealId: string,
  initialData: Deal,
  onSuccess?: (deal: Deal) => void,
) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit, reset } = useForm<UpdateDealFormFields>({
    resolver: yupResolver(updateDealSchema),
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      amount: initialData.amount || undefined,
      currency: initialData.currency || 'RUB',
      client_id: initialData.client_id || undefined,
      responsible_user_id: initialData.responsible_user_id || '',
    },
  })

  const updateDeal = handleSubmit(async (values: UpdateDealFormFields) => {
    setLoading(true)
    try {
      // Отправляем только измененные поля (не undefined)
      const updateData: Partial<UpdateDealFormFields> = {}
      if (values.title !== undefined && values.title !== '') {
        updateData.title = values.title
      }
      if (values.description !== undefined) {
        updateData.description = values.description || undefined
      }
      if (values.amount !== undefined) {
        updateData.amount = values.amount || undefined
      }
      if (values.currency !== undefined) {
        updateData.currency = values.currency || undefined
      }
      if (values.client_id !== undefined && values.client_id !== '') {
        updateData.client_id = values.client_id || undefined
      }
      if (values.responsible_user_id !== undefined && values.responsible_user_id !== '') {
        updateData.responsible_user_id = values.responsible_user_id || undefined
      }

      const response: AxiosResponse<UpdateDealApiResponse> = await httpClient.patch(`/deals/${dealId}`, updateData)

      if (response.data.status && response.data.data) {
        showNotification({ message: 'Сделка успешно обновлена!', variant: 'success' })
        if (onSuccess) {
          onSuccess(response.data.data)
        }
        return response.data.data
      } else {
        const errors = response.data.message?.errors || []
        if (errors.length > 0) {
          const errorMessages = errors.map((err) => err.text).join('. ')
          showNotification({ message: errorMessages, variant: 'danger' })
        } else {
          const errorMessage = response.data.message?.text || 'Ошибка при обновлении сделки'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
    } catch (err: any) {
      console.error('Error updating deal:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при обновлении сделки'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return {
    control,
    updateDeal,
    loading,
    reset,
  }
}

