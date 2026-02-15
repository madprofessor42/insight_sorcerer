import { useEffect, useRef, useState } from 'react';
import { useAIChat } from '../../hooks/ai';
import { Modal } from '../ui/Modal/Modal';
import styles from './AIChatModal.module.css';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export const AIChatModal = ({ 
  isOpen, 
  onClose, 
  isMinimized = false,
  onMinimize,
  onMaximize,
}: AIChatModalProps) => {
  const { messages, isConnected, isConnecting, connect, disconnect, sendMessage } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      connect();
      // Фокус на input при открытии
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      disconnect();
    }
  }, [isOpen, connect, disconnect]);

  useEffect(() => {
    // Автоскролл к последнему сообщению
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isConnected) return;
    sendMessage(suggestion);
  };

  const suggestions = [
    'Как создать модель роста населения?',
    'Помоги исправить формулу',
    'Объясни как работают Stock и Flow',
    'Как добавить обратную связь в модель?',
  ];

  const modalTitle = (
    <div className={styles.titleContainer}>
      <span>🤖 AI Ассистент</span>
      <div className={styles.status}>
        <span
          className={`${styles.statusDot} ${
            isConnected ? styles.connected : isConnecting ? styles.connecting : ''
          }`}
        />
        <span className={styles.statusText}>
          {isConnected ? 'Подключено' : isConnecting ? 'Подключение...' : 'Отключено'}
        </span>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle} 
      size="large"
      draggable={true}
      minimizable={true}
      isMinimized={isMinimized}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      windowId="ai-chat"
    >
      <div className={styles.chatContainer}>
        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>💬</div>
              <div className={styles.emptyStateText}>
                Привет! Я помогу вам с построением и анализом моделей.
                <br />
                Задайте мне вопрос или выберите один из предложенных вариантов:
              </div>
              <div className={styles.suggestions}>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={styles.suggestionButton}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={!isConnected}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`${styles.message} ${styles[message.type]}`}>
                <div className={styles.messageHeader}>
                  <div className={styles.messageAvatar}>
                    {message.type === 'user' ? '👤' : message.type === 'assistant' ? '🤖' : 'ℹ️'}
                  </div>
                  <span className={styles.messageSender}>
                    {message.type === 'user'
                      ? 'Вы'
                      : message.type === 'assistant'
                      ? 'AI Ассистент'
                      : 'Система'}
                  </span>
                </div>
                <div className={styles.messageContent}>{message.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputContainer}>
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected
                  ? 'Напишите ваш вопрос... (Enter для отправки, Shift+Enter для новой строки)'
                  : 'Подключение к серверу...'
              }
              disabled={!isConnected}
              rows={1}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!isConnected || !inputValue.trim()}
            >
              Отправить
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

