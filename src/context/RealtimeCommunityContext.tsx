import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { User, ChatMessage, ChatMessageType, ChatOnlineUser, PresenceToast } from '../types';
import { soundService } from '../services/soundService';
import {
  auth,
  subscribeToPublicChatMessages,
  publishChatMessageToFirestore,
  updateChatQuestionStatusInFirestore,
  deleteChatMessageInFirestore,
} from '../lib/firebase';

export interface ActiveChatTarget {
  user?: ChatOnlineUser;
  channelId?: string;
  prefillReply?: string;
  replyToMessage?: ChatMessage;
}

interface RealtimeCommunityContextType {
  onlineUsers: ChatOnlineUser[];
  unreadCount: number;
  toasts: PresenceToast[];
  isConnected: boolean;
  soundEnabled: boolean;
  chatError: string | null;
  clearChatError: () => void;
  toggleSound: () => boolean;
  dismissToast: (id: string) => void;
  clearUnread: () => void;
  openChatForResponse: (target: ActiveChatTarget) => void;
  activeChatTarget: ActiveChatTarget | null;
  clearActiveChatTarget: () => void;
  deleteMessage: (messageId: string) => Promise<boolean>;
  updateMessageStatus: (messageId: string, status: 'pending' | 'answered') => Promise<boolean>;
  postOfficialAdminReply: (
    parentMsg: ChatMessage,
    content: string
  ) => Promise<{ ok: boolean; error?: string }>;
  latestMessages: ChatMessage[];
  refreshMessages: () => Promise<void>;
  upsertServerMessage: (
    msg: ChatMessage,
    parentQuestionId?: string,
    answeredBy?: string
  ) => void;
  sendMessage: (payload: {
    channelId: string;
    content: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    messageType?: ChatMessageType;
    isOfficialReply?: boolean;
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
  const [activeChatTarget, setActiveChatTarget] = useState<ActiveChatTarget | null>(null);
  const [serverMessages, setServerMessages] = useState<ChatMessage[]>([]);
  const [firestoreMessages, setFirestoreMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const errorTimeoutRef = useRef<any>(null);
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

  const triggerChatError = (message: string) => {
    setChatError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setChatError(null);
    }, 6000);
  };

  const clearChatError = () => {
    setChatError(null);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
  };

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

  const openChatForResponse = (target: ActiveChatTarget) => {
    const cleanChannelId =
      target.channelId && target.channelId.startsWith('dm:') ? 'general' : target.channelId;
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

  // Subscribe to Firestore chat_messages when Firebase Auth is active
  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }
      if (fbUser) {
        unsubFirestore = subscribeToPublicChatMessages((msgs) => {
          setFirestoreMessages(msgs);
        });
      } else {
        setFirestoreMessages([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  // Merge Express WebSocket messages + Firestore messages deduplicated by id
  const latestMessages = useMemo(() => {
    if (firestoreMessages.length === 0) return serverMessages;
    const seen = new Set(serverMessages.map(m => m.id));
    const extraFromFirestore = firestoreMessages.filter(m => !seen.has(m.id));
    if (extraFromFirestore.length === 0) return serverMessages;
    return [...serverMessages, ...extraFromFirestore].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [serverMessages, firestoreMessages]);

  const refreshMessages = async () => {
    try {
      const res = await fetch('/api/chat/messages');
      if (!res.ok) return;
      const fresh = await res.json();
      if (Array.isArray(fresh)) {
        setServerMessages(fresh);
      }
    } catch {
      // ignore transient network error
    }
  };

  const upsertServerMessage = (
    msg: ChatMessage,
    parentQuestionId?: string,
    answeredBy?: string
  ) => {
    setServerMessages(prev => {
      const withParentUpdated =
        parentQuestionId && (msg.isOfficialReply || msg.messageType === 'answer')
          ? prev.map(m =>
              m.id === parentQuestionId
                ? {
                    ...m,
                    status: 'answered' as const,
                    answeredBy: answeredBy || msg.senderName,
                    answeredAt: new Date().toISOString(),
                  }
                : m
            )
          : prev;
      if (withParentUpdated.some(m => m.id === msg.id)) {
        return withParentUpdated.map(m => (m.id === msg.id ? msg : m));
      }
      return [...withParentUpdated, msg].slice(-500);
    });
  };

  useEffect(() => {
    if (isChatModalOpen) {
      refreshMessages();
    }
  }, [isChatModalOpen]);

  // Connect to WebSocket server on /ws/chat
  useEffect(() => {
    let isMounted = true;

    // Seed immediately via REST so messages are visible even before WS finishes handshake
    fetch('/api/chat/messages')
      .then(r => (r.ok ? r.json() : []))
      .then((initial) => {
        if (isMounted && Array.isArray(initial) && initial.length > 0) {
          setServerMessages(initial);
        }
      })
      .catch(() => {});

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
                  setServerMessages(initialMsgs);
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

                setServerMessages(prev => {
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
                  setServerMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
                }
                break;
              }

              case 'chat:delete': {
                const { messageId } = data.payload || {};
                if (messageId) {
                  setServerMessages(prev => prev.filter(m => m.id !== messageId));
                }
                break;
              }

              case 'chat:status': {
                const { messageId, status, message } = data.payload || {};
                if (messageId) {
                  setServerMessages(prev => prev.map(m => {
                    if (m.id === messageId) {
                      return message || { ...m, status };
                    }
                    return m;
                  }));
                }
                break;
              }

              case 'chat:error': {
                const errMsg = data.payload?.message || 'Permission denied for this chat action.';
                triggerChatError(errMsg);
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
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
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
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (errData?.error) triggerChatError(errData.error);
          }
        })
        .catch(err => console.warn('Chat send fallback:', err));
    }

    if (auth.currentUser?.emailVerified) {
      const firestoreType: ChatMessageType =
        payload.messageType ||
        (payload.isOfficialReply ? 'answer' : payload.replyTo ? 'reply' : 'message');
      publishChatMessageToFirestore({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        channelId: payload.channelId || 'general',
        senderName: payload.senderName || currentUserName,
        senderRole: payload.senderRole || currentUserRole,
        messageType: firestoreType,
        content: payload.content || '',
        isOfficialReply: Boolean(payload.isOfficialReply),
        replyTo: payload.replyTo,
      }).catch(err => console.warn('Firestore chat sync:', err));
    }
  };

  // Post an official Admin answer to a question or thread (used by AdminPanel inline responder)
  const postOfficialAdminReply = async (
    parentMsg: ChatMessage,
    content: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const trimmed = content.trim();
    if (!trimmed) {
      return { ok: false, error: 'Please write an answer before sending.' };
    }
    if (currentUserRole !== 'admin') {
      const msg = 'Only the Admin is permitted to provide answers to questions.';
      triggerChatError(msg);
      return { ok: false, error: msg };
    }

    const payload = {
      channelId: parentMsg.channelId || 'general',
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: 'admin',
      messageType: 'answer' as ChatMessageType,
      isOfficialReply: true,
      content: trimmed,
      replyTo: {
        id: parentMsg.id,
        senderName: parentMsg.senderName,
        content: parentMsg.content.length > 70 ? `${parentMsg.content.slice(0, 70)}...` : parentMsg.content
      }
    };

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error || 'Failed to publish Admin answer.';
        triggerChatError(errMsg);
        return { ok: false, error: errMsg };
      }

      const savedMsg: ChatMessage | null = data?.message || (data?.id ? data : null);
      if (savedMsg) {
        setServerMessages(prev => {
          const updatedParent = prev.map(m =>
            m.id === parentMsg.id
              ? { ...m, status: 'answered' as const, answeredBy: currentUserName, answeredAt: new Date().toISOString() }
              : m
          );
          if (updatedParent.some(m => m.id === savedMsg.id)) return updatedParent;
          return [...updatedParent, savedMsg];
        });
      }

      if (auth.currentUser?.emailVerified) {
        publishChatMessageToFirestore({
          id: savedMsg?.id || `msg-${Date.now()}`,
          channelId: payload.channelId,
          senderName: payload.senderName,
          senderRole: 'admin',
          messageType: 'answer',
          content: trimmed,
          isOfficialReply: true,
          replyTo: payload.replyTo,
        }).catch(err => console.warn('Firestore Admin answer sync:', err));
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'Network error while posting Admin answer.' };
    }
  };

  // Delete message helper (Admin only)
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (currentUserRole !== 'admin') {
      triggerChatError('Only the Administrator can delete messages.');
      return false;
    }
    if (auth.currentUser?.emailVerified) {
      deleteChatMessageInFirestore(messageId).catch(err =>
        console.warn('Firestore delete sync:', err)
      );
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:delete',
        payload: { messageId }
      }));
      setServerMessages(prev => prev.filter(m => m.id !== messageId));
      return true;
    }
    try {
      const res = await fetch(`/api/chat/messages/${messageId}?role=${currentUserRole}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setServerMessages(prev => prev.filter(m => m.id !== messageId));
      }
      return res.ok;
    } catch (err) {
      console.warn('Delete message failed:', err);
      return false;
    }
  };

  // Update question status helper (Admin only)
  const updateMessageStatus = async (messageId: string, status: 'pending' | 'answered'): Promise<boolean> => {
    if (currentUserRole !== 'admin') {
      triggerChatError('Only the Administrator can update question status.');
      return false;
    }
    if (auth.currentUser?.emailVerified) {
      updateChatQuestionStatusInFirestore(messageId, status, currentUserName).catch(err =>
        console.warn('Firestore status sync:', err)
      );
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:status',
        payload: { messageId, status }
      }));
      setServerMessages(prev => prev.map(m => (m.id === messageId ? { ...m, status } : m)));
      return true;
    }
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, role: currentUserRole, answeredBy: currentUserName })
      });
      if (res.ok) {
        setServerMessages(prev => prev.map(m => (m.id === messageId ? { ...m, status } : m)));
      }
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
        chatError,
        clearChatError,
        toggleSound,
        dismissToast,
        clearUnread,
        openChatForResponse,
        activeChatTarget,
        clearActiveChatTarget,
        latestMessages,
        refreshMessages,
        upsertServerMessage,
        sendMessage,
        postOfficialAdminReply,
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
