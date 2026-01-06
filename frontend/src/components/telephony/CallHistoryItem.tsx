import React from 'react'
import { Card, Badge } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { CallInfo } from '@/types/telephony'

interface CallHistoryItemProps {
  call: CallInfo
  onClick?: (call: CallInfo) => void
}

const CallHistoryItem: React.FC<CallHistoryItemProps> = ({ call, onClick }) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '—'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDirectionBadge = () => {
    if (call.direction === 'incoming') {
      return <Badge bg="success">Входящий</Badge>
    } else if (call.direction === 'outgoing') {
      return <Badge bg="primary">Исходящий</Badge>
    }
    return null
  }

  const getStatusBadge = () => {
    if (call.status === 'answered') {
      return <Badge bg="success">Отвечен</Badge>
    } else if (call.status === 'missed') {
      return <Badge bg="danger">Пропущен</Badge>
    } else if (call.status === 'failed') {
      return <Badge bg="warning">Неудачный</Badge>
    }
    return null
  }

  return (
    <Card
      className="mb-2"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick && onClick(call)}
    >
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              {call.direction === 'incoming' ? (
                <IconifyIcon icon="bx:phone-incoming" className="text-success" />
              ) : (
                <IconifyIcon icon="bx:phone-outgoing" className="text-primary" />
              )}
              <strong>{call.from_number || 'Неизвестно'}</strong>
              <IconifyIcon icon="bx:arrow-right" className="text-muted" />
              <strong>{call.to_number || 'Неизвестно'}</strong>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {getDirectionBadge()}
              {getStatusBadge()}
              <small className="text-muted">
                <IconifyIcon icon="bx:time" className="me-1" />
                {formatDate(call.start_time)}
              </small>
              {call.duration && (
                <small className="text-muted">
                  <IconifyIcon icon="bx:stopwatch" className="me-1" />
                  {formatDuration(call.duration)}
                </small>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default CallHistoryItem

