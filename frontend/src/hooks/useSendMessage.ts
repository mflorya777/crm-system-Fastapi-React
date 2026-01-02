import { useState } from 'react';
import httpClient from '@/helpers/httpClient';
import { ChatMessage } from './useChatMessages';

interface SendMessageParams {
  content: string;
  message_type?: 'text' | 'file' | 'image';
  file_url?: string;
}

interface UseSendMessageReturn {
  sendMessage: (chatId: string, userId: string, params: SendMessageParams) => Promise<ChatMessage | null>;
  loading: boolean;
  error: string | null;
}

export const useSendMessage = (): UseSendMessageReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    chatId: string,
    userId: string,
    params: SendMessageParams
  ): Promise<ChatMessage | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.post<{ status: boolean; data: ChatMessage }>(
        `/chats/${chatId}/messages?user_id=${userId}`,
        params
      );

      if (response.data.status && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Не удалось отправить сообщение');
      }
    } catch (err: any) {
      console.error('Ошибка отправки сообщения:', err);
      const errorMessage = err.response?.data?.message?.text || 'Ошибка при отправке сообщения';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
    error,
  };
};

