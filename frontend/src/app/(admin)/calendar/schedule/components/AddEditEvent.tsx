import { useEffect } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Col, Modal, ModalBody, ModalHeader, ModalTitle, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import SelectFormInput from '@/components/form/SelectFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import type { CalendarFormType } from '@/types/component-props'
import type { SubmitEventType } from '../useCalendar'

const AddEditEvent = ({ eventData, isEditable, onAddEvent, onRemoveEvent, onUpdateEvent, open, toggle }: CalendarFormType) => {
  const eventFormSchema = yup.object({
    title: yup.string().required('Пожалуйста, введите название события'),
    category: yup.string().required('Пожалуйста, выберите категорию события'),
  })

  type FormValues = yup.InferType<typeof eventFormSchema>

  const { handleSubmit, control, setValue, reset } = useForm<FormValues>({
    resolver: yupResolver(eventFormSchema),
    defaultValues: {
      title: eventData?.title ?? '',
      category: eventData?.className ? String(eventData.className) : 'bg-danger',
    },
  })

  useEffect(() => {
    if (eventData?.title) {
      setValue('title', String(eventData?.title))
      setValue('category', String(eventData?.className))
    }
  }, [eventData])

  useEffect(() => {
    if (!open) reset()
  }, [open])

  const onSubmitEvent = (data: SubmitEventType) => {
    isEditable ? onUpdateEvent(data) : onAddEvent(data)
  }

  return (
    <Modal show={open} onHide={toggle} className="fade" tabIndex={-1}>
      <div className="modal-content">
        <form onSubmit={handleSubmit(onSubmitEvent)} className="needs-validation" name="event-form">
          <ModalHeader className="modal-header p-3 border-bottom-0" closeButton>
            <ModalTitle className="modal-title" as="h5">
              Событие
            </ModalTitle>
          </ModalHeader>
          <ModalBody className="px-3 pb-3 pt-0">
            <Row>
              <Col xs={12}>
                <TextFormInput control={control} name="title" containerClassName="mb-3" label="Название события" placeholder="Введите название события" />
              </Col>
              <Col xs={12}>
                <SelectFormInput
                  control={control}
                  name="category"
                  label="Категория"
                  containerClassName="mb-3"
                  options={[
                    { value: 'bg-primary', label: 'Синий' },
                    { value: 'bg-secondary', label: 'Тёмно-серый' },
                    { value: 'bg-success', label: 'Зелёный' },
                    { value: 'bg-info', label: 'Голубой' },
                    { value: 'bg-warning', label: 'Жёлтый' },
                    { value: 'bg-danger', label: 'Красный' },
                    { value: 'bg-dark', label: 'Тёмный' },
                  ]}
                />
              </Col>
            </Row>
            <Row>
              <Col xs={6}>
                {isEditable && (
                  <button onClick={onRemoveEvent} type="button" className="btn btn-danger">
                    Удалить
                  </button>
                )}
              </Col>
              <Col xs={6} className="text-end">
                <Button variant="light" type="button" className="me-1" onClick={toggle}>
                  Отмена
                </Button>
                <Button variant="primary" type="submit">
                  Сохранить
                </Button>
              </Col>
            </Row>
          </ModalBody>
        </form>
      </div>
    </Modal>
  )
}

export default AddEditEvent
