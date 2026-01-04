import React, { useState } from 'react';
import { Dropdown, Form, Button } from 'react-bootstrap';
import { ChatMessage } from '@/hooks/useChatMessages';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Удалить сообщение?')) {
      onDelete(message.id);
    }
  };

  const formatTime = (date: string): string => {
    try {
      return new Date(date).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (message.is_deleted) {
    return (
      <div
        className={`d-flex mb-2 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
      >
        <div
          style={{
            maxWidth: '70%',
            padding: '0.5rem 1rem',
            borderRadius: '1rem',
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
            fontStyle: 'italic',
          }}
        >
          <small>Сообщение удалено</small>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`d-flex mb-2 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '0.75rem 1rem',
          borderRadius: isOwn ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
          backgroundColor: isOwn ? '#0d6efd' : '#e9ecef',
          color: isOwn ? 'white' : 'black',
          position: 'relative',
        }}
      >
        {isEditing ? (
          <div>
            <Form.Control
              as="textarea"
              rows={3}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
              style={{ marginBottom: '0.5rem' }}
            />
            <div className="d-flex gap-2">
              <Button size="sm" variant="success" onClick={handleSaveEdit}>
                Сохранить
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </div>
            <div className="d-flex justify-content-between align-items-center mt-1">
              <small style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                {formatTime(message.created_at)}
                {message.is_edited && ' (изменено)'}
              </small>
              {isOwn && (
                <Dropdown align="end">
                  <Dropdown.Toggle
                    as="button"
                    className="btn btn-link btn-sm p-0 ms-2"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'inherit',
                      opacity: 0.7,
                    }}
                  >
                    <IconifyIcon icon="bx:dots-vertical-rounded" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setIsEditing(true)}>
                      <IconifyIcon icon="bx:pencil" className="me-2" />
                      Редактировать
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleDelete} className="text-danger">
                      <IconifyIcon icon="bx:trash" className="me-2" />
                      Удалить
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageItem;

