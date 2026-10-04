import React, { useState } from 'react';
import { useApp } from '../store/appStore';
import { sortPatientsByPriority } from '../domain/priority';
import { PatientCard } from '../components/PatientCard';
import { FlagLevel } from '../domain/types';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Users,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { patients, navigateToTimeline, syncQueue, dict, language } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | FlagLevel>('ALL');

  const pendingSyncCount = syncQueue.filter(
    (i) => i.status === 'pending' || i.status === 'syncing'
  ).length;

  const redCount = patients.filter((p) => p.current_flag.level === 'RED').length;
  const orangeCount = patients.filter((p) => p.current_flag.level === 'ORANGE').length;
  const greenCount = patients.filter((p) => p.current_flag.level === 'GREEN').length;

  const sortedPatients = sortPatientsByPriority(patients);

  const filteredPatients =
    selectedFilter === 'ALL'
      ? sortedPatients
      : sortedPatients.filter((p) => p.current_flag.level === selectedFilter);

  return (
    <div className="space-y-4">
      {/* Village View Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>{dict.villageView}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {patients.length} Registered Villagers
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {dict.tagline}
        </p>

        {/* Summary Chips */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => setSelectedFilter(selectedFilter === 'RED' ? 'ALL' : 'RED')}
            className={`p-2 rounded-xl border text-center transition-all ${
              selectedFilter === 'RED'
                ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-300'
                : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-base font-extrabold">{redCount}</span>
            </div>
            <span className="text-[10px] font-bold text-rose-800 uppercase">Red</span>
          </button>

          <button
            onClick={() => setSelectedFilter(selectedFilter === 'ORANGE' ? 'ALL' : 'ORANGE')}
            className={`p-2 rounded-xl border text-center transition-all ${
              selectedFilter === 'ORANGE'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-amber-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-base font-extrabold">{orangeCount}</span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 uppercase">Orange</span>
          </button>

          <button
            onClick={() => setSelectedFilter(selectedFilter === 'GREEN' ? 'ALL' : 'GREEN')}
            className={`p-2 rounded-xl border text-center transition-all ${
              selectedFilter === 'GREEN'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300'
                : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-base font-extrabold">{greenCount}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Green</span>
          </button>

          <div className="p-2 rounded-xl border bg-slate-50 border-slate-200 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-base font-extrabold">{pendingSyncCount}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Queued</span>
          </div>
        </div>
      </div>

      {/* Filter and Patient Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {selectedFilter === 'ALL'
                ? dict.allPatients
                : `${selectedFilter} Priority Patients`}
            </span>
          </div>

          {selectedFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedFilter('ALL')}
              className="text-[11px] font-semibold text-teal-700 hover:underline"
            >
              Clear filter ({filteredPatients.length})
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {filteredPatients.map((p) => (
            <PatientCard
              key={p.patient_id}
              patient={p}
              onClick={() => navigateToTimeline(p.patient_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
