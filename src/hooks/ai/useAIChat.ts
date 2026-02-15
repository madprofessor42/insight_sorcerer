import { useEffect, useRef, useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface UseAIChatOptions {
  url?: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export const useAIChat = (options: UseAIChatOptions = {}) => {
  const {
    url = 'ws://localhost:3001/api/ai/chat',
    autoConnect = false,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const shouldReconnectRef = useRef(true);

  // Очистка heartbeat
  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current !== undefined) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  }, []);

  // Запуск heartbeat
  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, clearHeartbeat]);

  // Функция переподключения с exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!reconnect || !shouldReconnectRef.current) return;
    
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'system',
          content: '❌ Не удалось подключиться к серверу. Попробуйте позже.',
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    const backoffDelay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
    
    console.log(`Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, backoffDelay);
  }, [reconnect, reconnectInterval, maxReconnectAttempts]);

  const connect = useCallback(() => {
    // Если уже подключены или подключаемся, не создавать новое соединение
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setIsConnecting(true);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('AI Chat WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0; // Сброс счетчика попыток
        startHeartbeat(); // Запуск heartbeat
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Игнорируем pong сообщения
          if (data.type === 'pong') {
            return;
          }

          if (data.type === 'welcome') {
            setMessages((prev) => [
              ...prev,
              {
                id: `system-${Date.now()}`,
                type: 'system',
                content: data.message,
                timestamp: data.timestamp,
              },
            ]);
          } else if (data.type === 'message') {
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                type: 'assistant',
                content: data.content,
                timestamp: data.timestamp,
              },
            ]);
          } else if (data.type === 'error') {
            console.error('AI Chat error:', data.message);
            setMessages((prev) => [
              ...prev,
              {
                id: `error-${Date.now()}`,
                type: 'system',
                content: `Ошибка: ${data.message}`,
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('AI Chat WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        clearHeartbeat();
        
        // Автоматическое переподключение если это не было намеренное закрытие
        if (shouldReconnectRef.current && event.code !== 1000) {
          scheduleReconnect();
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnecting(false);
      scheduleReconnect();
    }
  }, [url, startHeartbeat, clearHeartbeat, scheduleReconnect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false; // Отключаем автоматическое переподключение
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    clearHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected'); // 1000 = normal closure
      wsRef.current = null;
    }
  }, [clearHeartbeat]);

  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    // Добавляем сообщение пользователя в список
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Отправляем на сервер
    wsRef.current.send(
      JSON.stringify({
        type: 'message',
        message,
      })
    );
  }, []);

  const updateContext = useCallback((context: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'context_update',
        context,
      })
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Основной useEffect для управления соединением
  useEffect(() => {
    shouldReconnectRef.current = true;

    if (autoConnect) {
      connect();
    }

    // Cleanup функция
    return () => {
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      clearHeartbeat();
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [autoConnect, connect, clearHeartbeat]); // connect теперь в зависимостях

  return {
    messages,
    isConnected,
    isConnecting,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
    sendMessage,
    updateContext,
    clearMessages,
  };
};
