import React from 'react'
import { Modal, Form, Button } from 'react-bootstrap'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import { useZoomMeetings } from '@/hooks/useZoomMeetings'
import type { CreateMeetingParams } from '@/types/zoom'

const meetingSchema = yup.object({
  topic: yup.string().required('Пожалуйста, введите тему встречи'),
  duration: yup.number().min(1).max(1440).default(30),
  start_time: yup.string(),
  password: yup.string(),
  agenda: yup.string(),
})

type MeetingFormFields = yup.InferType<typeof meetingSchema>

interface CreateMeetingModalProps {
  show: boolean
  onHide: () => void
  onSuccess?: () => void
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ show, onHide, onSuccess }) => {
  const { createMeeting, loading } = useZoomMeetings(false)

  const { control, handleSubmit, reset, watch } = useForm<MeetingFormFields>({
    resolver: yupResolver(meetingSchema),
    defaultValues: {
      topic: '',
      duration: 30,
      start_time: '',
      password: '',
      agenda: '',
    },
  })

  const meetingType = watch('start_time') ? 2 : 1 // 1=мгновенная, 2=запланированная

  const onSubmit = async (values: MeetingFormFields) => {
    const params: CreateMeetingParams = {
      topic: values.topic,
      type: meetingType,
      duration: values.duration || 30,
      agenda: values.agenda || undefined,
      password: values.password || undefined,
      start_time: values.start_time ? new Date(values.start_time).toISOString() : undefined,
    }

    const meeting = await createMeeting(params)
    if (meeting) {
      reset()
      if (onSuccess) {
        onSuccess()
      }
      onHide()
    }
  }

  const handleClose = () => {
    reset()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Создать встречу Zoom</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <TextFormInput
            control={control}
            name="topic"
            containerClassName="mb-3"
            label="Тема встречи"
            placeholder="Введите тему встречи"
            required
          />

          <TextFormInput
            control={control}
            name="start_time"
            containerClassName="mb-3"
            label="Время начала (необязательно)"
            type="datetime-local"
            placeholder="Оставьте пустым для мгновенной встречи"
          />

          <TextFormInput
            control={control}
            name="duration"
            containerClassName="mb-3"
            label="Длительность (минуты)"
            type="number"
            placeholder="30"
          />

          <TextFormInput
            control={control}
            name="password"
            containerClassName="mb-3"
            label="Пароль (необязательно)"
            placeholder="Пароль для встречи"
          />

          <TextAreaFormInput
            control={control}
            name="agenda"
            containerClassName="mb-3"
            label="Повестка дня (необязательно)"
            placeholder="Описание встречи"
            rows={3}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Создание...
              </>
            ) : (
              <>
                <IconifyIcon icon="bx:plus" className="me-2" />
                Создать встречу
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CreateMeetingModal

