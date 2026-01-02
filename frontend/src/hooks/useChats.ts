import { useState, useCallback, useEffect } from 'react';
import httpClient from '@/helpers/httpClient';

export interface ChatParticipant {
  user_id: string;
  joined_at: string;
  last_read_at?: string;
}

export interface Chat {
  id: string;
  title?: string;
  chat_type: 'direct' | 'group';
  participants: ChatParticipant[];
  created_at: string;
  created_by: string;
  updated_at?: string;
  is_active: boolean;
  deal_id?: string;
  buyer_id?: string;
  last_message_at?: string;
  unread_count: number;
}

interface UseChatsReturn {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  fetchChats: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useChats = (userId: string, activeOnly: boolean = true): UseChatsReturn => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.get<{ status: boolean; data: Chat[] }>(
        `/chats?user_id=${userId}&active_only=${activeOnly}`
      );

      if (response.data.status && response.data.data) {
        setChats(response.data.data);
      } else {
        throw new Error('Не удалось загрузить чаты');
      }
    } catch (err: any) {
      console.error('Ошибка загрузки чатов:', err);
      setError(err.response?.data?.message?.text || 'Ошибка при загрузке чатов');
    } finally {
      setLoading(false);
    }
  }, [userId, activeOnly]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    loading,
    error,
    fetchChats,
    refetch: fetchChats,
  };
};

