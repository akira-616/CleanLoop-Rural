import React from 'react';
import { useApp } from '../store/appStore';
import {
  LayoutDashboard,
  Camera,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, dict } = useApp();

  const tabs = [
    { id: 'dashboard' as const, label: dict.navDashboard, icon: LayoutDashboard },
    { id: 'upload' as const, label: dict.navUpload, icon: Camera },
    { id: 'patients' as const, label: dict.navPatients, icon: Users },
    { id: 'validation' as const, label: dict.navValidation, icon: CheckCircle2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'upload' && activeTab === 'review') ||
            (tab.id === 'patients' && activeTab === 'timeline');

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-2 px-3 text-xs font-semibold transition-all relative ${
                isActive ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-teal-600 rounded-full" />
              )}
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
