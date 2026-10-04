/**
 * Patient priority calculation and sorting for Village Dashboard
 */

import { Patient, FlagLevel } from './types';

const LEVEL_RANK: Record<FlagLevel, number> = {
  RED: 3,
  ORANGE: 2,
  GREEN: 1,
};

/**
 * Sorts patients by priority:
 * 1. Flag level (RED > ORANGE > GREEN)
 * 2. Priority score (descending)
 * 3. Days overdue (descending)
 * 4. Name (alphabetical)
 */
export function sortPatientsByPriority(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const rankA = LEVEL_RANK[a.current_flag.level];
    const rankB = LEVEL_RANK[b.current_flag.level];
    if (rankB !== rankA) {
      return rankB - rankA;
    }

    if (b.current_flag.score !== a.current_flag.score) {
      return b.current_flag.score - a.current_flag.score;
    }

    if (b.current_flag.overdueDaysMax !== a.current_flag.overdueDaysMax) {
      return b.current_flag.overdueDaysMax - a.current_flag.overdueDaysMax;
    }

    return a.name.localeCompare(b.name);
  });
}
