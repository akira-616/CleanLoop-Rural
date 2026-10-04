/**
 * Follow-up tracking and completion logic
 */

import { FollowupItem, VisitRecord, FollowupKind } from './types';
import { CLINICAL_CONFIG } from './config';

/**
 * Add days to YYYY-MM-DD string safely in UTC
 */
export function addDaysToDate(dateStr: string, days: number): string {
  try {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

/**
 * Difference in days between two YYYY-MM-DD dates (target - base)
 */
export function dateDiffDays(targetStr: string, baseStr: string): number {
  try {
    const p1 = targetStr.split('-').map(Number);
    const p2 = baseStr.split('-').map(Number);
    const d1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
    const d2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Parses when-text into days offset if due_in_days is not directly given
 */
export function parseWhenTextToDays(whenText: string | null): number {
  if (!whenText) return 14; // default 2 weeks in rural clinic workflow
  const text = whenText.toLowerCase().trim();

  // Hindi and Hinglish patterns
  if (text.includes('हफ्ते') || text.includes('हफ्ता') || text.includes('hafta') || text.includes('hafte') || text.includes('week')) {
    const match = text.match(/(\d+|एक|दो|तीन|चार|one|two|three|four)/i);
    if (match) {
      const numMap: Record<string, number> = {
        '१': 1, '२': 2, '३': 3, '४': 4,
        'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4,
        'one': 1, 'two': 2, 'three': 3, 'four': 4,
      };
      const n = numMap[match[1]] ?? parseInt(match[1], 10);
      if (!isNaN(n)) return n * 7;
    }
  }

  if (text.includes('महीने') || text.includes('महीना') || text.includes('mahina') || text.includes('month')) {
    const match = text.match(/(\d+|एक|दो|three|one|two)/i);
    const numMap: Record<string, number> = { '१': 1, '२': 2, 'एक': 1, 'दो': 2, 'one': 1, 'two': 2 };
    const n = match ? (numMap[match[1]] ?? parseInt(match[1], 10)) : 1;
    return isNaN(n) ? 30 : n * 30;
  }

  if (text.includes('दिन') || text.includes('din') || text.includes('day')) {
    const match = text.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }

  const num = parseInt(text.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num > 0) {
    if (num <= 12) return num * 7; // assume weeks if small number
    return num;
  }

  return 14;
}

/**
 * Recomputes follow-up statuses across a patient's visits.
 * Follow-up items marked done manually by doctor remain done.
 * Auto-completion rules:
 * - kind "visit": auto-done if any later visit exists dated on or after (due_date - 7 days).
 * - kind "test": auto-done if a later visit contains that test's result on or after planned_on, or doctor marks it done.
 * - kind "referral": done only when doctor marks it done.
 */
export function evaluateFollowups(
  existingFollowups: FollowupItem[],
  visits: VisitRecord[]
): FollowupItem[] {
  // Sort visits chronologically
  const sortedVisits = [...visits].sort((a, b) => a.date.localeCompare(b.date));

  return existingFollowups.map((item) => {
    // If doctor explicitly marked it done manually, preserve it
    if (item.status === 'done' && item.completed_reason === 'Doctor manual completion') {
      return item;
    }

    if (item.kind === 'visit') {
      const windowStart = addDaysToDate(item.due_date, -CLINICAL_CONFIG.followup.visitAutoResolveDays);
      const resolvingVisit = sortedVisits.find(
        (v) => v.date > item.planned_on && v.date >= windowStart
      );

      if (resolvingVisit) {
        return {
          ...item,
          status: 'done',
          completed_on: resolvingVisit.date,
          completed_reason: `Completed by clinic visit on ${resolvingVisit.date}`,
        };
      }
    } else if (item.kind === 'test') {
      // Check if test was resolved in later visits
      const descLower = item.description.toLowerCase();
      const isSugarTest =
        descLower.includes('sugar') || descLower.includes('glucose') || descLower.includes('hba1c') || descLower.includes('रक्त शर्करा');

      const isBpCheck =
        descLower.includes('bp') || descLower.includes('blood pressure') || descLower.includes('रक्तचाप');

      const resolvingVisit = sortedVisits.find((v) => {
        if (v.date <= item.planned_on) return false;
        if (isSugarTest && v.sugar?.value !== null && v.sugar?.value !== undefined) {
          return true;
        }
        if (isBpCheck && v.bp?.systolic !== null && v.bp?.systolic !== undefined) {
          return true;
        }
        return false;
      });

      if (resolvingVisit) {
        return {
          ...item,
          status: 'done',
          completed_on: resolvingVisit.date,
          completed_reason: `Resolved by test result recorded on ${resolvingVisit.date}`,
        };
      }
    }

    // Referral remains open until doctor marks done
    return item;
  });
}
