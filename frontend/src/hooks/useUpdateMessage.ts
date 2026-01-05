import { useState } from 'react';
import httpClient from '@/helpers/httpClient';

interface UseUpdateMessageReturn {
  updateMessage: (chatId: string, messageId: string, userId: string, content: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useUpdateMessage = (): UseUpdateMessageReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateMessage = async (
    chatId: string,
    messageId: string,
    userId: string,
    content: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.patch<{ status: boolean }>(
        `/chats/${chatId}/messages/${messageId}?user_id=${userId}`,
        { content }
      );

      if (response.data.status) {
        return true;
      } else {
        throw new Error('Не удалось обновить сообщение');
      }
    } catch (err: any) {
      console.error('Ошибка обновления сообщения:', err);
      const errorMessage = err.response?.data?.message?.text || 'Ошибка при обновлении сообщения';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateMessage,
    loading,
    error,
  };
};

