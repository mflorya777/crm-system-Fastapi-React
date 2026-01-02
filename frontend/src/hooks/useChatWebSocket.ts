import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage } from './useChatMessages';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseChatWebSocketReturn {
  connected: boolean;
  sendMessage: (content: string, messageType?: string, fileUrl?: string) => void;
  sendTypingIndicator: (isTyping: boolean) => void;
  markAsRead: () => void;
  onlineUsers: string[];
  disconnect: () => void;
}

export const useChatWebSocket = (
  chatId: string,
  userId: string,
  onNewMessage?: (message: ChatMessage) => void,
  onTypingIndicator?: (userId: string, isTyping: boolean) => void,
  onMessageEdited?: (messageId: string, content: string) => void,
  onMessageDeleted?: (messageId: string) => void,
  onMessagesRead?: (userId: string) => void,
  onUserJoined?: (userId: string) => void,
  onUserLeft?: (userId: string) => void
): UseChatWebSocketReturn => {
  const [connected, setConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!chatId || !userId) return;

    try {
      // Используем ws:// для локального окружения, wss:// для продакшна
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = '8081'; // Порт бэкенда
      const wsUrl = `${protocol}//${host}:${port}/chats/ws/${chatId}?user_id=${userId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('Connected to chat:', data.chat_id);
              break;

            case 'online_users':
              setOnlineUsers(data.users || []);
              break;

            case 'new_message':
              if (onNewMessage && data.message) {
                onNewMessage(data.message as ChatMessage);
              }
              break;

            case 'typing_indicator':
              if (onTypingIndicator && data.user_id) {
                onTypingIndicator(data.user_id, data.is_typing);
              }
              break;

            case 'message_edited':
              if (onMessageEdited && data.message_id && data.content) {
                onMessageEdited(data.message_id, data.content);
              }
              break;

            case 'message_deleted':
              if (onMessageDeleted && data.message_id) {
                onMessageDeleted(data.message_id);
              }
              break;

            case 'messages_read':
              if (onMessagesRead && data.user_id) {
                onMessagesRead(data.user_id);
              }
              break;

            case 'user_joined':
              if (onUserJoined && data.user_id) {
                onUserJoined(data.user_id);
                setOnlineUsers((prev) => [...prev, data.user_id]);
              }
              break;

            case 'user_left':
              if (onUserLeft && data.user_id) {
                onUserLeft(data.user_id);
                setOnlineUsers((prev) => prev.filter((id) => id !== data.user_id));
              }
              break;

            case 'pong':
              // Ответ на ping
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        wsRef.current = null;

        // Попытка переподключения
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
    }
  }, [chatId, userId, onNewMessage, onTypingIndicator, onMessageEdited, onMessageDeleted, onMessagesRead, onUserJoined, onUserLeft]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnection
  }, []);

  const sendWSMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  const sendMessage = useCallback((content: string, messageType: string = 'text', fileUrl?: string) => {
    sendWSMessage({
      type: 'send_message',
      content,
      message_type: messageType,
      file_url: fileUrl,
    });
  }, [sendWSMessage]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    sendWSMessage({
      type: 'typing_indicator',
      is_typing: isTyping,
    });
  }, [sendWSMessage]);

  const markAsRead = useCallback(() => {
    sendWSMessage({
      type: 'mark_as_read',
    });
  }, [sendWSMessage]);

  useEffect(() => {
    // Не подключаемся, если chatId пустой
    if (!chatId || !userId) {
      return;
    }

    connect();

    // Ping каждые 30 секунд для поддержания соединения
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendWSMessage({ type: 'ping' });
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      disconnect();
    };
  }, [chatId, userId, connect, disconnect, sendWSMessage]);

  return {
    connected,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    onlineUsers,
    disconnect,
  };
};

