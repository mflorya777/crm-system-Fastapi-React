import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { BuyerCategory } from './useBuyerCategories'

interface CreateBuyerCategoryApiResponse {
  status: boolean
  data?: BuyerCategory
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

const createCategorySchema = yup.object({
  name: yup.string().required('Пожалуйста, введите название категории'),
  description: yup.string().optional(),
})

type CreateCategoryFormFields = yup.InferType<typeof createCategorySchema>

export const useCreateBuyerCategory = (onSuccess?: (category: BuyerCategory) => void) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit, reset } = useForm<CreateCategoryFormFields>({
    resolver: yupResolver(createCategorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const createCategory = handleSubmit(async (values: CreateCategoryFormFields) => {
    setLoading(true)
    try {
      const response: AxiosResponse<CreateBuyerCategoryApiResponse> = await httpClient.post('/buyers/categories', {
        name: values.name,
        description: values.description || undefined,
        stages: [], // Начальный пустой список стадий
      })

      if (response.data.status && response.data.data) {
        showNotification({ message: 'Категория успешно создана!', variant: 'success' })
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
          const errorMessage = response.data.message?.text || 'Ошибка при создании категории'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
    } catch (err: any) {
      console.error('Error creating buyer category:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при создании категории'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return {
    control,
    createCategory,
    loading,
    reset,
  }
}

