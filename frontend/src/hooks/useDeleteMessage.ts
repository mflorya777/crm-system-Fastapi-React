import { useState } from 'react';
import httpClient from '@/helpers/httpClient';

interface UseDeleteMessageReturn {
  deleteMessage: (chatId: string, messageId: string, userId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useDeleteMessage = (): UseDeleteMessageReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMessage = async (
    chatId: string,
    messageId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.delete<{ status: boolean }>(
        `/chats/${chatId}/messages/${messageId}?user_id=${userId}`
      );

      if (response.data.status) {
        return true;
      } else {
        throw new Error('Не удалось удалить сообщение');
      }
    } catch (err: any) {
      console.error('Ошибка удаления сообщения:', err);
      const errorMessage = err.response?.data?.message?.text || 'Ошибка при удалении сообщения';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteMessage,
    loading,
    error,
  };
};

