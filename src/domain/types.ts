/**
 * Domain types for CareLoop Rural
 */

export type FlagLevel = 'RED' | 'ORANGE' | 'GREEN';

export type SignalCode =
  | 'BP_TREND'
  | 'BP_HIGH'
  | 'SUGAR_TREND'
  | 'SUGAR_HIGH'
  | 'WEIGHT_DROP'
  | 'FOLLOWUP_OVERDUE'
  | 'FOLLOWUP_LONG_OVERDUE'
  | 'TEST_MISSED';

export interface SignalFact {
  code: SignalCode;
  points: number;
  label: string;
  labelHi: string;
  facts: Record<string, any>;
  description: string;
}

export interface PatientFlag {
  level: FlagLevel;
  score: number;
  signals: SignalFact[];
  templateReason: string;
  templateReasonHi: string;
  aiReason?: string;
  aiReasonLang?: 'en' | 'hi';
  reasonSource: 'rule' | 'ai';
  evaluatedAt: string;
  overdueDaysMax: number;
}

export type SugarType = 'fasting' | 'random' | 'post-meal' | 'unknown';

export interface MedicineRecord {
  name: string;
  dose: string | null;
  frequency: string | null;
  change: 'started' | 'increased' | 'continued' | 'stopped' | 'unknown';
}

export interface TestOrderedRecord {
  name: string;
  when_text: string | null;
  due_in_days: number | null;
}

export interface PlannedFollowupRecord {
  what: string;
  when_text: string | null;
  due_in_days: number | null;
  absolute_date: string | null;
}

export interface ReferralRecord {
  to: string;
  reason: string | null;
  when_text: string | null;
}

export type FollowupKind = 'visit' | 'test' | 'referral';
export type FollowupStatus = 'open' | 'done';

export interface FollowupItem {
  id: string;
  patient_id: string;
  kind: FollowupKind;
  description: string;
  planned_on: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  status: FollowupStatus;
  completed_on?: string;
  completed_reason?: string;
  source_visit_id: string;
}

export interface VisitRecord {
  id: string;
  patient_id: string;
  date: string; // YYYY-MM-DD
  bp: {
    systolic: number | null;
    diastolic: number | null;
  } | null;
  sugar: {
    value: number | null;
    unit: 'mg/dL';
    type: SugarType;
  } | null;
  weight_kg: number | null;
  medicines: MedicineRecord[];
  tests_ordered: TestOrderedRecord[];
  planned_followup: PlannedFollowupRecord | null;
  referral: ReferralRecord | null;
  notes_summary?: string;
  source: 'extracted' | 'manual';
  edited_fields?: string[];
  syncStatus: 'synced' | 'pending' | 'syncing';
  created_at: string;
}

export interface GroundTruthExpected {
  expected_level: FlagLevel;
  expected_signals: SignalCode[];
  notes?: string;
}

export interface Patient {
  patient_id: string;
  name: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  village: string;
  phone?: string;
  visits: VisitRecord[];
  followups: FollowupItem[];
  current_flag: PatientFlag;
  ground_truth?: GroundTruthExpected;
  created_at: string;
  updated_at: string;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface FieldWithConfidence<T> {
  value: T;
  confidence: ConfidenceLevel;
  doctorChecked?: boolean;
  edited?: boolean;
}

export interface ExtractedNoteData {
  visit_date: FieldWithConfidence<string | null>;
  blood_pressure: FieldWithConfidence<{
    systolic: number;
    diastolic: number;
  } | null>;
  blood_sugar: FieldWithConfidence<{
    value: number;
    unit: 'mg/dL';
    type: SugarType;
  } | null>;
  weight_kg: FieldWithConfidence<number | null>;
  medicines: FieldWithConfidence<MedicineRecord[] | null>;
  tests_ordered: FieldWithConfidence<TestOrderedRecord[] | null>;
  planned_followup: FieldWithConfidence<PlannedFollowupRecord | null>;
  referral: FieldWithConfidence<ReferralRecord | null>;
  rawNotesSnippet?: string;
}

export interface SampleNote {
  id: string;
  title: string;
  patient_id_hint?: string;
  patient_name_hint?: string;
  style: 'handwritten' | 'typed' | 'mixed';
  language: 'English' | 'Hindi' | 'Hinglish';
  canvasText: string;
  description: string;
  unclearElementNote?: string;
  groundTruth: {
    visit_date: string | null;
    blood_pressure: { systolic: number; diastolic: number } | null;
    blood_sugar: { value: number; unit: 'mg/dL'; type: SugarType } | null;
    weight_kg: number | null;
    medicines: MedicineRecord[] | null;
    tests_ordered: TestOrderedRecord[] | null;
    planned_followup: PlannedFollowupRecord | null;
    referral: ReferralRecord | null;
  };
}

export interface SyncQueueItem {
  id: string;
  type: 'CREATE_VISIT' | 'UPDATE_FOLLOWUP' | 'PENDING_EXTRACTION';
  patient_id?: string;
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  created_at: string;
}
