import React, { useState, useEffect } from 'react'
import { Card, CardBody, Form, Button, Alert, Badge } from 'react-bootstrap'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import { useTelegramMessages } from '@/hooks/useTelegramMessages'
import type { WebhookInfo } from '@/types/telegram'

const webhookSchema = yup.object({
  url: yup.string().url('Пожалуйста, введите корректный URL').required('Пожалуйста, введите URL для webhook'),
  max_connections: yup.number().min(1).max(100),
})

type WebhookFormFields = yup.InferType<typeof webhookSchema>

const WebhookSettings: React.FC = () => {
  const { getWebhookInfo, setWebhook, deleteWebhook, loading } = useTelegramMessages()
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  const { control, handleSubmit, reset } = useForm<WebhookFormFields>({
    resolver: yupResolver(webhookSchema),
    defaultValues: {
      url: '',
      max_connections: 40,
    },
  })

  useEffect(() => {
    loadWebhookInfo()
  }, [])

  const loadWebhookInfo = async () => {
    setLoadingInfo(true)
    const info = await getWebhookInfo()
    if (info) {
      setWebhookInfo(info)
      reset({
        url: info.url || '',
        max_connections: 40,
      })
    }
    setLoadingInfo(false)
  }

  const onSubmit = async (values: WebhookFormFields) => {
    const success = await setWebhook(
      values.url,
      values.max_connections,
      ['message', 'edited_message'], // Разрешенные типы обновлений
    )
    if (success) {
      await loadWebhookInfo()
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить webhook?')) {
      const success = await deleteWebhook()
      if (success) {
        await loadWebhookInfo()
        reset({
          url: '',
          max_connections: 40,
        })
      }
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Настройки Webhook</h4>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={loadWebhookInfo}
            disabled={loadingInfo}
          >
            {loadingInfo ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Загрузка...
              </>
            ) : (
              <>
                <IconifyIcon icon="mdi:refresh" className="me-2" />
                Обновить
              </>
            )}
          </Button>
        </div>

        <Alert variant="info" className="mb-4">
          <IconifyIcon icon="mdi:information" className="me-2" />
          <strong>Webhook</strong> позволяет получать обновления от Telegram в реальном времени.
          <br />
          Укажите публичный URL вашего сервера, который будет принимать POST-запросы от Telegram.
        </Alert>

        {webhookInfo && (
          <div className="mb-4">
            <h5>Текущий webhook</h5>
            <div className="mb-2">
              <strong>URL:</strong>{' '}
              {webhookInfo.url ? (
                <code>{webhookInfo.url}</code>
              ) : (
                <Badge bg="secondary">Не установлен</Badge>
              )}
            </div>
            {webhookInfo.url && (
              <>
                <div className="mb-2">
                  <strong>Ожидающих обновлений:</strong>{' '}
                  <Badge bg={webhookInfo.pending_update_count > 0 ? 'warning' : 'success'}>
                    {webhookInfo.pending_update_count}
                  </Badge>
                </div>
                {webhookInfo.last_error_message && (
                  <Alert variant="danger" className="mt-2">
                    <strong>Последняя ошибка:</strong> {webhookInfo.last_error_message}
                    {webhookInfo.last_error_date && (
                      <div className="text-muted small mt-1">
                        Дата: {new Date(webhookInfo.last_error_date).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </Alert>
                )}
              </>
            )}
          </div>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <TextFormInput
            control={control}
            name="url"
            label="URL для webhook"
            placeholder="https://your-domain.com/api/telegram/webhook"
            required
            helpText="Публичный URL вашего сервера для приема обновлений от Telegram"
          />

          <TextFormInput
            control={control}
            name="max_connections"
            label="Максимальное количество соединений"
            type="number"
            helpText="Максимальное количество одновременных HTTPS-соединений (1-100, по умолчанию 40)"
          />

          <div className="d-flex gap-2 mt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || loadingInfo}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Установка...
                </>
              ) : (
                <>
                  <IconifyIcon icon="mdi:content-save" className="me-2" />
                  {webhookInfo?.url ? 'Обновить webhook' : 'Установить webhook'}
                </>
              )}
            </Button>

            {webhookInfo?.url && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={loading || loadingInfo}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <IconifyIcon icon="mdi:delete" className="me-2" />
                    Удалить webhook
                  </>
                )}
              </Button>
            )}
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}

export default WebhookSettings

