import React from 'react';
import { Card, ListGroup, Button, Spinner, Badge } from 'react-bootstrap';
import { Chat } from '@/hooks/useChats';
import ChatItem from './ChatItem';

interface ChatListProps {
  chats: Chat[];
  loading: boolean;
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  currentUserId: string;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  loading,
  selectedChatId,
  onChatSelect,
  onCreateChat,
  currentUserId,
}) => {
  const totalUnread = chats.reduce((sum, chat) => sum + chat.unread_count, 0);

  return (
    <Card style={{ height: '100%', borderRadius: '0.5rem' }}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">Чаты</h5>
          {totalUnread > 0 && (
            <Badge bg="danger" className="ms-2">
              {totalUnread}
            </Badge>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={onCreateChat}>
          <i className="bi bi-plus-lg me-1"></i>
          Новый чат
        </Button>
      </Card.Header>
      <Card.Body className="p-0" style={{ overflowY: 'auto' }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center text-muted p-4">
            <i className="bi bi-chat-dots" style={{ fontSize: '3rem' }}></i>
            <p className="mt-2">Нет чатов</p>
            <Button variant="outline-primary" size="sm" onClick={onCreateChat}>
              Создать первый чат
            </Button>
          </div>
        ) : (
          <ListGroup variant="flush">
            {chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={chat.id === selectedChatId}
                onSelect={() => onChatSelect(chat.id)}
                currentUserId={currentUserId}
              />
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default ChatList;

