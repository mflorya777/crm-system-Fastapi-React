import React, { useEffect, useRef, useState } from 'react';
import { Card, Spinner, Badge } from 'react-bootstrap';
import { Chat } from '@/hooks/useChats';
import { ChatMessage } from '@/hooks/useChatMessages';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

interface ChatWindowProps {
  chat: Chat;
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: Set<string>;
  onlineUsers: string[];
  connected: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  loading,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onTyping,
  typingUsers,
  onlineUsers,
  connected,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Автоматическая прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll]);

  // Отслеживаем прокрутку
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
  };

  // Получаем название чата
  const getChatTitle = (): string => {
    if (chat.title) return chat.title;
    
    // Для личного чата показываем ФИО собеседника
    if (chat.chat_type === 'direct' && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find((p) => p.user_id !== currentUserId);
      if (otherParticipant) {
        const { soname, name, father_name } = otherParticipant;
        // Формируем ФИО: Фамилия Имя Отчество
        const fullName = [soname, name, father_name].filter(Boolean).join(' ');
        return fullName || 'Собеседник';
      }
      return 'Личный чат';
    }
    
    return chat.chat_type === 'group' ? 'Групповой чат' : 'Чат';
  };

  // Для личного чата определяем ID собеседника и его онлайн-статус
  const getOtherParticipantId = (): string | null => {
    if (chat.chat_type === 'direct' && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find((p) => p.user_id !== currentUserId);
      return otherParticipant ? otherParticipant.user_id : null;
    }
    return null;
  };

  const otherParticipantId = getOtherParticipantId();
  const isOtherParticipantOnline = otherParticipantId ? onlineUsers.includes(otherParticipantId) : false;
  const onlineCount = onlineUsers.length;

  return (
    <Card style={{ height: '100%', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column' }}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            {getChatTitle()}
            {!connected && (
              <Badge bg="warning" className="ms-2">
                Подключение...
              </Badge>
            )}
            {connected && chat.chat_type === 'direct' && (
              <Badge bg={isOtherParticipantOnline ? 'success' : 'secondary'} className="ms-2">
                {isOtherParticipantOnline ? 'Онлайн' : 'Не онлайн'}
              </Badge>
            )}
          </h5>
          <small className="text-muted">
            {chat.chat_type === 'group' && (
              <>
                {chat.participants.length} участников
                {onlineCount > 0 && ` • ${onlineCount} онлайн`}
              </>
            )}
          </small>
        </div>
      </Card.Header>
      
      <Card.Body
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
        }}
      >
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted" style={{ margin: 'auto' }}>
            <IconifyIcon icon="bx:message-dots" style={{ fontSize: '3rem' }} />
            <p className="mt-2">Нет сообщений</p>
            <small>Начните переписку</small>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const showDate =
                index === 0 ||
                new Date(message.created_at).toDateString() !==
                  new Date(messages[index - 1].created_at).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="text-center my-3">
                      <small className="text-muted">
                        {new Date(message.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </small>
                    </div>
                  )}
                  <MessageItem
                    message={message}
                    isOwn={isOwn}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                  />
                </React.Fragment>
              );
            })}
            
            {typingUsers.size > 0 && (
              <div className="mb-2">
                <small className="text-muted">
                  <IconifyIcon icon="bx:dots-horizontal-rounded" className="me-1" /> Печатает...
                </small>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Card.Body>
      
      <Card.Footer className="p-2">
        <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} disabled={!connected} />
      </Card.Footer>
    </Card>
  );
};

export default ChatWindow;

