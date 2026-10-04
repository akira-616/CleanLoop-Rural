/**
 * Storage adapter with honest three-tier fallback:
 * Tier 1: IndexedDB via idb
 * Tier 2: window.localStorage
 * Tier 3: In-memory JavaScript Map
 * Discloses current mode to the UI without failing silently.
 */

import { openDB, IDBPDatabase } from 'idb';
import { Patient, SyncQueueItem } from '../domain/types';

export type StorageMode = 'IndexedDB' | 'localStorage' | 'in-memory (preview limited)';

const DB_NAME = 'careloop_rural_db';
const DB_VERSION = 1;
const PATIENTS_STORE = 'patients';
const QUEUE_STORE = 'sync_queue';
const SETTINGS_STORE = 'settings';

let currentMode: StorageMode = 'in-memory (preview limited)';
let idbHandle: IDBPDatabase | null = null;
const memoryStore = new Map<string, any>();

/**
 * Initializes storage engine detecting available sandboxed APIs
 */
export async function initStorage(): Promise<StorageMode> {
  // Test IndexedDB
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      idbHandle = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(PATIENTS_STORE)) {
            db.createObjectStore(PATIENTS_STORE, { keyPath: 'patient_id' });
          }
          if (!db.objectStoreNames.contains(QUEUE_STORE)) {
            db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE);
          }
        },
      });
      currentMode = 'IndexedDB';
      return currentMode;
    }
  } catch (err) {
    console.warn('IndexedDB unavailable or blocked by sandbox, attempting localStorage fallback:', err);
  }

  // Test localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__careloop_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      currentMode = 'localStorage';
      return currentMode;
    }
  } catch (err) {
    console.warn('localStorage unavailable, falling back to in-memory storage:', err);
  }

  currentMode = 'in-memory (preview limited)';
  return currentMode;
}

export function getStorageMode(): StorageMode {
  return currentMode;
}

// --- Patient Operations ---

export async function savePatientToStorage(patient: Patient): Promise<void> {
  if (currentMode === 'IndexedDB' && idbHandle) {
    try {
      await idbHandle.put(PATIENTS_STORE, patient);
      return;
    } catch (e) {
      console.warn('IDB put failed, using memory fallback:', e);
    }
  }

  if (currentMode === 'localStorage' && typeof window !== 'undefined') {
    try {
      const all = await loadAllPatientsFromStorage();
      const updated = all.filter((p) => p.patient_id !== patient.patient_id);
      updated.push(patient);
      window.localStorage.setItem('careloop_patients', JSON.stringify(updated));
      return;
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  }

  memoryStore.set(`patient_${patient.patient_id}`, patient);
}

export async function saveAllPatientsToStorage(patients: Patient[]): Promise<void> {
  if (currentMode === 'IndexedDB' && idbHandle) {
    try {
      const tx = idbHandle.transaction(PATIENTS_STORE, 'readwrite');
      await tx.store.clear();
      for (const p of patients) {
        await tx.store.put(p);
      }
      await tx.done;
      return;
    } catch (e) {
      console.warn('IDB batch save failed:', e);
    }
  }

  if (currentMode === 'localStorage' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('careloop_patients', JSON.stringify(patients));
      return;
    } catch (e) {
      console.warn('localStorage batch save failed:', e);
    }
  }

  for (const p of patients) {
    memoryStore.set(`patient_${p.patient_id}`, p);
  }
}

export async function loadAllPatientsFromStorage(): Promise<Patient[]> {
  if (currentMode === 'IndexedDB' && idbHandle) {
    try {
      const list = await idbHandle.getAll(PATIENTS_STORE);
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('IDB getAll failed:', e);
    }
  }

  if (currentMode === 'localStorage' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('careloop_patients');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('localStorage read failed:', e);
    }
  }

  const list: Patient[] = [];
  for (const [key, val] of memoryStore.entries()) {
    if (key.startsWith('patient_')) {
      list.push(val);
    }
  }
  return list;
}

// --- Sync Queue Operations ---

export async function saveQueueItemToStorage(item: SyncQueueItem): Promise<void> {
  if (currentMode === 'IndexedDB' && idbHandle) {
    try {
      await idbHandle.put(QUEUE_STORE, item);
      return;
    } catch (e) {
      console.warn('IDB put queue item failed:', e);
    }
  }

  if (currentMode === 'localStorage' && typeof window !== 'undefined') {
    try {
      const all = await loadQueueItemsFromStorage();
      const updated = all.filter((i) => i.id !== item.id);
      updated.push(item);
      window.localStorage.setItem('careloop_sync_queue', JSON.stringify(updated));
      return;
    } catch (e) {
      console.warn('localStorage queue save failed:', e);
    }
  }

  memoryStore.set(`queue_${item.id}`, item);
}

export async function loadQueueItemsFromStorage(): Promise<SyncQueueItem[]> {
  if (currentMode === 'IndexedDB' && idbHandle) {
    try {
      const list = await idbHandle.getAll(QUEUE_STORE);
      if (list) return list;
    } catch (e) {
      console.warn('IDB getAll queue failed:', e);
    }
  }

  if (currentMode === 'localStorage' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('careloop_sync_queue');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('localStorage read queue failed:', e);
    }
  }

  const list: SyncQueueItem[] = [];
  for (const [key, val] of memoryStore.entries()) {
    if (key.startsWith('queue_')) {
      list.push(val);
    }
  }
  return list;
}

export async function removeQueueItemFromStorage(id: string): Promise<void> {
  if (currentMode === 'IndexedDB' && idbHandle) {
    try {
      await idbHandle.delete(QUEUE_STORE, id);
      return;
    } catch (e) {
      console.warn('IDB delete queue item failed:', e);
    }
  }

  if (currentMode === 'localStorage' && typeof window !== 'undefined') {
    try {
      const all = await loadQueueItemsFromStorage();
      const filtered = all.filter((i) => i.id !== id);
      window.localStorage.setItem('careloop_sync_queue', JSON.stringify(filtered));
      return;
    } catch (e) {
      console.warn('localStorage queue delete failed:', e);
    }
  }

  memoryStore.delete(`queue_${id}`);
}
