import { yupResolver } from '@hookform/resolvers/yup'
import type { AxiosResponse } from 'axios'
import { useEffect, useState } from 'react'
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

const updateStageSchema = yup.object({
  name: yup.string().required('Пожалуйста, введите название стадии'),
  order: yup.number().required('Пожалуйста, введите порядок стадии').min(1, 'Порядок должен быть больше 0'),
  color: yup.string().optional(),
})

type UpdateStageFormFields = yup.InferType<typeof updateStageSchema>

export const useUpdateDealStage = (
  categoryId: string,
  currentStages: DealCategory['stages'],
  stageId: string,
  onSuccess?: (category: DealCategory) => void,
) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotificationContext()

  // Находим редактируемую стадию
  const stageToEdit = currentStages.find((s) => s.id === stageId)

  const { control, handleSubmit, reset } = useForm<UpdateStageFormFields>({
    resolver: yupResolver(updateStageSchema),
    defaultValues: {
      name: stageToEdit?.name || '',
      order: stageToEdit?.order || 1,
      color: stageToEdit?.color || '#6c757d',
    },
  })

  // Обновляем значения формы при изменении стадии
  useEffect(() => {
    if (stageToEdit) {
      reset({
        name: stageToEdit.name || '',
        order: stageToEdit.order || 1,
        color: stageToEdit.color || '#6c757d',
      })
    }
  }, [stageToEdit, reset])

  const updateStage = handleSubmit(async (values: UpdateStageFormFields) => {
    setLoading(true)
    try {
      // Создаем обновленный список стадий, заменяя редактируемую стадию
      // ВАЖНО: передаём id всех стадий, чтобы сохранить связь со сделками
      const updatedStages = currentStages.map((stage) => {
        if (stage.id === stageId) {
          return {
            id: stage.id, // Сохраняем id стадии!
            name: values.name,
            order: values.order,
            color: values.color || undefined,
          }
        }
        return {
          id: stage.id, // Сохраняем id стадии!
          name: stage.name,
          order: stage.order,
          color: stage.color || undefined,
        }
      })

      const response: AxiosResponse<UpdateStagesApiResponse> = await httpClient.put(`/deals/categories/${categoryId}/stages`, {
        stages: updatedStages,
      })

      if (response.data.status && response.data.data) {
        showNotification({ message: 'Стадия успешно обновлена!', variant: 'success' })
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
          const errorMessage = response.data.message?.text || 'Ошибка при обновлении стадии'
          showNotification({ message: errorMessage, variant: 'danger' })
        }
      }
    } catch (err: any) {
      console.error('Error updating deal stage:', err)
      const errors = err.response?.data?.message?.errors || []
      if (errors.length > 0) {
        const errorMessages = errors.map((error: { text: string }) => error.text).join('. ')
        showNotification({ message: errorMessages, variant: 'danger' })
      } else {
        const errorMessage = err.response?.data?.message?.text || err.message || 'Ошибка при обновлении стадии'
        showNotification({ message: errorMessage, variant: 'danger' })
      }
    } finally {
      setLoading(false)
    }
  })

  return {
    control,
    updateStage,
    loading,
    reset,
  }
}

