import React, { useState } from 'react'
import { Card, Button, Form, InputGroup } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useMakeCall } from '@/hooks/useMakeCall'
import { useAuthContext } from '@/context/useAuthContext'
import MakeCallModal from '@/components/telephony/MakeCallModal'

const CallWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { user } = useAuthContext()
  const { makeCall, loading } = useMakeCall()

  const handleCall = async () => {
    if (!phoneNumber.trim()) return

    const success = await makeCall({
      from_number: user?.phone || '',
      to_number: phoneNumber,
    })

    if (success) {
      setPhoneNumber('')
      setIsExpanded(false)
    }
  }

  const handleQuickCall = (number: string) => {
    setPhoneNumber(number)
    setShowModal(true)
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        {isExpanded ? (
          <Card style={{ width: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Быстрый звонок</h6>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() => setIsExpanded(false)}
                >
                  <IconifyIcon icon="bx:x" />
                </Button>
              </div>
              <InputGroup className="mb-2">
                <Form.Control
                  type="tel"
                  placeholder="Введите номер"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCall()
                    }
                  }}
                />
                <Button
                  variant="primary"
                  onClick={handleCall}
                  disabled={loading || !phoneNumber.trim()}
                >
                  <IconifyIcon icon="bx:phone" />
                </Button>
              </InputGroup>
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100"
                onClick={() => setShowModal(true)}
              >
                <IconifyIcon icon="bx:phone-call" className="me-1" />
                Расширенный звонок
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="rounded-circle"
            style={{ width: '60px', height: '60px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            onClick={() => setIsExpanded(true)}
          >
            <IconifyIcon icon="bx:phone" style={{ fontSize: '24px' }} />
          </Button>
        )}
      </div>

      <MakeCallModal
        show={showModal}
        onHide={() => setShowModal(false)}
        toNumber={phoneNumber}
        onCall={async (fromNumber) => {
          await makeCall({
            from_number: fromNumber,
            to_number: phoneNumber,
          })
          setShowModal(false)
        }}
        defaultFromNumber={user?.phone || ''}
      />
    </>
  )
}

export default CallWidget

