import React, { useState, useEffect } from 'react'
import { Card, CardBody, Button, Alert, Badge, Row, Col } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useTelegramMessages } from '@/hooks/useTelegramMessages'
import type { BotInfo } from '@/types/telegram'

const BotInfoComponent: React.FC = () => {
  const { getBotInfo, loading } = useTelegramMessages()
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBotInfo()
  }, [])

  const loadBotInfo = async () => {
    setError(null)
    const info = await getBotInfo()
    if (info) {
      setBotInfo(info)
    } else {
      setError('Не удалось загрузить информацию о боте')
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Информация о боте</h4>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={loadBotInfo}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Загрузка...
              </>
            ) : (
              <>
                <IconifyIcon icon="mdi:refresh" className="me-2" />
                Обновить
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="danger">
            <IconifyIcon icon="mdi:alert-circle" className="me-2" />
            {error}
          </Alert>
        )}

        {botInfo && (
          <div>
            <Row className="mb-3">
              <Col md={6}>
                <div className="mb-3">
                  <strong>ID бота:</strong>
                  <div className="text-muted">{botInfo.id}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Имя бота:</strong>
                  <div className="text-muted">{botInfo.first_name}</div>
                </div>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <div className="mb-3">
                  <strong>Username:</strong>
                  <div className="text-muted">@{botInfo.username}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Ссылка на бота:</strong>
                  <div>
                    <a
                      href={`https://t.me/${botInfo.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{botInfo.username}
                      <IconifyIcon icon="mdi:open-in-new" className="ms-1" />
                    </a>
                  </div>
                </div>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <div className="mb-3">
                  <strong>Может присоединяться к группам:</strong>
                  <div>
                    <Badge bg={botInfo.can_join_groups ? 'success' : 'secondary'}>
                      {botInfo.can_join_groups ? 'Да' : 'Нет'}
                    </Badge>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Может читать все сообщения в группах:</strong>
                  <div>
                    <Badge bg={botInfo.can_read_all_group_messages ? 'success' : 'secondary'}>
                      {botInfo.can_read_all_group_messages ? 'Да' : 'Нет'}
                    </Badge>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {!botInfo && !error && !loading && (
          <Alert variant="info">
            <IconifyIcon icon="mdi:information" className="me-2" />
            Нажмите "Обновить" для загрузки информации о боте
          </Alert>
        )}
      </CardBody>
    </Card>
  )
}

export default BotInfoComponent

