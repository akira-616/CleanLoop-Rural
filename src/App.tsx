/**
 * CareLoop Rural - Clinical Decision Support for Rural Health
 * Mobile-First Clinical Interface
 */

import React from 'react';
import { AppProvider, useApp } from './store/appStore';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DisclaimerFooter } from './components/DisclaimerFooter';
import { SettingsModal } from './components/SettingsModal';
import { HowFlagsWorkModal } from './components/HowFlagsWorkModal';

import { DashboardScreen } from './screens/DashboardScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { PatientsScreen } from './screens/PatientsScreen';
import { ValidationScreen } from './screens/ValidationScreen';

import { WifiOff, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, isOnline, toastMessage, clearToast, dict } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Bar */}
      <Header />

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{dict.offlineModeNotice}</span>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
          <button
            onClick={clearToast}
            className="text-slate-400 hover:text-white shrink-0 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-24 md:pb-14">
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'upload' && <UploadScreen />}
        {activeTab === 'review' && <ReviewScreen />}
        {activeTab === 'timeline' && <TimelineScreen />}
        {activeTab === 'patients' && <PatientsScreen />}
        {activeTab === 'validation' && <ValidationScreen />}

        {/* Persistent Footer on Every Screen */}
        <DisclaimerFooter />
      </main>

      {/* Modals */}
      <SettingsModal />
      <HowFlagsWorkModal />

      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
