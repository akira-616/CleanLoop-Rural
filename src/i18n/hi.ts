export const hi = {
  appName: 'केयरलूप रूरल (CareLoop Rural)',
  tagline: 'हम बीमारी की भविष्यवाणी नहीं करते। हम यह सुनिश्चित करते हैं कि किसी मरीज की धीमी गिरावट या छूटा हुआ फॉलो-अप ध्यान से न चूके।',
  disclaimer: 'केवल निर्णय सहायता। कोई चिकित्सीय निदान नहीं।',
  syntheticBadge: 'सिंथेटिक डेमो डेटा',
  villageView: 'ग्रामीण स्वास्थ्य केंद्र दृश्य',

  // Navigation
  navDashboard: 'डैशबोर्ड',
  navUpload: 'नोट अपलोड',
  navPatients: 'मरीज सूची',
  navValidation: 'सत्यापन',

  // Status
  online: 'ऑनलाइन',
  offline: 'ऑफलाइन',
  offlineModeNotice: 'ऑफलाइन मोड: नोट कतारबद्ध, नियम-आधारित कारण सक्रिय',
  synced: 'सिंक हो गया ✓',
  syncPending: 'सिंक लंबित',
  storageMode: 'स्टोरेज मोड',

  // Dashboard
  allPatients: 'सभी मरीज',
  filterAll: 'सभी',
  filterRed: 'रेड फ्लैग',
  filterOrange: 'ऑरेंज फ्लैग',
  filterGreen: 'ग्रीन (सामान्य)',
  priorityScore: 'प्राथमिकता अंक',
  lastVisit: 'पिछला दौरा',
  overdueByDays: '{n} दिन विलंबित',
  whyThisFlag: 'यह फ्लैग क्यों?',
  howFlagsWork: 'नियम कैसे काम करते हैं',

  // Upload Screen
  uploadTitle: 'कागजी क्लिनिक नोट डिजिटाइज़ करें',
  selectPatient: 'मरीज चुनें',
  selectPatientPlaceholder: '-- मरीज चुनें या नया मरीज पंजीकृत करें --',
  newPatientOption: '+ नया मरीज पंजीकरण',
  pickSampleNote: 'या 10 नमूना क्लिनिक नोटों में से चुनें:',
  readNoteBtn: 'नोट पढ़ें और डेटा निकालें',
  readingNote: 'Gemini द्वारा नोट पढ़ा जा रहा है...',
  offlineUploadPrompt: 'ऑफलाइन: नोट स्थानीय रूप से सहेजें या मैन्युअल दर्ज करें',
  enterManuallyBtn: 'मैन्युअल प्रविष्टि करें',
  cameraUpload: 'फोटो खींचें / अपलोड करें',

  // Review Screen
  reviewTitle: 'निकाले गए नैदानिक डेटा की समीक्षा',
  reviewSubtitle: 'डॉक्टर द्वारा सत्यापन: प्रत्येक फ़ील्ड की पुष्टि करें। कम-विश्वास वाले फ़ील्ड को सहेजने से पहले जांचना आवश्यक है।',
  fieldCheckRequired: 'कृपया जांचें',
  editedByDoctor: 'डॉक्टर द्वारा संपादित',
  markAsChecked: 'जांच पूर्ण चिह्नित करें',
  confirmAndSave: 'पुष्टि करें और सहेजें',
  confirmDisabledHint: 'सहेजने से पहले कृपया कम-विश्वास वाले सभी फ़ील्ड की जांच करें।',

  // Fields
  visitDate: 'दौरे की तारीख',
  bloodPressure: 'रक्तचाप (सिस्टोलिक/डायस्टोलिक)',
  bloodSugar: 'रक्त शर्करा (शुगर)',
  sugarType: 'शुगर का प्रकार',
  fasting: 'फास्टिंग (खाली पेट)',
  random: 'रैंडम',
  postMeal: 'भोजनोपरांत (पोस्ट-मील)',
  unknown: 'अस्पष्ट / अनिर्दिष्ट',
  weightKg: 'वजन (किग्रा)',
  medicines: 'निर्धारित दवाएं',
  testsOrdered: 'जांच के आदेश',
  plannedFollowup: 'नियोजित फॉलो-अप',
  referral: 'रेफरल',

  // Timeline
  patientTimeline: 'मरीज टाइमलाइन',
  openFollowups: 'लंबित फॉलो-अप',
  addVisit: 'दौरा जोड़ें',
  markDone: 'पूर्ण चिह्नित करें',
  bpTrendChart: 'रक्तचाप का रुझान (mmHg)',
  sugarTrendChart: 'फास्टिंग ब्लड शुगर का रुझान (mg/dL)',
  weightTrendChart: 'वजन रिकॉर्ड (किग्रा)',
  exampleThreshold: 'उदाहरण सीमा रेखा',
  noFollowups: 'इस मरीज के लिए कोई खुला फॉलो-अप नहीं है।',

  // Validation
  validationTitle: 'नैदानिक सटीकता और बेंचमार्क',
  flagAccuracyTitle: 'A. फ्लैग इंजन सटीकता (संकेत केस)',
  extractionAccuracyTitle: 'B. निष्कर्षण सटीकता (10 नमूना नोट)',
  runExtractionTestBtn: '10 नमूना नोटों पर निष्कर्षण टेस्ट चलाएं',
  runningTest: 'Gemini निष्कर्षण परीक्षण प्रगति पर है...',
  validationNote: 'ईमानदार सूचना: छोटा सिंथेटिक बेंचमार्क। वास्तविक क्लिनिकल तैनाती के लिए औपचारिक सत्यापन आवश्यक है।',
  confusionMatrix: 'कन्फ्यूजन मैट्रिक्स (अपेक्षित बनाम फ्लैग)',
  precision: 'सटीकता (Precision)',
  recall: 'स्मरण (Recall)',
  unclearFieldHandling: 'अस्पष्ट फ़ील्ड सही ढंग से शून्य छोड़े गए',

  // Settings / About
  settingsTitle: 'सेटिंग्स और क्लिनिकल नियम',
  resetSeedBtn: 'डेमो डेटा रीसेट करें',
  demoDate: 'डेमो संदर्भ तिथि',
  aboutTitle: 'CareLoop Rural के बारे में',
  futureWorkTitle: 'भविष्य का कार्य (कार्यक्षेत्र से बाहर)',
};
