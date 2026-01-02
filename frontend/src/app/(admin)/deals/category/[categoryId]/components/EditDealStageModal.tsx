import { useState } from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import TextFormInput from '@/components/form/TextFormInput'
import { useUpdateDealStage } from '@/hooks/useUpdateDealStage'
import { useDeleteDealStage } from '@/hooks/useDeleteDealStage'
import type { DealCategory } from '@/hooks/useDealCategories'

interface EditDealStageModalProps {
  show: boolean
  onHide: () => void
  categoryId: string
  currentStages: DealCategory['stages']
  stageId: string
  onStageUpdated?: (category: DealCategory) => void
  onStageDeleted?: () => void
}

const EditDealStageModal = ({ show, onHide, categoryId, currentStages, stageId, onStageUpdated, onStageDeleted }: EditDealStageModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const { control, updateStage, loading, reset } = useUpdateDealStage(categoryId, currentStages, stageId, (category) => {
    onHide()
    if (onStageUpdated) {
      onStageUpdated(category)
    }
  })

  const { deleteStage, loading: deleteLoading } = useDeleteDealStage(() => {
    onHide()
    if (onStageDeleted) {
      onStageDeleted()
    }
  })

  const handleClose = () => {
    reset()
    setShowDeleteConfirm(false)
    onHide()
  }

  const handleDelete = async () => {
    await deleteStage(categoryId, stageId)
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

          {/* Подтверждение удаления */}
          {showDeleteConfirm && (
            <div className="alert alert-danger mt-3">
              <strong>Вы уверены, что хотите удалить эту стадию?</strong>
              <p className="small mb-2 text-muted">Сделки, привязанные к этой стадии, останутся, но стадия будет скрыта.</p>
              <div>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleDelete} 
                  disabled={deleteLoading}
                  className="me-2"
                >
                  {deleteLoading ? 'Удаление...' : 'Да, удалить'}
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="justify-content-between">
          <Button 
            type="button" 
            variant="outline-danger" 
            onClick={() => setShowDeleteConfirm(true)} 
            disabled={loading || deleteLoading || showDeleteConfirm}
          >
            Удалить
          </Button>
          <div>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading || deleteLoading} className="me-2">
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={loading || deleteLoading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default EditDealStageModal
