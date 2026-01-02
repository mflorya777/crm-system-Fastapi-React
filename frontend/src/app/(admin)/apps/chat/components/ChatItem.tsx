import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { Chat } from '@/hooks/useChats';

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: () => void;
  currentUserId: string;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isSelected, onSelect, currentUserId }) => {
  // Получаем название чата
  const getChatTitle = (): string => {
    if (chat.title) {
      return chat.title;
    }
    
    // Для личного чата показываем имя собеседника
    if (chat.chat_type === 'direct' && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find((p) => p.user_id !== currentUserId);
      return otherParticipant ? `Пользователь ${otherParticipant.user_id.substring(0, 8)}...` : 'Чат';
    }
    
    return chat.chat_type === 'group' ? 'Групповой чат' : 'Чат';
  };

  // Форматируем время последнего сообщения
  const getLastMessageTime = (): string => {
    if (!chat.last_message_at) return '';
    
    try {
      const now = new Date();
      const messageDate = new Date(chat.last_message_at);
      const diffMs = now.getTime() - messageDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'только что';
      if (diffMins < 60) return `${diffMins} мин. назад`;
      if (diffHours < 24) return `${diffHours} ч. назад`;
      if (diffDays < 7) return `${diffDays} дн. назад`;
      
      return messageDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  return (
    <ListGroup.Item
      action
      active={isSelected}
      onClick={onSelect}
      className="d-flex justify-content-between align-items-start"
      style={{ cursor: 'pointer' }}
    >
      <div className="flex-grow-1">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle me-2"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: chat.chat_type === 'direct' ? '#0d6efd' : '#6c757d',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            <i className={`bi ${chat.chat_type === 'direct' ? 'bi-person' : 'bi-people'}`}></i>
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold">{getChatTitle()}</div>
            <small className="text-muted">
              {chat.participants.length} {chat.participants.length === 1 ? 'участник' : 'участника'}
            </small>
          </div>
        </div>
      </div>
      <div className="d-flex flex-column align-items-end">
        {chat.last_message_at && (
          <small className="text-muted">{getLastMessageTime()}</small>
        )}
        {chat.unread_count > 0 && (
          <Badge bg="danger" className="mt-1">
            {chat.unread_count}
          </Badge>
        )}
      </div>
    </ListGroup.Item>
  );
};

export default ChatItem;

