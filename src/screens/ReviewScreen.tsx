import React from 'react';
import { useApp } from '../store/appStore';
import { ReviewForm } from '../components/ReviewForm';
import { ArrowLeft, CheckSquare } from 'lucide-react';

export const ReviewScreen: React.FC = () => {
  const { pendingReview, setActiveTab, selectedPatientId, dict } = useApp();

  if (!pendingReview) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">No Note Pending Review</h3>
        <p className="text-xs text-slate-500">
          Upload or choose a clinic note from the Upload tab to review extracted clinical facts.
        </p>
        <button
          onClick={() => setActiveTab('upload')}
          className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-semibold hover:bg-teal-800"
        >
          Go to Upload Tab
        </button>
      </div>
    );
  }

  const patientId = pendingReview.patientId || selectedPatientId || 'P106';

  return (
    <div className="space-y-4">
      {/* Back button and screen header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('upload')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Upload
        </button>
        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
          Step 2 of 2: Human Confirmation
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
        <h2 className="text-base font-extrabold text-slate-900">
          {dict.reviewTitle}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {dict.reviewSubtitle}
        </p>
      </div>

      {/* Review Form */}
      <ReviewForm
        initialExtracted={pendingReview.extracted}
        noteImage={pendingReview.noteImage}
        patientId={patientId}
        isManual={pendingReview.isManual}
      />
    </div>
  );
};
