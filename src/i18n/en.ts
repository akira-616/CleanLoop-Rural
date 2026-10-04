export const en = {
  appName: 'CareLoop Rural',
  tagline: "We don't predict disease. We make sure a patient's slow decline, or a missed follow-up, doesn't go unnoticed between a traveling doctor's visits.",
  disclaimer: 'Decision support only. Not a diagnosis.',
  syntheticBadge: 'Synthetic demo data',
  villageView: 'Village View • Rural Health Outpost',

  // Navigation
  navDashboard: 'Dashboard',
  navUpload: 'Upload Note',
  navPatients: 'Patients',
  navValidation: 'Validation',

  // Status
  online: 'Online',
  offline: 'Offline',
  offlineModeNotice: 'Offline Mode: Notes queued, rule-based reasons active',
  synced: 'Synced',
  syncPending: 'Sync pending',
  storageMode: 'Storage mode',

  // Dashboard
  allPatients: 'All Patients',
  filterAll: 'All',
  filterRed: 'Red Flag',
  filterOrange: 'Orange Flag',
  filterGreen: 'Green',
  priorityScore: 'Priority Score',
  lastVisit: 'Last Visit',
  overdueByDays: 'Overdue by {n} days',
  whyThisFlag: 'Why this flag?',
  howFlagsWork: 'How flags work',

  // Upload Screen
  uploadTitle: 'Digitize Paper Clinic Note',
  selectPatient: 'Select Patient',
  selectPatientPlaceholder: '-- Choose a patient or New Patient --',
  newPatientOption: '+ New Patient Registration',
  pickSampleNote: 'Or pick from 10 sample clinic notes:',
  readNoteBtn: 'Read Note & Extract Data',
  readingNote: 'Reading note with Gemini...',
  offlineUploadPrompt: 'Offline: Save note locally or enter manually',
  enterManuallyBtn: 'Enter manually',
  cameraUpload: 'Upload photo / Take picture',

  // Review Screen
  reviewTitle: 'Review Extracted Clinical Data',
  reviewSubtitle: 'Human check: confirm or edit every field. Low-confidence fields require verification before saving.',
  fieldCheckRequired: 'Please check',
  editedByDoctor: 'edited by doctor',
  markAsChecked: 'Mark Checked',
  confirmAndSave: 'Confirm & Save Visit',
  confirmDisabledHint: 'Please review and verify all low-confidence fields before saving.',

  // Fields
  visitDate: 'Visit Date',
  bloodPressure: 'Blood Pressure (Systolic/Diastolic)',
  bloodSugar: 'Blood Sugar',
  sugarType: 'Sugar Type',
  fasting: 'Fasting',
  random: 'Random',
  postMeal: 'Post-meal',
  unknown: 'Unknown / Unspecified',
  weightKg: 'Weight (kg)',
  medicines: 'Prescribed Medicines',
  testsOrdered: 'Tests Ordered',
  plannedFollowup: 'Planned Follow-up',
  referral: 'Referral',

  // Timeline
  patientTimeline: 'Patient Clinical Timeline',
  openFollowups: 'Open Follow-ups',
  addVisit: 'Add Visit',
  markDone: 'Mark as done',
  bpTrendChart: 'Blood Pressure Trend (mmHg)',
  sugarTrendChart: 'Fasting Blood Sugar Trend (mg/dL)',
  weightTrendChart: 'Weight Record (kg)',
  exampleThreshold: 'Example clinical threshold',
  noFollowups: 'No open follow-ups for this patient.',

  // Validation
  validationTitle: 'Clinical Validation & Benchmark',
  flagAccuracyTitle: 'A. Flag Engine Accuracy (Plant Cases)',
  extractionAccuracyTitle: 'B. Extraction Accuracy (10 Sample Notes)',
  runExtractionTestBtn: 'Run Extraction Test on 10 Sample Notes',
  runningTest: 'Running Gemini extraction benchmark...',
  validationNote: 'Honest note: Small synthetic benchmark. Real-world deployment requires formal clinical validation.',
  confusionMatrix: 'Confusion Matrix (Expected vs Flagged)',
  precision: 'Precision',
  recall: 'Recall',
  unclearFieldHandling: 'Unclear Fields Correctly Left Null',

  // Settings / About
  settingsTitle: 'Settings & Clinical Architecture',
  resetSeedBtn: 'Reset Demo Data',
  demoDate: 'Demo Today Date',
  aboutTitle: 'About CareLoop Rural',
  futureWorkTitle: 'Future Work (Out of Scope)',
};
