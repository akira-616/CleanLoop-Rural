import React, { useState } from 'react';
import { useApp } from '../store/appStore';
import { FlagBadge } from '../components/Badge';
import { FlagLevel } from '../domain/types';
import {
  Users,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  UserPlus,
  ArrowUpDown,
} from 'lucide-react';

export const PatientsScreen: React.FC = () => {
  const { patients, navigateToTimeline, language, dict } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | FlagLevel>('ALL');

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterLevel === 'ALL' ? true : p.current_flag.level === filterLevel;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Title & Stats */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            {dict.navPatients} ({patients.length})
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            Rampur & Sonpur Outpost
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Directory of registered patients under traveling clinic coverage.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, ID, or village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50/50 text-xs text-slate-900 focus:outline-teal-600 focus:bg-white"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'RED', 'ORANGE', 'GREEN'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterLevel === lvl
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl === 'ALL' ? 'All' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            No patients match "{searchTerm}".
          </div>
        ) : (
          filtered.map((p) => {
            const lastVisit = p.visits[p.visits.length - 1];
            return (
              <div
                key={p.patient_id}
                onClick={() => navigateToTimeline(p.patient_id)}
                role="button"
                tabIndex={0}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({p.age}/{p.sex})
                    </span>
                    <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-1 py-0.2 rounded border border-teal-200 font-bold">
                      {p.patient_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {p.village}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {lastVisit ? `Last: ${lastVisit.date}` : 'No visits'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <FlagBadge level={p.current_flag.level} size="sm" lang={language} />
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
