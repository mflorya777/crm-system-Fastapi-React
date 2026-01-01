import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import SelectFormInput from '@/components/form/SelectFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { useAuthContext } from '@/context/useAuthContext'
import { useCreateDeal } from '@/hooks/useCreateDeal'
import type { DealCategory } from '@/hooks/useDealCategories'
import type { Deal } from '@/hooks/useDealsByCategory'

interface AddDealModalProps {
  show: boolean
  onHide: () => void
  categoryId: string
  category: DealCategory
  onDealCreated?: (deal: Deal) => void
}

const AddDealModal = ({ show, onHide, categoryId, category, onDealCreated }: AddDealModalProps) => {
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

  const { control, createDeal, loading, reset } = useCreateDeal(categoryId, defaultStageId, defaultResponsibleUserId, (deal) => {
    onHide()
    if (onDealCreated) {
      onDealCreated(deal)
    }
  })

  const handleClose = () => {
    reset()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} className="fade" size="lg" tabIndex={-1}>
      <ModalHeader>
        <ModalTitle as="h5">Добавить сделку</ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>
      <form onSubmit={createDeal}>
        <ModalBody>
          <TextFormInput
            control={control}
            name="title"
            containerClassName="mb-3"
            label="Название сделки"
            id="deal-title"
            placeholder="Введите название сделки"
          />
          <SelectFormInput
            control={control}
            name="stage_id"
            containerClassName="mb-3"
            label="Стадия"
            id="deal-stage"
            options={stageOptions}
            placeholder="Выберите стадию"
          />
          <TextAreaFormInput
            control={control}
            name="description"
            containerClassName="mb-3"
            label="Описание (необязательно)"
            id="deal-description"
            placeholder="Введите описание сделки"
            rows={3}
          />
          <div className="row">
            <div className="col-md-6">
              <TextFormInput
                control={control}
                name="amount"
                type="number"
                containerClassName="mb-3"
                label="Сумма (необязательно)"
                id="deal-amount"
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
                id="deal-currency"
                placeholder="RUB"
              />
            </div>
          </div>
          <TextFormInput
            control={control}
            name="responsible_user_id"
            containerClassName="mb-3"
            label="Ответственный (ID пользователя)"
            id="deal-responsible"
            placeholder="ID ответственного пользователя"
          />
          <TextFormInput
            control={control}
            name="client_id"
            containerClassName="mb-3"
            label="ID клиента (необязательно)"
            id="deal-client"
            placeholder="ID клиента"
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

export default AddDealModal

