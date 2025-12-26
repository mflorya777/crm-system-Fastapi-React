import { useState } from 'react'
import { Button, Dropdown, DropdownDivider, DropdownMenu, DropdownToggle, Modal, ModalBody, ModalHeader, ModalTitle } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useEmailContext } from '@/context/useEmailContext'

import 'react-quill-new/dist/quill.snow.css'

const ComposeEmailModal = () => {
  const [quillEditorContent, setQuillEditorContent] = useState('')

  const {
    composeEmail: { open, toggle },
  } = useEmailContext()

  return (
    <Modal show={open} onHide={toggle} size="lg" className="fade compose-mail" tabIndex={-1} aria-labelledby="compose-modalLabel" aria-hidden="true">
      <ModalHeader closeButton closeVariant="white" className="overflow-hidden bg-primary p-2">
        <ModalTitle as="h5" className="text-white">
          Новое сообщение
        </ModalTitle>
      </ModalHeader>
      <ModalBody className="p-4">
        <div className="overflow-hidden">
          <div className="mb-2">
            <input type="email" className="form-control" placeholder="Кому: " />
          </div>
          <div className="mb-2">
            <input type="text" className="form-control" placeholder="Тема " />
          </div>
          <div className="mt-2 mb-5">
            <ReactQuill value={quillEditorContent} onChange={setQuillEditorContent} style={{ height: 200 }} />
          </div>
          <div className="d-flex float-end">
            <Dropdown className="dropdown me-1">
              <DropdownToggle className="arrow-none btn btn-light" aria-expanded="false">
                <IconifyIcon icon="bx:dots-vertical-rounded" className="fs-18" />
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu-up">
                <span role="button" className="dropdown-item">
                  По умолчанию на весь экран
                </span>
                <DropdownDivider />
                <span role="button" className="dropdown-item">
                  Метка
                </span>
                <span role="button" className="dropdown-item">
                  Режим обычного текста
                </span>
                <DropdownDivider />
                <span role="button" className="dropdown-item">
                  Умная обратная связь при составлении
                </span>
              </DropdownMenu>
            </Dropdown>
            <button onClick={() => setQuillEditorContent('')} className="btn btn-light compose-close">
              <IconifyIcon icon="bxs:trash" className="fs-18" />
            </button>
          </div>
          <div>
            <Button onClick={toggle} variant="primary">
              Отправить
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}

export default ComposeEmailModal
