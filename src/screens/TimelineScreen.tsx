import React, { useState, useEffect } from 'react';
import { useApp } from '../store/appStore';
import { FlagBadge } from '../components/Badge';
import { BpChart } from '../components/BpChart';
import { SugarChart } from '../components/SugarChart';
import { WeightSparkline } from '../components/WeightSparkline';
import { TimelineCard } from '../components/TimelineCard';
import { dateDiffDays } from '../domain/followups';
import { explainFlag } from '../services/gemini';
import { getCachedAiReason } from '../services/safety';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
  HelpCircle,
  Activity,
  Heart,
  FileCheck,
  Check,
  Sparkles,
  Shield,
  Loader2,
} from 'lucide-react';

export const TimelineScreen: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    completeFollowup,
    navigateToReview,
    demoToday,
    dict,
    language,
    isOnline,
    showToast,
    setHowFlagsWorkOpen,
  } = useApp();

  const [whyFlagOpen, setWhyFlagOpen] = useState(true);

  // If no patient selected, default to P104 (prominent case) or first patient
  const patient =
    patients.find((p) => p.patient_id === selectedPatientId) || patients[0];

  const flag = patient?.current_flag;
  const flagHash = flag ? `${flag.level}_${flag.score}_${flag.signals.map((s) => s.code).join('-')}` : '';

  const [reasonText, setReasonText] = useState<string>('');
  const [isAiWorded, setIsAiWorded] = useState<boolean>(false);
  const [isRewording, setIsRewording] = useState<boolean>(false);

  useEffect(() => {
    if (!flag || !patient) return;
    const cached = getCachedAiReason(patient.patient_id, flagHash, language);
    if (cached) {
      setReasonText(cached);
      setIsAiWorded(true);
    } else {
      setReasonText(language === 'hi' ? flag.templateReasonHi : flag.templateReason);
      setIsAiWorded(false);
    }
  }, [patient?.patient_id, flagHash, language, flag?.templateReasonHi, flag?.templateReason]);

  const handleReword = async () => {
    if (!patient || !flag || isRewording) return;
    if (!isOnline) {
      showToast('Offline Mode: Rule-based template active.');
      return;
    }

    setIsRewording(true);
    try {
      const res = await explainFlag(patient.patient_id, flag, language, isOnline);
      setReasonText(res.text);
      setIsAiWorded(res.source === 'ai');
      if (res.source === 'ai') {
        showToast('Flag reason naturalized with Gemini.');
      } else {
        showToast('Clinical rule template active (rate limit or offline).');
      }
    } catch {
      showToast('Clinical rule template active.');
    } finally {
      setIsRewording(false);
    }
  };

  if (!patient || !flag) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <p className="text-sm font-semibold text-slate-600">No patient found.</p>
      </div>
    );
  }

  const sortedVisits = [...patient.visits].sort((a, b) => b.date.localeCompare(a.date)); // latest first
  const openFollowups = patient.followups.filter((f) => f.status === 'open');
  const completedFollowups = patient.followups.filter((f) => f.status === 'done');

  const handleAddVisit = () => {
    // Blank form on Screen 2
    navigateToReview({
      extracted: {
        visit_date: { value: demoToday, confidence: 'high' },
        blood_pressure: { value: null, confidence: 'low' },
        blood_sugar: { value: null, confidence: 'low' },
        weight_kg: { value: null, confidence: 'low' },
        medicines: { value: [], confidence: 'high' },
        tests_ordered: { value: [], confidence: 'high' },
        planned_followup: { value: null, confidence: 'low' },
        referral: { value: null, confidence: 'high' },
      },
      patientId: patient.patient_id,
      isManual: true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Patient Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {patient.name}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                ({patient.age}y / {patient.sex})
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-bold">
                {patient.patient_id}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Village {patient.village}
              </span>
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <FlagBadge level={flag.level} size="md" lang={language} />
            <span className="text-xs font-bold text-slate-700">
              Score: <span className="text-slate-900 font-extrabold">{flag.score}</span>
            </span>
          </div>
        </div>

        {/* Flag Summary Banner */}
        <div
          className={`p-3 rounded-xl border text-xs leading-relaxed font-medium space-y-2 ${
            flag.level === 'RED'
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : flag.level === 'ORANGE'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}
        >
          <p className="font-medium text-slate-800">
            {reasonText || (language === 'hi' ? flag.templateReasonHi : flag.templateReason)}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              {isAiWorded ? (
                <>
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span className="text-indigo-600 font-semibold">AI-worded with Gemini</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Rule-based clinical text</span>
                </>
              )}
            </span>

            {flag.level !== 'GREEN' && !isAiWorded && (
              <button
                type="button"
                onClick={handleReword}
                disabled={isRewording}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded transition-colors shadow-2xs"
              >
                {isRewording ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>Rewording...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                    <span>Reword with AI</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action button row */}
        <div className="flex items-center justify-between pt-1">
          {/* Collapsible Why This Flag button */}
          <button
            onClick={() => setWhyFlagOpen(!whyFlagOpen)}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{dict.whyThisFlag}</span>
            {whyFlagOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Add visit button */}
          <button
            onClick={handleAddVisit}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {dict.addVisit}
          </button>
        </div>

        {/* Collapsible 'Why this flag?' breakdown panel */}
        {whyFlagOpen && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Triggered clinical signals ({flag.signals.length}):</span>
              <button
                onClick={() => setHowFlagsWorkOpen(true)}
                className="text-teal-700 font-semibold hover:underline"
              >
                View all rules & thresholds
              </button>
            </div>

            {flag.signals.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                No adverse signals triggered. All monitored vitals and follow-ups are within target thresholds.
              </p>
            ) : (
              <div className="space-y-1.5">
                {flag.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {sig.code} ({sig.label})
                      </span>
                      <span className="text-teal-700 font-bold">+{sig.points} pts</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{sig.description}</p>
                    {sig.facts && (
                      <div className="text-[10px] font-mono text-slate-500 bg-white p-1 rounded border border-slate-100">
                        Facts: {JSON.stringify(sig.facts)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vitals Trend Charts: 1 column on mobile, 2 columns on tablet & desktop */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Blood Pressure Chart */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 px-1">
              <Heart className="w-4 h-4 text-rose-600" />
              {dict.bpTrendChart}
            </h3>
            <BpChart visits={patient.visits} />
          </div>

          {/* Blood Sugar Chart */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 px-1">
              <Activity className="w-4 h-4 text-amber-600" />
              {dict.sugarTrendChart}
            </h3>
            <SugarChart visits={patient.visits} />
          </div>
        </div>

        {/* Weight Sparkline */}
        <div>
          <WeightSparkline visits={patient.visits} />
        </div>
      </div>

      {/* Follow-ups and Visit Records: 1 column on mobile, 2 columns on desktop (5 cols / 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Open Follow-ups Section (Left Column on Desktop) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 lg:sticky lg:top-16">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-700" />
              {dict.openFollowups} ({openFollowups.length})
            </h3>
            <span className="text-[10px] text-slate-400">
              Ref date: {demoToday}
            </span>
          </div>

          {openFollowups.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center">
              {dict.noFollowups}
            </p>
          ) : (
            <div className="space-y-2">
              {openFollowups.map((item) => {
                const isOverdue = item.due_date < demoToday;
                const overdueDays = isOverdue ? dateDiffDays(demoToday, item.due_date) : 0;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isOverdue
                        ? overdueDays > 14
                          ? 'bg-rose-50/80 border-rose-300'
                          : 'bg-amber-50/80 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {item.description}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                          {item.kind}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Due: <span className="font-semibold">{item.due_date}</span>
                        {isOverdue && (
                          <span className="font-bold text-rose-700 ml-1.5">
                            (Overdue by {overdueDays} days)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => completeFollowup(patient.patient_id, item.id)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      {dict.markDone}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recently completed follow-ups list */}
          {completedFollowups.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Completed Care Items ({completedFollowups.length})
              </span>
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto pr-1">
                {completedFollowups.slice(-5).map((f) => (
                  <div
                    key={f.id}
                    className="text-xs text-slate-600 flex items-center justify-between p-1.5 bg-slate-50 rounded"
                  >
                    <span className="truncate">{f.description}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold shrink-0">
                      Done ✓ ({f.completed_on || 'Resolved'})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Timeline of Visits (Right Column on Desktop) */}
        <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              Visit Timeline Records ({patient.visits.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Chronological OPD Visits
            </span>
          </div>

          <div className="pt-2">
            {sortedVisits.map((v, idx) => (
              <TimelineCard key={v.id} visit={v} isLatest={idx === 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
