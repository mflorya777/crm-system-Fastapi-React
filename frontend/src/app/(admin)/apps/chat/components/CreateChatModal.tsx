import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface CreateChatModalProps {
  show: boolean;
  onHide: () => void;
  onCreate: (participantIds: string[], chatType: 'direct' | 'group', title?: string) => Promise<void>;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ show, onHide, onCreate }) => {
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [title, setTitle] = useState('');
  const [participantIds, setParticipantIds] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!participantIds.trim()) {
      alert('Введите ID участников');
      return;
    }

    setLoading(true);
    try {
      const ids = participantIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);

      if (ids.length === 0) {
        alert('Введите корректные ID участников');
        return;
      }

      await onCreate(ids, chatType, chatType === 'group' ? title : undefined);
      
      // Сбрасываем форму
      setTitle('');
      setParticipantIds('');
      setChatType('direct');
      onHide();
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      alert('Не удалось создать чат');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Новый чат</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Тип чата</Form.Label>
            <Form.Select
              value={chatType}
              onChange={(e) => setChatType(e.target.value as 'direct' | 'group')}
            >
              <option value="direct">Личный чат</option>
              <option value="group">Групповой чат</option>
            </Form.Select>
          </Form.Group>

          {chatType === 'group' && (
            <Form.Group className="mb-3">
              <Form.Label>Название группы</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите название группы"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>ID участников</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Введите ID участников через запятую"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
            />
            <Form.Text className="text-muted">
              Например: 123e4567-e89b-12d3-a456-426614174000, 223e4567-e89b-12d3-a456-426614174001
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Отмена
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={loading}>
          {loading ? 'Создание...' : 'Создать'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateChatModal;

