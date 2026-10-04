import React from 'react';
import { useApp } from '../store/appStore';
import { CLINICAL_CONFIG } from '../domain/config';
import { X, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';

export const HowFlagsWorkModal: React.FC = () => {
  const { howFlagsWorkOpen, setHowFlagsWorkOpen, language } = useApp();

  if (!howFlagsWorkOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'hi' ? 'फ्लैग नियम एवं थ्रेशोल्ड' : 'How Decision Support Flags Work'}
            </h2>
          </div>
          <button
            onClick={() => setHowFlagsWorkOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-medium">
            <p className="font-semibold text-teal-950 mb-0.5">Clinical Note:</p>
            {CLINICAL_CONFIG.clinicalNote}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Priority Levels</h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  RED FLAG (Urgent Review)
                </div>
                <p className="text-[11px] text-rose-950 mt-1">
                  Triggered if: (any clinical worsening AND any missed follow-up) OR a follow-up is severely overdue (&gt; 14 days) OR total priority score &ge; 5.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  ORANGE FLAG (Attention Needed)
                </div>
                <p className="text-[11px] text-amber-950 mt-1">
                  Triggered if any single worsening signal or standard missed follow-up occurs without meeting the Red threshold.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  GREEN (On Track)
                </div>
                <p className="text-[11px] text-emerald-950 mt-1">
                  All vitals stable, no consecutive worsening trends, and all follow-ups either attended or not yet due.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">The 7 Signals & Point Weights</h3>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
              <div className="p-2.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>1. BP_TREND (+2 pts)</span>
                  <span className="text-teal-700">Worsening</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Systolic strictly increasing across the last 3 consecutive visits.
                </p>
              </div>

              <div className="p-2.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>2. BP_HIGH (+2 pts)</span>
                  <span className="text-teal-700">Threshold</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Latest systolic &ge; {CLINICAL_CONFIG.bp.highSystolic} OR diastolic &ge; {CLINICAL_CONFIG.bp.highDiastolic} mmHg.
                </p>
              </div>

              <div className="p-2.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>3. SUGAR_TREND (+2 pts)</span>
                  <span className="text-teal-700">Worsening</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  FASTING blood sugar strictly increasing across the last 3 fasting readings.
                </p>
              </div>

              <div className="p-2.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>4. SUGAR_HIGH (+2 pts)</span>
                  <span className="text-teal-700">Threshold</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Latest fasting sugar &ge; {CLINICAL_CONFIG.sugar.highFastingMgDl} mg/dL.
                </p>
              </div>

              <div className="p-2.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>5. WEIGHT_DROP (+1 pt)</span>
                  <span className="text-teal-700">Vulnerability</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Weight fell by &gt; {CLINICAL_CONFIG.weight.dropPercentageThreshold}% between consecutive visits in the last 3 visits.
                </p>
              </div>

              <div className="p-2.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>6. FOLLOWUP_OVERDUE (+2 pts) / LONG_OVERDUE (+3 pts)</span>
                  <span className="text-rose-700">Missed Care</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Due date passed &lt; today. If overdue by &gt; {CLINICAL_CONFIG.followup.longOverdueDays} days, triggers +3 points and automatic RED flag.
                </p>
              </div>

              <div className="p-2.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>7. TEST_MISSED (+2 pts)</span>
                  <span className="text-rose-700">Missed Test</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Test ordered with a due date has passed with no recorded result.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setHowFlagsWorkOpen(false)}
              className="w-full py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs hover:bg-slate-800"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
