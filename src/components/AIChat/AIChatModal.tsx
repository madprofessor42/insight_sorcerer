import { useEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { useAIChat } from '../../hooks/ai';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import type { RootState } from '../../store/store';
import { extractDiagramContext, formatDiagramContextForLLM } from '../../utils/diagram-data';
import { applyDiagramModifications } from '../../utils/diagram-modifications-applier';
import { Modal } from '../ui/Modal/Modal';
import { ModificationProposal } from './ModificationProposal';
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
  const {
    messages,
    isConnected,
    isConnecting,
    pendingProposal,
    connect,
    disconnect,
    sendMessage,
    updateContext,
    requestModifications,
    clearProposal,
  } = useAIChat();
  
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'ask' | 'modify'>('ask');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Get diagram state and dispatch from Redux
  const diagramState = useAppSelector((state) => state.diagram);
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  useEffect(() => {
    if (isOpen) {
      connect();
      // Фокус на input при открытии
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      disconnect();
    }
  }, [isOpen, connect, disconnect]);

  // Auto-send diagram context when connected or when diagram changes
  useEffect(() => {
    if (isConnected && isOpen) {
      // Небольшая задержка чтобы не спамить при быстрых изменениях
      const timer = setTimeout(() => {
        const context = extractDiagramContext({ diagram: diagramState } as any);
        const contextText = formatDiagramContextForLLM(context);
        
        updateContext({
          diagram: context,
          formattedContext: contextText,
          timestamp: new Date().toISOString(),
        });
        
        console.log('📊 Контекст диаграммы обновлен автоматически');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, isOpen, diagramState, updateContext]);

  useEffect(() => {
    // Автоскролл к последнему сообщению при изменении messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Автоскролл при разворачивании из минимизированного состояния
    if (isOpen && !isMinimized) {
      // Небольшая задержка для того, чтобы DOM успел отрендериться
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isMinimized, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    if (mode === 'ask') {
      sendMessage(inputValue.trim());
    } else {
      // Context is already in backend's conversationHistory from automatic updates
      requestModifications(inputValue.trim());
    }
    
    setInputValue('');
  };

  const handleAcceptModifications = () => {
    if (!pendingProposal) return;

    const result = applyDiagramModifications(
      pendingProposal,
      dispatch,
      store.getState
    );

    console.log('✨ Modifications applied:', result);
    alert(
      `Применено изменений: ${result.appliedCount}\n` +
      `Ошибок: ${result.failedCount}\n\n` +
      result.messages.join('\n')
    );

    clearProposal();
  };

  const handleRejectModifications = () => {
    clearProposal();
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

        {/* Modification Proposal */}
        {pendingProposal && (
          <div className={styles.proposalWrapper}>
            <ModificationProposal
              proposal={pendingProposal}
              onAccept={handleAcceptModifications}
              onReject={handleRejectModifications}
            />
          </div>
        )}

        {/* Input */}
        <div className={styles.inputContainer}>
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            <select
              className={styles.modeSelect}
              value={mode}
              onChange={(e) => setMode(e.target.value as 'ask' | 'modify')}
              disabled={!isConnected}
              title="Выберите режим работы"
            >
              <option value="ask">💬 Спросить</option>
              <option value="modify">✨ Изменить</option>
            </select>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected
                  ? mode === 'ask'
                    ? 'Напишите ваш вопрос... (Enter для отправки, Shift+Enter для новой строки)'
                    : 'Опишите как изменить диаграмму... (Enter для отправки, Shift+Enter для новой строки)'
                  : 'Подключение к серверу...'
              }
              disabled={!isConnected}
              rows={1}
            />
            <button
              type="submit"
              className={mode === 'modify' ? styles.modifyButton : styles.sendButton}
              disabled={!isConnected || !inputValue.trim()}
              title={mode === 'ask' ? 'Отправить вопрос' : 'Запросить изменения диаграммы'}
            >
              {mode === 'ask' ? '📤 Отправить' : '✨ Применить'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

