import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import type { DealCategory } from './useDealCategories'

interface UpdateStagesApiResponse {
  status: boolean
  data?: DealCategory
  message?: {
    text?: string
    errors?: Array<{ code: number; text: string }>
  }
}

const addStageSchema = yup.object({
  name: yup.string().required('Пожалуйста, введите название стадии'),
  order: yup.number().required('Пожалуйста, введите порядок стадии').min(1, 'Порядок должен быть больше 0'),
  color: yup.string().optional(),
})

type AddStageFormFields = yup.InferType<typeof addStageSchema>

export const useAddDealStage = (categoryId: string, currentStages: DealCategory['stages'], onSuccess?: (category: DealCategory) => void) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  // Вычисляем следующий порядок стадии
  const nextOrder = currentStages.length > 0 ? Math.max(...currentStages.map((s) => s.order)) + 1 : 1

  const { control, handleSubmit, reset } = useForm<AddStageFormFields>({
    resolver: yupResolver(addStageSchema),
    defaultValues: {
      name: '',
      order: nextOrder,
      color: '#6c757d',
    },
  })

  const addStage = handleSubmit(async (values: AddStageFormFields) => {
    setLoading(true)
    try {
      // Создаем новый список стадий с добавленной стадией
      // ВАЖНО: для существующих стадий передаём их id, чтобы сохранить связь со сделками
      const newStages = [
        ...currentStages.map((stage) => ({
          id: stage.id, // Сохраняем id существующих стадий!
          name: stage.name,
          order: stage.order,
          color: stage.color || undefined,
        })),
        {
          // Новая стадия без id - бэкенд сгенерирует новый
          name: values.name,
          order: values.order,
          color: values.color || undefined,
        },
      ]

      const response: AxiosResponse<UpdateStagesApiResponse> = await httpClient.put(`/deals/categories/${categoryId}/stages`, {
        stages: newStages,
      })

      if (response.data.status && response.data.data) {
        showNotification({ message: 'Стадия успешно добавлена!', variant: 'success' })
        reset({
          name: '',
          order: nextOrder + 1,
          color: '#6c757d',
        })
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
          const errorMessage = response.data.message?.text || 'Ошибка при добавлении стадии'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
    } catch (err: any) {
      console.error('Error adding deal stage:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при добавлении стадии'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return {
    control,
    addStage,
    loading,
    reset,
    nextOrder,
  }
}

