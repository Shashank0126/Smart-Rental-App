import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Send, MessageCircle, Loader, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { userId: paramUserId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { messages, addMessages, sendWsMessage, connected, unread, setUnread } = useChat();

  const [threads, setThreads]         = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [newMsg, setNewMsg]            = useState('');
  const [sending, setSending]          = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const bottomRef = useRef(null);

  // Load threads
  useEffect(() => {
    chatAPI.getThreads()
      .then(r => {
        setThreads(r.data);
        // Auto-select from URL param
        if (paramUserId) {
          const t = r.data.find(th => th.userId === paramUserId);
          if (t) openThread(t);
          else {
            const newThread = {
              userId: paramUserId,
              userName: location.state?.ownerName || 'User',
              lastMessage: '',
              unread: 0,
            };
            setThreads(prev => [newThread, ...prev]);
            openThread(newThread);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingThreads(false));

    setUnread(0);
  }, []);

  const openThread = async (thread) => {
    setActiveThread(thread);
    const key = [user?.id, thread.userId].sort().join('-');
    if (!messages[key]) {
      try {
        const res = await chatAPI.getConversation(thread.userId, location.state?.propertyId);
        addMessages(key, res.data);
      } catch {}
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThread]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeThread) return;
    setSending(true);
    const msg = newMsg.trim();
    setNewMsg('');
    // Try WS first
    const sent = sendWsMessage(activeThread.userId, msg, location.state?.propertyId);
    if (!sent) {
      // REST fallback
      try {
        await chatAPI.send({
          receiverId: activeThread.userId,
          message: msg,
          propertyId: location.state?.propertyId,
        });
      } catch { toast.error('Failed to send message'); }
    }
    // Update thread list
    setThreads(prev => prev.map(t =>
      t.userId === activeThread.userId ? { ...t, lastMessage: msg } : t
    ));
    setSending(false);
  };

  const activeKey = activeThread ? [user?.id, activeThread.userId].sort().join('-') : null;
  const activeMessages = activeKey ? (messages[activeKey] || []) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn">
      <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 140px)', display: 'flex' }}>
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-indigo-400" />
              <h2 className="font-semibold text-white">Messages</h2>
              <div className={`ml-auto w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-slate-600'}`} title={connected ? 'Connected' : 'Offline'} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="flex items-center justify-center py-10"><Loader size={24} className="animate-spin text-indigo-400" /></div>
            ) : threads.length > 0 ? (
              threads.map(thread => (
                <button
                  key={thread.userId}
                  onClick={() => openThread(thread)}
                  className={`w-full text-left p-4 transition-all hover:bg-white/5 ${activeThread?.userId === thread.userId ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {thread.userName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">{thread.userName}</p>
                        {thread.unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                            {thread.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{thread.lastMessage || 'Start a conversation'}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">No conversations yet</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeThread ? (
            <>
              {/* Header */}
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
                  {activeThread.userName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{activeThread.userName}</p>
                  <p className="text-xs text-slate-500">{connected ? '🟢 Online' : '⚫ Offline'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={isMe ? 'bubble-sent' : 'bubble-received'}>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {activeMessages.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    No messages yet. Say hello! 👋
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                    id="chat-input"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMsg.trim()}
                    className="btn-primary px-4 py-3 disabled:opacity-50 flex items-center gap-2"
                    id="chat-send"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <MessageCircle size={56} className="text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-slate-400 text-sm">Choose a thread from the left panel or contact an owner from a property listing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
