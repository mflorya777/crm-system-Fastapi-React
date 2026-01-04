'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import CreateChatModal from './components/CreateChatModal';
import { useChats } from '@/hooks/useChats';
import { useChatMessages, ChatMessage } from '@/hooks/useChatMessages';
import { useCreateChat } from '@/hooks/useCreateChat';
import { useUpdateMessage } from '@/hooks/useUpdateMessage';
import { useDeleteMessage } from '@/hooks/useDeleteMessage';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useAuthContext } from '@/context/useAuthContext';

const ChatPage: React.FC = () => {
  const { user } = useAuthContext();
  const currentUserId = user?.id || '';
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Hooks для чатов
  const { chats, loading: chatsLoading, error: chatsError, refetch: refetchChats } = useChats(currentUserId);
  const { createChat } = useCreateChat();
  const { updateMessage } = useUpdateMessage();
  const { deleteMessage } = useDeleteMessage();

  // Hooks для сообщений выбранного чата
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useChatMessages(selectedChatId || '', 50);

  // Обработчики WebSocket событий
  const handleNewMessage = useCallback((message: ChatMessage) => {
    setLocalMessages((prev) => [...prev, message]);
    refetchChats(); // Обновляем список чатов для обновления last_message_at
  }, [refetchChats]);

  const handleTypingIndicator = useCallback((userId: string, isTyping: boolean) => {
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      if (isTyping) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const handleMessageEdited = useCallback((messageId: string, content: string) => {
    setLocalMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content, is_edited: true, updated_at: new Date().toISOString() }
          : msg
      )
    );
  }, []);

  const handleMessageDeleted = useCallback((messageId: string) => {
    setLocalMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, is_deleted: true, content: '[удалено]' }
          : msg
      )
    );
  }, []);

  // WebSocket соединение (только если чат выбран)
  const {
    connected,
    sendMessage: sendWSMessage,
    sendTypingIndicator,
    markAsRead,
    onlineUsers,
  } = useChatWebSocket(
    selectedChatId || '',
    currentUserId,
    selectedChatId ? handleNewMessage : undefined,
    selectedChatId ? handleTypingIndicator : undefined,
    selectedChatId ? handleMessageEdited : undefined,
    selectedChatId ? handleMessageDeleted : undefined
  );

  // Синхронизация локальных сообщений с загруженными
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Отметка сообщений как прочитанных при открытии чата
  useEffect(() => {
    if (selectedChatId && connected) {
      markAsRead();
    }
  }, [selectedChatId, connected, markAsRead]);

  // Обработчики действий
  const handleCreateChat = async (participantIds: string[], chatType: 'direct' | 'group', title?: string) => {
    const chat = await createChat(currentUserId, {
      participant_ids: participantIds,
      chat_type: chatType,
      title,
    });

    if (chat) {
      await refetchChats();
      setSelectedChatId(chat.id);
    }
  };

  const handleSendMessage = useCallback(
    (content: string) => {
      if (selectedChatId && connected) {
        sendWSMessage(content);
      }
    },
    [selectedChatId, connected, sendWSMessage]
  );

  const handleEditMessage = async (messageId: string, content: string) => {
    if (selectedChatId) {
      const success = await updateMessage(selectedChatId, messageId, currentUserId, content);
      if (success) {
        // Оптимистичное обновление уже произошло через WebSocket
        await refetchMessages();
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (selectedChatId) {
      const success = await deleteMessage(selectedChatId, messageId, currentUserId);
      if (success) {
        // Оптимистичное обновление уже произошло через WebSocket
        await refetchMessages();
      }
    }
  };

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (connected) {
        sendTypingIndicator(isTyping);
      }
    },
    [connected, sendTypingIndicator]
  );

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Проверка авторизации
  if (!user || !currentUserId) {
    return (
      <>
        <PageBreadcrumb title="Чаты" subName="" />
        <Container fluid className="mt-3">
          <Alert variant="warning">
            Необходима авторизация для просмотра чатов
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageBreadcrumb title="Чаты" subName="" />
      <Container fluid className="mt-3">
        {chatsError && (
          <Alert variant="danger" className="mb-3">
            Ошибка загрузки чатов: {chatsError}
          </Alert>
        )}
        {messagesError && (
          <Alert variant="danger" className="mb-3">
            Ошибка загрузки сообщений: {messagesError}
          </Alert>
        )}
        
        <Row style={{ height: 'calc(100vh - 200px)' }}>
          <Col md={4} className="pe-2" style={{ height: '100%' }}>
            <ChatList
              chats={chats}
              loading={chatsLoading}
              selectedChatId={selectedChatId || undefined}
              onChatSelect={setSelectedChatId}
              onCreateChat={() => setShowCreateModal(true)}
              currentUserId={currentUserId}
            />
          </Col>
          <Col md={8} className="ps-2" style={{ height: '100%' }}>
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                messages={localMessages}
                loading={messagesLoading}
                currentUserId={currentUserId}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onTyping={handleTyping}
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
                connected={connected}
              />
            ) : (
              <div
                className="d-flex justify-content-center align-items-center h-100"
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '0.5rem',
                  border: '1px solid #dee2e6',
                }}
              >
                <div className="text-center text-muted">
                  <IconifyIcon icon="bx:chat" style={{ fontSize: '4rem' }} />
                  <p className="mt-3">Выберите чат для начала общения</p>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <CreateChatModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onCreate={handleCreateChat}
      />
    </>
  );
};

export default ChatPage;
