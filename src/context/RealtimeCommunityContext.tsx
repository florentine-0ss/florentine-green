import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatOnlineUser, PresenceToast, ChatChannel } from '../types';
import { soundService } from '../services/soundService';

interface RealtimeCommunityContextType {
  onlineUsers: ChatOnlineUser[];
  unreadCount: number;
  toasts: PresenceToast[];
  isConnected: boolean;
  soundEnabled: boolean;
  toggleSound: () => boolean;
  dismissToast: (id: string) => void;
  clearUnread: () => void;
  openChatForResponse: (target: {
    user?: ChatOnlineUser;
    channelId?: string;
    prefillReply?: string;
  }) => void;
  activeChatTarget: {
    user?: ChatOnlineUser;
    channelId?: string;
    prefillReply?: string;
  } | null;
  clearActiveChatTarget: () => void;
  deleteMessage: (messageId: string) => Promise<boolean>;
  updateMessageStatus: (messageId: string, status: 'pending' | 'answered') => Promise<boolean>;
  latestMessages: ChatMessage[];
  sendMessage: (payload: {
    channelId: string;
    content: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    senderAvatar?: string;
    replyTo?: { id: string; senderName: string; content: string };
    productTag?: any;
    attachments?: any[];
    voiceNote?: any;
    isDirectMessage?: boolean;
    recipientId?: string;
    recipientName?: string;
  }) => void;
}

const RealtimeCommunityContext = createContext<RealtimeCommunityContextType | undefined>(undefined);

export const RealtimeCommunityProvider: React.FC<{
  currentUser: User | null;
  isChatModalOpen: boolean;
  onOpenChatModal: () => void;
  children: React.ReactNode;
}> = ({ currentUser, isChatModalOpen, onOpenChatModal, children }) => {
  const [onlineUsers, setOnlineUsers] = useState<ChatOnlineUser[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<PresenceToast[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isEnabled());
  const [activeChatTarget, setActiveChatTarget] = useState<{
    user?: ChatOnlineUser;
    channelId?: string;
    prefillReply?: string;
  } | null>(null);
  const [latestMessages, setLatestMessages] = useState<ChatMessage[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isChatModalOpenRef = useRef(isChatModalOpen);
  isChatModalOpenRef.current = isChatModalOpen;

  // Stable session guest ID if no user is signed in
  const guestIdRef = useRef<string>('');
  if (!guestIdRef.current) {
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('fofo_guest_id') : null;
      if (stored) {
        guestIdRef.current = stored;
      } else {
        const created = `gst-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 6)}`;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('fofo_guest_id', created);
        }
        guestIdRef.current = created;
      }
    } catch {
      guestIdRef.current = `gst-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  const currentUserId = currentUser ? String(currentUser.id) : guestIdRef.current;
  const currentUserName = currentUser ? currentUser.name : 'Kigali Shopper';
  const currentUserRole = currentUser ? currentUser.role : 'customer';

  // Toggle sound
  const toggleSound = () => {
    const updated = soundService.toggleSound();
    setSoundEnabled(updated);
    return updated;
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearUnread = () => {
    setUnreadCount(0);
  };

  const clearActiveChatTarget = () => {
    setActiveChatTarget(null);
  };

  const openChatForResponse = (target: {
    user?: ChatOnlineUser;
    channelId?: string;
    prefillReply?: string;
  }) => {
    const cleanChannelId = target.channelId && target.channelId.startsWith('dm:')
      ? 'general'
      : target.channelId;
    setActiveChatTarget({
      ...target,
      channelId: cleanChannelId
    });
    onOpenChatModal();
    setUnreadCount(0);
  };

  const addToast = (toast: Omit<PresenceToast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: PresenceToast = {
      ...toast,
      id,
      timestamp: Date.now()
    };

    setToasts(prev => [newToast, ...prev].slice(0, 4));

    // Auto dismiss after 7.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 7500);
  };

  // Connect to WebSocket server on /ws/chat
  useEffect(() => {
    let isMounted = true;

    function connect() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);

          // Announce presence
          ws.send(JSON.stringify({
            type: 'presence:join',
            payload: {
              userId: currentUserId,
              userName: currentUserName,
              role: currentUserRole
            }
          }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (!data || !data.type) return;

            switch (data.type) {
              case 'chat:init': {
                const { onlineUsers: initialUsers, messages: initialMsgs } = data.payload || {};
                if (Array.isArray(initialUsers)) {
                  setOnlineUsers(initialUsers);
                }
                if (Array.isArray(initialMsgs)) {
                  setLatestMessages(initialMsgs);
                }
                break;
              }

              case 'presence:update': {
                const { onlineUsers: updatedUsers, event: presenceEvent, user: joinedUser } = data.payload || {};
                if (Array.isArray(updatedUsers)) {
                  setOnlineUsers(updatedUsers);
                }

                // If someone joined and it's not the current user: Trigger chime + immediate notification!
                if (presenceEvent === 'join' && joinedUser && joinedUser.userId !== currentUserId) {
                  soundService.playMemberJoined();
                  const roleLabel = joinedUser.role === 'admin' ? 'Administrator' : 
                                    joinedUser.role === 'stock_manager' ? 'Stock Manager' :
                                    joinedUser.role === 'cashier' ? 'Cashier' :
                                    joinedUser.role === 'sales_attendant' ? 'Sales Attendant' :
                                    joinedUser.role === 'accountant' ? 'Accountant' : 'Customer';

                  addToast({
                    type: 'member_joined',
                    user: joinedUser,
                    title: `${joinedUser.userName} is active now!`,
                    subtitle: `${roleLabel} joined the Member Lounge. Click to say hello & respond right away.`
                  });
                }
                break;
              }

              case 'chat:message': {
                const msg: ChatMessage = data.payload;
                if (!msg) return;

                setLatestMessages(prev => {
                  if (prev.some(m => m.id === msg.id)) return prev;
                  return [...prev, msg].slice(-500);
                });

                // If message is from someone else:
                if (msg.senderId !== currentUserId) {
                  soundService.playMessageReceived();

                  if (!isChatModalOpenRef.current) {
                    setUnreadCount(prev => prev + 1);
                  }

                  // Always show immediate floating response card
                  addToast({
                    type: 'new_message',
                    message: msg,
                    title: `New message from ${msg.senderName}`,
                    subtitle: msg.content.length > 80 ? `${msg.content.slice(0, 80)}...` : msg.content
                  });
                }
                break;
              }

              case 'chat:reaction': {
                const { messageId, reactions } = data.payload || {};
                if (messageId && reactions) {
                  setLatestMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
                }
                break;
              }

              case 'chat:delete': {
                const { messageId } = data.payload || {};
                if (messageId) {
                  setLatestMessages(prev => prev.filter(m => m.id !== messageId));
                }
                break;
              }

              case 'chat:status': {
                const { messageId, status, message } = data.payload || {};
                if (messageId) {
                  setLatestMessages(prev => prev.map(m => {
                    if (m.id === messageId) {
                      return message || { ...m, status };
                    }
                    return m;
                  }));
                }
                break;
              }
            }
          } catch (err) {
            console.warn('[RealtimeCommunity] Message parse error:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Auto reconnect after 3.5 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3500);
        };

        ws.onerror = (err) => {
          console.warn('[RealtimeCommunity] WebSocket warning:', err);
        };
      } catch (e) {
        console.warn('[RealtimeCommunity] Connection error:', e);
        reconnectTimeoutRef.current = setTimeout(connect, 3500);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [currentUserId, currentUserName, currentUserRole]);

  // Re-broadcast presence if current user profile changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'presence:join',
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          role: currentUserRole
        }
      }));
    }
  }, [currentUserId, currentUserName, currentUserRole]);

  // When a staff member logs in / switches role, alert them to any pending Admin message or directive
  const alertedDirectivesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'customer') return;

    // Check if there are messages from Admin in public staff-internal channel
    const staffMessages = latestMessages.filter(m => 
      (m.senderRole === 'admin' || m.senderId === 'usr-admin') &&
      m.channelId === 'staff-internal'
    );

    if (staffMessages.length > 0) {
      const latestStaffMsg = staffMessages[staffMessages.length - 1];
      const alertKey = `${currentUserId}-${latestStaffMsg.id}`;

      if (!alertedDirectivesRef.current.has(alertKey)) {
        alertedDirectivesRef.current.add(alertKey);

        setTimeout(() => {
          soundService.playMessageReceived();
          addToast({
            type: 'admin_directive',
            message: latestStaffMsg,
            title: `👑 Admin Directive from Florentine`,
            subtitle: latestStaffMsg.content.length > 95 ? `${latestStaffMsg.content.slice(0, 95)}...` : latestStaffMsg.content
          });
        }, 600);
      }
    }
  }, [currentUser, currentUserId, latestMessages]);

  // Send message helper
  const sendMessage = (payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:send',
        payload
      }));
    } else {
      // Fallback to REST API
      fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Chat send fallback:', err));
    }
  };

  // Delete message helper (Admin only)
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:delete',
        payload: { messageId }
      }));
      return true;
    }
    try {
      const res = await fetch(`/api/chat/messages/${messageId}?role=${currentUserRole}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('Delete message failed:', err);
      return false;
    }
  };

  // Update question status helper (Admin only)
  const updateMessageStatus = async (messageId: string, status: 'pending' | 'answered'): Promise<boolean> => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:status',
        payload: { messageId, status }
      }));
      return true;
    }
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, role: currentUserRole, answeredBy: currentUserName })
      });
      return res.ok;
    } catch (err) {
      console.warn('Update message status failed:', err);
      return false;
    }
  };

  return (
    <RealtimeCommunityContext.Provider
      value={{
        onlineUsers,
        unreadCount,
        toasts,
        isConnected,
        soundEnabled,
        toggleSound,
        dismissToast,
        clearUnread,
        openChatForResponse,
        activeChatTarget,
        clearActiveChatTarget,
        latestMessages,
        sendMessage,
        deleteMessage,
        updateMessageStatus
      }}
    >
      {children}
    </RealtimeCommunityContext.Provider>
  );
};

export const useRealtimeCommunity = () => {
  const context = useContext(RealtimeCommunityContext);
  if (!context) {
    throw new Error('useRealtimeCommunity must be used within a RealtimeCommunityProvider');
  }
  return context;
};
