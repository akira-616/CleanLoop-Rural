/**
 * Deterministic template reasons for patient flags in English and Hindi
 * Used directly when offline or if AI-generated text fails safety verification.
 */

import { SignalFact, FlagLevel } from './types';

export function buildTemplateReasonEn(
  level: FlagLevel,
  signals: SignalFact[],
  sugarTypeUnclear: boolean = false
): string {
  if (level === 'GREEN' || signals.length === 0) {
    return 'Vitals stable across visits and follow-ups on schedule. Routine checkup recommended.';
  }

  const parts: string[] = [];

  for (const s of signals) {
    if (s.code === 'BP_TREND') {
      const vals = s.facts.systolicValues?.join(', ');
      parts.push(`Systolic BP rose over the last 3 visits (${vals || ''})`);
    } else if (s.code === 'BP_HIGH') {
      parts.push(`Latest BP high (${s.facts.systolic}/${s.facts.diastolic} mmHg)`);
    } else if (s.code === 'SUGAR_TREND') {
      const vals = s.facts.sugarValues?.join(', ');
      parts.push(`Fasting blood sugar rose across 3 readings (${vals || ''} mg/dL)`);
    } else if (s.code === 'SUGAR_HIGH') {
      parts.push(`Latest fasting sugar high (${s.facts.value} mg/dL)`);
    } else if (s.code === 'WEIGHT_DROP') {
      parts.push(`Weight fell by ${s.facts.percentDrop}% (${s.facts.prevWeight} to ${s.facts.currentWeight} kg)`);
    } else if (s.code === 'FOLLOWUP_LONG_OVERDUE') {
      parts.push(`Follow-up overdue by ${s.facts.daysOverdue} days`);
    } else if (s.code === 'FOLLOWUP_OVERDUE') {
      parts.push(`Follow-up overdue by ${s.facts.daysOverdue} days`);
    } else if (s.code === 'TEST_MISSED') {
      parts.push(`Ordered test (${s.facts.testName || 'test'}) result not recorded`);
    }
  }

  if (sugarTypeUnclear) {
    parts.push('Note: sugar type unclear');
  }

  const prefix = level === 'RED' ? 'Possible clinical worsening: ' : 'Attention needed: ';
  return `${prefix}${parts.join('. ')}. Doctor review recommended.`;
}

export function buildTemplateReasonHi(
  level: FlagLevel,
  signals: SignalFact[],
  sugarTypeUnclear: boolean = false
): string {
  if (level === 'GREEN' || signals.length === 0) {
    return 'सभी महत्वपूर्ण संकेत स्थिर हैं और फॉलो-अप समय पर हैं। नियमित जांच की सलाह दी जाती है।';
  }

  const parts: string[] = [];

  for (const s of signals) {
    if (s.code === 'BP_TREND') {
      const vals = s.facts.systolicValues?.join(', ');
      parts.push(`पिछले 3 दौरों में सिस्टोलिक बीपी में लगातार वृद्धि (${vals || ''})`);
    } else if (s.code === 'BP_HIGH') {
      parts.push(`नवीनतम बीपी अधिक (${s.facts.systolic}/${s.facts.diastolic} mmHg)`);
    } else if (s.code === 'SUGAR_TREND') {
      const vals = s.facts.sugarValues?.join(', ');
      parts.push(`फास्टिंग ब्लड शुगर 3 जांचों में बढ़ा (${vals || ''} mg/dL)`);
    } else if (s.code === 'SUGAR_HIGH') {
      parts.push(`नवीनतम फास्टिंग शुगर अधिक (${s.facts.value} mg/dL)`);
    } else if (s.code === 'WEIGHT_DROP') {
      parts.push(`वजन में ${s.facts.percentDrop}% की गिरावट (${s.facts.prevWeight} से ${s.facts.currentWeight} किग्रा)`);
    } else if (s.code === 'FOLLOWUP_LONG_OVERDUE') {
      parts.push(`फॉलो-अप ${s.facts.daysOverdue} दिन से अधिक विलंबित है`);
    } else if (s.code === 'FOLLOWUP_OVERDUE') {
      parts.push(`फॉलो-अप ${s.facts.daysOverdue} दिन विलंबित है`);
    } else if (s.code === 'TEST_MISSED') {
      parts.push(`जांच (${s.facts.testName || 'जांच'}) का परिणाम दर्ज नहीं है`);
    }
  }

  if (sugarTypeUnclear) {
    parts.push('सूचना: रक्त शर्करा का प्रकार अस्पष्ट');
  }

  const prefix = level === 'RED' ? 'संभावित स्वास्थ्य गिरावट: ' : 'ध्यान देने योग्य: ';
  return `${prefix}${parts.join('। ')}। डॉक्टर द्वारा समीक्षा की सलाह दी जाती है।`;
}
