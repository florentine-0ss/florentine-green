import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Smile, Users, Hash, ShieldCheck, Boxes, Store, 
  Scale, Apple, Truck, User as UserIcon, Search, Sparkles, 
  Reply, Tag, RefreshCw, MessageSquare, Lock, Heart, ThumbsUp,
  Flame, CheckCircle2, ShoppingBag, CornerDownRight, LogIn,
  Phone, PhoneCall, PhoneOff, Video, VideoOff, Mic, MicOff,
  Image as ImageIcon, Paperclip, Play, Pause, Volume2, VolumeX,
  FileText, Camera, HelpCircle, Maximize2, Minimize2, Info,
  ChevronDown, Check, Download, Trash2, Radio
} from 'lucide-react';
import { 
  User, Product, ChatMessage, ChatChannel, ChatOnlineUser, 
  ChatAttachment, ChatVoiceNote, ChatCallSession, UserRole 
} from '../types';

interface CommunityChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  availableProducts: Product[];
  joinedUsers: User[];
}

const COMMON_REACTIONS = ['🌿', '❤️', '🥑', '👍', '🔥', '👏'];

const PRESET_PROMPTS: Record<string, string[]> = {
  general: [
    'Muraho neza! Any good recipe tips for fresh Isombe tonight?',
    'The Hass avocados this week are remarkably fresh! 🥑',
    'Loving the farm-direct quality from Musanze cooperative.'
  ],
  'fresh-harvest': [
    'Are the sweet yellow passion fruits ready to eat today?',
    'When will the next batch of organic strawberries arrive from Gicumbi?',
    'The crisp garden carrots from Musanze were sweet and fragrant.'
  ],
  'delivery-kigali': [
    'My Solar Moto delivery arrived in Niboye in under 20 minutes! 🛵⚡',
    'Do you deliver to Rebero and Gahanga in the afternoon?',
    'Cold-chain packaging with ice packs kept the tilapia perfectly chilled.'
  ],
  'staff-support': [
    'Need help with an MTN MoMo payment receipt confirmation.',
    'Could a sales attendant help me customize a weekly family basket?',
    'How do I request bulk orders for a restaurant in Kiyovu?'
  ]
};

const SAMPLE_FARM_IMAGES = [
  {
    name: 'fresh-musanze-avocados.jpg',
    url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=700&q=80',
    sizeFormatted: '1.2 MB'
  },
  {
    name: 'bugesera-vine-tomatoes.jpg',
    url: 'https://images.unsplash.com/photo-1546470427-227c7369a913?auto=format&fit=crop&w=700&q=80',
    sizeFormatted: '980 KB'
  },
  {
    name: 'volcano-carrots-crate.jpg',
    url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=700&q=80',
    sizeFormatted: '1.5 MB'
  }
];

export const CommunityChatModal: React.FC<CommunityChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  availableProducts,
  joinedUsers
}) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [directRecipient, setDirectRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedProductToTag, setSelectedProductToTag] = useState<Product | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<ChatOnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'channels' | 'members'>('channels');

  // Media & Attachment States
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const [pendingVoiceNote, setPendingVoiceNote] = useState<ChatVoiceNote | null>(null);
  const [playingVoiceNoteId, setPlayingVoiceNoteId] = useState<string | null>(null);
  const [voicePlaybackSeconds, setVoicePlaybackSeconds] = useState(0);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Live Call States (Voice & Video)
  const [activeCall, setActiveCall] = useState<ChatCallSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callVolume, setCallVolume] = useState(true);

  // Location Guide Helper Banner
  const [showLocationGuide, setShowLocationGuide] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const recordTimerRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);
  const playbackTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, activeChannelId, directRecipient, isOpen, activeCall]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setVoiceRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setVoiceRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Call timer
  useEffect(() => {
    if (activeCall && activeCall.status === 'active') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall]);

  // Voice playback timer
  useEffect(() => {
    if (playingVoiceNoteId) {
      setVoicePlaybackSeconds(0);
      playbackTimerRef.current = setInterval(() => {
        setVoicePlaybackSeconds(prev => {
          if (prev >= 24) {
            setPlayingVoiceNoteId(null);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [playingVoiceNoteId]);

  // Initial Fetch & WebSocket Connection
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      try {
        const [chRes, msgRes, usersRes] = await Promise.all([
          fetch('/api/chat/channels').then(r => r.json()).catch(() => []),
          fetch('/api/chat/messages').then(r => r.json()).catch(() => []),
          fetch('/api/chat/online-users').then(r => r.json()).catch(() => [])
        ]);

        if (Array.isArray(chRes) && chRes.length > 0) setChannels(chRes);
        if (Array.isArray(msgRes)) setMessages(msgRes);
        if (Array.isArray(usersRes)) setOnlineUsers(usersRes);
      } catch (err) {
        console.warn('[Chat] Failed REST fetch, will rely on WebSocket:', err);
      }
    };

    fetchInitialData();

    // Establish Real-time WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (currentUser) {
          ws.send(JSON.stringify({
            type: 'presence:join',
            payload: {
              userId: currentUser.id,
              userName: currentUser.name,
              role: currentUser.role
            }
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data || !data.type) return;

          switch (data.type) {
            case 'chat:init': {
              if (data.payload?.channels) setChannels(data.payload.channels);
              if (data.payload?.messages) setMessages(data.payload.messages);
              if (data.payload?.onlineUsers) setOnlineUsers(data.payload.onlineUsers);
              break;
            }

            case 'chat:message': {
              const newMsg = data.payload as ChatMessage;
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              break;
            }

            case 'chat:reaction': {
              const { messageId, reactions } = data.payload || {};
              if (messageId && reactions) {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
              }
              break;
            }

            case 'presence:update': {
              if (data.payload?.onlineUsers) {
                setOnlineUsers(data.payload.onlineUsers);
              }
              break;
            }

            case 'chat:typing': {
              const { channelId, userName } = data.payload || {};
              if (channelId === activeChannelId && userName !== currentUser?.name) {
                setIsTyping(userName);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(null), 2500);
              }
              break;
            }
          }
        } catch (err) {
          console.error('[Chat] Error processing WS event:', err);
        }
      };

      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => setIsConnected(false);
    } catch (err) {
      console.error('[Chat] Failed to create WebSocket connection:', err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [isOpen, currentUser]);

  const getDmChannelId = (userA: string, userB: string) => {
    const sorted = [userA, userB].sort();
    return `dm:${sorted[0]}-${sorted[1]}`;
  };

  const currentChannel = directRecipient && currentUser
    ? getDmChannelId(currentUser.id, directRecipient.id)
    : activeChannelId;

  // Handle typing notification
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (socketRef.current?.readyState === WebSocket.OPEN && currentUser && text.trim().length > 0) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:typing',
        payload: {
          channelId: currentChannel,
          userName: currentUser.name
        }
      }));
    }
  };

  // Switch to a Channel
  const handleSelectChannel = (channelId: string) => {
    setDirectRecipient(null);
    setActiveChannelId(channelId);
    setReplyingTo(null);
  };

  // Switch to a Direct Message with another joined member
  const handleSelectMemberDM = (member: User) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setDirectRecipient(member);
    setReplyingTo(null);
  };

  // --- VOICE NOTE RECORDING HANDLERS ---
  const handleStartVoiceRecording = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setIsRecordingVoice(true);
  };

  const handleStopAndSaveVoiceRecording = () => {
    setIsRecordingVoice(false);
    const duration = Math.max(3, voiceRecordSeconds);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // Generate simulated dynamic waveform values
    const randomWaveform = Array.from({ length: 24 }, () => Math.floor(Math.random() * 65) + 30);

    setPendingVoiceNote({
      durationSeconds: duration,
      durationFormatted: formatted,
      waveform: randomWaveform
    });
  };

  const handleCancelVoiceRecording = () => {
    setIsRecordingVoice(false);
    setVoiceRecordSeconds(0);
    setPendingVoiceNote(null);
  };

  // --- FILE & IMAGE ATTACHMENT HANDLERS ---
  const handleSelectLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const isImage = file.type.startsWith('image/');

    const newAttachment: ChatAttachment = {
      id: `att-${Date.now()}`,
      type: isImage ? 'image' : 'file',
      name: file.name,
      url: URL.createObjectURL(file),
      sizeFormatted,
      fileType: file.type
    };

    setPendingAttachments(prev => [...prev, newAttachment]);
    if (e.target) e.target.value = '';
  };

  const handleAttachSampleFarmImage = (sample: typeof SAMPLE_FARM_IMAGES[0]) => {
    const newAtt: ChatAttachment = {
      id: `att-farm-${Date.now()}`,
      type: 'image',
      name: sample.name,
      url: sample.url,
      sizeFormatted: sample.sizeFormatted
    };
    setPendingAttachments(prev => [...prev, newAtt]);
    setShowImagePickerModal(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  // --- LIVE CALL HANDLERS (VOICE & VIDEO) ---
  const handleStartCall = (type: 'voice' | 'video') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setCallDuration(0);
    setIsMicMuted(false);
    setIsCameraOff(false);

    const session: ChatCallSession = {
      type,
      status: 'active',
      startedBy: currentUser.id,
      startedByName: currentUser.name,
      channelId: currentChannel,
      recipientName: directRecipient?.name || activeChannelDef?.name || 'General Lounge',
      durationSeconds: 0
    };

    setActiveCall(session);

    // Announce call start in chat
    const startMsg: Partial<ChatMessage> = {
      channelId: currentChannel,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: `${type === 'voice' ? '📞 Voice Audio Call' : '📹 Video Consultation'} started by ${currentUser.name}. Connected live!`,
      callEvent: {
        type,
        action: 'started'
      }
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:send',
        payload: startMsg
      }));
    }
  };

  const handleEndCall = () => {
    if (!activeCall) return;

    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    const durStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    // Announce call end summary in chat
    const endMsg: Partial<ChatMessage> = {
      channelId: currentChannel,
      senderId: currentUser?.id || 'usr-call',
      senderName: currentUser?.name || 'Caller',
      senderRole: currentUser?.role || 'customer',
      content: `${activeCall.type === 'voice' ? '📞 Voice Call' : '📹 Video Consultation'} finished. Total duration: ${durStr}.`,
      callEvent: {
        type: activeCall.type,
        action: 'ended',
        duration: durStr
      }
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:send',
        payload: endMsg
      }));
    }

    setActiveCall(null);
    setCallDuration(0);
  };

  // --- SEND MESSAGE HANDLER ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedProductToTag && pendingAttachments.length === 0 && !pendingVoiceNote) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const payload: Partial<ChatMessage> = {
      channelId: currentChannel,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: inputText.trim() || (pendingVoiceNote ? '🎙️ Voice message' : pendingAttachments.length > 0 ? '📎 Attachment' : ''),
      reactions: {},
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content.length > 70 ? `${replyingTo.content.slice(0, 70)}...` : replyingTo.content
      } : undefined,
      productTag: selectedProductToTag ? {
        id: selectedProductToTag.id,
        name: selectedProductToTag.name,
        price: selectedProductToTag.price,
        image: selectedProductToTag.image,
        spec: selectedProductToTag.spec
      } : undefined,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
      voiceNote: pendingVoiceNote || undefined,
      isDirectMessage: !!directRecipient,
      recipientId: directRecipient?.id,
      recipientName: directRecipient?.name
    };

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `msg-opt-${Date.now()}`,
      channelId: currentChannel,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: payload.content || '',
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
      replyTo: payload.replyTo,
      productTag: payload.productTag,
      attachments: payload.attachments,
      voiceNote: payload.voiceNote,
      isDirectMessage: !!directRecipient,
      recipientId: directRecipient?.id,
      recipientName: directRecipient?.name
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');
    setReplyingTo(null);
    setSelectedProductToTag(null);
    setShowProductPicker(false);
    setPendingAttachments([]);
    setPendingVoiceNote(null);

    // Send via WebSocket if open
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:send',
        payload
      }));
    } else {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('[Chat] Failed REST fallback message send:', err);
      }
    }
  };

  // Toggle Reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:reaction',
        payload: {
          messageId,
          emoji,
          userId: currentUser.id
        }
      }));
    } else {
      try {
        await fetch(`/api/chat/messages/${messageId}/reaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji, userId: currentUser.id })
        });
      } catch (err) {
        console.error('[Chat] Failed REST toggle reaction:', err);
      }
    }
    setShowEmojiPicker(null);
  };

  if (!isOpen) return null;

  const currentMessages = messages.filter(m => m.channelId === currentChannel);
  const activeChannelDef = channels.find(c => c.id === activeChannelId) || channels[0];

  const filteredMembers = joinedUsers.filter(u => {
    const q = memberSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || (u.department && u.department.toLowerCase().includes(q));
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: '👑 Admin', bg: 'bg-amber-100 text-amber-950 border-amber-300' };
      case 'stock_manager':
        return { label: '📦 Stock', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'cashier':
        return { label: '💳 Cashier', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'sales_attendant':
        return { label: '🤝 Sales', bg: 'bg-violet-100 text-violet-900 border-violet-300' };
      case 'accountant':
        return { label: '📊 Finance', bg: 'bg-teal-100 text-teal-900 border-teal-300' };
      default:
        return { label: '🛒 Customer', bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.userId === userId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/75 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Hidden file inputs for image & generic files */}
      <input 
        type="file" 
        ref={imageInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleSelectLocalFile} 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleSelectLocalFile} 
      />

      <div className="bg-white w-full max-w-5xl h-[94vh] sm:h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        
        {/* TOP BAR / HEADER WITH VOICE & VIDEO CALL LAUNCHERS */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-theme-primary flex items-center justify-center text-white shadow-xs shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white font-serif tracking-tight truncate">
                  Fofo Green Community Lounge
                </h2>
                <span className="hidden md:inline text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80">
                  Voice, Video & Media Synced
                </span>
              </div>
              <p className="text-xs text-stone-300 truncate">
                Connect via live voice, video consultations, voice notes, photos & document exchange
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            
            {/* Live Voice Call Button in Header */}
            <button
              onClick={() => handleStartCall('voice')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
              title="Start live Voice Audio Call with this channel or member"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Voice Call</span>
            </button>

            {/* Live Video Call Button in Header */}
            <button
              onClick={() => handleStartCall('video')}
              className="px-2.5 py-1.5 rounded-xl bg-violet-950 hover:bg-violet-900 text-violet-300 border border-violet-700/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
              title="Start Face-to-Face Video Consultation"
            >
              <Video className="w-3.5 h-3.5 text-violet-400 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Video Call</span>
            </button>

            {/* Location Guide Toggle Button */}
            <button
              onClick={() => setShowLocationGuide(!showLocationGuide)}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                showLocationGuide 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                  : 'text-stone-400 hover:text-white border-stone-700 bg-stone-800'
              }`}
              title="Toggle Location Indicators Guide for Voice, Video, Images & Attachments"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-[11px]">Where are options?</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Close Lounge"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* GUIDED LOCATION INDICATOR BANNER (EXPLAINS WHERE EVERY OPTION IS LOCATED) */}
        {showLocationGuide && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-950 flex items-center justify-between shrink-0 shadow-2xs animate-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-black uppercase tracking-wider text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-800" />
                <span>Feature Locations Guide</span>
              </span>
              
              <div className="flex items-center gap-3 text-[11px] text-amber-900 flex-wrap">
                <span className="flex items-center gap-1 font-semibold">
                  <span>📞 📹</span>
                  <strong>Voice & Video Calls:</strong>
                  <span className="text-amber-800">Top-right header buttons</span>
                </span>
                <span className="hidden md:inline text-amber-400">•</span>
                <span className="flex items-center gap-1 font-semibold">
                  <span>🎙️</span>
                  <strong>Voice Note:</strong>
                  <span className="text-amber-800">Microphone button next to Send</span>
                </span>
                <span className="hidden md:inline text-amber-400">•</span>
                <span className="flex items-center gap-1 font-semibold">
                  <span>🖼️</span>
                  <strong>Apply Image:</strong>
                  <span className="text-amber-800">Photo icon on bottom composer</span>
                </span>
                <span className="hidden md:inline text-amber-400">•</span>
                <span className="flex items-center gap-1 font-semibold">
                  <span>📎</span>
                  <strong>Attach File:</strong>
                  <span className="text-amber-800">Paperclip icon on bottom composer</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowLocationGuide(false)}
              className="text-amber-800 hover:text-amber-950 p-1 font-bold text-[11px] shrink-0"
              title="Dismiss Guide"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ACTIVE VOICE / VIDEO CALL DISPLAY ROOM OVERLAY */}
        {activeCall && (
          <div className="bg-stone-900 text-white border-b border-stone-800 px-4 py-3 shrink-0 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
              
              {/* Call Details / Visualizer */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                  activeCall.type === 'voice' ? 'bg-emerald-600 animate-pulse' : 'bg-violet-600'
                }`}>
                  {activeCall.type === 'voice' ? <PhoneCall className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-white">
                      {activeCall.type === 'voice' ? 'Live Kigali Voice Call' : 'Live Face-to-Face Video Consultation'}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{Math.floor(callDuration / 60)}:{callDuration % 60 < 10 ? '0' : ''}{callDuration % 60}</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Connected with <strong className="text-emerald-400">{activeCall.recipientName}</strong> • High-Definition Audio Stream
                  </p>
                </div>
              </div>

              {/* Video Simulated Window if in video mode */}
              {activeCall.type === 'video' && !isCameraOff && (
                <div className="relative w-44 h-24 rounded-2xl bg-stone-800 border-2 border-emerald-500 overflow-hidden shadow-lg hidden sm:block shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" 
                    alt="Video Consultation Stream"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-1 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                    {activeCall.recipientName}
                  </div>
                </div>
              )}

              {/* In-Call Actions Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isMicMuted 
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500' 
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                  }`}
                  title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {activeCall.type === 'video' && (
                  <button
                    onClick={() => setIsCameraOff(!isCameraOff)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isCameraOff 
                        ? 'bg-rose-600/30 text-rose-300 border-rose-500' 
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                    }`}
                    title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => setCallVolume(!callVolume)}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all cursor-pointer"
                  title="Toggle Audio Speaker"
                >
                  {callVolume ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MAIN BODY: 2 COLUMNS (Sidebar & Conversation) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: Channels & Joined Members */}
          <aside className="w-64 sm:w-72 bg-stone-50/90 border-r border-stone-200 flex flex-col shrink-0">
            
            <div className="p-2.5 border-b border-stone-200 bg-white flex gap-1">
              <button
                onClick={() => setSidebarTab('channels')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'channels'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Channels ({channels.length})</span>
              </button>

              <button
                onClick={() => setSidebarTab('members')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'members'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Members ({joinedUsers.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: CHANNELS */}
            {sidebarTab === 'channels' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-stone-500">
                  Public Lounges
                </div>

                {channels.map((chan) => {
                  const isActive = !directRecipient && activeChannelId === chan.id;
                  return (
                    <button
                      key={chan.id}
                      onClick={() => handleSelectChannel(chan.id)}
                      className={`w-full text-left p-2.5 rounded-2xl transition-all cursor-pointer flex items-start gap-2.5 ${
                        isActive
                          ? 'bg-emerald-100/90 border border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                          : 'hover:bg-white text-stone-700 hover:text-stone-900 border border-transparent'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                        isActive ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        <Hash className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold truncate leading-tight">{chan.name}</p>
                          {chan.badge && (
                            <span className="text-[8px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-black uppercase">
                              {chan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                          {chan.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* Direct Messages Quick Section */}
                <div className="pt-3 px-2 text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center justify-between">
                  <span>Direct Messages</span>
                  <Lock className="w-3 h-3 text-stone-400" />
                </div>

                <div className="space-y-1">
                  {joinedUsers.slice(0, 5).map((user) => {
                    const isSelected = directRecipient?.id === user.id;
                    const online = isUserOnline(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSelectMemberDM(user)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold shadow-2xs'
                            : 'hover:bg-white text-stone-700 border border-transparent'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-6 h-6 rounded-lg bg-stone-800 text-white text-[11px] font-bold flex items-center justify-center">
                            {user.name.charAt(0)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                            online ? 'bg-emerald-500' : 'bg-stone-300'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-none">{user.name}</p>
                          <span className="text-[9px] text-stone-500 leading-none capitalize">
                            {user.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: JOINED MEMBERS DIRECTORY */}
            {sidebarTab === 'members' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-2 border-b border-stone-200">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search joined members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  <div className="px-2 py-0.5 text-[9px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Joined System Accounts</span>
                    <span className="text-emerald-700 font-extrabold">{filteredMembers.length}</span>
                  </div>

                  {filteredMembers.map((member) => {
                    const badge = getRoleBadge(member.role);
                    const online = isUserOnline(member.id);
                    const isSelf = currentUser?.id === member.id;
                    const isSelected = directRecipient?.id === member.id;

                    return (
                      <div
                        key={member.id}
                        className={`p-2 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-white border-stone-200/80 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-stone-800 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                              {member.name.charAt(0)}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              online ? 'bg-emerald-500' : 'bg-stone-300'
                            }`} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-stone-900 truncate">{member.name}</p>
                              {isSelf && (
                                <span className="text-[8px] bg-stone-200 text-stone-700 px-1 py-0.2 rounded font-extrabold">You</span>
                              )}
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border inline-block mt-0.5 ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        {!isSelf && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSelectMemberDM(member)}
                              className="px-2 py-1 bg-stone-100 hover:bg-emerald-700 hover:text-white text-stone-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title={`Direct text chat with ${member.name}`}
                            >
                              Chat
                            </button>
                            <button
                              onClick={() => {
                                handleSelectMemberDM(member);
                                handleStartCall('voice');
                              }}
                              className="p-1 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] transition-colors cursor-pointer"
                              title={`Call ${member.name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Logged In User Footer Capsule */}
            <div className="p-2.5 border-t border-stone-200 bg-white">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-theme-primary text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-stone-900 truncate leading-tight">{currentUser.name}</p>
                      <p className="text-[10px] text-emerald-700 font-bold capitalize leading-none">
                        ● Online ({currentUser.role.replace(/_/g, ' ')})
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Join / Sign In to Chat</span>
                </button>
              )}
            </div>

          </aside>

          {/* MAIN CHAT CONVERSATION VIEW */}
          <main className="flex-1 flex flex-col bg-stone-100/60 overflow-hidden">
            
            {/* Channel / DM Header Bar */}
            <div className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                {directRecipient ? (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {directRecipient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-stone-900">
                          {directRecipient.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold border ${getRoleBadge(directRecipient.role).bg}`}>
                          {getRoleBadge(directRecipient.role).label}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-none">
                        Private 1-on-1 member conversation
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
                      <Hash className="w-4 h-4 text-emerald-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-stone-900">
                          {activeChannelDef?.name || 'General Lounge'}
                        </span>
                        {activeChannelDef?.nameRw && (
                          <span className="text-[10px] text-stone-400 hidden sm:inline">
                            • {activeChannelDef.nameRw}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 line-clamp-1 leading-none">
                        {activeChannelDef?.description}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Direct Call Triggers right in channel header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCall('voice')}
                  className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                  title="Start live Voice Audio Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleStartCall('video')}
                  className="p-1.5 rounded-lg text-violet-800 hover:bg-violet-50 border border-violet-200 transition-colors cursor-pointer"
                  title="Start live Video Consultation"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MESSAGES LIST AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Channel Welcome Banner */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/90 text-center max-w-lg mx-auto shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-2 text-emerald-800">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-stone-900">
                  {directRecipient ? `Direct Conversation with ${directRecipient.name}` : `Welcome to #${activeChannelDef?.name}`}
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  {directRecipient 
                    ? 'Messages exchanged here are private between you two.'
                    : activeChannelDef?.description}
                </p>
              </div>

              {/* Message Bubbles */}
              {currentMessages.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  No messages yet in this lounge. Be the first to start the conversation! 🌿
                </div>
              ) : (
                currentMessages.map((msg) => {
                  const isMine = currentUser?.id === msg.senderId;
                  const senderBadge = getRoleBadge(msg.senderRole);

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2.5 max-w-2xl ${isMine ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-xl bg-stone-800 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs mt-1">
                        {msg.senderName.charAt(0)}
                      </div>

                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        
                        {/* Sender info & time */}
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="font-extrabold text-xs text-stone-900">{msg.senderName}</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-md border ${senderBadge.bg}`}>
                            {senderBadge.label}
                          </span>
                          <span className="text-[10px] text-stone-400">{msg.timeFormatted}</span>
                        </div>

                        {/* Quoted message if replied */}
                        {msg.replyTo && (
                          <div className="mb-1 p-2 rounded-xl bg-stone-200/70 text-[11px] text-stone-700 border-l-2 border-emerald-600 flex items-center gap-1.5">
                            <CornerDownRight className="w-3 h-3 text-stone-500 shrink-0" />
                            <span className="font-bold text-stone-900">{msg.replyTo.senderName}:</span>
                            <span className="truncate italic">{msg.replyTo.content}</span>
                          </div>
                        )}

                        {/* Call Event Banner if this was a call notification */}
                        {msg.callEvent && (
                          <div className="mb-2 p-3 rounded-2xl bg-stone-900 text-white border border-stone-800 text-xs flex items-center gap-3 shadow-md">
                            <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0">
                              {msg.callEvent.type === 'voice' ? <PhoneCall className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-extrabold text-white text-xs">
                                {msg.callEvent.type === 'voice' ? 'Voice Audio Call' : 'Video Consultation'} {msg.callEvent.action === 'ended' ? 'Completed' : 'Started'}
                              </p>
                              {msg.callEvent.duration && (
                                <p className="text-[10px] text-emerald-300 font-mono mt-0.5">Duration: {msg.callEvent.duration}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Message content bubble */}
                        <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs group relative ${
                          isMine 
                            ? 'bg-emerald-800 text-white rounded-tr-none' 
                            : 'bg-white text-stone-900 border border-stone-200 rounded-tl-none'
                        }`}>
                          
                          {/* Text content */}
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                          {/* VOICE NOTE AUDIO PLAYER IN BUBBLE */}
                          {msg.voiceNote && (
                            <div className={`mt-2 p-2.5 rounded-xl border flex items-center gap-3 ${
                              isMine ? 'bg-emerald-900/80 border-emerald-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                            }`}>
                              <button
                                onClick={() => setPlayingVoiceNoteId(playingVoiceNoteId === msg.id ? null : msg.id)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs ${
                                  isMine ? 'bg-white text-emerald-900' : 'bg-emerald-800 text-white'
                                }`}
                                title={playingVoiceNoteId === msg.id ? "Pause Voice Message" : "Play Voice Message"}
                              >
                                {playingVoiceNoteId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 h-6">
                                  {(msg.voiceNote.waveform || [40, 70, 90, 50, 80, 60, 95, 30, 85, 40, 65, 75]).map((barH, idx) => {
                                    const isPassed = playingVoiceNoteId === msg.id && idx < 12;
                                    return (
                                      <span
                                        key={idx}
                                        style={{ height: `${Math.max(15, barH)}%` }}
                                        className={`w-1 rounded-full transition-colors ${
                                          isPassed
                                            ? 'bg-amber-400'
                                            : isMine ? 'bg-emerald-400/80' : 'bg-stone-400'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                                <div className="flex items-center justify-between text-[10px] opacity-80 mt-1 font-mono">
                                  <span>{playingVoiceNoteId === msg.id ? `0:${voicePlaybackSeconds < 10 ? '0' : ''}${voicePlaybackSeconds}` : 'Voice Note'}</span>
                                  <span>{msg.voiceNote.durationFormatted}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ATTACHED IMAGES & FILES IN BUBBLE */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {msg.attachments.map((att) => {
                                if (att.type === 'image') {
                                  return (
                                    <div key={att.id} className="relative rounded-xl overflow-hidden border border-black/10 group/img">
                                      <img 
                                        src={att.url} 
                                        alt={att.name}
                                        className="max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                        onClick={() => setLightboxImageUrl(att.url)}
                                      />
                                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                                        {att.sizeFormatted || 'Photo'}
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div 
                                      key={att.id}
                                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                        isMine ? 'bg-emerald-900/60 border-emerald-700' : 'bg-stone-100 border-stone-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-xs truncate">{att.name}</p>
                                          <p className="text-[10px] opacity-80">{att.sizeFormatted || 'Document'}</p>
                                        </div>
                                      </div>

                                      <a
                                        href={att.url}
                                        download={att.name}
                                        className="p-1.5 hover:bg-black/10 rounded-lg text-inherit transition-colors cursor-pointer shrink-0"
                                        title="Download Attached Document"
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          )}

                          {/* Product Card Attachment if tagged */}
                          {msg.productTag && (
                            <div className="mt-2.5 p-2 rounded-xl bg-black/10 flex items-center gap-2.5 border border-white/20">
                              <img 
                                src={msg.productTag.image} 
                                alt={msg.productTag.name}
                                className="w-10 h-10 rounded-lg object-cover bg-stone-200 shrink-0" 
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-xs truncate">{msg.productTag.name}</p>
                                <p className="text-[10px] opacity-90">{msg.productTag.price.toLocaleString()} FRW {msg.productTag.spec ? `• ${msg.productTag.spec}` : ''}</p>
                              </div>
                            </div>
                          )}

                          {/* Quick action buttons on hover */}
                          <div className={`absolute -top-3 ${isMine ? 'left-2' : 'right-2'} hidden group-hover:flex items-center gap-1 bg-white border border-stone-200 shadow-md rounded-full px-2 py-0.5 z-10`}>
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="text-stone-500 hover:text-emerald-800 p-0.5 cursor-pointer"
                              title="Reply to message"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                              className="text-stone-500 hover:text-amber-600 p-0.5 cursor-pointer"
                              title="React with emoji"
                            >
                              <Smile className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Emoji Reaction Picker Dropdown */}
                        {showEmojiPicker === msg.id && (
                          <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-lg border border-stone-200 mt-1 animate-in zoom-in-95 duration-100 z-20">
                            {COMMON_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="w-6 h-6 flex items-center justify-center hover:scale-125 transition-transform text-xs cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reactions Bar under message */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                              if (!userIds || userIds.length === 0) return null;
                              const hasReacted = currentUser && userIds.includes(currentUser.id);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                                    hasReacted 
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900' 
                                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{userIds.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })
              )}

              {/* Real-time typing notification */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-stone-500 italic px-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span>{isTyping} is typing a message...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* QUICK PRESET SUGGESTIONS BAR */}
            <div className="px-4 py-1.5 bg-stone-50 border-t border-stone-200/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-stone-500 shrink-0">Quick prompts:</span>
              {(PRESET_PROMPTS[activeChannelId] || PRESET_PROMPTS.general).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(prompt)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 hover:border-emerald-500 hover:text-emerald-900 text-xs truncate max-w-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* PENDING ATTACHMENTS & VOICE NOTE PREVIEW STRIP */}
            {(pendingAttachments.length > 0 || pendingVoiceNote) && (
              <div className="px-4 py-2 bg-emerald-50/70 border-t border-emerald-200 flex items-center gap-2 flex-wrap shrink-0">
                {pendingAttachments.map((att) => (
                  <div key={att.id} className="relative flex items-center gap-1.5 bg-white border border-emerald-300 px-2.5 py-1 rounded-xl text-xs shadow-2xs">
                    {att.type === 'image' ? (
                      <img src={att.url} alt={att.name} className="w-6 h-6 rounded-md object-cover" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-700" />
                    )}
                    <span className="font-bold text-stone-900 truncate max-w-xs">{att.name}</span>
                    <button onClick={() => handleRemoveAttachment(att.id)} className="p-0.5 hover:text-rose-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {pendingVoiceNote && (
                  <div className="flex items-center gap-2 bg-white border border-emerald-300 px-3 py-1 rounded-xl text-xs shadow-2xs">
                    <Mic className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                    <span className="font-bold text-stone-900">Voice Note Recorded ({pendingVoiceNote.durationFormatted})</span>
                    <button onClick={() => setPendingVoiceNote(null)} className="p-0.5 hover:text-rose-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LIVE VOICE RECORDING ACTIVE STRIP */}
            {isRecordingVoice && (
              <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-950 shrink-0 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                  <span className="font-black text-rose-800">
                    Recording Voice Message... {Math.floor(voiceRecordSeconds / 60)}:{voiceRecordSeconds % 60 < 10 ? '0' : ''}{voiceRecordSeconds % 60}
                  </span>
                  <div className="flex items-center gap-1 h-4 ml-2">
                    {[30, 60, 90, 40, 80, 50, 95, 70].map((h, idx) => (
                      <span key={idx} style={{ height: `${h}%` }} className="w-1 bg-rose-500 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelVoiceRecording}
                    className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStopAndSaveVoiceRecording}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black text-xs cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Done Recording</span>
                  </button>
                </div>
              </div>
            )}

            {/* REPLY BANNER */}
            {replyingTo && (
              <div className="px-4 py-1.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-950 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <CornerDownRight className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-bold">Replying to {replyingTo.senderName}:</span>
                  <span className="truncate italic text-stone-600 max-w-sm">{replyingTo.content}</span>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-800 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* PRODUCT TAG ATTACHMENT PREVIEW */}
            {selectedProductToTag && (
              <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-950 shrink-0">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-bold">Tagged Produce:</span>
                  <span className="font-bold text-stone-900">{selectedProductToTag.name}</span>
                  <span className="text-stone-500">({selectedProductToTag.price.toLocaleString()} FRW)</span>
                </div>
                <button 
                  onClick={() => setSelectedProductToTag(null)}
                  className="p-1 hover:bg-amber-100 rounded-lg text-amber-800 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* PRODUCT PICKER POPOVER */}
            {showProductPicker && (
              <div className="p-3 bg-white border-t border-stone-200 max-h-48 overflow-y-auto shrink-0 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-stone-800">Tag a Farm Produce Item in Message:</p>
                  <button onClick={() => setShowProductPicker(false)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableProducts.slice(0, 9).map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedProductToTag(prod);
                        setShowProductPicker(false);
                      }}
                      className="p-1.5 rounded-xl border border-stone-200 hover:border-emerald-500 flex items-center gap-2 text-left cursor-pointer transition-colors"
                    >
                      <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{prod.name}</p>
                        <p className="text-[10px] text-emerald-800 font-mono">{prod.price.toLocaleString()} FRW</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SAMPLE FARM IMAGE PICKER POPOVER */}
            {showImagePickerModal && (
              <div className="p-3 bg-white border-t border-stone-200 shrink-0 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <p className="text-xs font-bold text-stone-800">Apply Image or Farm Photo:</p>
                  </div>
                  <button onClick={() => setShowImagePickerModal(false)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </button>
                  <span className="text-[11px] text-stone-500">or choose recent farm photos:</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_FARM_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAttachSampleFarmImage(sample)}
                      className="relative rounded-xl overflow-hidden border border-stone-200 hover:border-emerald-500 transition-all text-left cursor-pointer group"
                    >
                      <img src={sample.url} alt={sample.name} className="w-full h-16 object-cover group-hover:scale-105 transition-transform" />
                      <div className="p-1 bg-white text-[10px] font-bold text-stone-800 truncate">
                        {sample.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* INPUT COMPOSER / SEND BAR WITH CLEAR MEDIA BUTTONS */}
            <div className="p-3 bg-white border-t border-stone-200 shrink-0">
              {currentUser ? (
                <form onSubmit={handleSendMessage} className="space-y-2">
                  
                  {/* MEDIA TOOLBAR BUTTONS WITH VISUAL LABELS */}
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-stone-100">
                    <div className="flex items-center gap-1 sm:gap-2">
                      
                      {/* 1. APPLY IMAGE BUTTON */}
                      <button
                        type="button"
                        onClick={() => setShowImagePickerModal(!showImagePickerModal)}
                        className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          pendingAttachments.some(a => a.type === 'image')
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                        title="Apply an Image / Produce Photo"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Apply Image</span>
                      </button>

                      {/* 2. ATTACH FILE BUTTON */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          pendingAttachments.some(a => a.type === 'file')
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                        title="Attach Document or Receipt (PDF, DOC, TXT)"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-700" />
                        <span className="hidden sm:inline">Attach File</span>
                      </button>

                      {/* 3. TAG PRODUCE BUTTON */}
                      <button
                        type="button"
                        onClick={() => setShowProductPicker(!showProductPicker)}
                        className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          selectedProductToTag
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                        title="Tag Farm Produce from Catalog"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">Tag Produce</span>
                      </button>

                    </div>

                    {/* Quick Call shortcuts indicator */}
                    <div className="flex items-center gap-1 text-[11px] text-stone-400">
                      <span>Live Call:</span>
                      <button
                        type="button"
                        onClick={() => handleStartCall('voice')}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Audio
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleStartCall('video')}
                        className="text-violet-700 font-bold hover:underline cursor-pointer"
                      >
                        Video
                      </button>
                    </div>
                  </div>

                  {/* MAIN INPUT ROW: TEXT INPUT, VOICE NOTE BUTTON, SEND BUTTON */}
                  <div className="flex items-center gap-2">
                    
                    {/* Text input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={
                          directRecipient 
                            ? `Message ${directRecipient.name}... (type or record voice note)` 
                            : `Message #${activeChannelDef?.name || 'General Lounge'}...`
                        }
                        className="w-full bg-stone-100 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-hidden focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    {/* VOICE MESSAGE / NOTE RECORDING BUTTON */}
                    {!isRecordingVoice ? (
                      <button
                        type="button"
                        onClick={handleStartVoiceRecording}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
                        title="Click to Record a Voice Message / Audio Note"
                      >
                        <Mic className="w-4 h-4 text-rose-600" />
                        <span className="hidden md:inline">Voice Note</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopAndSaveVoiceRecording}
                        className="px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0 animate-pulse"
                      >
                        <Check className="w-4 h-4" />
                        <span>Done</span>
                      </button>
                    )}

                    {/* SEND BUTTON */}
                    <button
                      type="submit"
                      disabled={!inputText.trim() && !selectedProductToTag && pendingAttachments.length === 0 && !pendingVoiceNote}
                      className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </form>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-xs text-amber-950">
                    <UserIcon className="w-4 h-4 text-amber-700" />
                    <span>You must be joined or logged in to send voice messages, photos, files or video call.</span>
                  </div>
                  <button
                    onClick={onOpenAuth}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    Join / Sign In Now
                  </button>
                </div>
              )}
            </div>

          </main>

        </div>

      </div>

      {/* LIGHTBOX MODAL FOR ZOOMING ATTACHED IMAGES */}
      {lightboxImageUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh]">
            <img 
              src={lightboxImageUrl} 
              alt="Full Preview" 
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" 
            />
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-lg border border-stone-700 hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
