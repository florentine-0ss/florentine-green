import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocFromServer,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, ChatMessage, ChatMessageType } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/mockData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const BOOTSTRAPPED_ADMIN_EMAIL = 'florentinemushimiyimana1@gmail.com';

export async function syncFirebaseUserProfile(
  fbUser: FirebaseUser,
  preferredRole: 'customer' | 'admin' = 'customer',
  phone?: string
): Promise<User> {
  const userPath = `users/${fbUser.uid}`;
  const userRef = doc(db, 'users', fbUser.uid);

  const canBeAdmin =
    preferredRole === 'admin' &&
    fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
    fbUser.emailVerified;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const resolvedRole: 'customer' | 'admin' =
        data.role === 'admin' && fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL
          ? 'admin'
          : data.role === 'admin'
          ? 'admin'
          : 'customer';

      return {
        id: fbUser.uid,
        name: String(data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer'),
        email: String(data.email || fbUser.email || ''),
        phone: String(data.phone || phone || fbUser.phoneNumber || '+250 788 123 456'),
        role: resolvedRole,
        joinedDate: 'Verified Member',
        ordersCount: 0,
        status: data.status === 'suspended' ? 'suspended' : 'active',
        department: resolvedRole === 'admin' ? 'Executive Administration' : 'Verified Customer',
        permissions: DEFAULT_ROLE_PERMISSIONS[resolvedRole],
        lastLogin: 'Just now',
      };
    }

    const assignedRole: 'customer' | 'admin' = canBeAdmin ? 'admin' : 'customer';
    const displayName =
      (fbUser.displayName || fbUser.email?.split('@')[0] || 'Fofo Green Customer').slice(0, 120);
    const email = (fbUser.email || `${fbUser.uid}@fofogreen.rw`).slice(0, 180);
    const safePhone = (phone || fbUser.phoneNumber || '+250 788 123 456').slice(0, 40);

    await setDoc(userRef, {
      uid: fbUser.uid,
      email,
      name: displayName,
      phone: safePhone,
      role: assignedRole,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: fbUser.uid,
      name: displayName,
      email,
      phone: safePhone,
      role: assignedRole,
      joinedDate: 'Today',
      ordersCount: 0,
      status: 'active',
      department: assignedRole === 'admin' ? 'Executive Administration' : 'Verified Customer',
      permissions: DEFAULT_ROLE_PERMISSIONS[assignedRole],
      lastLogin: 'Just now',
    };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }
    const fallbackRole: 'customer' | 'admin' = canBeAdmin ? 'admin' : 'customer';
    return {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Fofo Green Customer',
      email: fbUser.email || '',
      phone: phone || fbUser.phoneNumber || '+250 788 123 456',
      role: fallbackRole,
      joinedDate: 'Today',
      ordersCount: 0,
      status: 'active',
      department: fallbackRole === 'admin' ? 'Executive Administration' : 'Verified Customer',
      permissions: DEFAULT_ROLE_PERMISSIONS[fallbackRole],
      lastLogin: 'Just now',
    };
  }
}

// --- FIRESTORE PUBLIC Q&A CHAT REAL-TIME SYNC ---
const ALLOWED_CHAT_CHANNELS = new Set([
  'general',
  'fresh-harvest',
  'delivery-kigali',
  'staff-internal',
  'staff-support',
]);

const firestoreChatMessageIds = new Set<string>();

function sanitizeFirestoreId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return cleaned || `msg-${Date.now()}`;
}

export function subscribeToPublicChatMessages(
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  if (!auth.currentUser) {
    return () => {};
  }

  const chatPath = 'chat_messages';
  const q = query(collection(db, chatPath), orderBy('createdAt', 'asc'), limit(250));

  return onSnapshot(
    q,
    (snapshot) => {
      const parsed: ChatMessage[] = [];
      firestoreChatMessageIds.clear();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        firestoreChatMessageIds.add(docSnap.id);
        const createdDate =
          d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date();
        parsed.push({
          id: String(d.id || docSnap.id),
          channelId: String(d.channelId || 'general'),
          senderId: String(d.senderUid || 'usr-member'),
          senderName: String(d.senderName || 'Joined Member'),
          senderRole: String(d.senderRole || 'customer'),
          messageType: (d.messageType as ChatMessageType) || 'message',
          content: String(d.content || ''),
          timestamp: createdDate.toISOString(),
          timeFormatted: createdDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          reactions: {},
          isOfficialReply: Boolean(d.isOfficialReply),
          status:
            d.status === 'pending' || d.status === 'answered' || d.status === 'open'
              ? d.status
              : 'open',
          answeredBy: d.answeredBy ? String(d.answeredBy) : undefined,
          answeredAt:
            d.answeredAt instanceof Timestamp
              ? d.answeredAt.toDate().toISOString()
              : undefined,
          replyTo: d.replyToSenderName
            ? {
                id: String(d.replyToId || ''),
                senderName: String(d.replyToSenderName),
                content: String(d.replyToContent || ''),
              }
            : undefined,
        });
      });
      onUpdate(parsed);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, chatPath);
    }
  );
}

export async function publishChatMessageToFirestore(msg: {
  id: string;
  channelId: string;
  senderName: string;
  senderRole: string;
  messageType: ChatMessageType;
  content: string;
  isOfficialReply: boolean;
  replyTo?: { id: string; senderName: string; content: string };
}): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return;

  const safeId = sanitizeFirestoreId(msg.id);
  const safeChannel = ALLOWED_CHAT_CHANNELS.has(msg.channelId)
    ? msg.channelId
    : 'general';
  const safeSenderRole =
    fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
    msg.senderRole === 'admin'
      ? 'admin'
      : 'customer';

  const effectiveType: ChatMessageType =
    safeSenderRole === 'admin' && msg.isOfficialReply
      ? 'answer'
      : msg.messageType === 'answer' && safeSenderRole !== 'admin'
      ? 'message'
      : msg.messageType;

  const effectiveOfficial = safeSenderRole === 'admin' && effectiveType === 'answer';
  const effectiveStatus = effectiveOfficial
    ? 'answered'
    : effectiveType === 'question'
    ? 'pending'
    : 'open';

  const payload: Record<string, unknown> = {
    id: safeId,
    channelId: safeChannel,
    senderUid: fbUser.uid,
    senderName: (msg.senderName || fbUser.displayName || 'Customer').slice(0, 120),
    senderRole: safeSenderRole,
    messageType: effectiveType,
    content: (msg.content || '').slice(0, 2000),
    isOfficialReply: effectiveOfficial,
    status: effectiveStatus,
    createdAt: serverTimestamp(),
  };

  if (msg.replyTo?.senderName) {
    payload.replyToSenderName = msg.replyTo.senderName.slice(0, 120);
    payload.replyToContent = (msg.replyTo.content || '').slice(0, 200);
    const parentId = sanitizeFirestoreId(msg.replyTo.id || '');
    if (parentId && firestoreChatMessageIds.has(parentId)) {
      payload.replyToId = parentId;
    }
  }

  if (effectiveOfficial) {
    payload.answeredBy = (msg.senderName || fbUser.displayName || 'Admin').slice(0, 120);
    payload.answeredAt = serverTimestamp();
  }

  const docPath = `chat_messages/${safeId}`;
  try {
    await setDoc(doc(db, 'chat_messages', safeId), payload);
    firestoreChatMessageIds.add(safeId);

    if (
      effectiveOfficial &&
      msg.replyTo?.id &&
      firestoreChatMessageIds.has(sanitizeFirestoreId(msg.replyTo.id))
    ) {
      const parentSafeId = sanitizeFirestoreId(msg.replyTo.id);
      await updateDoc(doc(db, 'chat_messages', parentSafeId), {
        status: 'answered',
        answeredBy: (msg.senderName || fbUser.displayName || 'Admin').slice(0, 120),
        answeredAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function updateChatQuestionStatusInFirestore(
  messageId: string,
  status: 'pending' | 'answered',
  answeredBy?: string
): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return;
  const safeId = sanitizeFirestoreId(messageId);
  if (!firestoreChatMessageIds.has(safeId)) return;

  const docPath = `chat_messages/${safeId}`;
  try {
    const updatePayload: Record<string, unknown> = { status };
    if (status === 'answered' && answeredBy) {
      updatePayload.answeredBy = answeredBy.slice(0, 120);
      updatePayload.answeredAt = serverTimestamp();
    }
    await updateDoc(doc(db, 'chat_messages', safeId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteChatMessageInFirestore(messageId: string): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return;
  const safeId = sanitizeFirestoreId(messageId);
  if (!firestoreChatMessageIds.has(safeId)) return;

  const docPath = `chat_messages/${safeId}`;
  try {
    await deleteDoc(doc(db, 'chat_messages', safeId));
    firestoreChatMessageIds.delete(safeId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
