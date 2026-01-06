import React, { useState, useEffect } from 'react'
import { Card, CardBody, Form, Button, Alert, Badge } from 'react-bootstrap'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import { useZoomIntegration } from '@/hooks/useZoomIntegration'
import { useZoomConnection } from '@/hooks/useZoomConnection'
import type { CreateZoomIntegrationParams, UpdateZoomIntegrationParams } from '@/types/zoom'

const integrationSchema = yup.object({
  name: yup.string().required('Пожалуйста, введите название интеграции'),
  account_id: yup.string().required('Пожалуйста, введите Account ID'),
  client_id: yup.string().required('Пожалуйста, введите Client ID'),
  client_secret: yup.string().required('Пожалуйста, введите Client Secret'),
})

type IntegrationFormFields = yup.InferType<typeof integrationSchema>

interface ZoomSettingsProps {
  onIntegrationUpdated?: () => void
}

const ZoomSettings: React.FC<ZoomSettingsProps> = ({ onIntegrationUpdated }) => {
  const { createIntegration, getIntegration, updateIntegration, loading } = useZoomIntegration()
  const { testConnection, isConnected, loading: connectionLoading } = useZoomConnection()
  const [existingIntegration, setExistingIntegration] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  const { control, handleSubmit, reset } = useForm<IntegrationFormFields>({
    resolver: yupResolver(integrationSchema),
    defaultValues: {
      name: '',
      account_id: '',
      client_id: '',
      client_secret: '',
    },
  })

  useEffect(() => {
    loadIntegration()
  }, [])

  const loadIntegration = async () => {
    const integration = await getIntegration()
    if (integration) {
      setExistingIntegration(integration)
      setIsEditing(true)
      reset({
        name: integration.name,
        account_id: '', // Не показываем реальные ключи
        client_id: '',
        client_secret: '',
      })
    }
  }

  const onSubmit = async (values: IntegrationFormFields) => {
    // Проверяем, что все обязательные поля заполнены для создания
    const hasAllRequiredFields = values.account_id && values.client_id && values.client_secret
    
    if (isEditing && existingIntegration && existingIntegration.id) {
      // Обновляем существующую интеграцию
      const updateParams: UpdateZoomIntegrationParams = {
        name: values.name,
      }
      
      // Добавляем только те поля, которые заполнены
      if (values.account_id) {
        updateParams.account_id = values.account_id
      }
      if (values.client_id) {
        updateParams.client_id = values.client_id
      }
      if (values.client_secret) {
        updateParams.client_secret = values.client_secret
      }
      
      console.log('Updating integration with ID:', existingIntegration.id)
      await updateIntegration(existingIntegration.id, updateParams)
    } else if (hasAllRequiredFields) {
      // Создаем новую интеграцию
      const createParams: CreateZoomIntegrationParams = {
        name: values.name,
        account_id: values.account_id,
        client_id: values.client_id,
        client_secret: values.client_secret,
        is_active: true,
      }
      
      console.log('Creating new integration')
      await createIntegration(createParams)
    } else {
      // Если нет всех полей, но есть интеграция, пытаемся обновить через PATCH без ID
      // (бэкенд создаст интеграцию, если её нет)
      const updateParams: UpdateZoomIntegrationParams = {
        name: values.name,
      }
      
      if (values.account_id) {
        updateParams.account_id = values.account_id
      }
      if (values.client_id) {
        updateParams.client_id = values.client_id
      }
      if (values.client_secret) {
        updateParams.client_secret = values.client_secret
      }
      
      console.log('Updating/Creating integration (no ID)')
      await updateIntegration(null, updateParams)
    }
    
    await loadIntegration()
    if (onIntegrationUpdated) {
      onIntegrationUpdated()
    }
  }

  const handleTestConnection = async () => {
    await testConnection()
  }

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Настройки Zoom</h5>
          {existingIntegration && (
            <div className="d-flex align-items-center gap-2">
              {isConnected !== null && (
                <Badge bg={isConnected ? 'success' : 'danger'}>
                  {isConnected ? 'Подключено' : 'Не подключено'}
                </Badge>
              )}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleTestConnection}
                disabled={connectionLoading || !existingIntegration}
              >
                <IconifyIcon icon="bx:refresh" className="me-1" />
                Проверить соединение
              </Button>
            </div>
          )}
        </div>

        {existingIntegration && (
          <Alert variant="info" className="mb-3">
            <IconifyIcon icon="bx:info-circle" className="me-2" />
            Интеграция уже настроена. Для обновления заполните только те поля, которые хотите изменить.
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <TextFormInput
            control={control}
            name="name"
            containerClassName="mb-3"
            label="Название интеграции"
            placeholder="Например: Zoom Production"
          />

          <TextFormInput
            control={control}
            name="account_id"
            containerClassName="mb-3"
            label="Account ID"
            type="password"
            placeholder={isEditing ? 'Оставьте пустым, если не хотите менять' : 'Введите Account ID'}
          />

          <TextFormInput
            control={control}
            name="client_id"
            containerClassName="mb-3"
            label="Client ID"
            type="password"
            placeholder={isEditing ? 'Оставьте пустым, если не хотите менять' : 'Введите Client ID'}
          />

          <TextFormInput
            control={control}
            name="client_secret"
            containerClassName="mb-3"
            label="Client Secret"
            type="password"
            placeholder={isEditing ? 'Оставьте пустым, если не хотите менять' : 'Введите Client Secret'}
          />

          <div className="d-flex gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <IconifyIcon icon="bx:save" className="me-2" />
                  {isEditing ? 'Обновить' : 'Создать'} интеграцию
                </>
              )}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}

export default ZoomSettings

