/**
 * Pure, deterministic clinical rules engine for CareLoop Rural
 */

import {
  Patient,
  PatientFlag,
  SignalFact,
  SignalCode,
  FlagLevel,
  VisitRecord,
  FollowupItem,
} from './types';
import { CLINICAL_CONFIG, DEFAULT_DEMO_TODAY } from './config';
import { dateDiffDays } from './followups';
import { buildTemplateReasonEn, buildTemplateReasonHi } from './reasonTemplates';

export interface EvaluationResult {
  flag: PatientFlag;
  signals: SignalFact[];
}

/**
 * Evaluates clinical signals for a patient given a reference today date
 */
export function evaluatePatientFlags(
  patient: Pick<Patient, 'visits' | 'followups' | 'name' | 'patient_id'>,
  todayDate: string = DEFAULT_DEMO_TODAY
): PatientFlag {
  const signals: SignalFact[] = [];
  let sugarTypeUnclear = false;

  // Use only visits sorted chronologically
  const visits = [...patient.visits].sort((a, b) => a.date.localeCompare(b.date));

  // --- Signal 1: BP_TREND (+2) ---
  // Systolic strictly increasing across the last 3 consecutive visits with BP
  const visitsWithBp = visits.filter(
    (v) => v.bp?.systolic !== null && v.bp?.systolic !== undefined && !isNaN(v.bp.systolic)
  );

  if (visitsWithBp.length >= CLINICAL_CONFIG.bp.trendVisitsCount) {
    const last3Bp = visitsWithBp.slice(-CLINICAL_CONFIG.bp.trendVisitsCount);
    const s1 = last3Bp[0].bp!.systolic!;
    const s2 = last3Bp[1].bp!.systolic!;
    const s3 = last3Bp[2].bp!.systolic!;

    if (s1 < s2 && s2 < s3) {
      signals.push({
        code: 'BP_TREND',
        points: CLINICAL_CONFIG.points.BP_TREND,
        label: 'BP Worsening Trend',
        labelHi: 'रक्तचाप वृद्धि प्रवृत्ति',
        facts: {
          systolicValues: [s1, s2, s3],
          dates: last3Bp.map((v) => v.date),
        },
        description: `Systolic BP increased across 3 consecutive visits (${s1} -> ${s2} -> ${s3} mmHg).`,
      });
    }
  }

  // --- Signal 2: BP_HIGH (+2) ---
  // Latest systolic >= 160 OR latest diastolic >= 100
  if (visitsWithBp.length > 0) {
    const latestBpVisit = visitsWithBp[visitsWithBp.length - 1];
    const sys = latestBpVisit.bp!.systolic!;
    const dia = latestBpVisit.bp?.diastolic ?? 0;

    if (sys >= CLINICAL_CONFIG.bp.highSystolic || dia >= CLINICAL_CONFIG.bp.highDiastolic) {
      signals.push({
        code: 'BP_HIGH',
        points: CLINICAL_CONFIG.points.BP_HIGH,
        label: 'High Blood Pressure',
        labelHi: 'उच्च रक्तचाप',
        facts: {
          systolic: sys,
          diastolic: dia,
          date: latestBpVisit.date,
          thresholdSystolic: CLINICAL_CONFIG.bp.highSystolic,
          thresholdDiastolic: CLINICAL_CONFIG.bp.highDiastolic,
        },
        description: `Latest BP recorded was ${sys}/${dia} mmHg (threshold: >= ${CLINICAL_CONFIG.bp.highSystolic}/${CLINICAL_CONFIG.bp.highDiastolic}).`,
      });
    }
  }

  // --- Sugar Processing ---
  // Sugar readings with type other than fasting are shown but ignored by sugar rules.
  // If type is unknown, ignore it and add note "sugar type unclear".
  const fastingSugarVisits = visits.filter(
    (v) =>
      v.sugar?.value !== null &&
      v.sugar?.value !== undefined &&
      !isNaN(v.sugar.value) &&
      v.sugar.type === 'fasting'
  );

  const unknownSugarVisits = visits.filter(
    (v) =>
      v.sugar?.value !== null &&
      v.sugar?.value !== undefined &&
      v.sugar.type === 'unknown'
  );
  if (unknownSugarVisits.length > 0) {
    sugarTypeUnclear = true;
  }

  // --- Signal 3: SUGAR_TREND (+2) ---
  // Fasting sugar strictly increasing across the last 3 fasting readings
  if (fastingSugarVisits.length >= CLINICAL_CONFIG.sugar.trendReadingsCount) {
    const last3Sugar = fastingSugarVisits.slice(-CLINICAL_CONFIG.sugar.trendReadingsCount);
    const sg1 = last3Sugar[0].sugar!.value!;
    const sg2 = last3Sugar[1].sugar!.value!;
    const sg3 = last3Sugar[2].sugar!.value!;

    if (sg1 < sg2 && sg2 < sg3) {
      signals.push({
        code: 'SUGAR_TREND',
        points: CLINICAL_CONFIG.points.SUGAR_TREND,
        label: 'Fasting Sugar Trend',
        labelHi: 'फास्टिंग शुगर वृद्धि प्रवृत्ति',
        facts: {
          sugarValues: [sg1, sg2, sg3],
          dates: last3Sugar.map((v) => v.date),
        },
        description: `Fasting blood sugar rose across 3 consecutive readings (${sg1} -> ${sg2} -> ${sg3} mg/dL).`,
      });
    }
  }

  // --- Signal 4: SUGAR_HIGH (+2) ---
  // Latest fasting sugar >= 180 mg/dL
  if (fastingSugarVisits.length > 0) {
    const latestFasting = fastingSugarVisits[fastingSugarVisits.length - 1];
    const val = latestFasting.sugar!.value!;

    if (val >= CLINICAL_CONFIG.sugar.highFastingMgDl) {
      signals.push({
        code: 'SUGAR_HIGH',
        points: CLINICAL_CONFIG.points.SUGAR_HIGH,
        label: 'High Fasting Sugar',
        labelHi: 'उच्च फास्टिंग शुगर',
        facts: {
          value: val,
          date: latestFasting.date,
          threshold: CLINICAL_CONFIG.sugar.highFastingMgDl,
        },
        description: `Latest fasting sugar was ${val} mg/dL (threshold: >= ${CLINICAL_CONFIG.sugar.highFastingMgDl} mg/dL).`,
      });
    }
  }

  // --- Signal 5: WEIGHT_DROP (+1) ---
  // Weight fell by MORE than 5% between two consecutive visits in the last 3 visits
  const visitsWithWeight = visits.filter(
    (v) => v.weight_kg !== null && v.weight_kg !== undefined && !isNaN(v.weight_kg) && v.weight_kg > 0
  );

  if (visitsWithWeight.length >= 2) {
    const recentWeightVisits = visitsWithWeight.slice(-3);
    for (let i = recentWeightVisits.length - 1; i >= 1; i--) {
      const current = recentWeightVisits[i].weight_kg!;
      const prev = recentWeightVisits[i - 1].weight_kg!;
      if (prev > current) {
        const dropPercent = ((prev - current) / prev) * 100;
        if (dropPercent > CLINICAL_CONFIG.weight.dropPercentageThreshold) {
          signals.push({
            code: 'WEIGHT_DROP',
            points: CLINICAL_CONFIG.points.WEIGHT_DROP,
            label: 'Rapid Weight Drop',
            labelHi: 'वजन में तीव्र गिरावट',
            facts: {
              prevWeight: prev,
              currentWeight: current,
              percentDrop: Number(dropPercent.toFixed(1)),
              datePrev: recentWeightVisits[i - 1].date,
              dateCurrent: recentWeightVisits[i].date,
            },
            description: `Weight fell by ${dropPercent.toFixed(1)}% (${prev} -> ${current} kg) between visits.`,
          });
          break; // Don't duplicate weight drop signal
        }
      }
    }
  }

  // --- Follow-up Signals ---
  // 6. FOLLOWUP_OVERDUE (+2) or FOLLOWUP_LONG_OVERDUE (+3)
  // 7. TEST_MISSED (+2)
  let maxOverdueDays = 0;
  let hasLongOverdue = false;
  let hasStandardOverdue = false;
  let missedTestRecorded = false;

  const openFollowups = patient.followups.filter((f) => f.status === 'open');

  for (const item of openFollowups) {
    // If due_date < todayDate, it is overdue
    if (item.due_date < todayDate) {
      const daysOverdue = dateDiffDays(todayDate, item.due_date);
      if (daysOverdue > maxOverdueDays) {
        maxOverdueDays = daysOverdue;
      }

      if (item.kind === 'test' && !missedTestRecorded) {
        missedTestRecorded = true;
        signals.push({
          code: 'TEST_MISSED',
          points: CLINICAL_CONFIG.points.TEST_MISSED,
          label: 'Missed Test Result',
          labelHi: 'जांच परिणाम अप्राप्त',
          facts: {
            testName: item.description,
            dueDate: item.due_date,
            daysOverdue,
          },
          description: `Ordered test (${item.description}) due on ${item.due_date} has no result recorded (${daysOverdue} days past due).`,
        });
      }

      if (daysOverdue > CLINICAL_CONFIG.followup.longOverdueDays) {
        hasLongOverdue = true;
      } else if (daysOverdue > 0) {
        hasStandardOverdue = true;
      }
    }
  }

  // Also check if any visit had tests_ordered that are overdue and not marked done
  if (!missedTestRecorded) {
    for (const v of visits) {
      for (const t of v.tests_ordered || []) {
        if (t.due_in_days !== null && t.due_in_days !== undefined) {
          const expectedDueDate = new Date(Date.parse(v.date) + t.due_in_days * 86400000)
            .toISOString()
            .slice(0, 10);
          if (expectedDueDate < todayDate) {
            // Check if test was resolved in followups list or later visit
            const matchingFollowup = patient.followups.find(
              (f) => f.kind === 'test' && f.description.toLowerCase().includes(t.name.toLowerCase())
            );
            if (!matchingFollowup || matchingFollowup.status === 'open') {
              missedTestRecorded = true;
              const daysOverdue = dateDiffDays(todayDate, expectedDueDate);
              signals.push({
                code: 'TEST_MISSED',
                points: CLINICAL_CONFIG.points.TEST_MISSED,
                label: 'Missed Test Result',
                labelHi: 'जांच परिणाम अप्राप्त',
                facts: {
                  testName: t.name,
                  dueDate: expectedDueDate,
                  daysOverdue,
                },
                description: `Test (${t.name}) ordered on ${v.date} has no recorded result (${daysOverdue} days past due).`,
              });
              break;
            }
          }
        }
      }
      if (missedTestRecorded) break;
    }
  }

  // Emit follow-up signal: long overdue takes precedence over standard overdue
  if (hasLongOverdue) {
    signals.push({
      code: 'FOLLOWUP_LONG_OVERDUE',
      points: CLINICAL_CONFIG.points.FOLLOWUP_LONG_OVERDUE,
      label: 'Follow-up Severely Overdue',
      labelHi: 'फॉलो-अप गंभीर रूप से विलंबित',
      facts: {
        daysOverdue: maxOverdueDays,
        threshold: CLINICAL_CONFIG.followup.longOverdueDays,
      },
      description: `Follow-up is severely overdue by ${maxOverdueDays} days (> ${CLINICAL_CONFIG.followup.longOverdueDays} days).`,
    });
  } else if (hasStandardOverdue) {
    signals.push({
      code: 'FOLLOWUP_OVERDUE',
      points: CLINICAL_CONFIG.points.FOLLOWUP_OVERDUE,
      label: 'Follow-up Overdue',
      labelHi: 'फॉलो-अप विलंबित',
      facts: {
        daysOverdue: maxOverdueDays,
      },
      description: `Follow-up is overdue by ${maxOverdueDays} days.`,
    });
  }

  // --- Calculate Level and Total Score ---
  const totalScore = signals.reduce((acc, s) => acc + s.points, 0);

  const worseningSignals: SignalCode[] = [
    'BP_TREND',
    'BP_HIGH',
    'SUGAR_TREND',
    'SUGAR_HIGH',
    'WEIGHT_DROP',
  ];
  const missedSignals: SignalCode[] = [
    'FOLLOWUP_OVERDUE',
    'FOLLOWUP_LONG_OVERDUE',
    'TEST_MISSED',
  ];

  const hasWorsening = signals.some((s) => worseningSignals.includes(s.code));
  const hasMissed = signals.some((s) => missedSignals.includes(s.code));

  let level: FlagLevel = 'GREEN';

  // RED: (any worsening AND any missed) OR FOLLOWUP_LONG_OVERDUE alone OR total score >= 5
  if ((hasWorsening && hasMissed) || hasLongOverdue || totalScore >= CLINICAL_CONFIG.redScoreThreshold) {
    level = 'RED';
  } else if (signals.length > 0) {
    level = 'ORANGE';
  } else {
    level = 'GREEN';
  }

  const templateReason = buildTemplateReasonEn(level, signals, sugarTypeUnclear);
  const templateReasonHi = buildTemplateReasonHi(level, signals, sugarTypeUnclear);

  return {
    level,
    score: totalScore,
    signals,
    templateReason,
    templateReasonHi,
    reasonSource: 'rule',
    evaluatedAt: todayDate,
    overdueDaysMax: maxOverdueDays,
  };
}
