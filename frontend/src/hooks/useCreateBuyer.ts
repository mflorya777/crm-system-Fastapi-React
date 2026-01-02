import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { Buyer } from './useBuyersByCategory'

interface CreateBuyerApiResponse {
  status: boolean
  data?: Buyer
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

const createBuyerSchema = yup.object({
  name: yup.string().required('Пожалуйста, введите имя покупателя'),
  email: yup.string().email('Неверный формат email').optional(),
  phone: yup.string().optional(),
  company: yup.string().optional(),
  address: yup.string().optional(),
  notes: yup.string().optional(),
  value: yup.number().optional().min(0, 'Сумма не может быть отрицательной'),
  currency: yup.string().optional(),
  source: yup.string().optional(),
  responsible_user_id: yup.string().required('Пожалуйста, выберите ответственного'),
  stage_id: yup.string().required('Пожалуйста, выберите стадию'),
})

type CreateBuyerFormFields = yup.InferType<typeof createBuyerSchema>

export const useCreateBuyer = (
  categoryId: string,
  defaultStageId?: string,
  defaultResponsibleUserId?: string,
  onSuccess?: (buyer: Buyer) => void,
) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit, reset } = useForm<CreateBuyerFormFields>({
    resolver: yupResolver(createBuyerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
      value: undefined,
      currency: 'RUB',
      source: '',
      responsible_user_id: defaultResponsibleUserId || '',
      stage_id: defaultStageId || '',
    },
  })

  const createBuyer = handleSubmit(async (values: CreateBuyerFormFields) => {
    setLoading(true)
    try {
      const response: AxiosResponse<CreateBuyerApiResponse> = await httpClient.post('/buyers', {
        category_id: categoryId,
        stage_id: values.stage_id,
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        company: values.company || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
        value: values.value !== undefined ? values.value : undefined,
        currency: values.currency || 'RUB',
        source: values.source || undefined,
        responsible_user_id: values.responsible_user_id,
      })

      if (response.data.status && response.data.data) {
        showNotification({ message: 'Покупатель успешно создан!', variant: 'success' })
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
          const errorMessage = response.data.message?.text || 'Ошибка при создании покупателя'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
    } catch (err: any) {
      console.error('Error creating buyer:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при создании покупателя'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return {
    control,
    createBuyer,
    loading,
    reset,
  }
}

