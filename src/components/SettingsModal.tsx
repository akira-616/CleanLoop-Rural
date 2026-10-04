import React, { useState } from 'react';
import { useApp } from '../store/appStore';
import {
  X,
  Database,
  Calendar,
  RotateCcw,
  ShieldCheck,
  Lock,
  Compass,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    storageMode,
    demoToday,
    setDemoToday,
    resetDemoData,
    language,
  } = useApp();

  const [dateInput, setDateInput] = useState(demoToday);

  if (!settingsOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInput(e.target.value);
    setDemoToday(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'hi' ? 'सेटिंग्स एवं क्लिनिकल सिद्धांत' : 'Settings & Clinical Architecture'}
            </h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Storage Mode Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Database className="w-4 h-4 text-teal-700" />
              <span>Storage Architecture Notice</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Active Storage Mode:{' '}
              <span className="font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                {storageMode}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 italic mt-1">
              "Prototype demonstrates local storage and an offline sync queue. Production would add encrypted SQLCipher storage, conflict resolution, and biometric consent."
            </p>
          </div>

          {/* Demo Date Controller */}
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-950 text-xs">
              <Calendar className="w-4 h-4 text-indigo-700" />
              <span>Demo Reference Date (DEMO_TODAY)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Used to calculate overdue days reproducibly across synthetic patients:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={handleDateChange}
                className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-semibold text-slate-800 focus:outline-teal-600"
              />
              <button
                onClick={() => {
                  setDateInput('2026-10-04');
                  setDemoToday('2026-10-04');
                }}
                className="text-[11px] font-semibold text-indigo-700 hover:underline"
              >
                Reset to 2026-10-04
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Reset Synthetic Demo Data</div>
              <p className="text-[11px] text-slate-500">
                Restore the 10 planted benchmark patients to their initial state.
              </p>
            </div>
            <button
              onClick={() => {
                resetDemoData();
                setSettingsOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Data
            </button>
          </div>

          {/* Privacy & India DPDP Act Principles */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Lock className="w-4 h-4 text-teal-700" />
              <span>Privacy & Regulatory Safeguards</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Aligned with the India Digital Personal Data Protection (DPDP) Act principles:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
              <li>Data minimization: stores only essential chronic monitoring metrics.</li>
              <li>Treated as traveling doctor tool: no open patient portal in prototype.</li>
              <li>Prototype has no production authentication; production requires ABHA/MCTS auth.</li>
            </ul>
          </div>

          {/* Out of Scope Boundaries */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>Explicitly Out of Scope (Future Work)</span>
            </div>
            <p className="text-[11px] text-amber-900">
              To preserve clinical safety, the following are intentionally omitted from this prototype:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
              <li>No patient-facing chatbots or triage panels.</li>
              <li>No real-time smartwatch/wearables vitals ingestion.</li>
              <li>No automated drug prescriptions or dosage calculations.</li>
              <li>Focused on hypertension & diabetes follow-up only.</li>
              <li>Hospital HIS/ABDM federated sync deferred to production.</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs hover:bg-slate-800"
            >
              Close Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
