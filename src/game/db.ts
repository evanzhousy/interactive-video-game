import type { CompendiumState, SavedShiftState } from "./storage.js";
import type { VisitorSpec } from "./types.js";

export const CLIENT_DB_NAME = "gate0.client.db";
export const CLIENT_DB_VERSION = 1;

export type ClientDbStoreName = "shifts" | "compendium" | "generated_visitors";

const SHIFT_RECORD_KEY = "current";
const COMPENDIUM_RECORD_KEY = "main";

let cachedDbPromise: Promise<IDBDatabase | null> | null = null;

function hasIndexedDb(): boolean {
  return typeof globalThis !== "undefined" && typeof globalThis.indexedDB !== "undefined";
}

export function resetClientDbCacheForTests(): void {
  cachedDbPromise = null;
}

export function openClientDb(): Promise<IDBDatabase | null> {
  if (!hasIndexedDb()) return Promise.resolve(null);
  if (cachedDbPromise) return cachedDbPromise;

  cachedDbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const req = globalThis.indexedDB.open(CLIENT_DB_NAME, CLIENT_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("shifts")) {
          db.createObjectStore("shifts");
        }
        if (!db.objectStoreNames.contains("compendium")) {
          db.createObjectStore("compendium");
        }
        if (!db.objectStoreNames.contains("generated_visitors")) {
          db.createObjectStore("generated_visitors");
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          cachedDbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => {
        cachedDbPromise = null;
        resolve(null);
      };
    } catch {
      cachedDbPromise = null;
      resolve(null);
    }
  });

  return cachedDbPromise;
}

export async function idbGet<T>(storeName: ClientDbStoreName, key: string): Promise<T | null> {
  const db = await openClientDb();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbPut<T>(
  storeName: ClientDbStoreName,
  key: string,
  value: T
): Promise<boolean> {
  const db = await openClientDb();
  if (!db) return false;

  return new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function idbDelete(storeName: ClientDbStoreName, key: string): Promise<boolean> {
  const db = await openClientDb();
  if (!db) return false;

  return new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function loadShiftFromClientDb(): Promise<SavedShiftState | null> {
  return idbGet<SavedShiftState>("shifts", SHIFT_RECORD_KEY);
}

export async function saveShiftToClientDb(state: SavedShiftState): Promise<boolean> {
  return idbPut("shifts", SHIFT_RECORD_KEY, state);
}

export async function clearShiftFromClientDb(): Promise<boolean> {
  return idbDelete("shifts", SHIFT_RECORD_KEY);
}

export async function loadCompendiumFromClientDb(): Promise<CompendiumState | null> {
  return idbGet<CompendiumState>("compendium", COMPENDIUM_RECORD_KEY);
}

export async function saveCompendiumToClientDb(state: CompendiumState): Promise<boolean> {
  return idbPut("compendium", COMPENDIUM_RECORD_KEY, state);
}

export interface GeneratedVisitorSeedRecord {
  seed: string;
  createdAt: string;
  visitors: VisitorSpec[];
}

export async function loadGeneratedVisitorsBySeed(
  seed: string
): Promise<GeneratedVisitorSeedRecord | null> {
  return idbGet<GeneratedVisitorSeedRecord>("generated_visitors", seed);
}

export async function saveGeneratedVisitorsBySeed(
  record: GeneratedVisitorSeedRecord
): Promise<boolean> {
  return idbPut("generated_visitors", record.seed, record);
}
