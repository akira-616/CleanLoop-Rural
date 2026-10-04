/**
 * Clinical safety guard and banned phrase validator for Gemini-generated explanations.
 * Enforces strict boundaries: decision support only, never diagnoses or prescribes.
 */

import { PatientFlag } from '../domain/types';

export const BANNED_PATTERNS = [
  /has diabetes/i,
  /has hypertension/i,
  /diagnos/i,
  /you should take/i,
  /prescribe/i,
  /increase the dose/i,
  /start\s+/i,
  /stop taking/i,
  /treat/i,
  /उपचार करें/i,
  /दवा शुरू करें/i,
  /मधुमेह का निदान/i,
  /उच्च रक्तचाप का निदान/i,
];

export const REQUIRED_EN_PHRASE = 'Doctor review recommended';
export const REQUIRED_HI_PHRASE = 'डॉक्टर द्वारा समीक्षा की सलाह दी जाती है';

/**
 * Extracts all numbers from text
 */
function extractNumbers(text: string): number[] {
  const matches = text.match(/\b\d+(\.\d+)?\b/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Extracts all allowed numbers from input facts and template reason
 */
function extractAllowedNumbers(flag: PatientFlag): Set<number> {
  const allowed = new Set<number>();

  // Extract from signals
  for (const s of flag.signals) {
    if (s.facts) {
      for (const val of Object.values(s.facts)) {
        if (typeof val === 'number') {
          allowed.add(val);
          // Also allow floor/ceil if decimal
          allowed.add(Math.floor(val));
          allowed.add(Math.ceil(val));
        } else if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'number') allowed.add(item);
          }
        }
      }
    }
  }

  // Also include any numbers from templateReason (e.g. 2 weeks, 3 visits)
  for (const n of extractNumbers(flag.templateReason)) {
    allowed.add(n);
  }
  for (const n of extractNumbers(flag.templateReasonHi)) {
    allowed.add(n);
  }

  // Allow standard small numbers like 2, 3 (for visits, weeks)
  allowed.add(2);
  allowed.add(3);
  allowed.add(14);
  allowed.add(2026); // year

  return allowed;
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  sanitizedText?: string;
}

/**
 * Validates AI explanation against safety rules
 */
export function validateAiExplanation(
  aiText: string,
  flag: PatientFlag,
  lang: 'en' | 'hi'
): ValidationResult {
  if (!aiText || typeof aiText !== 'string' || aiText.trim().length === 0) {
    return { isValid: false, reason: 'Empty response' };
  }

  const trimmed = aiText.trim();

  // 1. Check banned phrases
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        reason: `Violates banned phrase policy: matched ${pattern.source}`,
      };
    }
  }

  // 2. Check required review-recommended phrase
  if (lang === 'en') {
    const hasEnReview =
      trimmed.toLowerCase().includes('doctor review recommended') ||
      trimmed.toLowerCase().includes('review recommended');
    if (!hasEnReview) {
      return {
        isValid: false,
        reason: 'Missing mandatory closing phrase: "Doctor review recommended"',
      };
    }
  } else {
    const hasHiReview =
      trimmed.includes('समीक्षा की सलाह') ||
      trimmed.includes('डॉक्टर द्वारा समीक्षा');
    if (!hasHiReview) {
      return {
        isValid: false,
        reason: 'Missing mandatory closing phrase in Hindi',
      };
    }
  }

  // 3. Verify numbers in AI output are grounded in input facts
  const allowedNumbers = extractAllowedNumbers(flag);
  const aiNumbers = extractNumbers(trimmed);

  for (const n of aiNumbers) {
    if (!allowedNumbers.has(n)) {
      return {
        isValid: false,
        reason: `Hallucinated or ungrounded number detected: ${n}`,
      };
    }
  }

  return {
    isValid: true,
    reason: 'Passed all clinical safety checks',
    sanitizedText: trimmed,
  };
}

// In-memory cache for validated AI reasons
const reasonCache = new Map<string, string>();

export function getCachedAiReason(patientId: string, flagHash: string, lang: 'en' | 'hi'): string | undefined {
  return reasonCache.get(`${patientId}_${flagHash}_${lang}`);
}

export function setCachedAiReason(
  patientId: string,
  flagHash: string,
  lang: 'en' | 'hi',
  reason: string
): void {
  reasonCache.set(`${patientId}_${flagHash}_${lang}`, reason);
}
