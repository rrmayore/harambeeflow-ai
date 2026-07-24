import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence 
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

const rawConfig: any = firebaseConfigJson || {};

const firebaseConfig = {
  projectId: rawConfig.projectId || import.meta.env?.VITE_FIREBASE_PROJECT_ID || "harambeeflow",
  appId: rawConfig.appId || import.meta.env?.VITE_FIREBASE_APP_ID || "1:991042439020:web:8996339bb8d18bd4121549",
  apiKey: rawConfig.apiKey || import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyD6CTXy_YMZniq3CLBcdO_rEtRn1AOyySE",
  authDomain: rawConfig.authDomain || import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "harambeeflow.firebaseapp.com",
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || import.meta.env?.VITE_FIREBASE_DATABASE_ID || "ai-studio-harambeeflowai-6b7cbd54-bb1f-4ee2-9d86-5807fcaeec9b",
  storageBucket: rawConfig.storageBucket || import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "harambeeflow.firebasestorage.app",
  messagingSenderId: rawConfig.messagingSenderId || import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "991042439020",
  measurementId: rawConfig.measurementId || import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "",
  recaptchaSiteKey: rawConfig.recaptchaSiteKey || import.meta.env?.VITE_FIREBASE_RECAPTCHA_SITE_KEY || ""
};

let app: any;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
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
    }, firebaseConfig.firestoreDatabaseId);
    console.log("🔥 Firestore initialized successfully with persistent local cache");
  } catch (err) {
    console.warn("Firestore persistent local cache initialization failed (expected inside sandboxed iframes). Falling back to default Firestore initialization...", err);
    try {
      // Fallback to standard firestore
      dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

/**
 * Cascading Authentication Persistence Helper
 * Attempts browserLocalPersistence -> browserSessionPersistence -> inMemoryPersistence.
 * Guarantees that authentication never aborts due to storage or iframe security constraints.
 */
export async function ensureAuthPersistence(authObj: any = authInstance): Promise<void> {
  if (!authObj) return;
  try {
    await setPersistence(authObj, browserLocalPersistence);
  } catch (err1) {
    console.warn("browserLocalPersistence unavailable, falling back to browserSessionPersistence...", err1);
    try {
      await setPersistence(authObj, browserSessionPersistence);
    } catch (err2) {
      console.warn("browserSessionPersistence unavailable, falling back to inMemoryPersistence...", err2);
      try {
        await setPersistence(authObj, inMemoryPersistence);
      } catch (err3) {
        console.warn("inMemoryPersistence setup encountered error, continuing with default auth state:", err3);
      }
    }
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

