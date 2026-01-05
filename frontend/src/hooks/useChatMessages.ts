import { useState, useCallback, useEffect } from 'react';
import httpClient from '@/helpers/httpClient';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message_type: 'text' | 'file' | 'image';
  content: string;
  file_url?: string;
  created_at: string;
  updated_at?: string;
  is_edited: boolean;
  is_deleted: boolean;
  read_by: string[];
}

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export const useChatMessages = (chatId: string, limit: number = 50): UseChatMessagesReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchMessages = useCallback(async (newSkip: number = 0, append: boolean = false) => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      const response = await httpClient.get<{ status: boolean; data: ChatMessage[] }>(
        `/chats/${chatId}/messages?skip=${newSkip}&limit=${limit}`
      );

      if (response.data.status && response.data.data) {
        const newMessages = response.data.data;
        
        if (append) {
          setMessages(prev => [...prev, ...newMessages]);
        } else {
          setMessages(newMessages);
        }
        
        setHasMore(newMessages.length === limit);
      } else {
        throw new Error('Не удалось загрузить сообщения');
      }
    } catch (err: any) {
      console.error('Ошибка загрузки сообщений:', err);
      setError(err.response?.data?.message?.text || 'Ошибка при загрузке сообщений');
    } finally {
      setLoading(false);
    }
  }, [chatId, limit]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const newSkip = skip + limit;
    setSkip(newSkip);
    await fetchMessages(newSkip, true);
  }, [skip, limit, hasMore, loading, fetchMessages]);

  useEffect(() => {
    setSkip(0);
    setMessages([]);
    setHasMore(true);
    fetchMessages(0, false);
  }, [chatId, limit]);

  return {
    messages,
    loading,
    error,
    fetchMessages: () => fetchMessages(0, false),
    refetch: () => fetchMessages(0, false),
    loadMore,
    hasMore,
  };
};

