import React, { useState } from 'react';
import {
  ExtractedNoteData,
  ConfidenceLevel,
  SugarType,
  MedicineRecord,
  TestOrderedRecord,
  PlannedFollowupRecord,
  ReferralRecord,
} from '../domain/types';
import { ConfidenceChip } from './ConfidenceChip';
import { useApp } from '../store/appStore';
import {
  Check,
  AlertCircle,
  Pill,
  Plus,
  Trash2,
  Calendar,
  Heart,
  Activity,
  Weight,
  FileCheck,
  Share2,
} from 'lucide-react';

interface ReviewFormProps {
  initialExtracted: ExtractedNoteData;
  noteImage?: string;
  patientId: string;
  isManual?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  initialExtracted,
  noteImage,
  patientId,
  isManual = false,
}) => {
  const { confirmAndSaveVisit, patients, dict } = useApp();
  const patient = patients.find((p) => p.patient_id === patientId);

  // Field states
  const [visitDate, setVisitDate] = useState(
    initialExtracted.visit_date?.value || '2026-10-02'
  );
  const [systolic, setSystolic] = useState<string>(
    initialExtracted.blood_pressure?.value?.systolic !== null &&
      initialExtracted.blood_pressure?.value?.systolic !== undefined
      ? String(initialExtracted.blood_pressure.value.systolic)
      : ''
  );
  const [diastolic, setDiastolic] = useState<string>(
    initialExtracted.blood_pressure?.value?.diastolic !== null &&
      initialExtracted.blood_pressure?.value?.diastolic !== undefined
      ? String(initialExtracted.blood_pressure.value.diastolic)
      : ''
  );

  const [sugarValue, setSugarValue] = useState<string>(
    initialExtracted.blood_sugar?.value?.value !== null &&
      initialExtracted.blood_sugar?.value?.value !== undefined
      ? String(initialExtracted.blood_sugar.value.value)
      : ''
  );
  const [sugarType, setSugarType] = useState<SugarType>(
    initialExtracted.blood_sugar?.value?.type || 'fasting'
  );

  const [weightKg, setWeightKg] = useState<string>(
    initialExtracted.weight_kg?.value !== null &&
      initialExtracted.weight_kg?.value !== undefined
      ? String(initialExtracted.weight_kg.value)
      : ''
  );

  const [medicines, setMedicines] = useState<MedicineRecord[]>(
    initialExtracted.medicines?.value || [
      { name: 'Metformin', dose: '500 mg', frequency: 'BD', change: 'continued' },
    ]
  );

  const [testsOrdered, setTestsOrdered] = useState<TestOrderedRecord[]>(
    initialExtracted.tests_ordered?.value || []
  );

  const [plannedWhat, setPlannedWhat] = useState<string>(
    initialExtracted.planned_followup?.value?.what || 'Review in 4 weeks'
  );
  const [plannedWhen, setPlannedWhen] = useState<string>(
    initialExtracted.planned_followup?.value?.when_text || 'in 4 weeks'
  );

  const [referralTo, setReferralTo] = useState<string>(
    initialExtracted.referral?.value?.to || ''
  );
  const [referralReason, setReferralReason] = useState<string>(
    initialExtracted.referral?.value?.reason || ''
  );

  // Tracking edited fields and low-confidence check approvals
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markEdited = (fieldName: string) => {
    setEditedFields((prev) => new Set(prev).add(fieldName));
  };

  const toggleChecked = (fieldName: string) => {
    setCheckedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) next.delete(fieldName);
      else next.add(fieldName);
      return next;
    });
  };

  // Check if a field requires doctor review:
  // Low confidence OR null/empty extracted value that hasn't been edited or explicitly checked
  const isBpAmber =
    (initialExtracted.blood_pressure?.confidence === 'low' ||
      !initialExtracted.blood_pressure?.value ||
      initialExtracted.blood_pressure.value.systolic === null) &&
    !editedFields.has('blood_pressure') &&
    !checkedFields.has('blood_pressure');

  const isSugarAmber =
    (initialExtracted.blood_sugar?.confidence === 'low' ||
      !initialExtracted.blood_sugar?.value ||
      initialExtracted.blood_sugar.value.type === 'unknown') &&
    !editedFields.has('blood_sugar') &&
    !checkedFields.has('blood_sugar');

  const isDateAmber =
    (initialExtracted.visit_date?.confidence === 'low' ||
      !initialExtracted.visit_date?.value) &&
    !editedFields.has('visit_date') &&
    !checkedFields.has('visit_date');

  const hasUnresolvedAmber = isBpAmber || isSugarAmber || isDateAmber;

  // Add / Remove medicines
  const addMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { name: '', dose: '', frequency: 'OD', change: 'started' },
    ]);
    markEdited('medicines');
  };

  const removeMedicine = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
    markEdited('medicines');
  };

  // Add / Remove tests
  const addTest = () => {
    setTestsOrdered((prev) => [...prev, { name: '', when_text: 'in 2 weeks', due_in_days: 14 }]);
    markEdited('tests_ordered');
  };

  const removeTest = (idx: number) => {
    setTestsOrdered((prev) => prev.filter((_, i) => i !== idx));
    markEdited('tests_ordered');
  };

  const handleConfirmAndSave = async () => {
    if (hasUnresolvedAmber) return;
    setIsSubmitting(true);

    try {
      const sysNum = systolic ? parseInt(systolic, 10) : null;
      const diaNum = diastolic ? parseInt(diastolic, 10) : null;
      const sugarNum = sugarValue ? parseFloat(sugarValue) : null;
      const weightNum = weightKg ? parseFloat(weightKg) : null;

      const visitPayload = {
        patient_id: patientId,
        date: visitDate,
        bp:
          sysNum !== null
            ? { systolic: sysNum, diastolic: diaNum ?? 80 }
            : null,
        sugar:
          sugarNum !== null
            ? {
                value: sugarNum,
                unit: 'mg/dL' as const,
                type: sugarType,
              }
            : null,
        weight_kg: weightNum,
        medicines: medicines.filter((m) => m.name.trim().length > 0),
        tests_ordered: testsOrdered.filter((t) => t.name.trim().length > 0),
        planned_followup: plannedWhat.trim()
          ? {
              what: plannedWhat,
              when_text: plannedWhen,
              due_in_days: 28,
              absolute_date: null,
            }
          : null,
        referral: referralTo.trim()
          ? {
              to: referralTo,
              reason: referralReason || null,
              when_text: 'as indicated',
            }
          : null,
        notes_summary: 'Doctor reviewed and confirmed record.',
        source: isManual ? ('manual' as const) : ('extracted' as const),
        edited_fields: Array.from(editedFields),
      };

      await confirmAndSaveVisit(patientId, visitPayload);
    } catch (err) {
      console.error('Failed to confirm and save:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Header Banner */}
      {patient && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
              Target Patient
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {patient.name}{' '}
              <span className="font-normal text-slate-500">
                ({patient.age}/{patient.sex} • {patient.village})
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-teal-700 bg-white px-2 py-1 rounded border border-teal-200">
            {patient.patient_id}
          </span>
        </div>
      )}

      {/* Note Image Preview (if extracted from image) */}
      {noteImage && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Source Clinic Note</span>
            <span className="text-[11px] text-teal-700 font-medium">Original Photo / Canvas</span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
            <img
              src={noteImage}
              alt="Prescription Note"
              className="max-h-60 w-auto object-contain rounded shadow-xs"
            />
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Visit Date */}
        <div
          className={`p-3.5 rounded-xl border bg-white shadow-2xs space-y-2 transition-colors ${
            isDateAmber ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              Visit Date
            </label>
            <div className="flex items-center gap-2">
              <ConfidenceChip
                confidence={initialExtracted.visit_date?.confidence || 'high'}
                doctorChecked={checkedFields.has('visit_date')}
                edited={editedFields.has('visit_date')}
              />
              {isDateAmber && (
                <button
                  type="button"
                  onClick={() => toggleChecked('visit_date')}
                  className="text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300"
                >
                  ✓ Mark Checked
                </button>
              )}
            </div>
          </div>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => {
              setVisitDate(e.target.value);
              markEdited('visit_date');
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-teal-600"
          />
        </div>

        {/* Blood Pressure */}
        <div
          className={`p-3.5 rounded-xl border bg-white shadow-2xs space-y-2 transition-colors ${
            isBpAmber ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-600" />
              Blood Pressure (mmHg)
            </label>
            <div className="flex items-center gap-2">
              <ConfidenceChip
                confidence={initialExtracted.blood_pressure?.confidence || 'high'}
                doctorChecked={checkedFields.has('blood_pressure')}
                edited={editedFields.has('blood_pressure')}
              />
              {isBpAmber && (
                <button
                  type="button"
                  onClick={() => toggleChecked('blood_pressure')}
                  className="text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300"
                >
                  ✓ Mark Checked
                </button>
              )}
            </div>
          </div>

          {isBpAmber && (
            <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Low confidence or smudged reading detected. Doctor verification required before saving.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-medium">Systolic</span>
              <input
                type="number"
                placeholder="e.g. 140"
                value={systolic}
                onChange={(e) => {
                  setSystolic(e.target.value);
                  markEdited('blood_pressure');
                }}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-teal-600"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium">Diastolic</span>
              <input
                type="number"
                placeholder="e.g. 90"
                value={diastolic}
                onChange={(e) => {
                  setDiastolic(e.target.value);
                  markEdited('blood_pressure');
                }}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Blood Sugar */}
        <div
          className={`p-3.5 rounded-xl border bg-white shadow-2xs space-y-2 transition-colors ${
            isSugarAmber ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-600" />
              Blood Sugar & Meal Status
            </label>
            <div className="flex items-center gap-2">
              <ConfidenceChip
                confidence={initialExtracted.blood_sugar?.confidence || 'high'}
                doctorChecked={checkedFields.has('blood_sugar')}
                edited={editedFields.has('blood_sugar')}
              />
              {isSugarAmber && (
                <button
                  type="button"
                  onClick={() => toggleChecked('blood_sugar')}
                  className="text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300"
                >
                  ✓ Mark Checked
                </button>
              )}
            </div>
          </div>

          {isSugarAmber && (
            <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Sugar meal type was unclear on note. Please confirm whether Fasting or Random.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-medium">Value (mg/dL)</span>
              <input
                type="number"
                placeholder="e.g. 150"
                value={sugarValue}
                onChange={(e) => {
                  setSugarValue(e.target.value);
                  markEdited('blood_sugar');
                }}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-teal-600"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium">Test Type</span>
              <select
                value={sugarType}
                onChange={(e) => {
                  setSugarType(e.target.value as SugarType);
                  markEdited('blood_sugar');
                }}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-teal-600"
              >
                <option value="fasting">Fasting (खाली पेट)</option>
                <option value="random">Random (रैंडम)</option>
                <option value="post-meal">Post-meal (भोजनोपरांत)</option>
                <option value="unknown">Unknown / Unspecified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Weight className="w-4 h-4 text-indigo-600" />
              Weight (kg)
            </label>
            <ConfidenceChip
              confidence={initialExtracted.weight_kg?.confidence || 'high'}
              edited={editedFields.has('weight_kg')}
            />
          </div>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 65.5"
            value={weightKg}
            onChange={(e) => {
              setWeightKg(e.target.value);
              markEdited('weight_kg');
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-teal-600"
          />
        </div>

        {/* Medicines */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-700" />
              Prescribed Medicines ({medicines.length})
            </label>
            <button
              type="button"
              onClick={addMedicine}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medicine
            </button>
          </div>

          <div className="space-y-2">
            {medicines.map((med, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-1.5 items-center p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Medicine name"
                    value={med.name}
                    onChange={(e) => {
                      const updated = [...medicines];
                      updated[idx].name = e.target.value;
                      setMedicines(updated);
                      markEdited('medicines');
                    }}
                    className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Dose"
                    value={med.dose || ''}
                    onChange={(e) => {
                      const updated = [...medicines];
                      updated[idx].dose = e.target.value;
                      setMedicines(updated);
                      markEdited('medicines');
                    }}
                    className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs"
                  />
                </div>
                <div className="col-span-4">
                  <select
                    value={med.change}
                    onChange={(e) => {
                      const updated = [...medicines];
                      updated[idx].change = e.target.value as any;
                      setMedicines(updated);
                      markEdited('medicines');
                    }}
                    className="w-full px-1.5 py-1 rounded border border-slate-300 bg-white text-[11px]"
                  >
                    <option value="continued">Continued</option>
                    <option value="started">Started</option>
                    <option value="increased">Increased</option>
                    <option value="stopped">Stopped</option>
                  </select>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeMedicine(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tests Ordered */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-700" />
              Tests Ordered
            </label>
            <button
              type="button"
              onClick={addTest}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Test
            </button>
          </div>

          {testsOrdered.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No tests recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {testsOrdered.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Test name"
                    value={t.name}
                    onChange={(e) => {
                      const copy = [...testsOrdered];
                      copy[idx].name = e.target.value;
                      setTestsOrdered(copy);
                      markEdited('tests_ordered');
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="When (e.g. 2 weeks)"
                    value={t.when_text || ''}
                    onChange={(e) => {
                      const copy = [...testsOrdered];
                      copy[idx].when_text = e.target.value;
                      setTestsOrdered(copy);
                      markEdited('tests_ordered');
                    }}
                    className="w-32 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeTest(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Planned Follow-up */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-800">
            Planned Follow-up / Clinical Plan
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="What (e.g. Next routine visit)"
              value={plannedWhat}
              onChange={(e) => {
                setPlannedWhat(e.target.value);
                markEdited('planned_followup');
              }}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
            />
            <input
              type="text"
              placeholder="When (e.g. in 4 weeks)"
              value={plannedWhen}
              onChange={(e) => {
                setPlannedWhen(e.target.value);
                markEdited('planned_followup');
              }}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
            />
          </div>
        </div>

        {/* Referral */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-indigo-700" />
            Referral (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Referral Facility (e.g. CHC Rampur)"
              value={referralTo}
              onChange={(e) => setReferralTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
            />
            <input
              type="text"
              placeholder="Reason for referral"
              value={referralReason}
              onChange={(e) => setReferralReason(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Confirmation Safeguard Banner */}
      {hasUnresolvedAmber && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {dict.confirmDisabledHint ||
              'Please review and verify all low-confidence fields before saving.'}
          </span>
        </div>
      )}

      {/* Confirm Button */}
      <button
        type="button"
        disabled={hasUnresolvedAmber || isSubmitting}
        onClick={handleConfirmAndSave}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
          hasUnresolvedAmber || isSubmitting
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            : 'bg-teal-700 hover:bg-teal-800 text-white active:scale-[0.99]'
        }`}
      >
        <Check className="w-4 h-4" />
        {isSubmitting ? 'Saving Visit...' : dict.confirmAndSave}
      </button>
    </div>
  );
};
