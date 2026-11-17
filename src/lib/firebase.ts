import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';
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
    // Surface structured error context if Firestore rule or connectivity fails,
    // while building an in-session customer identity fallback only if offline
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
