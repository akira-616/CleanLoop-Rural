/**
 * Application State Store & Context
 * Centralized reactive state for CareLoop Rural
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Patient, SyncQueueItem, ExtractedNoteData, VisitRecord } from '../domain/types';
import { StorageMode, getStorageMode } from '../data/storage';
import {
  initializeRepository,
  resetRepositoryToSeed,
  addPatientVisit,
  markFollowupDone,
} from '../data/repository';
import { getPendingQueue, flushSyncQueue } from '../data/syncQueue';
import { DEFAULT_DEMO_TODAY } from '../domain/config';
import { Language, getDictionary } from '../i18n';

export type ActiveTab = 'dashboard' | 'upload' | 'patients' | 'validation' | 'review' | 'timeline';

interface PendingReviewState {
  noteImage?: string;
  noteMimeType?: string;
  extracted: ExtractedNoteData;
  patientId?: string;
  isManual?: boolean;
  sampleNoteId?: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dict: ReturnType<typeof getDictionary>;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  toggleOnline: () => void;
  demoToday: string;
  setDemoToday: (dateStr: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  patients: Patient[];
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  storageMode: StorageMode;
  pendingReview: PendingReviewState | null;
  setPendingReview: (review: PendingReviewState | null) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  howFlagsWorkOpen: boolean;
  setHowFlagsWorkOpen: (open: boolean) => void;
  triggerManualSync: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  confirmAndSaveVisit: (
    patientId: string,
    visit: Omit<VisitRecord, 'id' | 'syncStatus' | 'created_at'>
  ) => Promise<string>;
  completeFollowup: (patientId: string, followupId: string) => Promise<void>;
  navigateToTimeline: (patientId: string) => void;
  navigateToReview: (review: PendingReviewState) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnlineState] = useState<boolean>(true);
  const [demoToday, setDemoTodayState] = useState<string>(DEFAULT_DEMO_TODAY);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('P104'); // default to high interest case
  const [patients, setPatients] = useState<Patient[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [storageMode, setStorageMode] = useState<StorageMode>('in-memory (preview limited)');
  const [pendingReview, setPendingReview] = useState<PendingReviewState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [howFlagsWorkOpen, setHowFlagsWorkOpen] = useState<boolean>(false);

  const dict = getDictionary(language);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initialize repo
  const loadData = useCallback(async (dateToUse: string) => {
    try {
      const data = await initializeRepository(dateToUse);
      setPatients(data);
      setStorageMode(getStorageMode());
      const queue = await getPendingQueue();
      setSyncQueue(queue);
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }, []);

  useEffect(() => {
    loadData(demoToday);
  }, [loadData, demoToday]);

  // Monitor browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineState(true);
      showToast('Device back online. Sync ready.');
    };
    const handleOffline = () => {
      setIsOnlineState(false);
      showToast('Device offline. Local storage and queued actions active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  const triggerManualSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await flushSyncQueue();
      const updatedQueue = await getPendingQueue();
      setSyncQueue(updatedQueue);

      // Refresh patients from storage
      const refreshed = await initializeRepository(demoToday);
      setPatients(refreshed);

      if (res.processed > 0) {
        showToast(`All changes synced (${res.processed} records updated to cloud EHR).`);
      } else {
        showToast('All records already up to date.');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showToast('Sync encountered an error.');
    } finally {
      setIsSyncing(false);
    }
  }, [demoToday, isSyncing, showToast]);

  const setIsOnline = useCallback(
    (online: boolean) => {
      setIsOnlineState(online);
      if (online) {
        showToast('Online mode active. Synchronizing queued items...');
        // Flush queue after brief pause
        setTimeout(() => {
          triggerManualSync();
        }, 300);
      } else {
        showToast('Offline mode active. All records stored locally.');
      }
    },
    [showToast, triggerManualSync]
  );

  const toggleOnline = useCallback(() => {
    setIsOnline(!isOnline);
  }, [isOnline, setIsOnline]);

  const setDemoToday = useCallback(
    (newDate: string) => {
      setDemoTodayState(newDate);
      loadData(newDate);
      showToast(`Demo reference date set to ${newDate}.`);
    },
    [loadData, showToast]
  );

  const resetDemoData = useCallback(async () => {
    const reset = await resetRepositoryToSeed(demoToday);
    setPatients(reset);
    const queue = await getPendingQueue();
    setSyncQueue(queue);
    showToast('Demo patients and planted ground truth reset successfully.');
  }, [demoToday, showToast]);

  const confirmAndSaveVisit = useCallback(
    async (
      patientId: string,
      visitData: Omit<VisitRecord, 'id' | 'syncStatus' | 'created_at'>
    ): Promise<string> => {
      const visitId = `v_${Date.now()}`;
      const fullVisit: VisitRecord = {
        ...visitData,
        id: visitId,
        patient_id: patientId,
        syncStatus: isOnline ? 'synced' : 'pending',
        created_at: new Date().toISOString(),
      };

      const { updatedPatient, syncQueued } = await addPatientVisit(
        patientId,
        fullVisit,
        isOnline,
        demoToday
      );

      // Update in-memory patients list
      setPatients((prev) =>
        prev.map((p) => (p.patient_id === updatedPatient.patient_id ? updatedPatient : p))
      );

      const queue = await getPendingQueue();
      setSyncQueue(queue);

      if (syncQueued) {
        showToast('Visit saved locally (Sync pending).');
      } else {
        showToast('Visit saved and synced with cloud EHR.');
      }

      setPendingReview(null);
      setSelectedPatientId(patientId);
      setActiveTab('timeline');

      return visitId;
    },
    [demoToday, isOnline, showToast]
  );

  const completeFollowup = useCallback(
    async (patientId: string, followupId: string) => {
      const updated = await markFollowupDone(patientId, followupId, demoToday, isOnline);
      setPatients((prev) => prev.map((p) => (p.patient_id === patientId ? updated : p)));
      const queue = await getPendingQueue();
      setSyncQueue(queue);
      showToast('Follow-up marked as completed.');
    },
    [demoToday, isOnline, showToast]
  );

  const navigateToTimeline = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('timeline');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToReview = useCallback((review: PendingReviewState) => {
    setPendingReview(review);
    setActiveTab('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        dict,
        isOnline,
        setIsOnline,
        toggleOnline,
        demoToday,
        setDemoToday,
        activeTab,
        setActiveTab,
        selectedPatientId,
        setSelectedPatientId,
        patients,
        syncQueue,
        isSyncing,
        storageMode,
        pendingReview,
        setPendingReview,
        toastMessage,
        showToast,
        clearToast,
        settingsOpen,
        setSettingsOpen,
        howFlagsWorkOpen,
        setHowFlagsWorkOpen,
        triggerManualSync,
        resetDemoData,
        confirmAndSaveVisit,
        completeFollowup,
        navigateToTimeline,
        navigateToReview,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
