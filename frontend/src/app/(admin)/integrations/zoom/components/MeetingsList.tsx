import React, { useState, useEffect } from 'react'
import { Card, CardBody, Button, Table, Badge, Dropdown, Form } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useZoomMeetings } from '@/hooks/useZoomMeetings'
import type { ZoomMeeting } from '@/types/zoom'
import CreateMeetingModal from './CreateMeetingModal'

interface MeetingsListProps {
  onCreateMeeting?: () => void
  onMeetingClick?: (meeting: ZoomMeeting) => void
}

const MeetingsList: React.FC<MeetingsListProps> = ({ onCreateMeeting, onMeetingClick }) => {
  const { meetings, fetchMeetings, deleteMeeting, loading } = useZoomMeetings(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [meetingType, setMeetingType] = useState<'live' | 'scheduled' | 'upcoming' | 'previous'>('live')

  useEffect(() => {
    fetchMeetings({ type: meetingType, page_size: 30 })
  }, [meetingType])

  const handleDelete = async (meetingId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту встречу?')) {
      await deleteMeeting(meetingId)
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchMeetings({ type: meetingType, page_size: 30 })
    if (onCreateMeeting) {
      onCreateMeeting()
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('ru-RU')
  }

  const getMeetingTypeLabel = (type: number) => {
    switch (type) {
      case 1:
        return 'Мгновенная'
      case 2:
        return 'Запланированная'
      case 3:
        return 'Повторяющаяся'
      case 8:
        return 'Фиксированное время'
      default:
        return 'Неизвестно'
    }
  }

  return (
    <>
      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Встречи Zoom</h5>
            <div className="d-flex gap-2">
              <Form.Select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as any)}
                style={{ width: 'auto' }}
              >
                <option value="live">Текущие</option>
                <option value="scheduled">Запланированные</option>
                <option value="upcoming">Предстоящие</option>
                <option value="previous">Прошедшие</option>
              </Form.Select>
              <Button variant="outline-primary" size="sm" onClick={() => fetchMeetings({ type: meetingType, page_size: 30 })}>
                <IconifyIcon icon="bx:refresh" className="me-1" />
                Обновить
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                <IconifyIcon icon="bx:plus" className="me-1" />
                Создать встречу
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <span className="spinner-border spinner-border-sm me-2" />
              Загрузка...
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <IconifyIcon icon="bx:video-off" className="fs-32 mb-2" />
              <div>Нет встреч</div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Тема</th>
                    <th>Тип</th>
                    <th>Время начала</th>
                    <th>Длительность</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} style={{ cursor: 'pointer' }} onClick={() => onMeetingClick?.(meeting)}>
                      <td>
                        <div className="fw-semibold">{meeting.topic}</div>
                        {meeting.agenda && (
                          <small className="text-muted">{meeting.agenda}</small>
                        )}
                      </td>
                      <td>
                        <Badge bg="secondary">{getMeetingTypeLabel(meeting.type)}</Badge>
                      </td>
                      <td>{formatDate(meeting.start_time)}</td>
                      <td>{meeting.duration} мин</td>
                      <td>
                        {meeting.status && (
                          <Badge bg={meeting.status === 'started' ? 'success' : 'secondary'}>
                            {meeting.status}
                          </Badge>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Dropdown>
                          <Dropdown.Toggle
                            as="button"
                            className="btn btn-link btn-sm p-0"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#6c757d',
                            }}
                          >
                            <IconifyIcon icon="bx:dots-vertical-rounded" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item
                              href={meeting.join_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <IconifyIcon icon="bx:video" className="me-2" />
                              Присоединиться
                            </Dropdown.Item>
                            {meeting.start_url && (
                              <Dropdown.Item
                                href={meeting.start_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <IconifyIcon icon="bx:play" className="me-2" />
                                Начать встречу
                              </Dropdown.Item>
                            )}
                            <Dropdown.Divider />
                            <Dropdown.Item
                              onClick={() => handleDelete(meeting.id)}
                              className="text-danger"
                            >
                              <IconifyIcon icon="bx:trash" className="me-2" />
                              Удалить
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <CreateMeetingModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}

export default MeetingsList

