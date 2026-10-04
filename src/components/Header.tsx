import React from 'react';
import { useApp } from '../store/appStore';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Languages,
  HelpCircle,
  LayoutDashboard,
  Camera,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    isOnline,
    toggleOnline,
    syncQueue,
    isSyncing,
    triggerManualSync,
    setSettingsOpen,
    setHowFlagsWorkOpen,
    activeTab,
    setActiveTab,
    dict,
  } = useApp();

  const pendingCount = syncQueue.filter(
    (i) => i.status === 'pending' || i.status === 'syncing'
  ).length;

  const navItems = [
    { id: 'dashboard' as const, label: dict.navDashboard, icon: LayoutDashboard },
    { id: 'upload' as const, label: dict.navUpload, icon: Camera },
    { id: 'patients' as const, label: dict.navPatients, icon: Users },
    { id: 'validation' as const, label: dict.navValidation, icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* App Title and Branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs shrink-0 cursor-pointer hover:bg-teal-700 transition-colors"
          >
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-base font-extrabold tracking-tight text-slate-900 leading-tight hover:text-teal-700 transition-colors text-left"
              >
                CareLoop <span className="text-teal-700">Rural</span>
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 hidden sm:inline-block">
                Decision Support
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden xs:block">
              Hypertension & Diabetes Traveling Clinic
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links (hidden on mobile, visible md+) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'upload' && activeTab === 'review') ||
              (item.id === 'patients' && activeTab === 'timeline');

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Online/Offline Toggle Chip */}
          <button
            onClick={toggleOnline}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
            }`}
            title={isOnline ? 'Switch to Offline Simulation' : 'Switch to Online'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </button>

          {/* Sync Status Badge */}
          <button
            onClick={triggerManualSync}
            disabled={isSyncing || pendingCount === 0 || !isOnline}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border transition-all ${
              pendingCount > 0
                ? 'bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            } ${isSyncing ? 'opacity-70 cursor-not-allowed' : ''}`}
            title="Click to sync queued records with cloud EHR"
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncing ? 'animate-spin text-orange-600' : ''}`}
            />
            {pendingCount > 0 ? (
              <span>Sync ({pendingCount})</span>
            ) : (
              <span className="text-emerald-700 hidden sm:inline">Synced ✓</span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            title="Toggle English / Hindi"
          >
            <Languages className="w-3.5 h-3.5 text-teal-700" />
            <span>{language === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          {/* How Flags Work Help */}
          <button
            onClick={() => setHowFlagsWorkOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-100"
            title="How Flags Work & Thresholds"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings & Clinical About */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-100"
            title="Settings & DPDP Privacy Notes"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
