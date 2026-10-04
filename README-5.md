# CareLoop Rural

**Decision support for traveling doctors in rural clinics.** CareLoop digitizes paper notes, builds a patient timeline, and flags two things: signs a patient may be getting worse, and follow-ups that were planned but never happened.

**Live demo:** https://careloop-rural.ai.studio

> **Decision support only. Not a diagnosis.** CareLoop never diagnoses or recommends treatment. It only says "doctor, please look at this patient." A human always decides.

---

## The problem

In rural India, a traveling doctor sees the same patient once every few weeks. Records are on paper. Between visits nobody can see the full history, and nobody notices when:

- a patient is slowly getting worse (BP creeping up, sugar rising), or
- a planned follow-up (a test, a return visit, a referral) never happened.

**We don't predict disease. We make sure a patient's slow decline, or a missed follow-up, doesn't go unnoticed between a traveling doctor's visits.**

## Scope

One condition only: **hypertension + diabetes follow-up.**

## Features

| Screen | What it does |
|---|---|
| **Upload** | Upload a photo or scan of a paper note (or pick a generated sample note). |
| **Review** | Gemini extracts date, BP, sugar, weight, medicines, tests, planned follow-up and referral as JSON with per-field confidence. The doctor edits and confirms. Low-confidence fields are highlighted. |
| **Patient timeline** | All visits in date order, with BP and sugar charts, open follow-ups, and the reason for any flag. |
| **Village dashboard** | Patients sorted by priority: Red / Orange / Green, each with a short plain-language reason (English / Hindi). |
| **Offline mode** | Works with no internet. Changes are saved on the device and shown as "Sync pending", then "Synced" when back online. |
| **Validation** | Reports flag precision/recall on planted synthetic cases and extraction accuracy on sample notes. |

## How it works

1. **Digitize:** Gemini (multimodal) reads the note image and returns structured JSON. Unclear values are returned as `null`, never guessed.
2. **Timeline:** All confirmed visits for a patient are stored in date order.
3. **Flag:** Simple, transparent rules check for worsening trends and missed follow-ups. Gemini only rewords the reason in plain English/Hindi.

**Flagging is rule-based, not a black-box model.** AI is used for reading notes and explaining, not for deciding.

### Example flag rules

| Signal | Example rule |
|---|---|
| BP worsening | Systolic rising across 3 consecutive visits, or latest at/above 160 (or diastolic at/above 100) |
| Sugar worsening | Fasting sugar rising across 3 visits, or latest well above target |
| Weight drop | More than 5% down between visits |
| Missed follow-up | Planned follow-up date passed with no visit or test recorded |
| Missed test | A test was ordered (e.g., "repeat test in 2 weeks") and none recorded |

**Levels:** 🔴 Red = worsening **and** missed follow-up, or follow-up long overdue · 🟠 Orange = a single worrying trend or an overdue follow-up · 🟢 Green = on track.

Each flag shows its reason, for example:
*"BP rose over the last 3 visits (140, 152, 160). Follow-up planned for 2 weeks ago, not recorded. Doctor review recommended."*

> Thresholds are **examples**. In a real deployment they would be set with clinicians using WHO/ICMR guidelines.

## Safety rules

- The app never says "the patient has X" and never recommends treatment, doses or medicine changes.
- Wording is always "possible worsening, doctor review recommended."
- Every extracted value can be edited by the doctor before it is used. Nothing feeds the flag rules until confirmed.
- AI-worded reasons pass a safety check (no new numbers, no diagnosis or treatment language). If a check fails, or the app is offline, rule-based text is shown instead.
- A "Decision support only. Not a diagnosis." disclaimer appears on every screen.

## Offline-first (and how honest we are about it)

The prototype demonstrates **local storage and a sync queue**, with an online/offline toggle for demos. Production would add encrypted storage, conflict resolution, and patient consent. If the browser blocks persistent storage in a sandboxed preview, the app falls back to in-memory state and says so in settings.

## Privacy

Patient data is kept minimal and access is intended to be limited to the treating doctor, following the principles of India's DPDP Act. The prototype has no real authentication.

## Data and validation

- **All data is synthetic.** There are about 10 fake patients with 3 to 5 visits each: some stable, some with planted worsening trends, some with planted missed follow-ups.
- Because the cases are planted, we know the right answer and can report how many the rules caught.

| Check | Result |
|---|---|
| Flag precision (needs attention vs. on track) | _fill in from the Validation screen_ |
| Flag recall | _fill in_ |
| Extraction accuracy (fields read correctly, 10 sample notes) | _fill in_ |

Small honest numbers beat big vague claims. This is a small synthetic test; real deployment needs clinical validation.

## Tech stack

- React + TypeScript + Vite, Tailwind CSS
- Recharts for charts
- Google Gemini (`@google/genai`) for note extraction and reason wording
- Local storage (IndexedDB with fallbacks) and a simulated sync queue
- Rule engine in plain TypeScript, thresholds in a single config file

## Run locally

```bash
git clone <your-repo-url>
cd careloop-rural
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
```

> The key lives client-side in this prototype. A production version would call Gemini through a backend proxy.

## Demo flow (about 2 minutes)

1. Upload a sample paper note, review the extraction, and confirm.
2. Open the patient timeline and show the BP chart.
3. Open the village dashboard and show red, orange and green patients.
4. Tap a red patient and read the reason.
5. Toggle offline, add a visit, see "Sync pending," go online, see "Synced."

## Limitations

- Runs on synthetic data only.
- Thresholds are examples, not clinical guidance.
- Handwriting extraction can be wrong, so the doctor confirms every record.
- Offline sync is simulated; no real server, auth or conflict handling.

## Future work (not built)

Real-time vitals or wearables, patient-facing triage or chatbots, multi-condition support, and hospital integration (HIS/ABDM).

## Disclaimer

CareLoop is a hackathon prototype. It is not a medical device and must not be used for real clinical decisions.
