import React, { useState } from 'react'
import { Modal, Form, Button, InputGroup } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useMakeCall } from '@/hooks/useMakeCall'

interface MakeCallModalProps {
  show: boolean
  onHide: () => void
  toNumber: string
  onCall?: (fromNumber: string) => void
  defaultFromNumber?: string
}

const MakeCallModal: React.FC<MakeCallModalProps> = ({
  show,
  onHide,
  toNumber,
  onCall,
  defaultFromNumber = '',
}) => {
  const [fromNumber, setFromNumber] = useState(defaultFromNumber)
  const { makeCall, loading } = useMakeCall()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fromNumber.trim()) {
      return
    }

    if (onCall) {
      await onCall(fromNumber)
    } else {
      const success = await makeCall({
        from_number: fromNumber,
        to_number: toNumber,
      })

      if (success) {
        onHide()
      }
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Инициация звонка</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Номер звонящего</Form.Label>
            <Form.Control
              type="tel"
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
              placeholder="Введите номер звонящего"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Номер получателя</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <IconifyIcon icon="bx:phone" />
              </InputGroup.Text>
              <Form.Control
                type="tel"
                value={toNumber}
                readOnly
                disabled
              />
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={loading || !fromNumber.trim()}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Звонок...
              </>
            ) : (
              <>
                <IconifyIcon icon="bx:phone" className="me-2" />
                Позвонить
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default MakeCallModal

