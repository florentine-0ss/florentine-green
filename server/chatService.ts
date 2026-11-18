import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const CHAT_FILE = path.resolve(DATA_DIR, 'fofo-chat-messages.json');

export type ChatMessageType = 'question' | 'reply' | 'answer' | 'message';

export interface ServerChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  messageType?: ChatMessageType;
  content: string;
  timestamp: string;
  timeFormatted: string;
  reactions: Record<string, string[]>; // emoji: [userId]
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  productTag?: {
    id: number;
    name: string;
    price: number;
    image: string;
    spec?: string;
  };
  attachments?: Array<{
    id: string;
    type: 'image' | 'file';
    name: string;
    url: string;
    sizeFormatted?: string;
    fileType?: string;
  }>;
  voiceNote?: {
    durationSeconds: number;
    durationFormatted: string;
    waveform: number[];
    audioUrl?: string;
  };
  callEvent?: {
    type: 'voice' | 'video';
    action: 'started' | 'ended' | 'missed';
    duration?: string;
  };
  isDirectMessage?: boolean;
  recipientId?: string;
  recipientName?: string;
  isOfficialReply?: boolean;
  status?: 'pending' | 'answered' | 'open';
  answeredBy?: string;
  answeredAt?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  nameRw?: string;
  description: string;
  icon: string;
  category: 'public' | 'staff' | 'market';
  badge?: string;
}

export const CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'general',
    name: 'Public Customer Support Chat',
    nameRw: 'Urubuga Rusange rw\'Ubufasha',
    description: 'Shared public customer support chat. Customers can ask questions, and only the Admin can reply. All customers see all questions and Admin replies in real time.',
    icon: 'HelpCircle',
    category: 'public',
    badge: 'Customer Support'
  },
  {
    id: 'fresh-harvest',
    name: 'Fresh Harvest & Arrivals',
    nameRw: 'Umusaruro Mushya & Ibishya Bihari',
    description: 'Daily Musanze & Bugesera farm arrivals, ripeness advice, avocado updates, and organic produce alerts.',
    icon: 'Apple',
    category: 'market',
    badge: 'Farm Direct'
  },
  {
    id: 'delivery-kigali',
    name: 'Kigali Deliveries & ETAs',
    nameRw: 'Kugeza Ibi bicuruzwa i Kigali',
    description: 'Real-time order delivery updates, solar moto ETAs, cold-chain queries, and neighborhood drop-offs.',
    icon: 'Truck',
    category: 'public'
  },
  {
    id: 'staff-internal',
    name: 'Staff Operations & Daily Directives',
    nameRw: 'Ibiro by\'Abakozi & Gahunda z\'Isoko',
    description: 'Internal operational coordination for Admin, Stock Manager, Cashier, Sales Attendant & Accountant. Shift handovers, price approvals & daily store directives.',
    icon: 'Building2',
    category: 'staff',
    badge: 'Staff Only'
  },
  {
    id: 'staff-support',
    name: 'Customer Care & Floor Staff',
    nameRw: 'Ubufasha n\'Abakozi bacu',
    description: 'Direct inquiries with Sales Attendants, Cashier POS queries, and Management support.',
    icon: 'ShieldCheck',
    category: 'staff',
    badge: 'Official Staff'
  }
];

const INITIAL_SEED_MESSAGES: ServerChatMessage[] = [
  {
    id: 'msg-seed-1',
    channelId: 'general',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    content: 'Murakaza neza! Welcome everyone to the Fofo Green Community & Member Lounge! Here you can connect via live text, voice notes, video calls, or share produce photos and recipes in real time. 🌿',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    timeFormatted: '4 hrs ago',
    reactions: { '🌿': ['usr-customer-1', 'usr-sales', 'usr-customer-2'], '❤️': ['usr-stock', 'usr-customer-3'] },
    attachments: [
      {
        id: 'att-seed-1',
        type: 'image',
        name: 'bugesera-organic-farm-harvest.jpg',
        url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
        sizeFormatted: '1.4 MB'
      }
    ]
  },
  {
    id: 'msg-seed-2',
    channelId: 'general',
    senderId: 'usr-customer-1',
    senderName: 'Divine Uwase',
    senderRole: 'customer',
    messageType: 'message',
    status: 'open',
    content: 'Muraho Florentine! I just received my Isombe recipe kit today in Kacyiru. Attaching the complete recipe card that came with the basket for anyone who wants to try it!',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    timeFormatted: '3 hrs ago',
    reactions: { '🍲': ['usr-admin', 'usr-sales'], '🔥': ['usr-customer-2'] },
    attachments: [
      {
        id: 'att-seed-2',
        type: 'file',
        name: 'Royal-Isombe-Traditional-Recipe-Guide.pdf',
        url: '#',
        sizeFormatted: '850 KB',
        fileType: 'application/pdf'
      }
    ]
  },
  {
    id: 'msg-seed-q-1',
    channelId: 'general',
    senderId: 'usr-customer-2',
    senderName: 'Jean-Luc Habimana',
    senderRole: 'customer',
    messageType: 'question',
    status: 'answered',
    answeredBy: 'Florentine Mushimiyimana',
    content: 'Do you offer same-day cold-chain delivery to Kimihurura for orders placed before 4:00 PM?',
    timestamp: new Date(Date.now() - 3600000 * 2.7).toISOString(),
    timeFormatted: '2 hrs ago',
    reactions: { '👍': ['usr-customer-1'] }
  },
  {
    id: 'msg-seed-a-1',
    channelId: 'general',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    messageType: 'answer',
    isOfficialReply: true,
    status: 'answered',
    answeredBy: 'Florentine Mushimiyimana',
    content: 'Yes Jean-Luc! Orders placed before 4:00 PM qualify for same-day chilled Solar Moto delivery across Kimihurura, Kacyiru, Remera, and Nyarugenge within 35–55 minutes.',
    timestamp: new Date(Date.now() - 3600000 * 2.6).toISOString(),
    timeFormatted: '2 hrs ago',
    reactions: { '🌿': ['usr-customer-2', 'usr-customer-1'] },
    replyTo: {
      id: 'msg-seed-q-1',
      senderName: 'Jean-Luc Habimana',
      content: 'Do you offer same-day cold-chain delivery to Kimihurura for orders placed...'
    }
  },
  {
    id: 'msg-seed-3',
    channelId: 'fresh-harvest',
    senderId: 'usr-stock',
    senderName: 'Eric Mugisha',
    senderRole: 'stock_manager',
    messageType: 'message',
    status: 'open',
    content: 'Voice note briefing on this morning\'s Musanze harvest delivery. Listen below for sorting & ripeness details!',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    timeFormatted: '2 hrs ago',
    reactions: { '🥑': ['usr-customer-1', 'usr-customer-3', 'usr-sales'] },
    voiceNote: {
      durationSeconds: 24,
      durationFormatted: '0:24',
      waveform: [35, 60, 85, 45, 90, 75, 40, 95, 65, 30, 80, 70, 50, 88, 60, 42, 90, 82, 38, 55, 78, 92, 45, 20]
    },
    productTag: {
      id: 7,
      name: 'Creamy Hass Avocados',
      price: 2200,
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=700&q=80',
      spec: '1 kg (approx. 4-5 pcs)'
    }
  },
  {
    id: 'msg-seed-4',
    channelId: 'fresh-harvest',
    senderId: 'usr-customer-3',
    senderName: 'Sarah Mitchell',
    senderRole: 'customer',
    messageType: 'question',
    status: 'answered',
    answeredBy: 'Florentine Mushimiyimana',
    content: 'Are the Musanze Hass avocados ready-to-eat today or do they need a couple of days to soften on the counter?',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    timeFormatted: '2 hrs ago',
    reactions: {}
  },
  {
    id: 'msg-seed-5',
    channelId: 'fresh-harvest',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    messageType: 'answer',
    isOfficialReply: true,
    status: 'answered',
    answeredBy: 'Florentine Mushimiyimana',
    content: 'Hi Sarah! About half the batch is gently yielding and perfect for today\'s guacamole, while the rest ripens over 2–3 days. You can note "Ripe for Today" at checkout!',
    timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    timeFormatted: '1 hr ago',
    reactions: { '👍': ['usr-customer-3'] },
    replyTo: {
      id: 'msg-seed-4',
      senderName: 'Sarah Mitchell',
      content: 'Are the Musanze Hass avocados ready-to-eat today or do they need a couple...'
    }
  },
  {
    id: 'msg-seed-call-1',
    channelId: 'staff-support',
    senderId: 'usr-sales',
    senderName: 'Kevin Niyonzima',
    senderRole: 'sales_attendant',
    content: 'Video consultation completed with Divine Uwase regarding personalized organic meal kits and dietary preferences.',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    timeFormatted: '1 hr ago',
    reactions: { '👏': ['usr-customer-1', 'usr-admin'] },
    callEvent: {
      type: 'video',
      action: 'ended',
      duration: '4 mins 18 secs'
    }
  },
  {
    id: 'msg-seed-6',
    channelId: 'delivery-kigali',
    senderId: 'usr-customer-2',
    senderName: 'Jean-Luc Habimana',
    senderRole: 'customer',
    content: 'Kudos to driver Patrick on Solar Moto #12! Order arrived in Niboye in under 20 minutes, fish was perfectly chilled on ice.',
    timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    timeFormatted: '1 hr ago',
    reactions: { '⚡': ['usr-admin', 'usr-cashier'], '👏': ['usr-customer-1'] }
  },
  {
    id: 'msg-seed-7',
    channelId: 'staff-support',
    senderId: 'usr-cashier',
    senderName: 'Chantal Uwera',
    senderRole: 'cashier',
    content: 'Just a reminder that both MTN MoMo (*182#) and Airtel Money (*175#) transactions issue instant digital receipts with RRA compliance QR codes right to your screen or WhatsApp! Let us know if you need any billing confirmation.',
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    timeFormatted: '45 mins ago',
    reactions: { '💳': ['usr-admin', 'usr-customer-2'] }
  },
  {
    id: 'msg-staff-admin-directive-1',
    channelId: 'staff-internal',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    content: '👑 STAFF DIRECTIVE: Good morning team! Today we have 50kg of premium Bugesera Hass Avocados arriving. Eric (Stock Manager), please log the incoming batch in the Stock Workspace. Chantal (Cashier), ensure the MTN MoMo test QR is configured. Kevin (Sales), guide customers to the seasonal fruit displays. Aimee (Accountant), run the mid-day P&L check. Let me know your updates here!',
    timestamp: new Date(Date.now() - 3600000 * 0.6).toISOString(),
    timeFormatted: '35 mins ago',
    reactions: { '👍': ['usr-stock', 'usr-cashier', 'usr-sales'], '🚀': ['usr-accountant'] }
  },
  {
    id: 'msg-staff-stock-reply-1',
    channelId: 'staff-internal',
    senderId: 'usr-stock',
    senderName: 'Eric Mugisha',
    senderRole: 'stock_manager',
    content: 'Noted Admin Florentine! Batch #STK-882 is currently being inspected in receiving bay 2. Quality grade is pristine. Recording in the system now.',
    timestamp: new Date(Date.now() - 3600000 * 0.4).toISOString(),
    timeFormatted: '25 mins ago',
    reactions: { '👏': ['usr-admin'] }
  },
  {
    id: 'msg-dm-admin-stock-1',
    channelId: 'staff-internal',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    isDirectMessage: false,
    content: '@Eric Mugisha Please double check the damaged fruit shelf in section C and record any discarded items before 2:00 PM.',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    timeFormatted: '30 mins ago',
    reactions: { '📦': ['usr-stock'] }
  },
  {
    id: 'msg-dm-admin-cashier-1',
    channelId: 'staff-internal',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    isDirectMessage: false,
    content: '@Chantal Uwera We are enabling automatic RRA EBM v2 receipts for all cashier transactions. Let me know if you encounter any printer or USSD timeout issues.',
    timestamp: new Date(Date.now() - 3600000 * 0.45).toISOString(),
    timeFormatted: '27 mins ago',
    reactions: { '💳': ['usr-cashier'] }
  },
  {
    id: 'msg-dm-admin-accountant-1',
    channelId: 'staff-internal',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    isDirectMessage: false,
    content: '@Aimee Mukamana Please export this week\'s net profit and gross margin reports so we can review them at the management meeting.',
    timestamp: new Date(Date.now() - 3600000 * 0.35).toISOString(),
    timeFormatted: '20 mins ago',
    reactions: { '📊': ['usr-accountant'] }
  },
  {
    id: 'msg-dm-admin-sales-1',
    channelId: 'staff-internal',
    senderId: 'usr-admin',
    senderName: 'Florentine Mushimiyimana',
    senderRole: 'admin',
    isDirectMessage: false,
    content: '@Kevin Niyonzima Remember to assist customers with the digital basket builder on the kiosk if they want help choosing between avocados and pineapples.',
    timestamp: new Date(Date.now() - 3600000 * 0.3).toISOString(),
    timeFormatted: '18 mins ago',
    reactions: { '🤝': ['usr-sales'] }
  }
];

class ChatService {
  private messages: ServerChatMessage[] = [];
  private connectedSockets = new Map<WebSocket, { userId?: string; userName?: string; role?: string }>();
  private onlineUsers = new Map<string, { userId: string; userName: string; role: string; lastSeen: string }>();

  constructor() {
    this.loadMessages();
  }

  private normalizePublicChannel(channelId?: string, recipientId?: string): string {
    if (!channelId || typeof channelId !== 'string') return 'general';
    if (channelId.startsWith('dm:')) {
      const isStaffTarget =
        (recipientId && ['usr-stock', 'usr-cashier', 'usr-accountant', 'usr-sales'].includes(recipientId)) ||
        channelId.includes('usr-stock') ||
        channelId.includes('usr-cashier') ||
        channelId.includes('usr-accountant') ||
        channelId.includes('usr-sales');
      return isStaffTarget ? 'staff-internal' : 'general';
    }
    return channelId;
  }

  private isQuestionMessage(m?: Partial<ServerChatMessage> | null): boolean {
    if (!m) return false;
    if (m.messageType === 'question') return true;
    if (m.messageType === 'answer' || m.messageType === 'reply' || m.messageType === 'message') {
      return false;
    }
    return Boolean(
      m.senderRole === 'customer' &&
        !m.replyTo &&
        (m.status === 'pending' ||
          m.status === 'answered' ||
          (typeof m.content === 'string' && m.content.trim().endsWith('?')))
    );
  }

  private normalizeMessageToPublic(m: any): { msg: ServerChatMessage; changed: boolean } {
    const normalizedChannel = this.normalizePublicChannel(m.channelId, m.recipientId);
    const hadPrivateFlags = Boolean(
      m.isDirectMessage ||
      m.recipientId ||
      m.recipientName ||
      (typeof m.channelId === 'string' && m.channelId.startsWith('dm:'))
    );

    let nextObj = { ...m };
    let changed = hadPrivateFlags || normalizedChannel !== m.channelId;

    if (nextObj.id === 'msg-seed-4' && nextObj.messageType !== 'question') {
      nextObj = {
        ...nextObj,
        messageType: 'question',
        status: 'answered',
        answeredBy: 'Florentine Mushimiyimana',
      };
      changed = true;
    }

    if (nextObj.id === 'msg-seed-5' && nextObj.senderRole !== 'admin') {
      nextObj = {
        ...nextObj,
        senderId: 'usr-admin',
        senderName: 'Florentine Mushimiyimana',
        senderRole: 'admin',
        messageType: 'answer',
        isOfficialReply: true,
        status: 'answered',
        answeredBy: 'Florentine Mushimiyimana',
      };
      changed = true;
    }

    if (!nextObj.messageType) {
      if (nextObj.isOfficialReply || (nextObj.senderRole === 'admin' && nextObj.replyTo)) {
        nextObj.messageType = 'answer';
      } else if (nextObj.replyTo) {
        nextObj.messageType = 'reply';
      } else if (this.isQuestionMessage(nextObj)) {
        nextObj.messageType = 'question';
      } else {
        nextObj.messageType = 'message';
      }
      changed = true;
    }

    if (!changed) {
      return { msg: m, changed: false };
    }
    const { recipientId, recipientName, ...rest } = nextObj;
    return {
      msg: {
        ...rest,
        channelId: normalizedChannel,
        isDirectMessage: false
      },
      changed: true
    };
  }

  private loadMessages() {
    try {
      if (fs.existsSync(CHAT_FILE)) {
        const raw = fs.readFileSync(CHAT_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let modified = false;
          const normalizedExisting = parsed.map((m: any) => {
            const { msg, changed } = this.normalizeMessageToPublic(m);
            if (changed) modified = true;
            return msg;
          });
          // Merge missing initial seed messages
          const existingIds = new Set(normalizedExisting.map((m: any) => m.id));
          const missingSeeds = INITIAL_SEED_MESSAGES.filter(s => !existingIds.has(s.id));
          this.messages = [...normalizedExisting, ...missingSeeds];
          if (missingSeeds.length > 0 || modified) {
            this.saveMessages();
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[ChatService] Failed to read messages file, using seed data:', err);
    }
    this.messages = [...INITIAL_SEED_MESSAGES];
    this.saveMessages();
  }

  private saveMessages() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(CHAT_FILE, JSON.stringify(this.messages, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ChatService] Error saving messages to file:', err);
    }
  }

  public getMessages(channelId?: string): ServerChatMessage[] {
    if (channelId) {
      const publicChannel = this.normalizePublicChannel(channelId);
      return this.messages.filter(m => m.channelId === publicChannel);
    }
    return this.messages;
  }

  public getChannels(): ChatChannel[] {
    return CHAT_CHANNELS;
  }

  public getOnlineUsers() {
    return Array.from(this.onlineUsers.values());
  }

  public addMessage(msg: Omit<ServerChatMessage, 'id' | 'timestamp' | 'timeFormatted' | 'reactions'> & { reactions?: Record<string, string[]> }): ServerChatMessage {
    const parentMsg = msg.replyTo?.id
      ? this.messages.find((m) => m.id === msg.replyTo!.id)
      : undefined;

    const requestedType: ChatMessageType =
      msg.messageType ||
      (msg.senderRole === 'admin' && Boolean(msg.replyTo)
        ? 'answer'
        : msg.replyTo
        ? 'reply'
        : msg.senderRole === 'customer' && msg.content?.trim().endsWith('?')
        ? 'question'
        : 'message');

    // Enforce: Anyone can reply or ask questions, but ONLY Admin is permitted to provide answers to questions
    if (msg.senderRole !== 'admin') {
      if (requestedType === 'answer' || msg.isOfficialReply) {
        throw new Error('Only the Admin is permitted to provide answers to questions.');
      }
      if (parentMsg && this.isQuestionMessage(parentMsg)) {
        throw new Error(
          'Only the Admin is permitted to provide answers to questions. You can ask a new question or reply to general discussions.'
        );
      }
    }

    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date();
    const isAdminAnswering =
      msg.senderRole === 'admin' &&
      (requestedType === 'answer' ||
        Boolean(parentMsg && this.isQuestionMessage(parentMsg)) ||
        Boolean(msg.isOfficialReply));

    const finalType: ChatMessageType = isAdminAnswering
      ? 'answer'
      : requestedType === 'answer'
      ? 'reply'
      : requestedType;

    const { recipientId: _rId, recipientName: _rName, isDirectMessage: _dm, ...cleanMsg } = msg;
    const publicChannelId = this.normalizePublicChannel(msg.channelId, msg.recipientId);

    const newMsg: ServerChatMessage = {
      ...cleanMsg,
      channelId: publicChannelId,
      isDirectMessage: false,
      id,
      messageType: finalType,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: msg.reactions || {},
      isOfficialReply: isAdminAnswering,
      status: isAdminAnswering
        ? 'answered'
        : finalType === 'question'
        ? 'pending'
        : 'open',
      answeredBy: isAdminAnswering ? msg.senderName : undefined,
      answeredAt: isAdminAnswering ? now.toISOString() : undefined
    };

    // If Admin is answering a question, mark the parent question as answered in real time
    if (isAdminAnswering && parentMsg) {
      parentMsg.status = 'answered';
      parentMsg.answeredBy = msg.senderName;
      parentMsg.answeredAt = now.toISOString();
      this.broadcast({
        type: 'chat:status',
        payload: { messageId: parentMsg.id, status: 'answered', message: parentMsg }
      });
    }

    this.messages.push(newMsg);
    // Keep max 500 messages
    if (this.messages.length > 500) {
      this.messages = this.messages.slice(-500);
    }
    this.saveMessages();

    // Broadcast to all WebSocket clients
    this.broadcast({
      type: 'chat:message',
      payload: newMsg
    });

    return newMsg;
  }

  public deleteMessage(messageId: string, role: string): { success: boolean; error?: string } {
    // REQUIREMENT 5: Only Admin can manage/delete support chat messages
    if (role !== 'admin') {
      return { success: false, error: 'Only the Administrator can delete messages from public customer support.' };
    }

    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx === -1) {
      return { success: false, error: 'Message not found' };
    }

    this.messages.splice(idx, 1);
    this.saveMessages();

    // Real-time broadcast deletion to all connected customers & staff
    this.broadcast({
      type: 'chat:delete',
      payload: { messageId }
    });

    return { success: true };
  }

  public updateMessageStatus(messageId: string, status: 'pending' | 'answered', role: string): { success: boolean; message?: ServerChatMessage; error?: string } {
    // REQUIREMENT 5: Only Admin can update question resolution status
    if (role !== 'admin') {
      return { success: false, error: 'Only the Administrator can update customer question status.' };
    }

    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) {
      return { success: false, error: 'Message not found' };
    }

    msg.status = status;
    if (status === 'answered') {
      msg.answeredAt = new Date().toISOString();
    }
    this.saveMessages();

    // Broadcast updated question status in real time
    this.broadcast({
      type: 'chat:status',
      payload: { messageId, status, message: msg }
    });

    return { success: true, message: msg };
  }

  public toggleReaction(messageId: string, emoji: string, userId: string): ServerChatMessage | null {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions) {
      msg.reactions = {};
    }

    const currentUsers = msg.reactions[emoji] || [];
    if (currentUsers.includes(userId)) {
      msg.reactions[emoji] = currentUsers.filter(u => u !== userId);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji] = [...currentUsers, userId];
    }

    this.saveMessages();

    // Broadcast update
    this.broadcast({
      type: 'chat:reaction',
      payload: {
        messageId,
        reactions: msg.reactions
      }
    });

    return msg;
  }

  public broadcast(data: any) {
    const json = JSON.stringify(data);
    this.connectedSockets.forEach((meta, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(json);
        } catch (err) {
          console.error('[ChatService] Error sending to socket:', err);
        }
      }
    });
  }

  public setupWebSocket(server: http.Server) {
    const wss = new WebSocketServer({ server, path: '/ws/chat' });

    wss.on('connection', (ws: WebSocket, req) => {
      this.connectedSockets.set(ws, {});

      // Send initial state to the connecting client
      ws.send(JSON.stringify({
        type: 'chat:init',
        payload: {
          channels: CHAT_CHANNELS,
          messages: this.messages,
          onlineUsers: this.getOnlineUsers()
        }
      }));

      ws.on('message', (data: string) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (!parsed || !parsed.type) return;

          switch (parsed.type) {
            case 'presence:join': {
              const { userId, userName, role } = parsed.payload || {};
              if (userId) {
                this.connectedSockets.set(ws, { userId, userName, role });
                this.onlineUsers.set(userId, {
                  userId,
                  userName: userName || 'Joined Member',
                  role: role || 'customer',
                  lastSeen: 'Just now'
                });
                this.broadcast({
                  type: 'presence:update',
                  payload: {
                    onlineUsers: this.getOnlineUsers(),
                    event: 'join',
                    user: { userId, userName, role }
                  }
                });
              }
              break;
            }

            case 'chat:send': {
              const payload = parsed.payload;
              let meta = this.connectedSockets.get(ws);

              const hasPayloadBody = Boolean(
                (typeof payload?.content === 'string' && payload.content.trim().length > 0) ||
                (Array.isArray(payload?.attachments) && payload.attachments.length > 0) ||
                payload?.voiceNote ||
                payload?.callEvent
              );

              if (!hasPayloadBody) {
                ws.send(JSON.stringify({
                  type: 'chat:error',
                  payload: { message: 'Please type a message or attach media before sending.' }
                }));
                break;
              }

              // If the socket sent a message before presence:join finished, bind a safe non-admin identity from payload
              if (!meta?.userId) {
                const fallbackId = typeof payload?.senderId === 'string' && payload.senderId.trim()
                  ? payload.senderId.trim().slice(0, 80)
                  : `gst-${Date.now()}`;
                const fallbackName = typeof payload?.senderName === 'string' && payload.senderName.trim()
                  ? payload.senderName.trim().slice(0, 80)
                  : 'Guest Customer';
                meta = { userId: fallbackId, userName: fallbackName, role: 'customer' };
                this.connectedSockets.set(ws, meta);
              }

              try {
                // Trust the authenticated socket identity for admin privileges,
                // while addMessage enforces that only admin can answer questions.
                this.addMessage({
                  ...payload,
                  content: typeof payload?.content === 'string' ? payload.content : '',
                  senderId: meta.userId,
                  senderName: meta.userName || 'Joined Member',
                  senderRole: meta.role || 'customer'
                });
              } catch (err: any) {
                ws.send(JSON.stringify({
                  type: 'chat:error',
                  payload: { message: err?.message || 'Failed to send message' }
                }));
              }
              break;
            }

            case 'chat:delete': {
              const { messageId } = parsed.payload || {};
              const meta = this.connectedSockets.get(ws);
              if (messageId && meta?.role) {
                const res = this.deleteMessage(messageId, meta.role);
                if (!res.success && res.error) {
                  ws.send(JSON.stringify({
                    type: 'chat:error',
                    payload: { message: res.error }
                  }));
                }
              }
              break;
            }

            case 'chat:status': {
              const { messageId, status } = parsed.payload || {};
              const meta = this.connectedSockets.get(ws);
              if (messageId && status && meta?.role) {
                const res = this.updateMessageStatus(messageId, status, meta.role);
                if (!res.success && res.error) {
                  ws.send(JSON.stringify({
                    type: 'chat:error',
                    payload: { message: res.error }
                  }));
                }
              }
              break;
            }

            case 'chat:reaction': {
              const { messageId, emoji, userId } = parsed.payload || {};
              if (messageId && emoji && userId) {
                this.toggleReaction(messageId, emoji, userId);
              }
              break;
            }

            case 'chat:typing': {
              const { channelId, userName } = parsed.payload || {};
              // Relay typing event
              this.broadcast({
                type: 'chat:typing',
                payload: { channelId, userName }
              });
              break;
            }
          }
        } catch (err) {
          console.error('[ChatService] Error parsing incoming WS message:', err);
        }
      });

      ws.on('close', () => {
        const meta = this.connectedSockets.get(ws);
        this.connectedSockets.delete(ws);

        if (meta && meta.userId) {
          // Check if user has other open sockets
          const hasOtherSockets = Array.from(this.connectedSockets.values()).some(m => m.userId === meta.userId);
          if (!hasOtherSockets) {
            this.onlineUsers.delete(meta.userId);
            this.broadcast({
              type: 'presence:update',
              payload: {
                onlineUsers: this.getOnlineUsers(),
                event: 'leave',
                user: meta
              }
            });
          }
        }
      });

      ws.on('error', (err) => {
        console.error('[ChatService] WebSocket client error:', err);
      });
    });

    console.log('[ChatService] Real-time WebSocket server attached to /ws/chat');
  }
}

export const chatService = new ChatService();
