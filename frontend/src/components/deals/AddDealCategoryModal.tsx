import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { useCreateDealCategory } from '@/hooks/useCreateDealCategory'
import type { DealCategory } from '@/hooks/useDealCategories'

interface AddDealCategoryModalProps {
  show: boolean
  onHide: () => void
  onCategoryCreated?: (category: DealCategory) => void
}

const AddDealCategoryModal = ({ show, onHide, onCategoryCreated }: AddDealCategoryModalProps) => {
  const { control, createCategory, loading, reset } = useCreateDealCategory((category) => {
    onHide()
    if (onCategoryCreated) {
      onCategoryCreated(category)
    }
  })

  const handleClose = () => {
    reset()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} className="fade" tabIndex={-1}>
      <ModalHeader>
        <ModalTitle as="h5">Добавить категорию</ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>
      <form onSubmit={createCategory}>
        <ModalBody>
          <TextFormInput
            control={control}
            name="name"
            containerClassName="mb-3"
            label="Название категории"
            id="category-name"
            placeholder="Введите название категории"
          />
          <TextAreaFormInput
            control={control}
            name="description"
            containerClassName="mb-3"
            label="Описание (необязательно)"
            id="category-description"
            placeholder="Введите описание категории"
            rows={3}
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

export default AddDealCategoryModal

