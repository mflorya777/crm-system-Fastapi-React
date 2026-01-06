import React, { useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { IncomingCallEvent } from '@/types/telephony'

interface IncomingCallModalProps {
  show: boolean
  call: IncomingCallEvent | null
  onAnswer?: () => void
  onReject?: () => void
  onClose?: () => void
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  show,
  call,
  onAnswer,
  onReject,
  onClose,
}) => {
  useEffect(() => {
    if (show && call) {
      // Можно добавить звуковое уведомление
      // const audio = new Audio('/sounds/incoming-call.mp3')
      // audio.play()
    }
  }, [show, call])

  if (!call) return null

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
      size="sm"
    >
      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <IconifyIcon
            icon="bx:phone-call"
            className="text-primary"
            style={{ fontSize: '48px' }}
          />
        </div>
        <h5 className="mb-2">Входящий звонок</h5>
        <p className="text-muted mb-3">
          <strong>{call.from_number}</strong>
          <br />
          <small>Звонит на {call.to_number}</small>
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Button
            variant="danger"
            size="lg"
            className="rounded-circle"
            style={{ width: '60px', height: '60px' }}
            onClick={onReject}
          >
            <IconifyIcon icon="bx:phone-off" />
          </Button>
          <Button
            variant="success"
            size="lg"
            className="rounded-circle"
            style={{ width: '60px', height: '60px' }}
            onClick={onAnswer}
          >
            <IconifyIcon icon="bx:phone" />
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default IncomingCallModal

