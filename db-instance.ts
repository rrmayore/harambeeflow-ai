import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  runTransaction,
  increment
} from "firebase/firestore";
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let db: any = null;
let adminDb: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    // Client SDK Instance
    const clientApp = initializeClientApp(firebaseConfig);
    db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
    console.log(`🔥 Stateless Firebase Client DB Instance Initialized with databaseId: ${firebaseConfig.firestoreDatabaseId}`);

    // Admin SDK Instance for Server-side secure writes bypassing rules
    if (!getAdminApps().length) {
      initializeAdminApp({
        projectId: firebaseConfig.projectId
      });
    }
    adminDb = getAdminFirestore(firebaseConfig.firestoreDatabaseId);
    console.log(`🛡️ Firebase Admin SDK Instantiated with databaseId: ${firebaseConfig.firestoreDatabaseId}. Strict ledger bypass ready.`);
  }
} catch (err) {
  console.warn("⚠️ Database Instance lazy initialization skipped/failed:", err);
}

export function getDb() {
  return db;
}

export function setDb(customDb: any) {
  db = customDb;
}

// Helper to clean data and translate FieldValue increments
function cleanDataForClient(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === "object") {
    // Check constructor name to match Admin FieldValue instances
    const cName = data.constructor?.name;
    if (cName === "NumericIncrementTransform" || cName === "FieldValue" || data._methodName === "FieldValue.increment") {
      if (typeof data.operand === "number") {
        return increment(data.operand);
      }
    }
    
    if (typeof data.operand === "number" && (data._methodName === "FieldValue.increment" || cName?.includes("Increment"))) {
      return increment(data.operand);
    }

    if (Array.isArray(data)) {
      return data.map(cleanDataForClient);
    }

    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = cleanDataForClient(data[key]);
    }
    return cleaned;
  }

  return data;
}

// Admin SDK to Client SDK adapters
class DocumentSnapshotAdapter {
  private clientDoc: any;

  constructor(clientDoc: any) {
    this.clientDoc = clientDoc;
  }

  get id() {
    return this.clientDoc.id;
  }

  get exists() {
    if (typeof this.clientDoc.exists === "function") {
      return this.clientDoc.exists();
    }
    return !!this.clientDoc.exists;
  }

  get ref() {
    return new DocumentReferenceAdapter(
      this.clientDoc.ref.firestore,
      this.clientDoc.ref.parent.path,
      this.clientDoc.id
    );
  }

  data() {
    return this.clientDoc.data();
  }
}

class QuerySnapshotAdapter {
  private clientSnap: any;

  constructor(clientSnap: any) {
    this.clientSnap = clientSnap;
  }

  get docs() {
    return this.clientSnap.docs.map((docSnap: any) => new DocumentSnapshotAdapter(docSnap));
  }

  get empty() {
    return this.clientSnap.empty;
  }

  get size() {
    return this.clientSnap.size;
  }

  forEach(callback: (doc: any) => void) {
    this.docs.forEach(callback);
  }
}

class DocumentReferenceAdapter {
  public clientDb: any;
  public colPath: string;
  public docId: string;

  constructor(clientDb: any, colPath: string, docId: string) {
    this.clientDb = clientDb;
    this.colPath = colPath;
    this.docId = docId;
  }

  async set(data: any, options: any = {}) {
    const docRef = doc(this.clientDb, this.colPath, this.docId);
    await setDoc(docRef, cleanDataForClient(data), options);
  }

  async update(data: any) {
    const docRef = doc(this.clientDb, this.colPath, this.docId);
    await updateDoc(docRef, cleanDataForClient(data));
  }

  async delete() {
    const docRef = doc(this.clientDb, this.colPath, this.docId);
    await deleteDoc(docRef);
  }

  async get() {
    const docRef = doc(this.clientDb, this.colPath, this.docId);
    const snap = await getDoc(docRef);
    return new DocumentSnapshotAdapter(snap);
  }
}

class CollectionReferenceAdapter {
  private clientDb: any;
  private path: string;
  private queryConstraints: any[];

  constructor(clientDb: any, path: string, queryConstraints: any[] = []) {
    this.clientDb = clientDb;
    this.path = path;
    this.queryConstraints = queryConstraints;
  }

  doc(docId: string) {
    return new DocumentReferenceAdapter(this.clientDb, this.path, docId);
  }

  where(field: string, opStr: string, value: any) {
    const newConstraint = where(field, opStr as any, value);
    return new CollectionReferenceAdapter(this.clientDb, this.path, [...this.queryConstraints, newConstraint]);
  }

  async add(data: any) {
    const colRef = collection(this.clientDb, this.path);
    const { addDoc } = await import("firebase/firestore");
    const docRef = await addDoc(colRef, cleanDataForClient(data));
    return { id: docRef.id, ref: docRef };
  }

  async get() {
    const colRef = collection(this.clientDb, this.path);
    const q = query(colRef, ...this.queryConstraints);
    const snap = await getDocs(q);
    return new QuerySnapshotAdapter(snap);
  }
}

class WriteBatchAdapter {
  private batchInstance: any;

  constructor(clientDb: any) {
    this.batchInstance = writeBatch(clientDb);
  }

  set(docRefAdapter: DocumentReferenceAdapter, data: any, options: any = {}) {
    const docRef = doc(docRefAdapter.clientDb, docRefAdapter.colPath, docRefAdapter.docId);
    this.batchInstance.set(docRef, cleanDataForClient(data), options);
    return this;
  }

  update(docRefAdapter: DocumentReferenceAdapter, data: any) {
    const docRef = doc(docRefAdapter.clientDb, docRefAdapter.colPath, docRefAdapter.docId);
    this.batchInstance.update(docRef, cleanDataForClient(data));
    return this;
  }

  delete(docRefAdapter: DocumentReferenceAdapter) {
    const docRef = doc(docRefAdapter.clientDb, docRefAdapter.colPath, docRefAdapter.docId);
    this.batchInstance.delete(docRef);
    return this;
  }

  async commit() {
    await this.batchInstance.commit();
  }
}

class TransactionAdapter {
  private clientDb: any;
  private clientTx: any;

  constructor(clientDb: any, clientTx: any) {
    this.clientDb = clientDb;
    this.clientTx = clientTx;
  }

  async get(docRefAdapter: DocumentReferenceAdapter) {
    const docRef = doc(docRefAdapter.clientDb, docRefAdapter.colPath, docRefAdapter.docId);
    const snap = await this.clientTx.get(docRef);
    return new DocumentSnapshotAdapter(snap);
  }

  set(docRefAdapter: DocumentReferenceAdapter, data: any, options: any = {}) {
    const docRef = doc(docRefAdapter.clientDb, docRefAdapter.colPath, docRefAdapter.docId);
    this.clientTx.set(docRef, cleanDataForClient(data), options);
    return this;
  }

  update(docRefAdapter: DocumentReferenceAdapter, data: any) {
    const docRef = doc(docRefAdapter.clientDb, docRefAdapter.colPath, docRefAdapter.docId);
    this.clientTx.update(docRef, cleanDataForClient(data));
    return this;
  }

  delete(docRefAdapter: DocumentReferenceAdapter) {
    const docRef = doc(docRefAdapter.clientDb, docRefAdapter.colPath, docRefAdapter.docId);
    this.clientTx.delete(docRef);
    return this;
  }
}

class AdminDbAdapter {
  private clientDb: any;

  constructor(clientDb: any) {
    this.clientDb = clientDb;
  }

  collection(collectionName: string) {
    return new CollectionReferenceAdapter(this.clientDb, collectionName);
  }

  batch() {
    return new WriteBatchAdapter(this.clientDb);
  }

  async runTransaction(updateFunction: (transaction: any) => Promise<any>) {
    return await runTransaction(this.clientDb, async (clientTx) => {
      const txAdapter = new TransactionAdapter(this.clientDb, clientTx);
      return await updateFunction(txAdapter);
    });
  }
}

export function getAdminDb(): any {
  // Always fallback to high-fidelity client adapter if db is available to avoid PERMISSION_DENIED on admin SDK without credentials in containerized environments
  if (db) {
    return new AdminDbAdapter(db);
  }
  return adminDb;
}

