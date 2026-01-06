import React, { useState, useEffect } from 'react'
import { Card, CardBody, Form, Button, Alert, Badge } from 'react-bootstrap'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import { useTelephonyIntegration } from '@/hooks/useTelephonyIntegration'
import { useTelephonyConnection } from '@/hooks/useTelephonyConnection'
import type { CreateMangoOfficeIntegrationParams, UpdateMangoOfficeIntegrationParams } from '@/types/telephony'

const integrationSchema = yup.object({
  name: yup.string().required('Пожалуйста, введите название интеграции'),
  api_key: yup.string().required('Пожалуйста, введите API ключ'),
  api_salt: yup.string().required('Пожалуйста, введите соль для API ключа'),
  vpbx_api_key: yup.string().required('Пожалуйста, введите VPBX API ключ'),
  vpbx_api_salt: yup.string().required('Пожалуйста, введите соль для VPBX API ключа'),
})

type IntegrationFormFields = yup.InferType<typeof integrationSchema>

interface TelephonySettingsProps {
  onIntegrationUpdated?: () => void
}

const TelephonySettings: React.FC<TelephonySettingsProps> = ({ onIntegrationUpdated }) => {
  const { createIntegration, getIntegrations, updateIntegration, loading } = useTelephonyIntegration()
  const { testConnection, isConnected, loading: connectionLoading } = useTelephonyConnection()
  const [existingIntegration, setExistingIntegration] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  const { control, handleSubmit, reset } = useForm<IntegrationFormFields>({
    resolver: yupResolver(integrationSchema),
    defaultValues: {
      name: '',
      api_key: '',
      api_salt: '',
      vpbx_api_key: '',
      vpbx_api_salt: '',
    },
  })

  useEffect(() => {
    loadIntegration()
  }, [])

  const loadIntegration = async () => {
    const integrations = await getIntegrations()
    if (integrations.length > 0) {
      const integration = integrations[0]
      setExistingIntegration(integration)
      setIsEditing(true)
      reset({
        name: integration.name,
        api_key: '', // Не показываем реальные ключи
        api_salt: '',
        vpbx_api_key: '',
        vpbx_api_salt: '',
      })
    }
  }

  const onSubmit = async (values: IntegrationFormFields) => {
    if (isEditing && existingIntegration) {
      const updateParams: UpdateMangoOfficeIntegrationParams = {
        name: values.name,
        api_key: values.api_key || undefined,
        api_salt: values.api_salt || undefined,
        vpbx_api_key: values.vpbx_api_key || undefined,
        vpbx_api_salt: values.vpbx_api_salt || undefined,
      }
      
      // Удаляем undefined значения
      Object.keys(updateParams).forEach((key) => {
        if (updateParams[key as keyof UpdateMangoOfficeIntegrationParams] === undefined) {
          delete updateParams[key as keyof UpdateMangoOfficeIntegrationParams]
        }
      })

      await updateIntegration(existingIntegration.id, updateParams)
    } else {
      const createParams: CreateMangoOfficeIntegrationParams = {
        name: values.name,
        api_key: values.api_key,
        api_salt: values.api_salt,
        vpbx_api_key: values.vpbx_api_key,
        vpbx_api_salt: values.vpbx_api_salt,
        is_active: true,
      }
      
      await createIntegration(createParams)
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
          <h5 className="mb-0">Настройки Mango Office</h5>
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
            placeholder="Например: Mango Office Production"
          />

          <TextFormInput
            control={control}
            name="api_key"
            containerClassName="mb-3"
            label="API ключ"
            type="password"
            placeholder={isEditing ? 'Оставьте пустым, если не хотите менять' : 'Введите API ключ'}
          />

          <TextFormInput
            control={control}
            name="api_salt"
            containerClassName="mb-3"
            label="Соль для API ключа"
            type="password"
            placeholder={isEditing ? 'Оставьте пустым, если не хотите менять' : 'Введите соль'}
          />

          <TextFormInput
            control={control}
            name="vpbx_api_key"
            containerClassName="mb-3"
            label="VPBX API ключ"
            type="password"
            placeholder={isEditing ? 'Оставьте пустым, если не хотите менять' : 'Введите VPBX API ключ'}
          />

          <TextFormInput
            control={control}
            name="vpbx_api_salt"
            containerClassName="mb-3"
            label="Соль для VPBX API ключа"
            type="password"
            placeholder={isEditing ? 'Оставьте пустым, если не хотите менять' : 'Введите соль для VPBX'}
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

export default TelephonySettings

