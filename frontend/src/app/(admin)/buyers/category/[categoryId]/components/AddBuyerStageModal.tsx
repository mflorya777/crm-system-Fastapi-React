import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import TextFormInput from '@/components/form/TextFormInput'
import { useAddBuyerStage } from '@/hooks/useAddBuyerStage'
import type { BuyerCategory } from '@/hooks/useBuyerCategories'

interface AddBuyerStageModalProps {
  show: boolean
  onHide: () => void
  categoryId: string
  currentStages: BuyerCategory['stages']
  onStageAdded?: (category: BuyerCategory) => void
}

const AddBuyerStageModal = ({ show, onHide, categoryId, currentStages, onStageAdded }: AddBuyerStageModalProps) => {
  const { control, addStage, loading, reset, nextOrder } = useAddBuyerStage(categoryId, currentStages, (category) => {
    onHide()
    if (onStageAdded) {
      onStageAdded(category)
    }
  })

  const handleClose = () => {
    reset()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} className="fade" tabIndex={-1}>
      <ModalHeader>
        <ModalTitle as="h5">Добавить стадию</ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>
      <form onSubmit={addStage}>
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
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default AddBuyerStageModal

