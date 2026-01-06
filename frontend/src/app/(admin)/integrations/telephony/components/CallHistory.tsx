import React, { useState, useEffect } from 'react'
import { Card, CardBody, Form, Button, InputGroup, Row, Col } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useCallHistory } from '@/hooks/useCallHistory'
import CallHistoryItem from '@/components/telephony/CallHistoryItem'
import type { CallInfo, CallHistoryParams } from '@/types/telephony'

interface CallHistoryProps {
  onCallClick?: (call: CallInfo) => void
}

const CallHistory: React.FC<CallHistoryProps> = ({ onCallClick }) => {
  const [filters, setFilters] = useState<CallHistoryParams>({
    limit: 50,
  })
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [fromNumber, setFromNumber] = useState<string>('')
  const [toNumber, setToNumber] = useState<string>('')

  const { calls, loading, error, total, fetchCallHistory } = useCallHistory(filters, false)

  useEffect(() => {
    const params: CallHistoryParams = {
      limit: 50,
    }

    if (dateFrom) {
      params.date_from = Math.floor(new Date(dateFrom).getTime() / 1000)
    }
    if (dateTo) {
      params.date_to = Math.floor(new Date(dateTo).getTime() / 1000)
    }
    if (fromNumber) {
      params.from_number = fromNumber
    }
    if (toNumber) {
      params.to_number = toNumber
    }

    setFilters(params)
  }, [dateFrom, dateTo, fromNumber, toNumber])

  useEffect(() => {
    fetchCallHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleSearch = () => {
    fetchCallHistory()
  }

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
    setFromNumber('')
    setToNumber('')
  }

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">История звонков</h5>
          <Button variant="outline-primary" size="sm" onClick={() => fetchCallHistory()}>
            <IconifyIcon icon="bx:refresh" className="me-1" />
            Обновить
          </Button>
        </div>

        {/* Фильтры */}
        <Card className="mb-3">
          <CardBody>
            <Row className="g-3">
              <Col md={3}>
                <Form.Label>Дата от</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Label>Дата до</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Label>Номер звонящего</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+7..."
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Label>Номер получателя</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+7..."
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                />
              </Col>
            </Row>
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary" onClick={handleSearch} disabled={loading}>
                <IconifyIcon icon="bx:search" className="me-1" />
                Поиск
              </Button>
              <Button variant="outline-secondary" onClick={handleReset}>
                <IconifyIcon icon="bx:x" className="me-1" />
                Сбросить
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Результаты */}
        {loading && (
          <div className="text-center py-4">
            <span className="spinner-border spinner-border-sm me-2" />
            Загрузка...
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-3">
              <small className="text-muted">Найдено звонков: {total}</small>
            </div>
            {calls.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <IconifyIcon icon="bx:phone-off" className="fs-32 mb-2" />
                <div>Нет звонков</div>
                {error && error.includes('No active telephony integration') && (
                  <div className="mt-2">
                    <small className="text-warning">
                      Для просмотра истории звонков необходимо настроить интеграцию Mango Office на вкладке "Настройки"
                    </small>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {calls.map((call, index) => (
                  <CallHistoryItem
                    key={call.entry_id || index}
                    call={call}
                    onClick={onCallClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default CallHistory

