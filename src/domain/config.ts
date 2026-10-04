/**
 * Clinical rules configuration and demo settings
 * Thresholds are examples, to be set with clinicians using WHO/ICMR guidelines.
 */

export const DEFAULT_DEMO_TODAY = '2026-10-04';

export const CLINICAL_CONFIG = {
  // Blood Pressure thresholds (example for rural hypertension screening)
  bp: {
    highSystolic: 160,
    highDiastolic: 100,
    trendVisitsCount: 3, // strictly increasing across 3 visits
  },

  // Fasting Blood Sugar thresholds (mg/dL)
  sugar: {
    highFastingMgDl: 180,
    trendReadingsCount: 3, // strictly increasing across 3 fasting readings
  },

  // Weight drop threshold (percentage loss between consecutive visits)
  weight: {
    dropPercentageThreshold: 5.0, // > 5% drop
  },

  // Follow-up thresholds (days)
  followup: {
    longOverdueDays: 14, // > 14 days overdue
    visitAutoResolveDays: 7, // visit considered completed if attended within -7 days of due date
  },

  // Signal point weights
  points: {
    BP_TREND: 2,
    BP_HIGH: 2,
    SUGAR_TREND: 2,
    SUGAR_HIGH: 2,
    WEIGHT_DROP: 1,
    FOLLOWUP_OVERDUE: 2,
    FOLLOWUP_LONG_OVERDUE: 3,
    TEST_MISSED: 2,
  },

  // Score threshold for Red flag
  redScoreThreshold: 5,

  disclaimerText: 'Decision support only. Not a diagnosis.',
  clinicalNote: 'Thresholds are examples, to be set with clinicians using WHO/ICMR guidelines.',
};
