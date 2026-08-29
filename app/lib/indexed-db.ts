import type { StoredRecord } from "./models";

export type StoreName =
  | "preferences"
  | "today"
  | "examSessions"
  | "library"
  | "portfolio"
  | "activity-progress"
  | "vocabulary"
  | "writing-practice"
  | "speaking-practice"
  | "generated-plans"
  | "personal-media";

const DATABASE_NAME = "lucid-dream";
const DATABASE_VERSION = 4;
const STORES: StoreName[] = [
  "activity-progress",
  "preferences",
  "today",
  "examSessions",
  "library",
  "portfolio",
  "vocabulary",
  "writing-practice",
  "speaking-practice",
  "generated-plans",
  "personal-media",
];

let databasePromise: Promise<IDBDatabase> | null = null;

export function openLucidDb(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const store of STORES) {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error("Unable to open IndexedDB."));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("IndexedDB upgrade is blocked by another tab."));
    };
  });
  return databasePromise;
}

export function closeLucidDb(): void {
  if (!databasePromise) return;
  void databasePromise.then((database) => database.close()).catch(() => undefined);
  databasePromise = null;
}

export async function getRecord<T extends StoredRecord>(
  storeName: StoreName,
  key: string,
): Promise<T | undefined> {
  const database = await openLucidDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB read was aborted."));
  });
}

export async function putRecord<T extends StoredRecord>(
  storeName: StoreName,
  value: T,
): Promise<void> {
  const database = await openLucidDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB write was aborted."));
  });
}

export async function deleteRecord(storeName: StoreName, key: string): Promise<void> {
  const database = await openLucidDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB delete failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB delete was aborted."));
  });
}

export async function getAllRecords<T extends StoredRecord>(
  storeName: StoreName,
): Promise<T[]> {
  const database = await openLucidDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB list failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB list was aborted."));
  });
}

export async function isIndexedDbAvailable(): Promise<boolean> {
  try {
    await openLucidDb();
    return true;
  } catch {
    return false;
  }
}
