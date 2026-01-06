import React, { useState, useEffect } from 'react'
import { Card, CardBody, Form, Button, Alert, Badge } from 'react-bootstrap'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration'
import { useTelegramConnection } from '@/hooks/useTelegramConnection'
import type { CreateTelegramIntegrationParams, UpdateTelegramIntegrationParams } from '@/types/telegram'

type IntegrationFormFields = {
  name: string
  integration_type: 'bot' | 'user'
  bot_token?: string
  phone_number?: string
  api_id?: string
  api_hash?: string
  chat_id?: string
}

const integrationSchema = yup.object({
  name: yup.string().required('Пожалуйста, введите название интеграции'),
  integration_type: yup.string().oneOf(['bot', 'user']).required(),
  bot_token: yup.string(),
  phone_number: yup.string(),
  api_id: yup.string(),
  api_hash: yup.string(),
  chat_id: yup.string(),
})

interface TelegramSettingsProps {
  onIntegrationUpdated?: () => void
}

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ onIntegrationUpdated }) => {
  const { createIntegration, getIntegration, updateIntegration, loading } = useTelegramIntegration()
  const { testConnection, connected, loading: connectionLoading } = useTelegramConnection()
  const [existingIntegration, setExistingIntegration] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [integrationType, setIntegrationType] = useState<'bot' | 'user'>('bot')

  const { control, handleSubmit, reset, watch } = useForm<IntegrationFormFields>({
    resolver: yupResolver(integrationSchema),
    defaultValues: {
      name: '',
      integration_type: 'bot',
      bot_token: '',
      phone_number: '',
      api_id: '',
      api_hash: '',
      chat_id: '',
    },
  })

  const watchedIntegrationType = watch('integration_type')
  const currentIntegrationType = (watchedIntegrationType || integrationType) as 'bot' | 'user'
  
  // Обновляем локальное состояние при изменении через watch
  useEffect(() => {
    if (watchedIntegrationType && watchedIntegrationType !== integrationType) {
      setIntegrationType(watchedIntegrationType as 'bot' | 'user')
    }
  }, [watchedIntegrationType])

  useEffect(() => {
    loadIntegration()
  }, [])

  const loadIntegration = async () => {
    const integration = await getIntegration()
    if (integration) {
      setExistingIntegration(integration)
      setIsEditing(true)
      const intType = integration.integration_type || 'bot'
      setIntegrationType(intType)
      reset({
        name: integration.name,
        integration_type: intType,
        bot_token: '', // Не показываем реальные данные
        phone_number: '',
        api_id: '',
        api_hash: '',
        chat_id: '',
      })
    }
  }

  const onSubmit = async (values: IntegrationFormFields) => {
    const intType = values.integration_type || currentIntegrationType || 'bot'
    
    // Проверяем обязательные поля в зависимости от типа
    const hasBotFields = intType === 'bot' && values.bot_token?.trim()
    const hasUserFields = intType === 'user' && values.phone_number?.trim() && values.api_id?.trim() && values.api_hash?.trim()
    const hasAllRequiredFields = hasBotFields || hasUserFields
    
    if (isEditing && existingIntegration && existingIntegration.id) {
      // Обновляем существующую интеграцию
      const updateParams: UpdateTelegramIntegrationParams = {
        name: values.name,
        integration_type: intType,
      }
      
      // Добавляем поля в зависимости от типа
      if (intType === 'bot' && values.bot_token) {
        updateParams.bot_token = values.bot_token
      } else if (intType === 'user') {
        if (values.phone_number) updateParams.phone_number = values.phone_number
        if (values.api_id) updateParams.api_id = values.api_id
        if (values.api_hash) updateParams.api_hash = values.api_hash
      }
      
      if (values.chat_id) {
        updateParams.chat_id = values.chat_id
      }
      
      console.log('Updating integration with ID:', existingIntegration.id)
      await updateIntegration(existingIntegration.id, updateParams)
    } else if (hasAllRequiredFields) {
      // Создаем новую интеграцию
      const createParams: CreateTelegramIntegrationParams = {
        name: values.name,
        integration_type: intType,
        is_active: true,
      }
      
      if (intType === 'bot') {
        createParams.bot_token = values.bot_token
      } else {
        createParams.phone_number = values.phone_number
        createParams.api_id = values.api_id
        createParams.api_hash = values.api_hash
      }
      
      if (values.chat_id) {
        createParams.chat_id = values.chat_id
      }
      
      console.log('Creating new integration')
      await createIntegration(createParams)
    } else {
      // Если нет всех полей, но есть интеграция, пытаемся обновить через PATCH без ID
      const updateParams: UpdateTelegramIntegrationParams = {
        name: values.name,
        integration_type: intType,
      }
      
      if (intType === 'bot' && values.bot_token) {
        updateParams.bot_token = values.bot_token
      } else if (intType === 'user') {
        if (values.phone_number) updateParams.phone_number = values.phone_number
        if (values.api_id) updateParams.api_id = values.api_id
        if (values.api_hash) updateParams.api_hash = values.api_hash
      }
      
      if (values.chat_id) {
        updateParams.chat_id = values.chat_id
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Настройки Telegram</h4>
          {existingIntegration && (
            <Badge bg={existingIntegration.is_active ? 'success' : 'secondary'}>
              {existingIntegration.is_active ? 'Активна' : 'Неактивна'}
            </Badge>
          )}
        </div>

        {!existingIntegration && (
          <Alert variant="info" className="mb-4">
            <IconifyIcon icon="mdi:information" className="me-2" />
            Выберите тип интеграции:
            <ul className="mb-0 mt-2">
              <li><strong>Бот:</strong> Создайте бота через @BotFather и получите Bot Token</li>
              <li><strong>Личный аккаунт:</strong> Используйте свой аккаунт Telegram (требует API ID и API Hash)</li>
            </ul>
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label">Тип интеграции</label>
            <Controller
              name="integration_type"
              control={control}
              render={({ field }) => (
                <div className="d-flex gap-4">
                  <Form.Check
                    type="radio"
                    id="type-bot"
                    label="Бот"
                    value="bot"
                    checked={field.value === 'bot'}
                    onChange={(e) => {
                      const newType = e.target.value as 'bot' | 'user'
                      field.onChange(newType)
                      setIntegrationType(newType)
                    }}
                  />
                  <Form.Check
                    type="radio"
                    id="type-user"
                    label="Личный аккаунт"
                    value="user"
                    checked={field.value === 'user'}
                    onChange={(e) => {
                      const newType = e.target.value as 'bot' | 'user'
                      field.onChange(newType)
                      setIntegrationType(newType)
                    }}
                  />
                </div>
              )}
            />
          </div>

          <TextFormInput
            control={control}
            name="name"
            label="Название интеграции"
            placeholder="Например: CRM Telegram Bot"
            required
          />

          {currentIntegrationType === 'bot' ? (
            <>
              <TextFormInput
                control={control}
                name="bot_token"
                label="Bot Token"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                required={currentIntegrationType === 'bot'}
                type="password"
              />
              <small className="text-muted d-block mb-3">
                Получите Bot Token от @BotFather в Telegram. Откройте @BotFather, отправьте /newbot и следуйте инструкциям.
              </small>
            </>
          ) : (
            <>
              <Alert variant="warning" className="mb-3">
                <IconifyIcon icon="mdi:alert" className="me-2" />
                <strong>Внимание:</strong> Для использования личного аккаунта необходимо получить API ID и API Hash на <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer">https://my.telegram.org/apps</a>
              </Alert>
              <TextFormInput
                control={control}
                name="phone_number"
                label="Номер телефона"
                placeholder="+79991234567"
                required={currentIntegrationType === 'user'}
              />
              <small className="text-muted d-block mb-3">
                Номер телефона в международном формате (например, +79991234567)
              </small>
              <TextFormInput
                control={control}
                name="api_id"
                label="API ID"
                placeholder="12345678"
                required={currentIntegrationType === 'user'}
              />
              <small className="text-muted d-block mb-3">
                Получите на <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer">https://my.telegram.org/apps</a>
              </small>
              <TextFormInput
                control={control}
                name="api_hash"
                label="API Hash"
                placeholder="abcdef1234567890abcdef1234567890"
                required={currentIntegrationType === 'user'}
                type="password"
              />
              <small className="text-muted d-block mb-3">
                Получите на <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer">https://my.telegram.org/apps</a>
              </small>
            </>
          )}

          <TextFormInput
            control={control}
            name="chat_id"
            label="Chat ID (опционально)"
            placeholder="@username или -1001234567890"
          />
          <small className="text-muted d-block mb-3">
            ID чата для отправки уведомлений. Можно оставить пустым и указывать при отправке сообщений.
          </small>

          <div className="d-flex gap-2 mt-4">
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
              ) : isEditing ? (
                <>
                  <IconifyIcon icon="mdi:content-save" className="me-2" />
                  Обновить интеграцию
                </>
              ) : (
                <>
                  <IconifyIcon icon="mdi:plus" className="me-2" />
                  Создать интеграцию
                </>
              )}
            </Button>

            {existingIntegration && (
              <Button
                type="button"
                variant="outline-primary"
                onClick={handleTestConnection}
                disabled={connectionLoading || loading}
              >
                {connectionLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <IconifyIcon icon="mdi:connection" className="me-2" />
                    Проверить соединение
                  </>
                )}
              </Button>
            )}
          </div>

          {connected !== null && (
            <Alert 
              variant={connected ? 'success' : 'danger'} 
              className="mt-3"
            >
              <IconifyIcon 
                icon={connected ? 'mdi:check-circle' : 'mdi:alert-circle'} 
                className="me-2" 
              />
              {connected ? 'Соединение установлено успешно!' : 'Не удалось установить соединение. Проверьте Bot Token.'}
            </Alert>
          )}
        </Form>
      </CardBody>
    </Card>
  )
}

export default TelegramSettings

