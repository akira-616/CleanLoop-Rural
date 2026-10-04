/**
 * Frontend Gemini service
 * Communicates with backend endpoints (/api/gemini/*) and runs safety guards.
 * Honors offline mode and provides safe fallbacks.
 */

import { ExtractedNoteData, PatientFlag, SampleNote } from '../domain/types';
import { validateAiExplanation, getCachedAiReason, setCachedAiReason } from './safety';
import { SAMPLE_NOTES } from './sampleNotes';

/**
 * Parses free text clinical note locally as intelligent fallback
 */
export function parseNoteTextLocally(text: string): ExtractedNoteData {
  // Convert Hindi numerals to western digits
  const devanagariMap: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  const normalizedText = text.replace(/[०-९]/g, (ch) => devanagariMap[ch] || ch);

  // 1. Visit Date
  const dateMatch = normalizedText.match(/\b(202\d-[01]\d-[0-3]\d)\b/);
  const visitDate = dateMatch ? dateMatch[1] : null;

  // 2. Blood Pressure
  let bp: { systolic: number; diastolic: number } | null = null;
  let bpConfidence: 'low' | 'medium' | 'high' = 'low';

  const bpMatch = normalizedText.match(/(?:BP|रक्तचाप|Blood Pressure)?:?\s*(\d{2,3}|\?)\s*[\/\\]\s*(\d{2,3})/i);
  if (bpMatch) {
    if (bpMatch[1] === '?' || bpMatch[1].includes('?')) {
      bp = null;
      bpConfidence = 'low';
    } else {
      const sys = parseInt(bpMatch[1], 10);
      const dia = parseInt(bpMatch[2], 10);
      if (!isNaN(sys) && !isNaN(dia)) {
        bp = { systolic: sys, diastolic: dia };
        bpConfidence = 'high';
      }
    }
  }

  // 3. Sugar
  let sugar: { value: number; unit: 'mg/dL'; type: 'fasting' | 'random' | 'post-meal' | 'unknown' } | null = null;
  let sugarConfidence: 'low' | 'medium' | 'high' = 'low';

  const sugarMatch = normalizedText.match(/(?:Sugar|शर्करा|Glucose|Fasting Sugar|ब्लड शुगर)?:?\s*(\d{2,3})\s*(?:mg\/dL)?/i);
  if (sugarMatch) {
    const val = parseInt(sugarMatch[1], 10);
    if (!isNaN(val)) {
      const lower = normalizedText.toLowerCase();
      let type: 'fasting' | 'random' | 'post-meal' | 'unknown' = 'unknown';

      if (lower.includes('fasting') || lower.includes('खाली पेट') || lower.includes('fbs')) {
        type = 'fasting';
        sugarConfidence = 'high';
      } else if (lower.includes('post-meal') || lower.includes('ppbs') || lower.includes('भोजनोपरांत')) {
        type = 'post-meal';
        sugarConfidence = 'high';
      } else if (lower.includes('random') || lower.includes('rbs')) {
        type = 'random';
        sugarConfidence = 'high';
      } else {
        type = 'unknown';
        sugarConfidence = 'low'; // Unclear type
      }

      sugar = { value: val, unit: 'mg/dL', type };
    }
  }

  // 4. Weight
  let weight: number | null = null;
  const weightMatch = normalizedText.match(/(?:Weight|वजन|Wt)?:?\s*(\d{2,3}(?:\.\d+)?)\s*(?:kg|किग्रा)?/i);
  if (weightMatch) {
    const w = parseFloat(weightMatch[1]);
    if (!isNaN(w) && w >= 30 && w <= 200) {
      weight = w;
    }
  }

  // 5. Medicines
  const medicines: Array<{ name: string; dose: string | null; frequency: string | null; change: any }> = [];
  const lines = normalizedText.split('\n');
  const commonMedNames = ['Amlodipine', 'Metformin', 'Telmisartan', 'Glimepiride', 'Atorvastatin', 'Enalapril', 'एम्लोडिपिन', 'मेटफॉर्मिन'];

  for (const line of lines) {
    for (const med of commonMedNames) {
      if (line.toLowerCase().includes(med.toLowerCase())) {
        const doseMatch = line.match(/(\d+\s*(?:mg|मिग्रा))/i);
        const freqMatch = line.match(/\b(OD|BD|TDS|HS|daily)\b/i);
        let change: any = 'continued';
        if (line.toLowerCase().includes('start') || line.toLowerCase().includes('शुरू')) change = 'started';
        else if (line.toLowerCase().includes('increase') || line.toLowerCase().includes('बढ़ा')) change = 'increased';

        medicines.push({
          name: med,
          dose: doseMatch ? doseMatch[1] : null,
          frequency: freqMatch ? freqMatch[1].toUpperCase() : 'OD',
          change,
        });
        break;
      }
    }
  }

  // 6. Planned Follow-up
  let followup: { what: string; when_text: string | null; due_in_days: number | null; absolute_date: string | null } | null = null;
  for (const line of lines) {
    if (line.includes('Review') || line.includes('हफ्ते') || line.includes('week') || line.includes('Return') || line.includes('समीक्षा')) {
      followup = {
        what: line.trim().slice(0, 40),
        when_text: line.includes('week') ? 'in 4 weeks' : line.includes('हफ्ते') ? '2 हफ्ते बाद' : 'in 2 weeks',
        due_in_days: line.includes('4') ? 28 : 14,
        absolute_date: null,
      };
      break;
    }
  }

  // 7. Referral
  let referral: { to: string; reason: string | null; when_text: string | null } | null = null;
  for (const line of lines) {
    if (line.toLowerCase().includes('refer') || line.includes('रेफर')) {
      referral = {
        to: line.includes('CHC') ? 'CHC Rampur' : line.includes('PHC') ? 'PHC Sonpur' : 'District Hospital',
        reason: 'Clinical evaluation',
        when_text: 'Urgent',
      };
      break;
    }
  }

  return {
    visit_date: { value: visitDate, confidence: visitDate ? 'high' : 'low' },
    blood_pressure: { value: bp, confidence: bpConfidence },
    blood_sugar: { value: sugar, confidence: sugarConfidence },
    weight_kg: { value: weight, confidence: weight ? 'high' : 'low' },
    medicines: { value: medicines.length > 0 ? medicines : null, confidence: medicines.length > 0 ? 'high' : 'medium' },
    tests_ordered: { value: [], confidence: 'high' },
    planned_followup: { value: followup, confidence: followup ? 'high' : 'low' },
    referral: { value: referral, confidence: referral ? 'high' : 'high' },
    rawNotesSnippet: text.slice(0, 150),
  };
}

/**
 * 5a. extractNote: Multimodal note extraction with per-field confidence
 */
export async function extractNote(
  imageBase64?: string,
  mimeType: string = 'image/png',
  visitDateHint?: string,
  sampleNoteHint?: SampleNote,
  noteText?: string
): Promise<{ data: ExtractedNoteData; source: 'gemini' | 'offline_fallback' }> {
  try {
    const res = await fetch('/api/gemini/extract-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        noteText,
        visitDateHint,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return { data: json.data, source: 'gemini' };
      }
    }
  } catch (err) {
    console.warn('Backend Gemini call failed or offline, checking local sample ground truth fallback:', err);
  }

  // If custom note text was typed or transcribed, parse locally
  if (noteText && noteText.trim().length > 0) {
    const parsed = parseNoteTextLocally(noteText);
    return { data: parsed, source: 'offline_fallback' };
  }

  // Graceful offline fallback: if this matches a sample note, build ExtractedNoteData with realistic confidences
  if (sampleNoteHint) {
    const gt = sampleNoteHint.groundTruth;
    const isSmudged = sampleNoteHint.id === 'sn-3';
    const isUnclearSugar = sampleNoteHint.id === 'sn-6';

    const fallbackData: ExtractedNoteData = {
      visit_date: {
        value: gt.visit_date,
        confidence: gt.visit_date ? 'high' : 'low',
      },
      blood_pressure: {
        value: gt.blood_pressure,
        confidence: isSmudged ? 'low' : gt.blood_pressure ? 'high' : 'low',
      },
      blood_sugar: {
        value: gt.blood_sugar,
        confidence: isUnclearSugar ? 'low' : gt.blood_sugar ? 'high' : 'low',
      },
      weight_kg: {
        value: gt.weight_kg,
        confidence: gt.weight_kg ? 'high' : 'low',
      },
      medicines: {
        value: gt.medicines,
        confidence: gt.medicines ? 'high' : 'low',
      },
      tests_ordered: {
        value: gt.tests_ordered,
        confidence: gt.tests_ordered && gt.tests_ordered.length > 0 ? 'medium' : 'high',
      },
      planned_followup: {
        value: gt.planned_followup,
        confidence: gt.planned_followup ? 'high' : 'low',
      },
      referral: {
        value: gt.referral,
        confidence: gt.referral ? 'high' : 'high',
      },
      rawNotesSnippet: sampleNoteHint.canvasText.slice(0, 150),
    };

    return { data: fallbackData, source: 'offline_fallback' };
  }

  // Blank default extraction template
  return {
    data: {
      visit_date: { value: null, confidence: 'low' },
      blood_pressure: { value: null, confidence: 'low' },
      blood_sugar: { value: null, confidence: 'low' },
      weight_kg: { value: null, confidence: 'low' },
      medicines: { value: null, confidence: 'low' },
      tests_ordered: { value: null, confidence: 'low' },
      planned_followup: { value: null, confidence: 'low' },
      referral: { value: null, confidence: 'low' },
    },
    source: 'offline_fallback',
  };
}

/**
 * 5b. explainFlag: Re-words deterministic clinical flag into natural language.
 * Always guards output using safety.ts and falls back to template reason.
 */
export async function explainFlag(
  patientId: string,
  flag: PatientFlag,
  lang: 'en' | 'hi',
  isOnline: boolean
): Promise<{ text: string; source: 'ai' | 'rule' }> {
  // If green or no signals, return template directly
  if (flag.level === 'GREEN' || flag.signals.length === 0) {
    return {
      text: lang === 'hi' ? flag.templateReasonHi : flag.templateReason,
      source: 'rule',
    };
  }

  const defaultTemplate = lang === 'hi' ? flag.templateReasonHi : flag.templateReason;

  // If offline, always use pure rule-based template
  if (!isOnline) {
    return { text: defaultTemplate, source: 'rule' };
  }

  // Check in-memory cache
  const flagHash = `${flag.level}_${flag.score}_${flag.signals.map((s) => s.code).join('-')}`;
  const cached = getCachedAiReason(patientId, flagHash, lang);
  if (cached) {
    return { text: cached, source: 'ai' };
  }

  try {
    const res = await fetch('/api/gemini/explain-flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flagFacts: {
          level: flag.level,
          score: flag.score,
          signals: flag.signals.map((s) => ({
            code: s.code,
            facts: s.facts,
            points: s.points,
          })),
        },
        language: lang,
        templateReason: defaultTemplate,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const rawAiText = json.explanation;

      // Run clinical safety guard
      const validation = validateAiExplanation(rawAiText, flag, lang);
      if (validation.isValid && validation.sanitizedText) {
        setCachedAiReason(patientId, flagHash, lang, validation.sanitizedText);
        return { text: validation.sanitizedText, source: 'ai' };
      } else {
        console.warn('AI explanation rejected by safety guard:', validation.reason);
      }
    }
  } catch (e) {
    console.warn('Gemini explain-flag network error, falling back to template:', e);
  }

  return { text: defaultTemplate, source: 'rule' };
}
