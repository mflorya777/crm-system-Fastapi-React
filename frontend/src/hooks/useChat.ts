import { useState, useCallback, useEffect } from 'react';
import httpClient from '@/helpers/httpClient';
import { Chat } from './useChats';

interface UseChatReturn {
  chat: Chat | null;
  loading: boolean;
  error: string | null;
  fetchChat: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useChat = (chatId: string): UseChatReturn => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChat = useCallback(async () => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.get<{ status: boolean; data: Chat }>(
        `/chats/${chatId}`
      );

      if (response.data.status && response.data.data) {
        setChat(response.data.data);
      } else {
        throw new Error('Не удалось загрузить чат');
      }
    } catch (err: any) {
      console.error('Ошибка загрузки чата:', err);
      setError(err.response?.data?.message?.text || 'Ошибка при загрузке чата');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  return {
    chat,
    loading,
    error,
    fetchChat,
    refetch: fetchChat,
  };
};

