import React, { useState } from 'react'
import { Card, CardBody, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import { useTelegramMessages } from '@/hooks/useTelegramMessages'
import type { SendMessageParams, SendPhotoParams, SendDocumentParams } from '@/types/telegram'

const messageSchema = yup.object({
  chat_id: yup.string().required('Пожалуйста, введите Chat ID или username'),
  text: yup.string(),
  photo: yup.string(),
  document: yup.string(),
  caption: yup.string(),
  parse_mode: yup.string(),
  disable_notification: yup.boolean(),
})

type MessageFormFields = yup.InferType<typeof messageSchema>

const SendMessage: React.FC = () => {
  const { sendMessage, sendPhoto, sendDocument, getChatInfo, loading } = useTelegramMessages()
  const [activeTab, setActiveTab] = useState<string>('message')
  const [lastSentMessage, setLastSentMessage] = useState<any>(null)
  const [chatInfo, setChatInfo] = useState<any>(null)
  const [checkingChat, setCheckingChat] = useState(false)

  const { control, handleSubmit, reset, watch } = useForm<MessageFormFields>({
    resolver: yupResolver(messageSchema),
    defaultValues: {
      chat_id: '',
      text: '',
      photo: '',
      document: '',
      caption: '',
      parse_mode: 'HTML',
      disable_notification: false,
    },
  })

  const onSubmit = async (values: MessageFormFields) => {
    // Валидация в зависимости от активной вкладки
    if (activeTab === 'message' && !values.text?.trim()) {
      return
    }
    if (activeTab === 'photo' && !values.photo?.trim()) {
      return
    }
    if (activeTab === 'document' && !values.document?.trim()) {
      return
    }

    let result = null

    if (activeTab === 'message') {
      const params: SendMessageParams = {
        chat_id: values.chat_id,
        text: values.text || '',
        parse_mode: values.parse_mode as 'HTML' | 'Markdown' | 'MarkdownV2' | undefined,
        disable_notification: values.disable_notification || false,
      }
      result = await sendMessage(params)
    } else if (activeTab === 'photo') {
      const params: SendPhotoParams = {
        chat_id: values.chat_id,
        photo: values.photo || '',
        caption: values.caption,
        parse_mode: values.parse_mode as 'HTML' | 'Markdown' | 'MarkdownV2' | undefined,
        disable_notification: values.disable_notification || false,
      }
      result = await sendPhoto(params)
    } else if (activeTab === 'document') {
      const params: SendDocumentParams = {
        chat_id: values.chat_id,
        document: values.document || '',
        caption: values.caption,
        parse_mode: values.parse_mode as 'HTML' | 'Markdown' | 'MarkdownV2' | undefined,
        disable_notification: values.disable_notification || false,
      }
      result = await sendDocument(params)
    }

    if (result) {
      setLastSentMessage(result)
      reset({
        chat_id: values.chat_id, // Сохраняем chat_id
        text: '',
        photo: '',
        document: '',
        caption: '',
        parse_mode: values.parse_mode,
        disable_notification: values.disable_notification,
      })
    }
  }

  return (
    <Card>
      <CardBody>
        <h4 className="mb-4">Отправить сообщение</h4>

        <Alert variant="info" className="mb-4">
          <IconifyIcon icon="mdi:information" className="me-2" />
          <strong>Chat ID:</strong> Может быть username (например, <code>@username</code>), числовой ID пользователя 
          (например, <code>123456789</code>) или ID группы/канала (например, <code>-1001234567890</code>).
          <br />
          <strong>Как получить Chat ID:</strong>
          <ul className="mb-0 mt-2">
            <li>Для личных сообщений: отправьте сообщение боту <strong>@userinfobot</strong> в Telegram</li>
            <li>Для групп: добавьте бота в группу, затем отправьте сообщение в группу и получите Chat ID через API</li>
            <li>Для каналов: добавьте бота как администратора канала</li>
            <li>Важно: бот должен иметь доступ к чату (не заблокирован, добавлен в группу/канал)</li>
          </ul>
        </Alert>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'message')}
          className="mb-3"
        >
          <Tab eventKey="message" title="Текст">
            <Form onSubmit={handleSubmit(onSubmit)} className="mt-3">
              <div className="mb-3">
                <TextFormInput
                  control={control}
                  name="chat_id"
                  label="Chat ID или username"
                  placeholder="@username или 123456789"
                  required
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    const chatId = watch('chat_id')
                    if (!chatId) {
                      return
                    }
                    setCheckingChat(true)
                    setChatInfo(null)
                    const info = await getChatInfo(chatId)
                    if (info) {
                      setChatInfo(info)
                    }
                    setCheckingChat(false)
                  }}
                  disabled={checkingChat || !watch('chat_id')}
                >
                  {checkingChat ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="mdi:check-circle" className="me-2" />
                      Проверить Chat ID
                    </>
                  )}
                </Button>
                {chatInfo && (
                  <Alert variant="success" className="mt-2">
                    <IconifyIcon icon="mdi:check-circle" className="me-2" />
                    <strong>Чат найден!</strong>
                    <br />
                    Тип: {chatInfo.type}
                    {chatInfo.title && <><br />Название: {chatInfo.title}</>}
                    {chatInfo.username && <><br />Username: @{chatInfo.username}</>}
                    {chatInfo.first_name && <><br />Имя: {chatInfo.first_name}</>}
                  </Alert>
                )}
              </div>

              <TextFormInput
                control={control}
                name="text"
                label="Текст сообщения"
                placeholder="Введите текст сообщения..."
                required
                as="textarea"
                rows={5}
                helpText="Поддерживается HTML форматирование (parse_mode: HTML)"
              />

              <div className="d-flex gap-2 mt-3">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="mdi:send" className="me-2" />
                      Отправить сообщение
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Tab>

          <Tab eventKey="photo" title="Фото">
            <Form onSubmit={handleSubmit(onSubmit)} className="mt-3">
              <div className="mb-3">
                <TextFormInput
                  control={control}
                  name="chat_id"
                  label="Chat ID или username"
                  placeholder="@username или 123456789"
                  required
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    const chatId = watch('chat_id')
                    if (!chatId) {
                      return
                    }
                    setCheckingChat(true)
                    setChatInfo(null)
                    const info = await getChatInfo(chatId)
                    if (info) {
                      setChatInfo(info)
                    }
                    setCheckingChat(false)
                  }}
                  disabled={checkingChat || !watch('chat_id')}
                >
                  {checkingChat ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="mdi:check-circle" className="me-2" />
                      Проверить Chat ID
                    </>
                  )}
                </Button>
                {chatInfo && (
                  <Alert variant="success" className="mt-2">
                    <IconifyIcon icon="mdi:check-circle" className="me-2" />
                    <strong>Чат найден!</strong>
                    <br />
                    Тип: {chatInfo.type}
                    {chatInfo.title && <><br />Название: {chatInfo.title}</>}
                    {chatInfo.username && <><br />Username: @{chatInfo.username}</>}
                    {chatInfo.first_name && <><br />Имя: {chatInfo.first_name}</>}
                  </Alert>
                )}
              </div>

              <TextFormInput
                control={control}
                name="photo"
                label="URL фото"
                placeholder="https://example.com/image.jpg"
                required
                helpText="URL изображения для отправки"
              />

              <TextFormInput
                control={control}
                name="caption"
                label="Подпись к фото (опционально)"
                placeholder="Описание фото..."
                as="textarea"
                rows={3}
              />

              <div className="d-flex gap-2 mt-3">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="mdi:image" className="me-2" />
                      Отправить фото
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Tab>

          <Tab eventKey="document" title="Документ">
            <Form onSubmit={handleSubmit(onSubmit)} className="mt-3">
              <div className="mb-3">
                <TextFormInput
                  control={control}
                  name="chat_id"
                  label="Chat ID или username"
                  placeholder="@username или 123456789"
                  required
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    const chatId = watch('chat_id')
                    if (!chatId) {
                      return
                    }
                    setCheckingChat(true)
                    setChatInfo(null)
                    const info = await getChatInfo(chatId)
                    if (info) {
                      setChatInfo(info)
                    }
                    setCheckingChat(false)
                  }}
                  disabled={checkingChat || !watch('chat_id')}
                >
                  {checkingChat ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="mdi:check-circle" className="me-2" />
                      Проверить Chat ID
                    </>
                  )}
                </Button>
                {chatInfo && (
                  <Alert variant="success" className="mt-2">
                    <IconifyIcon icon="mdi:check-circle" className="me-2" />
                    <strong>Чат найден!</strong>
                    <br />
                    Тип: {chatInfo.type}
                    {chatInfo.title && <><br />Название: {chatInfo.title}</>}
                    {chatInfo.username && <><br />Username: @{chatInfo.username}</>}
                    {chatInfo.first_name && <><br />Имя: {chatInfo.first_name}</>}
                  </Alert>
                )}
              </div>

              <TextFormInput
                control={control}
                name="document"
                label="URL документа"
                placeholder="https://example.com/document.pdf"
                required
                helpText="URL документа для отправки"
              />

              <TextFormInput
                control={control}
                name="caption"
                label="Подпись к документу (опционально)"
                placeholder="Описание документа..."
                as="textarea"
                rows={3}
              />

              <div className="d-flex gap-2 mt-3">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <IconifyIcon icon="mdi:file-document" className="me-2" />
                      Отправить документ
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Tab>
        </Tabs>

        {lastSentMessage && (
          <Alert variant="success" className="mt-3">
            <IconifyIcon icon="mdi:check-circle" className="me-2" />
            <strong>Сообщение отправлено!</strong>
            <br />
            Message ID: {lastSentMessage.message_id}
            <br />
            Chat ID: {lastSentMessage.chat_id}
            <br />
            Дата: {new Date(lastSentMessage.date).toLocaleString('ru-RU')}
          </Alert>
        )}
      </CardBody>
    </Card>
  )
}

export default SendMessage

