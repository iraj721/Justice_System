// frontend/src/shared/hooks/useWebSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { getToken } from '../services/auth';
import { API_BASE_URL } from '../env';

type WebSocketMessage = {
  type: string;
  case_id?: string;
  data: any;
  timestamp: string;
};

export function useWebSocket(caseId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) return;

    // Better WebSocket URL construction
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let apiHost = API_BASE_URL.replace(/^https?:\/\//, '');
    
    let wsUrl: string;
    if (caseId) {
        wsUrl = `${wsProtocol}//${apiHost}/ws/case/${caseId}?token=${token}`;
    } else {
        wsUrl = `${wsProtocol}//${apiHost}/ws/user?token=${token}`;
    }

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('✅ WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        if (message.type === 'notification') {
          setNotifications(prev => [message, ...prev].slice(0, 50));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Reconnecting WebSocket...');
        connect();
      }, 3000);
    };
    
    wsRef.current = ws;
  }, [caseId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  const sendPing = useCallback(() => {
    sendMessage('ping');
  }, [sendMessage]);

  const requestRefresh = useCallback(() => {
    sendMessage('refresh');
  }, [sendMessage]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    notifications,
    sendMessage,
    sendPing,
    requestRefresh,
    disconnect
  };
}