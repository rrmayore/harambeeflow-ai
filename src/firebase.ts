import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app: any;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase init failed", e);
}

let dbInstance: any = undefined;
let authInstance: any = undefined;

if (app) {
  try {
    // Try to initialize with persistent local cache
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    }, (firebaseConfig as any).firestoreDatabaseId);
    console.log("🔥 Firestore initialized successfully with persistent local cache");
  } catch (err) {
    console.warn("Firestore persistent local cache initialization failed (expected inside sandboxed iframes). Falling back to default Firestore initialization...", err);
    try {
      // Fallback to standard firestore
      dbInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
      console.log("🔥 Firestore initialized successfully with default caching fallback");
    } catch (fallbackErr) {
      console.error("Firestore fallback initialization failed:", fallbackErr);
    }
  }

  try {
    authInstance = getAuth(app);
  } catch (authErr) {
    console.error("Firebase Auth initialization failed:", authErr);
  }
}

export const db = dbInstance;
export const auth = authInstance;

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

