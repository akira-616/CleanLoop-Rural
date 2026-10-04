/**
 * In-App Runtime Sample Clinic Notes Generator with Canvas Rendering
 * Generates 10 realistic clinic notes (English, Hindi, Hinglish, handwritten, typed,
 * smudged, relative dates, referrals, Hindi numerals) with complete ground truth.
 */

import { SampleNote } from '../domain/types';

export const SAMPLE_NOTES: SampleNote[] = [
  // Note 1: Standard English clinic note for P106 Abdul Rahim (New Visit Oct 2026)
  {
    id: 'sn-1',
    title: 'Note 1: Abdul Rahim - Follow-up Check (P106)',
    patient_id_hint: 'P106',
    patient_name_hint: 'Abdul Rahim',
    style: 'handwritten',
    language: 'English',
    canvasText: `RURAL SUB-CENTRE RAMPUR
Dr. A. K. Verma, MBBS | Date: 2026-10-02
Pt: Abdul Rahim (66/M) | ID: P106

BP: 142/88 mmHg
Fasting Sugar: 184 mg/dL
Weight: 64.5 kg

Rx:
- Tab Metformin 500mg BD (continued)
- Tab Glimepiride 1mg OD (started)

Adv:
- Fasting sugar repeat in 2 weeks
- Review in 4 weeks
Signed: Dr. Verma`,
    description: 'October visit for P106 showing fasting sugar worsening to 184 mg/dL and new medication started.',
    groundTruth: {
      visit_date: '2026-10-02',
      blood_pressure: { systolic: 142, diastolic: 88 },
      blood_sugar: { value: 184, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 64.5,
      medicines: [
        { name: 'Metformin', dose: '500 mg', frequency: 'BD', change: 'continued' },
        { name: 'Glimepiride', dose: '1 mg', frequency: 'OD', change: 'started' },
      ],
      tests_ordered: [{ name: 'Fasting sugar repeat', when_text: 'in 2 weeks', due_in_days: 14 }],
      planned_followup: { what: 'Review', when_text: 'in 4 weeks', due_in_days: 28, absolute_date: '2026-10-30' },
      referral: null,
    },
  },

  // Note 2: Hindi/Hinglish with relative follow-up "2 हफ्ते बाद" (Sunita Devi P101)
  {
    id: 'sn-2',
    title: 'Note 2: Sunita Devi - Routine (P101) [Hindi/Hinglish]',
    patient_id_hint: 'P101',
    patient_name_hint: 'Sunita Devi',
    style: 'handwritten',
    language: 'Hindi',
    canvasText: `प्राथमिक स्वास्थ्य उप-केंद्र (PHC Sonpur)
दिनांक / Date: 2026-09-28
मरीज: Sunita Devi, 54 F, Rampur

रक्तचाप (BP): 132/84 mmHg
ब्लड शुगर: 122 mg/dL (सुबह खाली पेट / fasting)
वजन / Wt: 61.5 kg

दवाएं (Medicines):
1. Amlodipine 5mg OD - जारी रखें (continued)
2. Metformin 500mg BD - जारी रखें (continued)

परामर्श:
- 2 हफ्ते बाद (after 2 weeks) बीपी जांच करवाएं
- नियमित रूप से दवा लें
डॉ. एस. गुप्ता`,
    description: 'Hindi note with "2 हफ्ते बाद" relative timing and explicit "सुबह खाली पेट" (fasting sugar).',
    groundTruth: {
      visit_date: '2026-09-28',
      blood_pressure: { systolic: 132, diastolic: 84 },
      blood_sugar: { value: 122, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 61.5,
      medicines: [
        { name: 'Amlodipine', dose: '5 mg', frequency: 'OD', change: 'continued' },
        { name: 'Metformin', dose: '500 mg', frequency: 'BD', change: 'continued' },
      ],
      tests_ordered: [{ name: 'BP check', when_text: '2 हफ्ते बाद', due_in_days: 14 }],
      planned_followup: { what: 'बीपी जांच', when_text: '2 हफ्ते बाद', due_in_days: 14, absolute_date: '2026-10-12' },
      referral: null,
    },
  },

  // Note 3: Smudged / unclear BP value ("1?0/90") -> BP Systolic must be extracted as NULL
  {
    id: 'sn-3',
    title: 'Note 3: Smudged BP Note (Unclear Value Test)',
    patient_id_hint: 'P102',
    patient_name_hint: 'Ramesh Yadav',
    style: 'handwritten',
    language: 'English',
    canvasText: `HEALTH WELLNESS SUB-CENTRE
Date: 2026-09-25 | Pt: Ramesh Yadav (61/M)

BP: 1?0/90 mmHg  [ink smudged / unreadable systolic]
Sugar: 128 mg/dL (fasting)
Weight: 71 kg

Meds:
- Telmisartan 40mg OD (continued)

Plan:
- Re-check BP carefully at next camp
- Review in 4 weeks
Signed: Medical Officer`,
    description: 'Deliberately smudged systolic BP ("1?0/90"). Correct extraction: systolic must be null or low confidence.',
    unclearElementNote: 'Systolic BP is unreadable/smudged, should correctly resolve to null.',
    groundTruth: {
      visit_date: '2026-09-25',
      blood_pressure: null, // Unclear/smudged -> null
      blood_sugar: { value: 128, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 71.0,
      medicines: [{ name: 'Telmisartan', dose: '40 mg', frequency: 'OD', change: 'continued' }],
      tests_ordered: [{ name: 'BP re-check', when_text: 'next camp', due_in_days: 14 }],
      planned_followup: { what: 'Review', when_text: 'in 4 weeks', due_in_days: 28, absolute_date: '2026-10-23' },
      referral: null,
    },
  },

  // Note 4: Referral note with clear destination & reason (Mohan Lal P104)
  {
    id: 'sn-4',
    title: 'Note 4: Mohan Lal - Referral to PHC/CHC (P104)',
    patient_id_hint: 'P104',
    patient_name_hint: 'Mohan Lal',
    style: 'mixed',
    language: 'English',
    canvasText: `GOVT. PRIMARY HEALTH OUTREACH
Date: 2026-08-01 | Patient: Mohan Lal (58/M)

BP: 160/100 mmHg
Fasting Sugar: 190 mg/dL
Weight: 65 kg

Medicines:
- Amlodipine 10mg OD (continued)
- Telmisartan 40mg OD (started)
- Metformin 1000mg BD (continued)

REFERRAL:
Refer to CHC Rampur / District Hospital
Reason: High BP & persistent hyperglycemia, kidney panel required.
When: Within 3-5 days.

Review in 3 weeks.
Dr. A. K. Verma`,
    description: 'Clear referral to CHC Rampur with reason and urgent review.',
    groundTruth: {
      visit_date: '2026-08-01',
      blood_pressure: { systolic: 160, diastolic: 100 },
      blood_sugar: { value: 190, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 65.0,
      medicines: [
        { name: 'Amlodipine', dose: '10 mg', frequency: 'OD', change: 'continued' },
        { name: 'Telmisartan', dose: '40 mg', frequency: 'OD', change: 'started' },
        { name: 'Metformin', dose: '1000 mg', frequency: 'BD', change: 'continued' },
      ],
      tests_ordered: [{ name: 'Kidney panel', when_text: 'Within 3-5 days', due_in_days: 5 }],
      planned_followup: { what: 'Review', when_text: 'in 3 weeks', due_in_days: 21, absolute_date: '2026-08-22' },
      referral: { to: 'CHC Rampur / District Hospital', reason: 'High BP & persistent hyperglycemia, kidney panel required', when_text: 'Within 3-5 days' },
    },
  },

  // Note 5: Hindi Numerals note (Devanagari Digits: १५०/९०, शुगर: १८०)
  {
    id: 'sn-5',
    title: 'Note 5: Hindi Numerals & Script (Geeta Kumari)',
    patient_id_hint: 'P105',
    patient_name_hint: 'Geeta Kumari',
    style: 'handwritten',
    language: 'Hindi',
    canvasText: `ग्रामीण स्वास्थ्य केंद्र सोनपुर
तारीख: २०२६-०९-०१
मरीज: गीता कुमारी | आयु: ५२ वर्ष

रक्तचाप (BP): १५६/९८ mmHg
रक्त शर्करा (Sugar): १७१ mg/dL (खाली पेट / fasting)
वजन (Weight): ६३ किग्रा

दवा:
एम्लोडिपिन १० मिग्रा (Amlodipine 10mg) OD
मेटफॉर्मिन ५०० मिग्रा BD (शुरू की / started)

सलाह:
२ हफ्ते बाद फास्टिंग शुगर टेस्ट
४ हफ्ते में पुनः समीक्षा`,
    description: 'Contains Devanagari numerals (२, ५, ८, ९) and Hindi clinical terms.',
    groundTruth: {
      visit_date: '2026-09-01',
      blood_pressure: { systolic: 156, diastolic: 98 },
      blood_sugar: { value: 171, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 63.0,
      medicines: [
        { name: 'Amlodipine', dose: '10 mg', frequency: 'OD', change: 'continued' },
        { name: 'Metformin', dose: '500 mg', frequency: 'BD', change: 'started' },
      ],
      tests_ordered: [{ name: 'फास्टिंग शुगर टेस्ट', when_text: '2 हफ्ते बाद', due_in_days: 14 }],
      planned_followup: { what: 'पुनः समीक्षा', when_text: '4 हफ्ते में', due_in_days: 28, absolute_date: '2026-09-29' },
      referral: null,
    },
  },

  // Note 6: Unclear Sugar Type (sugar: 145 mg/dL without fasting/random indication)
  {
    id: 'sn-6',
    title: 'Note 6: Unspecified Sugar Type Test (Kavita Sharma)',
    patient_id_hint: 'P103',
    patient_name_hint: 'Kavita Sharma',
    style: 'typed',
    language: 'English',
    canvasText: `COMMUNITY HEALTH CAMP - SONPUR
Date: 2026-09-14
Patient: Kavita Sharma | Age: 49 | Female

Vitals:
- BP: 141/90 mmHg
- Blood Sugar: 145 mg/dL  [meal timing not recorded on strip]
- Weight: 57.8 kg

Current Treatment:
- Metformin 500mg BD continued

Recommendations:
- Continue low-sugar diet
- Next visit in 6 weeks`,
    description: 'Sugar value 145 mg/dL without fasting/random label. Should extract type as "unknown".',
    unclearElementNote: 'Sugar meal status is missing/unspecified, type should extract as unknown.',
    groundTruth: {
      visit_date: '2026-09-14',
      blood_pressure: { systolic: 141, diastolic: 90 },
      blood_sugar: { value: 145, unit: 'mg/dL', type: 'unknown' },
      weight_kg: 57.8,
      medicines: [{ name: 'Metformin', dose: '500 mg', frequency: 'BD', change: 'continued' }],
      tests_ordered: [],
      planned_followup: { what: 'Next visit', when_text: 'in 6 weeks', due_in_days: 42, absolute_date: '2026-10-26' },
      referral: null,
    },
  },

  // Note 7: Rapid weight loss check (Anita Mishra P109)
  {
    id: 'sn-7',
    title: 'Note 7: Anita Mishra - Weight Loss Documented (P109)',
    patient_id_hint: 'P109',
    patient_name_hint: 'Anita Mishra',
    style: 'mixed',
    language: 'English',
    canvasText: `SUB-HEALTH CENTRE SONPUR
Visit Record: 2026-09-12
Name: Anita Mishra | 45 / F

BP: 124/80 mmHg
Sugar: 114 mg/dL (fasting)
Weight: 69.0 kg (Noted drop from 74kg in August)

Prescription:
- Tab Metformin 500mg OD

Clinical Plan:
- Advised adequate nutrition and water intake
- Routine follow-up in 5 weeks
Dr. Neha Rao`,
    description: 'Shows weight recorded as 69 kg with note of drop from 74 kg.',
    groundTruth: {
      visit_date: '2026-09-12',
      blood_pressure: { systolic: 124, diastolic: 80 },
      blood_sugar: { value: 114, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 69.0,
      medicines: [{ name: 'Metformin', dose: '500 mg', frequency: 'OD', change: 'continued' }],
      tests_ordered: [],
      planned_followup: { what: 'Routine follow-up', when_text: 'in 5 weeks', due_in_days: 35, absolute_date: '2026-10-17' },
      referral: null,
    },
  },

  // Note 8: Overdue return visit case (Lakshmi Bai P107)
  {
    id: 'sn-8',
    title: 'Note 8: Lakshmi Bai - Aug Plan (P107)',
    patient_id_hint: 'P107',
    patient_name_hint: 'Lakshmi Bai',
    style: 'typed',
    language: 'English',
    canvasText: `PRIMARY HEALTH CARE OUTPOST
Date: 2026-08-20
Pt: Lakshmi Bai (57/F) - Village Sonpur

Observations:
- Blood Pressure: 130/82 mmHg
- Sugar: 125 mg/dL (fasting)
- Weight: 58.5 kg

Medication:
- Amlodipine 5mg OD continued

Instructions:
- Return in 6 weeks for regular BP & sugar monitoring
- Check with ASHA if any dizziness occurs`,
    description: 'Shows August 20 visit with plan "Return in 6 weeks" (due Oct 1, 2026).',
    groundTruth: {
      visit_date: '2026-08-20',
      blood_pressure: { systolic: 130, diastolic: 82 },
      blood_sugar: { value: 125, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 58.5,
      medicines: [{ name: 'Amlodipine', dose: '5 mg', frequency: 'OD', change: 'continued' }],
      tests_ordered: [],
      planned_followup: { what: 'Return for monitoring', when_text: 'in 6 weeks', due_in_days: 42, absolute_date: '2026-10-01' },
      referral: null,
    },
  },

  // Note 9: Routine stable check (Dinesh Kumar P110)
  {
    id: 'sn-9',
    title: 'Note 9: Dinesh Kumar - Controlled Parameters (P110)',
    patient_id_hint: 'P110',
    patient_name_hint: 'Dinesh Kumar',
    style: 'mixed',
    language: 'English',
    canvasText: `RAMPUR DISPENSARY
Date: 2026-09-24
Patient: Dinesh Kumar (55 M)

BP: 125/82 mmHg
Fasting Glucose: 114 mg/dL
Weight: 65.0 kg

Medication:
- Metformin 500mg OD

Notes:
- Patient adhering well to walking routine and low sugar intake.
- Next follow-up in 7 weeks (mid-November).`,
    description: 'Clean, controlled patient check with long follow-up interval.',
    groundTruth: {
      visit_date: '2026-09-24',
      blood_pressure: { systolic: 125, diastolic: 82 },
      blood_sugar: { value: 114, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 65.0,
      medicines: [{ name: 'Metformin', dose: '500 mg', frequency: 'OD', change: 'continued' }],
      tests_ordered: [],
      planned_followup: { what: 'Next follow-up', when_text: 'in 7 weeks', due_in_days: 49, absolute_date: '2026-11-12' },
      referral: null,
    },
  },

  // Note 10: New Walk-in Patient (New Registration)
  {
    id: 'sn-10',
    title: 'Note 10: New Patient Intake - Shanti Devi',
    patient_id_hint: undefined,
    patient_name_hint: 'Shanti Devi',
    style: 'handwritten',
    language: 'Hinglish',
    canvasText: `RURAL HEALTH CAMP - RAMPUR
Date: 2026-10-01 | Pt: Shanti Devi (50/F)

Naya Mareez (New Patient)
BP: 154/96 mmHg
Sugar: 165 mg/dL (fasting)
Weight: 60.5 kg

Treatment Started:
- Tab Amlodipine 5mg OD
- Tab Metformin 500mg OD

Plan:
- Fasting sugar repeat in 2 weeks
- Review after 3 weeks`,
    description: 'New clinic registration note in Hinglish, tests ordered in 2 weeks, review in 3 weeks.',
    groundTruth: {
      visit_date: '2026-10-01',
      blood_pressure: { systolic: 154, diastolic: 96 },
      blood_sugar: { value: 165, unit: 'mg/dL', type: 'fasting' },
      weight_kg: 60.5,
      medicines: [
        { name: 'Amlodipine', dose: '5 mg', frequency: 'OD', change: 'started' },
        { name: 'Metformin', dose: '500 mg', frequency: 'OD', change: 'started' },
      ],
      tests_ordered: [{ name: 'Fasting sugar repeat', when_text: 'in 2 weeks', due_in_days: 14 }],
      planned_followup: { what: 'Review', when_text: 'after 3 weeks', due_in_days: 21, absolute_date: '2026-10-22' },
      referral: null,
    },
  },
];

/**
 * Renders a clinic note on an HTML canvas with paper texture, ruled lines, and font styling
 * Returns a base64 DataURL (image/png)
 */
export function renderNoteToCanvas(note: SampleNote): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Warm clinic prescription pad off-white / light cream
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper grain/vignette
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, 'rgba(235, 225, 210, 0.45)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  grad.addColorStop(1, 'rgba(225, 215, 200, 0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ruled lines (faint cyan/blue clinic ledger lines)
  ctx.strokeStyle = 'rgba(180, 205, 225, 0.4)';
  ctx.lineWidth = 1;
  const lineSpacing = 28;
  for (let y = 140; y < canvas.height - 40; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(canvas.width - 35, y);
    ctx.stroke();
  }

  // Red margin rule on left
  ctx.strokeStyle = 'rgba(230, 140, 140, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(65, 30);
  ctx.lineTo(65, canvas.height - 30);
  ctx.stroke();

  // Header banner / stamp
  ctx.fillStyle = '#0f766e'; // teal clinic header
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('GOVT. PRIMARY HEALTH CARE CLINIC • RURAL OUTREACH', 75, 45);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NATIONAL HEALTH MISSION • HYPERTENSION & DIABETES RECORD', 75, 62);

  // Prescription Rx symbol
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 26px serif';
  ctx.fillText('℞', 38, 125);

  // Choose font based on note style
  let fontName = 'sans-serif';
  let inkColor = '#1e293b';
  if (note.style === 'handwritten') {
    fontName = note.language === 'Hindi' ? '"Kalam", "Caveat", cursive' : '"Caveat", cursive';
    inkColor = '#1e3a8a'; // dark fountain pen blue ink
  } else if (note.style === 'mixed') {
    fontName = '"Kalam", "Plus Jakarta Sans", sans-serif';
    inkColor = '#0f172a';
  } else {
    fontName = '"Plus Jakarta Sans", sans-serif';
    inkColor = '#1f2937';
  }

  ctx.fillStyle = inkColor;

  // Split lines and render text
  const lines = note.canvasText.split('\n');
  let currentY = 135;

  for (const line of lines) {
    if (line.trim().startsWith('---') || line.trim() === '') {
      currentY += 16;
      continue;
    }

    if (line.includes('RURAL SUB-CENTRE') || line.includes('प्राथमिक स्वास्थ्य') || line.includes('COMMUNITY HEALTH')) {
      ctx.font = `bold 16px ${fontName}`;
    } else if (line.startsWith('BP:') || line.startsWith('रक्तचाप') || line.startsWith('Fasting Sugar:') || line.startsWith('ब्लड शुगर')) {
      ctx.font = `bold 18px ${fontName}`;
    } else {
      ctx.font = `17px ${fontName}`;
    }

    // If smudged note, draw ink blur/smudge over the BP line
    if (note.unclearElementNote && line.includes('1?0/90')) {
      ctx.fillText(line, 75, currentY);
      // Draw smudge over the ? area
      ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.beginPath();
      ctx.arc(108, currentY - 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = inkColor;
    } else {
      ctx.fillText(line, 75, currentY);
    }

    currentY += 28;
  }

  // Official doctor stamp in lower right
  ctx.save();
  ctx.translate(canvas.width - 145, canvas.height - 110);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 120, 60);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('SUB-CENTRE CLINIC', 8, 18);
  ctx.fillText('VERIFIED BY MO', 15, 34);
  ctx.fillText('DISTRICT HEALTH', 12, 50);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Renders custom typed or transcribed note text onto canvas prescription pad
 */
export function renderCustomTextToCanvas(
  rawText: string,
  style: 'handwritten' | 'typed' = 'handwritten'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, 'rgba(235, 225, 210, 0.45)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  grad.addColorStop(1, 'rgba(225, 215, 200, 0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ruled lines
  ctx.strokeStyle = 'rgba(180, 205, 225, 0.4)';
  ctx.lineWidth = 1;
  for (let y = 140; y < canvas.height - 40; y += 28) {
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(canvas.width - 35, y);
    ctx.stroke();
  }

  // Margin rule
  ctx.strokeStyle = 'rgba(230, 140, 140, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(65, 30);
  ctx.lineTo(65, canvas.height - 30);
  ctx.stroke();

  // Header
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('RURAL CLINIC CLINICAL NOTE • DOCTOR RECORD', 75, 45);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NATIONAL HEALTH MISSION • RECORDED CONSULTATION', 75, 62);

  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 26px serif';
  ctx.fillText('℞', 38, 125);

  const fontName =
    style === 'handwritten' ? '"Caveat", "Kalam", cursive' : '"Plus Jakarta Sans", sans-serif';
  const inkColor = style === 'handwritten' ? '#1e3a8a' : '#0f172a';

  ctx.fillStyle = inkColor;

  const lines = rawText.split('\n');
  let currentY = 135;

  for (const line of lines) {
    if (currentY > canvas.height - 80) break;
    ctx.font = `17px ${fontName}`;
    ctx.fillText(line.slice(0, 50), 75, currentY);
    currentY += 28;
  }

  // Stamp
  ctx.save();
  ctx.translate(canvas.width - 145, canvas.height - 110);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 120, 60);
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('DOCTOR RECORDED', 8, 18);
  ctx.fillText('VERIFIED CLINIC', 14, 34);
  ctx.fillText('OUTREACH POST', 16, 50);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

