/**
 * Mock remote clinic server for demonstration of cloud EHR synchronization
 */

import { VisitRecord, FollowupItem } from '../domain/types';

interface RemoteStore {
  visits: Map<string, VisitRecord>;
  followups: Map<string, FollowupItem>;
  lastSyncedAt: string | null;
}

const remoteStore: RemoteStore = {
  visits: new Map(),
  followups: new Map(),
  lastSyncedAt: null,
};

export async function uploadVisitToRemote(visit: VisitRecord): Promise<{ success: boolean; remoteId: string }> {
  // Simulate network flight time (600-900ms)
  await new Promise((res) => setTimeout(res, 750));
  remoteStore.visits.set(visit.id, { ...visit, syncStatus: 'synced' });
  remoteStore.lastSyncedAt = new Date().toISOString();
  return { success: true, remoteId: `cloud_${visit.id}` };
}

export async function updateFollowupOnRemote(followup: FollowupItem): Promise<{ success: boolean }> {
  await new Promise((res) => setTimeout(res, 600));
  remoteStore.followups.set(followup.id, followup);
  remoteStore.lastSyncedAt = new Date().toISOString();
  return { success: true };
}

export function getRemoteStats() {
  return {
    remoteVisitsCount: remoteStore.visits.size,
    remoteFollowupsCount: remoteStore.followups.size,
    lastSyncedAt: remoteStore.lastSyncedAt,
  };
}
