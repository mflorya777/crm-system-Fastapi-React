import React, { useState } from 'react'
import { Button } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useMakeCall } from '@/hooks/useMakeCall'
import { useAuthContext } from '@/context/useAuthContext'
import MakeCallModal from './MakeCallModal'

interface CallButtonProps {
  phoneNumber: string
  buyerId?: string
  dealId?: string
  onCallComplete?: (callInfo: any) => void
  variant?: 'primary' | 'outline-primary' | 'link'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const CallButton: React.FC<CallButtonProps> = ({
  phoneNumber,
  buyerId,
  dealId,
  onCallComplete,
  variant = 'outline-primary',
  size = 'sm',
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false)
  const { user } = useAuthContext()
  const { makeCall, loading } = useMakeCall()

  const handleCall = async (fromNumber: string) => {
    const success = await makeCall(
      {
        from_number: fromNumber,
        to_number: phoneNumber,
      },
      (data) => {
        if (onCallComplete) {
          onCallComplete({
            ...data,
            buyer_id: buyerId,
            deal_id: dealId,
          })
        }
      },
    )

    if (success) {
      setShowModal(false)
    }
  }

  if (!phoneNumber) {
    return null
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`d-flex align-items-center gap-1 ${className}`}
        onClick={() => setShowModal(true)}
        disabled={loading}
      >
        <IconifyIcon icon="bx:phone" />
        Позвонить
      </Button>

      <MakeCallModal
        show={showModal}
        onHide={() => setShowModal(false)}
        toNumber={phoneNumber}
        onCall={handleCall}
        defaultFromNumber={user?.phone || ''}
      />
    </>
  )
}

export default CallButton

