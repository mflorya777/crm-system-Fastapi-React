import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import SelectFormInput from '@/components/form/SelectFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { useAuthContext } from '@/context/useAuthContext'
import { useCreateBuyer } from '@/hooks/useCreateBuyer'
import type { BuyerCategory } from '@/hooks/useBuyerCategories'
import type { Buyer } from '@/hooks/useBuyersByCategory'

interface AddBuyerModalProps {
  show: boolean
  onHide: () => void
  categoryId: string
  category: BuyerCategory
  onBuyerCreated?: (buyer: Buyer) => void
}

const AddBuyerModal = ({ show, onHide, categoryId, category, onBuyerCreated }: AddBuyerModalProps) => {
  const { user } = useAuthContext()
  const defaultResponsibleUserId = user?.id || ''
  
  // Получаем первую стадию как значение по умолчанию
  const firstStage = category.stages && category.stages.length > 0
    ? [...category.stages].sort((a, b) => a.order - b.order)[0]
    : null
  const defaultStageId = firstStage?.id || ''

  // Подготавливаем опции для выбора стадии
  const stageOptions = category.stages
    ? [...category.stages]
        .sort((a, b) => a.order - b.order)
        .map((stage) => ({
          value: stage.id,
          label: `${stage.name} (Стадия ${stage.order})`,
        }))
    : []

  const { control, createBuyer, loading, reset } = useCreateBuyer(categoryId, defaultStageId, defaultResponsibleUserId, (buyer) => {
    onHide()
    if (onBuyerCreated) {
      onBuyerCreated(buyer)
    }
  })

  const handleClose = () => {
    reset()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} className="fade" size="lg" tabIndex={-1}>
      <ModalHeader>
        <ModalTitle as="h5">Добавить покупателя</ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>
      <form onSubmit={createBuyer}>
        <ModalBody>
          <TextFormInput
            control={control}
            name="name"
            containerClassName="mb-3"
            label="Имя покупателя"
            id="buyer-name"
            placeholder="Введите имя покупателя"
          />
          <SelectFormInput
            control={control}
            name="stage_id"
            containerClassName="mb-3"
            label="Стадия"
            id="buyer-stage"
            options={stageOptions}
            placeholder="Выберите стадию"
          />
          <div className="row">
            <div className="col-md-6">
              <TextFormInput
                control={control}
                name="email"
                type="email"
                containerClassName="mb-3"
                label="Email (необязательно)"
                id="buyer-email"
                placeholder="email@example.com"
              />
            </div>
            <div className="col-md-6">
              <TextFormInput
                control={control}
                name="phone"
                containerClassName="mb-3"
                label="Телефон (необязательно)"
                id="buyer-phone"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <TextFormInput
                control={control}
                name="company"
                containerClassName="mb-3"
                label="Компания (необязательно)"
                id="buyer-company"
                placeholder="Название компании"
              />
            </div>
            <div className="col-md-6">
              <TextFormInput
                control={control}
                name="source"
                containerClassName="mb-3"
                label="Источник (необязательно)"
                id="buyer-source"
                placeholder="Откуда пришел клиент"
              />
            </div>
          </div>
          <TextFormInput
            control={control}
            name="address"
            containerClassName="mb-3"
            label="Адрес (необязательно)"
            id="buyer-address"
            placeholder="Введите адрес"
          />
          <TextAreaFormInput
            control={control}
            name="notes"
            containerClassName="mb-3"
            label="Заметки (необязательно)"
            id="buyer-notes"
            placeholder="Дополнительная информация"
            rows={3}
          />
          <div className="row">
            <div className="col-md-6">
              <TextFormInput
                control={control}
                name="value"
                type="number"
                containerClassName="mb-3"
                label="Сумма (необязательно)"
                id="buyer-value"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="col-md-6">
              <TextFormInput
                control={control}
                name="currency"
                containerClassName="mb-3"
                label="Валюта"
                id="buyer-currency"
                placeholder="RUB"
              />
            </div>
          </div>
          <TextFormInput
            control={control}
            name="responsible_user_id"
            containerClassName="mb-3"
            label="Ответственный (ID пользователя)"
            id="buyer-responsible"
            placeholder="ID ответственного пользователя"
          />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Создание...' : 'Создать'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default AddBuyerModal

