import React, { useState, useEffect } from 'react'
import { Card, CardBody, Form, Button, Alert, Badge } from 'react-bootstrap'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration'
import { useTelegramConnection } from '@/hooks/useTelegramConnection'
import type { CreateTelegramIntegrationParams, UpdateTelegramIntegrationParams } from '@/types/telegram'

const integrationSchema = yup.object({
  name: yup.string().required('Пожалуйста, введите название интеграции'),
  bot_token: yup.string().required('Пожалуйста, введите Bot Token'),
  chat_id: yup.string(),
})

type IntegrationFormFields = yup.InferType<typeof integrationSchema>

interface TelegramSettingsProps {
  onIntegrationUpdated?: () => void
}

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ onIntegrationUpdated }) => {
  const { createIntegration, getIntegration, updateIntegration, loading } = useTelegramIntegration()
  const { testConnection, connected, loading: connectionLoading } = useTelegramConnection()
  const [existingIntegration, setExistingIntegration] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  const { control, handleSubmit, reset } = useForm<IntegrationFormFields>({
    resolver: yupResolver(integrationSchema),
    defaultValues: {
      name: '',
      bot_token: '',
      chat_id: '',
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
        bot_token: '', // Не показываем реальный токен
        chat_id: '',
      })
    }
  }

  const onSubmit = async (values: IntegrationFormFields) => {
    // Проверяем, что все обязательные поля заполнены для создания
    const hasAllRequiredFields = values.bot_token
    
    if (isEditing && existingIntegration && existingIntegration.id) {
      // Обновляем существующую интеграцию
      const updateParams: UpdateTelegramIntegrationParams = {
        name: values.name,
      }
      
      // Добавляем только те поля, которые заполнены
      if (values.bot_token) {
        updateParams.bot_token = values.bot_token
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
        bot_token: values.bot_token,
        chat_id: values.chat_id || undefined,
        is_active: true,
      }
      
      console.log('Creating new integration')
      await createIntegration(createParams)
    } else {
      // Если нет всех полей, но есть интеграция, пытаемся обновить через PATCH без ID
      // (бэкенд создаст интеграцию, если её нет)
      const updateParams: UpdateTelegramIntegrationParams = {
        name: values.name,
      }
      
      if (values.bot_token) {
        updateParams.bot_token = values.bot_token
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
            Для начала работы с Telegram интеграцией:
            <ol className="mb-0 mt-2">
              <li>Откройте Telegram и найдите <strong>@BotFather</strong></li>
              <li>Отправьте команду <code>/newbot</code> и следуйте инструкциям</li>
              <li>Скопируйте полученный <strong>Bot Token</strong> и вставьте ниже</li>
              <li>Опционально: укажите <strong>Chat ID</strong> для отправки уведомлений</li>
            </ol>
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <TextFormInput
            control={control}
            name="name"
            label="Название интеграции"
            placeholder="Например: CRM Telegram Bot"
            required
          />

          <TextFormInput
            control={control}
            name="bot_token"
            label="Bot Token"
            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            required
            type="password"
            helpText="Получите Bot Token от @BotFather в Telegram"
          />

          <TextFormInput
            control={control}
            name="chat_id"
            label="Chat ID (опционально)"
            placeholder="@username или -1001234567890"
            helpText="ID чата для отправки уведомлений. Можно оставить пустым и указывать при отправке сообщений."
          />

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

