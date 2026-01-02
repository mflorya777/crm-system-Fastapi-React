import { useState } from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { useUpdateBuyer } from '@/hooks/useUpdateBuyer'
import { useDeleteBuyer } from '@/hooks/useDeleteBuyer'
import type { Buyer } from '@/hooks/useBuyersByCategory'

interface EditBuyerModalProps {
  show: boolean
  onHide: () => void
  buyer: Buyer
  onBuyerUpdated?: (buyer: Buyer) => void
  onBuyerDeleted?: () => void
}

const EditBuyerModal = ({ show, onHide, buyer, onBuyerUpdated, onBuyerDeleted }: EditBuyerModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const { control, updateBuyer, loading, reset } = useUpdateBuyer(buyer.id, buyer, (updatedBuyer) => {
    onHide()
    if (onBuyerUpdated) {
      onBuyerUpdated(updatedBuyer)
    }
  })

  const { deleteBuyer, loading: deleteLoading } = useDeleteBuyer(() => {
    onHide()
    if (onBuyerDeleted) {
      onBuyerDeleted()
    }
  })

  const handleClose = () => {
    reset()
    setShowDeleteConfirm(false)
    onHide()
  }

  const handleDelete = async () => {
    await deleteBuyer(buyer.id)
  }

  return (
    <Modal show={show} onHide={handleClose} className="fade" size="lg" tabIndex={-1}>
      <ModalHeader>
        <ModalTitle as="h5">Редактировать покупателя</ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>
      <form onSubmit={updateBuyer}>
        <ModalBody>
          <TextFormInput
            control={control}
            name="name"
            containerClassName="mb-3"
            label="Имя покупателя"
            id="buyer-name"
            placeholder="Введите имя покупателя"
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
                name="potential_value"
                type="number"
                containerClassName="mb-3"
                label="Сумма (необязательно)"
                id="buyer-potential-value"
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

          {/* Подтверждение удаления */}
          {showDeleteConfirm && (
            <div className="alert alert-danger mt-3">
              <strong>Вы уверены, что хотите удалить этого покупателя?</strong>
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

export default EditBuyerModal

