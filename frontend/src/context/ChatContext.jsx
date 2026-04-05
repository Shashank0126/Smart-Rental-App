import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);
export function ChatProvider({ children }) {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const [messages, setMessages] = useState({});   // { conversationKey: [msgs] }
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);

  const connect = () => {
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) return;

    const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      .replace('http', 'ws');
    const ws = new WebSocket(`${WS_URL}/ws/chat/${token}`);

    ws.onopen  = () => { setConnected(true); console.log('WS connected'); };
    ws.onclose = () => { setConnected(false); console.log('WS disconnected'); };
    ws.onerror = (e) => console.error('WS error', e);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message' || data.type === 'sent') {
        const key = [data.senderId, data.receiverId].sort().join('-');
        setMessages(prev => ({
          ...prev,
          [key]: [...(prev[key] || []), data]
        }));
        if (data.type === 'new_message') {
          setUnread(n => n + 1);
        }
      }
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  };

  const sendWsMessage = (receiverId, message, propertyId = null) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return false;
    }
    wsRef.current.send(JSON.stringify({ receiverId, message, propertyId }));
    return true;
  };

  const addMessages = (key, msgs) => {
    setMessages(prev => ({ ...prev, [key]: msgs }));
  };

  useEffect(() => {
    if (token) connect();
    return () => disconnect();
  }, [token]);

  return (
    <ChatContext.Provider value={{ connected, messages, unread, setUnread, sendWsMessage, addMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
