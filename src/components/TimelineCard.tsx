import React from 'react';
import { VisitRecord } from '../domain/types';
import {
  Calendar,
  Pill,
  FileCheck,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
} from 'lucide-react';

interface TimelineCardProps {
  visit: VisitRecord;
  isLatest?: boolean;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ visit, isLatest }) => {
  return (
    <div className="relative pl-6 pb-6 group">
      {/* Vertical timeline line */}
      <div className="absolute left-2.5 top-3 bottom-0 w-0.5 bg-slate-200 group-last:hidden" />

      {/* Timeline Node Icon */}
      <div
        className={`absolute left-0 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${
          isLatest ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-300'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${isLatest ? 'bg-teal-600' : 'bg-slate-400'}`}
        />
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-700" />
            <span className="text-sm font-bold text-slate-900">{visit.date}</span>
            {isLatest && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                Latest Visit
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Sync Badge */}
            {visit.syncStatus === 'synced' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Synced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                <Clock className="w-3 h-3" />
                Sync pending
              </span>
            )}

            {/* Source Tag */}
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {visit.source === 'extracted' ? (
                <>
                  <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                  Extracted Note
                </>
              ) : (
                <>
                  <Edit3 className="w-2.5 h-2.5 text-slate-600" />
                  Manual Entry
                </>
              )}
            </span>
          </div>
        </div>

        {/* Vitals Summary Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50/80 rounded-lg text-center">
          <div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Blood Pressure
            </span>
            <div className="text-xs font-bold text-slate-800">
              {visit.bp?.systolic !== null && visit.bp?.systolic !== undefined
                ? `${visit.bp.systolic}/${visit.bp.diastolic} mmHg`
                : 'Not recorded'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Blood Sugar
            </span>
            <div className="text-xs font-bold text-slate-800">
              {visit.sugar?.value !== null && visit.sugar?.value !== undefined
                ? `${visit.sugar.value} mg/dL (${visit.sugar.type})`
                : 'Not recorded'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Weight
            </span>
            <div className="text-xs font-bold text-slate-800">
              {visit.weight_kg ? `${visit.weight_kg} kg` : 'Not recorded'}
            </div>
          </div>
        </div>

        {/* Medicines */}
        {visit.medicines && visit.medicines.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Pill className="w-3.5 h-3.5 text-teal-700" />
              Prescribed Medicines:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {visit.medicines.map((m, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-800 font-medium"
                >
                  {m.name} {m.dose || ''} {m.frequency || ''}{' '}
                  <span className="text-[10px] text-slate-500 lowercase italic">
                    ({m.change})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tests Ordered */}
        {visit.tests_ordered && visit.tests_ordered.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-indigo-700" />
              Tests Ordered:
            </span>
            <ul className="text-xs text-slate-700 list-disc pl-4 space-y-0.5">
              {visit.tests_ordered.map((t, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{t.name}</span>
                  {t.when_text && (
                    <span className="text-slate-500"> ({t.when_text})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Plan / Follow-up */}
        {visit.planned_followup && (
          <div className="p-2 rounded-lg bg-teal-50/50 border border-teal-100 text-xs">
            <span className="font-bold text-teal-900">Planned Follow-up: </span>
            <span className="text-teal-950 font-medium">
              {visit.planned_followup.what}
            </span>
            {visit.planned_followup.when_text && (
              <span className="text-teal-700 font-normal">
                {' '}
                — {visit.planned_followup.when_text}
              </span>
            )}
          </div>
        )}

        {/* Referral */}
        {visit.referral && (
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-xs flex items-start gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-950">Referral: </span>
              <span className="text-indigo-900 font-semibold">
                To {visit.referral.to}
              </span>
              {visit.referral.reason && (
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Reason: {visit.referral.reason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes summary */}
        {visit.notes_summary && (
          <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
            "{visit.notes_summary}"
          </p>
        )}

        {/* Doctor edited fields indicator */}
        {visit.edited_fields && visit.edited_fields.length > 0 && (
          <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
            <Edit3 className="w-3 h-3 text-teal-600" />
            <span>Doctor adjusted: {visit.edited_fields.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
