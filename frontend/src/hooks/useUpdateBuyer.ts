import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { Buyer } from './useBuyersByCategory'

interface UpdateBuyerApiResponse {
  status: boolean
  data?: Buyer
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

const updateBuyerSchema = yup.object({
  name: yup.string().optional(),
  email: yup.string().email('Неверный формат email').optional(),
  phone: yup.string().optional(),
  company: yup.string().optional(),
  address: yup.string().optional(),
  notes: yup.string().optional(),
  value: yup.number().optional().min(0, 'Сумма не может быть отрицательной'),
  currency: yup.string().optional(),
  source: yup.string().optional(),
  responsible_user_id: yup.string().optional(),
})

type UpdateBuyerFormFields = yup.InferType<typeof updateBuyerSchema>

export const useUpdateBuyer = (
  buyerId: string,
  initialData: Buyer,
  onSuccess?: (buyer: Buyer) => void,
) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit, reset } = useForm<UpdateBuyerFormFields>({
    resolver: yupResolver(updateBuyerSchema),
    defaultValues: {
      name: initialData.name || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      company: initialData.company || '',
      address: initialData.address || '',
      notes: initialData.notes || '',
      value: initialData.value || undefined,
      currency: initialData.currency || 'RUB',
      source: initialData.source || '',
      responsible_user_id: initialData.responsible_user_id || '',
    },
  })

  const updateBuyer = handleSubmit(async (values: UpdateBuyerFormFields) => {
    setLoading(true)
    try {
      // Отправляем только измененные поля (не undefined)
      const updateData: Partial<UpdateBuyerFormFields> = {}
      if (values.name !== undefined && values.name !== '') {
        updateData.name = values.name
      }
      if (values.email !== undefined) {
        updateData.email = values.email || undefined
      }
      if (values.phone !== undefined) {
        updateData.phone = values.phone || undefined
      }
      if (values.company !== undefined) {
        updateData.company = values.company || undefined
      }
      if (values.address !== undefined) {
        updateData.address = values.address || undefined
      }
      if (values.notes !== undefined) {
        updateData.notes = values.notes || undefined
      }
      if (values.value !== undefined) {
        updateData.value = values.value
      }
      if (values.currency !== undefined) {
        updateData.currency = values.currency || undefined
      }
      if (values.source !== undefined) {
        updateData.source = values.source || undefined
      }
      if (values.responsible_user_id !== undefined && values.responsible_user_id !== '') {
        updateData.responsible_user_id = values.responsible_user_id || undefined
      }

      const response: AxiosResponse<UpdateBuyerApiResponse> = await httpClient.patch(`/buyers/${buyerId}`, updateData)

      if (response.data.status && response.data.data) {
        showNotification({ message: 'Покупатель успешно обновлен!', variant: 'success' })
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
          const errorMessage = response.data.message?.text || 'Ошибка при обновлении покупателя'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
    } catch (err: any) {
      console.error('Error updating buyer:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при обновлении покупателя'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return {
    control,
    updateBuyer,
    loading,
    reset,
  }
}

