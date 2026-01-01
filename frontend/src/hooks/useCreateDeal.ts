import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { Deal } from './useDealsByCategory'

interface CreateDealApiResponse {
  status: boolean
  data?: Deal
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

const createDealSchema = yup.object({
  title: yup.string().required('Пожалуйста, введите название сделки'),
  description: yup.string().optional(),
  amount: yup.number().optional().min(0, 'Сумма не может быть отрицательной'),
  currency: yup.string().optional(),
  client_id: yup.string().optional(),
  responsible_user_id: yup.string().required('Пожалуйста, выберите ответственного'),
})

type CreateDealFormFields = yup.InferType<typeof createDealSchema>

export const useCreateDeal = (
  categoryId: string,
  stageId: string,
  defaultResponsibleUserId?: string,
  onSuccess?: (deal: Deal) => void,
) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit, reset } = useForm<CreateDealFormFields>({
    resolver: yupResolver(createDealSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: undefined,
      currency: 'RUB',
      client_id: undefined,
      responsible_user_id: defaultResponsibleUserId || '',
    },
  })

  const createDeal = handleSubmit(async (values: CreateDealFormFields) => {
    setLoading(true)
    try {
      const response: AxiosResponse<CreateDealApiResponse> = await httpClient.post('/deals', {
        category_id: categoryId,
        stage_id: stageId,
        title: values.title,
        description: values.description || undefined,
        amount: values.amount || undefined,
        currency: values.currency || 'RUB',
        client_id: values.client_id || undefined,
        responsible_user_id: values.responsible_user_id,
      })

      if (response.data.status && response.data.data) {
        showNotification({ message: 'Сделка успешно создана!', variant: 'success' })
        reset()
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
          const errorMessage = response.data.message?.text || 'Ошибка при создании сделки'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
    } catch (err: any) {
      console.error('Error creating deal:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при создании сделки'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return {
    control,
    createDeal,
    loading,
    reset,
  }
}

