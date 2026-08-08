import { DeletionQueueItem } from '../types';

const DB_NAME = 'JerjhonSyncDB';
const DB_VERSION = 1;
const STORE_NAME = 'deletion_queue';

export function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open JerjhonSyncDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('collectionName', 'collectionName', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('recordId', 'recordId', { unique: false });
        store.createIndex('deletedAt', 'deletedAt', { unique: false });
      }
    };
  });
}

export async function addToDeletionQueue(
  collectionName: string,
  recordId: string,
  recordName?: string,
  deletedBy?: string
): Promise<DeletionQueueItem> {
  const item: DeletionQueueItem = {
    id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    collectionName,
    recordId: String(recordId),
    recordName: recordName || recordId,
    deletedBy: deletedBy || 'System / Admin',
    deletedAt: new Date().toISOString(),
    status: 'pending',
    attempts: 0
  };

  try {
    const db = await openSyncDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add(item);
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error adding item to deletion_queue:', err);
  }

  return item;
}

export async function getDeletionQueue(): Promise<DeletionQueueItem[]> {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items: DeletionQueueItem[] = request.result || [];
        // Sort descending by deletedAt
        items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error reading deletion_queue:', err);
    return [];
  }
}

export async function updateQueueItemStatus(
  id: string,
  status: DeletionQueueItem['status'],
  error?: string
): Promise<void> {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing: DeletionQueueItem | undefined = getReq.result;
      if (existing) {
        existing.status = status;
        existing.attempts = (existing.attempts || 0) + 1;
        if (error) {
          existing.lastSyncError = error;
        }
        if (status === 'synced') {
          existing.syncedAt = new Date().toISOString();
        }
        store.put(existing);
      }
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error updating queue item status:', err);
  }
}

export async function removeQueueItem(id: string): Promise<void> {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error removing queue item:', err);
  }
}

export async function clearSyncedItems(): Promise<void> {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items: DeletionQueueItem[] = request.result || [];
      items.forEach(item => {
        if (item.status === 'synced') {
          store.delete(item.id);
        }
      });
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error clearing synced items:', err);
  }
}

export async function clearAllQueueItems(): Promise<void> {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error clearing all queue items:', err);
  }
}
