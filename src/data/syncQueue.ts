/**
 * Offline Sync Queue Manager
 * Appends actions while offline and flushes to remote when toggled online
 */

import { SyncQueueItem, VisitRecord, FollowupItem } from '../domain/types';
import {
  saveQueueItemToStorage,
  loadQueueItemsFromStorage,
  removeQueueItemFromStorage,
} from './storage';
import { uploadVisitToRemote, updateFollowupOnRemote } from './mockRemote';

export async function enqueueAction(
  type: SyncQueueItem['type'],
  payload: any,
  patientId?: string
): Promise<SyncQueueItem> {
  const item: SyncQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    patient_id: patientId,
    payload,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  await saveQueueItemToStorage(item);
  return item;
}

export async function getPendingQueue(): Promise<SyncQueueItem[]> {
  const all = await loadQueueItemsFromStorage();
  return all.filter((i) => i.status === 'pending' || i.status === 'syncing');
}

export interface SyncProgressCallback {
  (current: number, total: number, currentItem: SyncQueueItem): void;
}

/**
 * Processes all pending queue items sequentially with progress updates
 */
export async function flushSyncQueue(
  onProgress?: SyncProgressCallback,
  onItemSynced?: (item: SyncQueueItem) => void
): Promise<{ processed: number; errors: number }> {
  const pending = await getPendingQueue();
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    item.status = 'syncing';
    await saveQueueItemToStorage(item);
    if (onProgress) onProgress(i + 1, pending.length, item);

    try {
      if (item.type === 'CREATE_VISIT') {
        const visit: VisitRecord = item.payload;
        await uploadVisitToRemote(visit);
      } else if (item.type === 'UPDATE_FOLLOWUP') {
        const followup: FollowupItem = item.payload;
        await updateFollowupOnRemote(followup);
      }

      await removeQueueItemFromStorage(item.id);
      processed++;
      if (onItemSynced) {
        onItemSynced({ ...item, status: 'synced' });
      }
    } catch (err: any) {
      console.error('Failed to sync item:', item.id, err);
      item.status = 'failed';
      item.error = err.message || 'Network sync error';
      await saveQueueItemToStorage(item);
      errors++;
    }
  }

  return { processed, errors };
}
