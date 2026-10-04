import React, { useState, useEffect } from 'react';
import { Patient } from '../domain/types';
import { FlagBadge } from './Badge';
import { useApp } from '../store/appStore';
import { explainFlag } from '../services/gemini';
import { getCachedAiReason } from '../services/safety';
import { ChevronRight, Calendar, MapPin, Sparkles, Shield, Loader2 } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  const { language, isOnline, showToast } = useApp();
  const flag = patient.current_flag;

  const flagHash = `${flag.level}_${flag.score}_${flag.signals.map((s) => s.code).join('-')}`;
  const defaultTemplate = language === 'hi' ? flag.templateReasonHi : flag.templateReason;

  const [reasonText, setReasonText] = useState<string>(defaultTemplate);
  const [reasonSource, setReasonSource] = useState<'ai' | 'rule'>('rule');
  const [isRewording, setIsRewording] = useState(false);

  // Sync reason text on language change or flag change, checking cache
  useEffect(() => {
    const cached = getCachedAiReason(patient.patient_id, flagHash, language);
    if (cached) {
      setReasonText(cached);
      setReasonSource('ai');
    } else {
      setReasonText(language === 'hi' ? flag.templateReasonHi : flag.templateReason);
      setReasonSource('rule');
    }
  }, [patient.patient_id, flagHash, language, flag.templateReasonHi, flag.templateReason]);

  const handleRewordWithAi = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't navigate to timeline on reword click
    if (isRewording) return;

    if (!isOnline) {
      showToast('Offline Mode: Using deterministic clinical rule template.');
      return;
    }

    setIsRewording(true);
    try {
      const res = await explainFlag(patient.patient_id, flag, language, isOnline);
      setReasonText(res.text);
      setReasonSource(res.source);
      if (res.source === 'ai') {
        showToast('Reason naturalized with Gemini decision-support phrasing.');
      } else {
        showToast('Clinical rule template active (rate limit or offline).');
      }
    } catch {
      showToast('Clinical rule template active.');
    } finally {
      setIsRewording(false);
    }
  };

  const lastVisit = patient.visits[patient.visits.length - 1];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className={`p-4 rounded-xl border bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer text-left relative overflow-hidden group ${
        flag.level === 'RED'
          ? 'border-rose-200 hover:border-rose-300'
          : flag.level === 'ORANGE'
          ? 'border-amber-200 hover:border-amber-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top row: Name, Demographics, and Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
              {patient.name}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              ({patient.age}/{patient.sex})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {patient.village}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {lastVisit ? lastVisit.date : 'No visits'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <FlagBadge level={flag.level} size="sm" lang={language} />
          <span className="text-[11px] font-semibold text-slate-500">
            Score: <span className="font-bold text-slate-800">{flag.score}</span>
          </span>
        </div>
      </div>

      {/* Reason Box */}
      <div className="mt-3 p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1.5">
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {reasonText}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              {reasonSource === 'ai' ? (
                <>
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span className="text-indigo-600 font-semibold">AI-worded</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Rule-based text</span>
                </>
              )}
            </span>

            {/* On-demand AI Reword Trigger */}
            {flag.level !== 'GREEN' && reasonSource !== 'ai' && (
              <button
                type="button"
                onClick={handleRewordWithAi}
                disabled={isRewording}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded transition-colors"
                title="Reword this reason in natural language using Gemini"
              >
                {isRewording ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>Rewording...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                    <span>AI Reword</span>
                  </>
                )}
              </button>
            )}
          </div>

          {flag.overdueDaysMax > 0 && (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
              {flag.overdueDaysMax}d overdue
            </span>
          )}
        </div>
      </div>

      {/* Hover arrow cue */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600 pr-1">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
};
