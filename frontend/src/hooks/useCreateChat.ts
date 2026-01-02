import { useState } from 'react';
import httpClient from '@/helpers/httpClient';
import { Chat } from './useChats';

interface CreateChatParams {
  participant_ids: string[];
  chat_type?: 'direct' | 'group';
  title?: string;
  deal_id?: string;
  buyer_id?: string;
}

interface UseCreateChatReturn {
  createChat: (userId: string, params: CreateChatParams) => Promise<Chat | null>;
  loading: boolean;
  error: string | null;
}

export const useCreateChat = (): UseCreateChatReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createChat = async (userId: string, params: CreateChatParams): Promise<Chat | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.post<{ status: boolean; data: Chat }>(
        `/chats?user_id=${userId}`,
        params
      );

      if (response.data.status && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Не удалось создать чат');
      }
    } catch (err: any) {
      console.error('Ошибка создания чата:', err);
      const errorMessage = err.response?.data?.message?.text || 'Ошибка при создании чата';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createChat,
    loading,
    error,
  };
};

