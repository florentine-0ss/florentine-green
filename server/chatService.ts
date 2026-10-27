import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const CHAT_FILE = path.resolve(DATA_DIR, 'fofo-chat-messages.json');

export interface ServerChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
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
    name: 'General Community Lounge',
    nameRw: 'Icyumba Rusange cy\'Abanyamuryango',
    description: 'Welcome space for all joined members! Rwandan recipes, organic lifestyle tips & friendly greetings.',
    icon: 'MessageSquare',
    category: 'public',
    badge: 'Popular'
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
    id: 'msg-seed-3',
    channelId: 'fresh-harvest',
    senderId: 'usr-stock',
    senderName: 'Eric Mugisha',
    senderRole: 'stock_manager',
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
    content: 'Eric, are the avocados ready-to-eat today or do they need a couple of days to soften on the counter?',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    timeFormatted: '2 hrs ago',
    reactions: {}
  },
  {
    id: 'msg-seed-5',
    channelId: 'fresh-harvest',
    senderId: 'usr-sales',
    senderName: 'Kevin Niyonzima',
    senderRole: 'sales_attendant',
    content: 'Hi Sarah! About half the batch is gently yielding and perfect for today\'s guacamole, while the rest can ripen over 2–3 days. You can specify "Ripe for Today" in your order notes!',
    timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    timeFormatted: '1 hr ago',
    reactions: { '👍': ['usr-customer-3'] },
    replyTo: {
      id: 'msg-seed-4',
      senderName: 'Sarah Mitchell',
      content: 'Eric, are the avocados ready-to-eat today or do they need a couple of days...'
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
  }
];

class ChatService {
  private messages: ServerChatMessage[] = [];
  private connectedSockets = new Map<WebSocket, { userId?: string; userName?: string; role?: string }>();
  private onlineUsers = new Map<string, { userId: string; userName: string; role: string; lastSeen: string }>();

  constructor() {
    this.loadMessages();
  }

  private loadMessages() {
    try {
      if (fs.existsSync(CHAT_FILE)) {
        const raw = fs.readFileSync(CHAT_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages = parsed;
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
      return this.messages.filter(m => m.channelId === channelId);
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
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date();
    const newMsg: ServerChatMessage = {
      ...msg,
      id,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: msg.reactions || {}
    };

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
              if (payload && payload.content && payload.senderId) {
                this.addMessage(payload);
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
