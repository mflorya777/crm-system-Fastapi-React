import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Автофокус на поле ввода
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Отправляем индикатор печатания
    if (value.length > 0) {
      onTyping(true);

      // Сбрасываем предыдущий таймер
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Через 2 секунды без ввода сообщаем, что пользователь перестал печатать
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else {
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      onTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Возвращаем фокус на поле ввода
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Отправка по Enter (без Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <InputGroup>
      <Form.Control
        ref={inputRef}
        as="textarea"
        rows={2}
        placeholder={disabled ? 'Подключение...' : 'Введите сообщение... (Enter для отправки)'}
        value={message}
        onChange={handleMessageChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          resize: 'none',
          borderRadius: '0.5rem 0 0 0.5rem',
        }}
      />
      <Button
        variant="primary"
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        style={{
          borderRadius: '0 0.5rem 0.5rem 0',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }}
      >
        <i className="bi bi-send-fill"></i>
      </Button>
    </InputGroup>
  );
};

export default MessageInput;

