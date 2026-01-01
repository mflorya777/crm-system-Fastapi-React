import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import TextFormInput from '@/components/form/TextFormInput'
import { useUpdateDealStage } from '@/hooks/useUpdateDealStage'
import type { DealCategory } from '@/hooks/useDealCategories'

interface EditDealStageModalProps {
  show: boolean
  onHide: () => void
  categoryId: string
  currentStages: DealCategory['stages']
  stageId: string
  onStageUpdated?: (category: DealCategory) => void
}

const EditDealStageModal = ({ show, onHide, categoryId, currentStages, stageId, onStageUpdated }: EditDealStageModalProps) => {
  const { control, updateStage, loading, reset } = useUpdateDealStage(categoryId, currentStages, stageId, (category) => {
    onHide()
    if (onStageUpdated) {
      onStageUpdated(category)
    }
  })

  const handleClose = () => {
    reset()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} className="fade" tabIndex={-1}>
      <ModalHeader>
        <ModalTitle as="h5">Редактировать стадию</ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>
      <form onSubmit={updateStage}>
        <ModalBody>
          <TextFormInput
            control={control}
            name="name"
            containerClassName="mb-3"
            label="Название стадии"
            id="stage-name"
            placeholder="Введите название стадии"
          />
          <TextFormInput
            control={control}
            name="order"
            type="number"
            containerClassName="mb-3"
            label="Порядок"
            id="stage-order"
            placeholder="Порядок стадии"
          />
          <TextFormInput
            control={control}
            name="color"
            type="color"
            containerClassName="mb-3"
            label="Цвет стадии"
            id="stage-color"
          />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default EditDealStageModal

