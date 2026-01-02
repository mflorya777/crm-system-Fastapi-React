import { useState } from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { useUpdateDeal } from '@/hooks/useUpdateDeal'
import { useDeleteDeal } from '@/hooks/useDeleteDeal'
import type { Deal } from '@/hooks/useDealsByCategory'

interface EditDealModalProps {
  show: boolean
  onHide: () => void
  deal: Deal
  onDealUpdated?: (deal: Deal) => void
  onDealDeleted?: () => void
}

const EditDealModal = ({ show, onHide, deal, onDealUpdated, onDealDeleted }: EditDealModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const { control, updateDeal, loading, reset } = useUpdateDeal(deal.id, deal, (updatedDeal) => {
    onHide()
    if (onDealUpdated) {
      onDealUpdated(updatedDeal)
    }
  })

  const { deleteDeal, loading: deleteLoading } = useDeleteDeal(() => {
    onHide()
    if (onDealDeleted) {
      onDealDeleted()
    }
  })

  const handleClose = () => {
    reset()
    setShowDeleteConfirm(false)
    onHide()
  }

  const handleDelete = async () => {
    await deleteDeal(deal.id)
  }

  return (
    <Modal show={show} onHide={handleClose} className="fade" size="lg" tabIndex={-1}>
      <ModalHeader>
        <ModalTitle as="h5">Редактировать сделку</ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>
      <form onSubmit={updateDeal}>
        <ModalBody>
          <TextFormInput
            control={control}
            name="title"
            containerClassName="mb-3"
            label="Название сделки"
            id="deal-title"
            placeholder="Введите название сделки"
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

          {/* Подтверждение удаления */}
          {showDeleteConfirm && (
            <div className="alert alert-danger mt-3">
              <strong>Вы уверены, что хотите удалить эту сделку?</strong>
              <div className="mt-2">
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

export default EditDealModal
