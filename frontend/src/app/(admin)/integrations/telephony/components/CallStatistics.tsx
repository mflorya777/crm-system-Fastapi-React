import React, { useState, useEffect } from 'react'
import { Card, CardBody, Form, Button, Row, Col } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useCallStatistics } from '@/hooks/useCallStatistics'

const CallStatistics: React.FC = () => {
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7) // Последние 7 дней
    return date.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  const { statistics, loading, error, fetchStatistics } = useCallStatistics()

  useEffect(() => {
    if (dateFrom && dateTo) {
      const fromTimestamp = Math.floor(new Date(dateFrom).getTime() / 1000)
      const toTimestamp = Math.floor(new Date(dateTo).getTime() / 1000)
      fetchStatistics({ date_from: fromTimestamp, date_to: toTimestamp })
    }
  }, [dateFrom, dateTo])

  const handleSearch = () => {
    if (dateFrom && dateTo) {
      const fromTimestamp = Math.floor(new Date(dateFrom).getTime() / 1000)
      const toTimestamp = Math.floor(new Date(dateTo).getTime() / 1000)
      fetchStatistics({ date_from: fromTimestamp, date_to: toTimestamp })
    }
  }

  const successRate = statistics
    ? statistics.total_calls > 0
      ? ((statistics.successful_calls / statistics.total_calls) * 100).toFixed(1)
      : '0'
    : '0'

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Статистика звонков</h5>
        </div>

        {/* Фильтры */}
        <Card className="mb-3">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label>Дата от</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Дата до</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Button variant="primary" onClick={handleSearch} disabled={loading}>
                  <IconifyIcon icon="bx:search" className="me-1" />
                  Показать статистику
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

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

        {!loading && !error && statistics && (
          <Row className="g-3">
            <Col md={4}>
              <Card className="border-primary">
                <CardBody className="text-center">
                  <IconifyIcon icon="bx:phone" className="fs-32 text-primary mb-2" />
                  <h3 className="mb-0">{statistics.total_calls}</h3>
                  <small className="text-muted">Всего звонков</small>
                </CardBody>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-success">
                <CardBody className="text-center">
                  <IconifyIcon icon="bx:check-circle" className="fs-32 text-success mb-2" />
                  <h3 className="mb-0">{statistics.successful_calls}</h3>
                  <small className="text-muted">Успешных звонков</small>
                </CardBody>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-danger">
                <CardBody className="text-center">
                  <IconifyIcon icon="bx:x-circle" className="fs-32 text-danger mb-2" />
                  <h3 className="mb-0">{statistics.failed_calls}</h3>
                  <small className="text-muted">Неудачных звонков</small>
                </CardBody>
              </Card>
            </Col>
            <Col md={12}>
              <Card>
                <CardBody>
                  <h6 className="mb-3">Процент успешных звонков</h6>
                  <div className="progress" style={{ height: '30px' }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${successRate}%` }}
                      aria-valuenow={parseFloat(successRate)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {successRate}%
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}

        {!loading && !error && !statistics && (
          <div className="text-center py-4 text-muted">
            <IconifyIcon icon="bx:bar-chart" className="fs-32 mb-2" />
            <div>Выберите период для отображения статистики</div>
            {error && error.includes('No active telephony integration') && (
              <div className="mt-2">
                <small className="text-warning">
                  Для просмотра статистики необходимо настроить интеграцию Mango Office на вкладке "Настройки"
                </small>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default CallStatistics

