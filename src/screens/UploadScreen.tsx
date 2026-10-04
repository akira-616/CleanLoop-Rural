import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/appStore';
import { SAMPLE_NOTES, renderNoteToCanvas, renderCustomTextToCanvas } from '../services/sampleNotes';
import { SampleNote } from '../domain/types';
import { extractNote } from '../services/gemini';
import {
  Camera,
  Upload,
  Sparkles,
  FileText,
  Edit3,
  CheckCircle2,
  Video,
  X,
  PenTool,
  RotateCcw,
  Palette,
  FileUp,
  Clipboard,
  Smartphone,
  Info,
} from 'lucide-react';

type InputMode = 'upload_file' | 'camera_capture' | 'type_text' | 'draw_handwritten' | 'sample_gallery';

export const UploadScreen: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    navigateToReview,
    isOnline,
    showToast,
    dict,
    demoToday,
  } = useApp();

  const [inputMode, setInputMode] = useState<InputMode>('upload_file');
  const [targetPatientId, setTargetPatientId] = useState<string>(
    selectedPatientId || 'P106'
  );

  // File Upload State
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  // Type / Paste Note State
  const [typedNoteText, setTypedNoteText] = useState<string>(
    `RURAL SUB-CENTRE RAMPUR
Date: ${demoToday} | Patient: Abdul Rahim (66/M)
BP: 144/90 mmHg
Fasting Sugar: 182 mg/dL
Weight: 64.5 kg

Rx:
- Tab Metformin 500mg BD continued
- Tab Glimepiride 1mg OD started

Plan:
- Repeat fasting sugar in 2 weeks
- Review in 4 weeks
Dr. A. K. Verma`
  );
  const [typedStyle, setTypedStyle] = useState<'handwritten' | 'typed'>('handwritten');

  // Drawing Pad (Handwrite with Touch / Stylus) State
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#1e3a8a'); // Doctor blue ink
  const [drawWidth, setDrawWidth] = useState(3);
  const [hasDrawnContent, setHasDrawnContent] = useState(false);

  // Sample Note State
  const [selectedSample, setSelectedSample] = useState<SampleNote>(SAMPLE_NOTES[0]);

  // Live Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isReading, setIsReading] = useState(false);

  // Global Clipboard Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      // Check for image in clipboard
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileProcess(blob);
            setInputMode('upload_file');
            showToast('Pasted image from clipboard!');
            return;
          }
        }
      }

      // Check for pasted text if not already focused on an input/textarea
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (!isInputActive) {
        const text = e.clipboardData.getData('text');
        if (text && text.trim().length > 10) {
          setTypedNoteText(text);
          setInputMode('type_text');
          showToast('Pasted note text from clipboard!');
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Initialize sample or typed canvas
  useEffect(() => {
    if (inputMode === 'sample_gallery' && !customFile) {
      const dataUrl = renderNoteToCanvas(selectedSample);
      setSelectedImageDataUrl(dataUrl);
      if (selectedSample.patient_id_hint) {
        setTargetPatientId(selectedSample.patient_id_hint);
      }
    } else if (inputMode === 'type_text') {
      const dataUrl = renderCustomTextToCanvas(typedNoteText, typedStyle);
      setSelectedImageDataUrl(dataUrl);
    }
  }, [inputMode, selectedSample, typedNoteText, typedStyle, customFile]);

  // Stop camera when switching tabs
  useEffect(() => {
    if (inputMode !== 'camera_capture') {
      stopCamera();
    }
  }, [inputMode]);

  // Setup drawing canvas background
  useEffect(() => {
    if (inputMode === 'draw_handwritten' && drawCanvasRef.current) {
      const canvas = drawCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && !hasDrawnContent) {
        initDrawingCanvas(canvas, ctx);
      }
    }
  }, [inputMode, hasDrawnContent]);

  const initDrawingCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // Fill paper background
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ruled lines
    ctx.strokeStyle = 'rgba(180, 205, 225, 0.4)';
    ctx.lineWidth = 1;
    for (let y = 70; y < canvas.height - 20; y += 26) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(canvas.width - 20, y);
      ctx.stroke();
    }

    // Header label
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('RURAL CLINIC PRESCRIPTION PAD • HANDWRITTEN NOTE', 24, 28);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Write / scribble with stylus, mouse, or touch finger', 24, 44);

    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 20px serif';
    ctx.fillText('℞', 24, 75);
  };

  const clearDrawingCanvas = () => {
    if (drawCanvasRef.current) {
      const ctx = drawCanvasRef.current.getContext('2d');
      if (ctx) {
        initDrawingCanvas(drawCanvasRef.current, ctx);
        setHasDrawnContent(false);
        setSelectedImageDataUrl('');
        showToast('Prescription pad cleared.');
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawnContent(true);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && drawCanvasRef.current) {
      setIsDrawing(false);
      const dataUrl = drawCanvasRef.current.toDataURL('image/png');
      setSelectedImageDataUrl(dataUrl);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access notice:', err);
      setCameraError('Unable to open camera feed. You can upload an image file instead.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (cameraActive) {
      setTimeout(() => startCamera(), 100);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setSelectedImageDataUrl(dataUrl);
      setCustomFile(new File([dataUrl], 'camera_prescription_note.jpg', { type: 'image/jpeg' }));
      stopCamera();
      showToast('Photo captured! Ready to digitize.');
    }
  };

  // Handle file selection / drop for images, PDFs, or text notes
  const handleFileProcess = (file: File) => {
    // If it is a text document or markdown
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        setTypedNoteText(text);
        setInputMode('type_text');
        setCustomFile(file);
        showToast(`Loaded text note: "${file.name}"`);
      };
      reader.readAsText(file);
      return;
    }

    // If it is an image
    if (file.type.startsWith('image/')) {
      setCustomFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImageDataUrl(e.target.result as string);
          showToast(`Loaded handwritten/typed note: "${file.name}"`);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Fallback: accept file and attempt data URL read
    setCustomFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImageDataUrl(e.target.result as string);
        showToast(`Loaded "${file.name}" successfully.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const clearUploadedImage = () => {
    setCustomFile(null);
    setSelectedImageDataUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textFileInputRef.current) {
      textFileInputRef.current.value = '';
    }
  };

  // Run Extraction & Proceed to Human Verification
  const handleReadNote = async () => {
    if (inputMode === 'type_text') {
      if (!typedNoteText.trim()) {
        showToast('Please enter note text to extract.');
        return;
      }
    } else if (!selectedImageDataUrl) {
      showToast('Please select or upload a note first.');
      return;
    }

    setIsReading(true);

    try {
      let res;
      let finalImageUrl = selectedImageDataUrl;

      if (inputMode === 'type_text') {
        finalImageUrl = renderCustomTextToCanvas(typedNoteText, typedStyle);
        res = await extractNote(
          finalImageUrl,
          'image/png',
          demoToday,
          undefined,
          typedNoteText
        );
      } else if (inputMode === 'draw_handwritten') {
        res = await extractNote(
          selectedImageDataUrl,
          'image/png',
          demoToday,
          undefined,
          undefined
        );
      } else {
        const isSample = inputMode === 'sample_gallery' && !customFile;
        res = await extractNote(
          selectedImageDataUrl,
          customFile?.type || 'image/png',
          demoToday,
          isSample ? selectedSample : undefined,
          typedNoteText // pass typed text as hint if provided
        );
      }

      if (res.source === 'offline_fallback' || !isOnline) {
        showToast('Digitized via smart clinical rules (offline / quota resilient).');
      } else {
        showToast('Digitized successfully with Gemini API.');
      }

      navigateToReview({
        noteImage: finalImageUrl,
        extracted: res.data,
        patientId: targetPatientId,
        isManual: false,
        sampleNoteId: inputMode === 'sample_gallery' && !customFile ? selectedSample.id : undefined,
      });
    } catch (err: any) {
      console.warn('Extraction notice:', err);
      showToast('Opening clinical review form.');
      navigateToReview({
        extracted: {
          visit_date: { value: demoToday, confidence: 'high' },
          blood_pressure: { value: null, confidence: 'low' },
          blood_sugar: { value: null, confidence: 'low' },
          weight_kg: { value: null, confidence: 'low' },
          medicines: { value: [], confidence: 'high' },
          tests_ordered: { value: [], confidence: 'high' },
          planned_followup: { value: null, confidence: 'low' },
          referral: { value: null, confidence: 'high' },
        },
        patientId: targetPatientId,
        isManual: false,
      });
    } finally {
      setIsReading(false);
    }
  };

  const handleEnterManually = () => {
    navigateToReview({
      extracted: {
        visit_date: { value: demoToday, confidence: 'high' },
        blood_pressure: { value: null, confidence: 'low' },
        blood_sugar: { value: null, confidence: 'low' },
        weight_kg: { value: null, confidence: 'low' },
        medicines: { value: [], confidence: 'high' },
        tests_ordered: { value: [], confidence: 'high' },
        planned_followup: { value: null, confidence: 'low' },
        referral: { value: null, confidence: 'high' },
      },
      patientId: targetPatientId,
      isManual: true,
    });
  };

  const selectedPatientObj = patients.find((p) => p.patient_id === targetPatientId);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-teal-700" />
          {dict.uploadTitle}
        </h2>
        <p className="text-xs text-slate-500">
          Upload photo or scan of handwritten prescription, snap with camera, write on pad, or type/paste doctor's consultation notes.
        </p>
      </div>

      {/* Main Responsive Grid Layout (1 col mobile, 2 col desktop: 7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Input Selection & Mode Widgets */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Patient Selector */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-700" />
              {dict.selectPatient}
            </label>
            <select
              value={targetPatientId}
              onChange={(e) => setTargetPatientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-teal-600 shadow-2xs"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.name} ({p.patient_id} • {p.age}/{p.sex} • {p.village})
                </option>
              ))}
            </select>
          </div>

          {/* Input Mode Navigation Tabs - Fully Responsive Scrollable / Touch-Friendly */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setInputMode('upload_file')}
              className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                inputMode === 'upload_file'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputMode('camera_capture');
                startCamera();
              }}
              className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                inputMode === 'camera_capture'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('type_text')}
              className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                inputMode === 'type_text'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Type Note</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('draw_handwritten')}
              className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                inputMode === 'draw_handwritten'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Scribble Pad</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('sample_gallery')}
              className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                inputMode === 'sample_gallery'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] leading-tight">10 Samples</span>
            </button>
          </div>

          {/* MODE 1: Upload File / Drag & Drop (Supports Images, Scans, PDFs, Text files) */}
          {inputMode === 'upload_file' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
                accept="image/*,.pdf,.txt,.md,.doc,.docx"
                className="hidden"
              />

              {!selectedImageDataUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 sm:p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    isDragOver
                      ? 'border-teal-500 bg-teal-50/70'
                      : 'border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Drop handwritten prescription photo, scan, or typed note here
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WebP, PDF scans, or text documents (.txt)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      className="px-3.5 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 shadow-2xs"
                    >
                      Browse Device File
                    </button>
                    <span className="text-[10px] text-slate-400">or paste (Ctrl+V)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Uploaded Note Ready ({customFile?.name || 'Handwritten Note'})
                    </span>
                    <button
                      type="button"
                      onClick={clearUploadedImage}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5 max-h-72 flex items-center justify-center p-2">
                    <img
                      src={selectedImageDataUrl}
                      alt="Uploaded handwritten note"
                      className="max-h-64 w-auto object-contain rounded-lg shadow-sm"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 text-center">
                    Image loaded successfully. Click below to digitize and parse clinical vitals.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: Camera Capture Viewfinder */}
          {inputMode === 'camera_capture' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-teal-700" />
                  Live Camera Scanner
                </span>
                <div className="flex items-center gap-2">
                  {cameraActive && (
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                      title="Switch front/back camera"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Flip
                    </button>
                  )}
                  {cameraActive && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </div>

              {cameraError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
                  <p className="text-xs text-rose-800">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : cameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-teal-500 shadow-md">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Prescription Framing Overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-white/70 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <span className="text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded self-start font-mono">
                      Align paper note inside frame
                    </span>
                    <span className="text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded self-end font-mono">
                      Good lighting recommended
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600">
                    Snap a clear photo of paper OPD slip or doctor's diary.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800"
                  >
                    Open Camera
                  </button>
                </div>
              )}

              {cameraActive && (
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo Now
                </button>
              )}

              {selectedImageDataUrl && !cameraActive && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-800">Captured Snapshot</span>
                  <img
                    src={selectedImageDataUrl}
                    alt="Captured note"
                    className="max-h-56 mx-auto rounded-lg border border-slate-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Type or Paste Doctor's Note (with Text File Upload) */}
          {inputMode === 'type_text' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-teal-700" />
                  Type or Paste Clinical Note (English, Hindi, or Hinglish)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={textFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                    accept=".txt,.md,.doc"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => textFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-teal-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                    title="Upload note as .txt file"
                  >
                    <FileUp className="w-3 h-3" />
                    Upload .txt
                  </button>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <span>Style:</span>
                    <button
                      type="button"
                      onClick={() => setTypedStyle(typedStyle === 'handwritten' ? 'typed' : 'handwritten')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-teal-800 font-bold border border-slate-300"
                    >
                      {typedStyle === 'handwritten' ? 'Handwritten Rx' : 'Printed OPD'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick preset templates */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-slate-400 shrink-0">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTypedNoteText(`SUB-CENTRE CLINIC
Date: ${demoToday}
Pt: Mohan Lal (58/M)
BP: 162/102 mmHg
Fasting Sugar: 194 mg/dL
Weight: 65 kg
Rx: Amlodipine 10mg OD, Telmisartan 40mg OD
Plan: Urgent review in 2 weeks. Refer to CHC for kidney test.`);
                  }}
                  className="text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded shrink-0 hover:bg-rose-100"
                >
                  + High BP (162/102)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypedNoteText(`प्राथमिक स्वास्थ्य केंद्र (PHC Sonpur)
दिनांक: ${demoToday}
मरीज: सुनीता देवी (54/F)
रक्तचाप: 130/82 mmHg
शुगर: 120 mg/dL (सुबह खाली पेट)
वजन: 62 किग्रा
दवा: एम्लोडिपिन 5mg OD जारी रखें
सलाह: 2 हफ्ते बाद बीपी जांच`);
                  }}
                  className="text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded shrink-0 hover:bg-teal-100"
                >
                  + Hindi Rx (खाली पेट)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypedNoteText(`RAMPUR DISPENSARY
Date: ${demoToday}
Patient: Anita Mishra (45/F)
BP: 124/80 mmHg
Sugar: 114 mg/dL (fasting)
Weight: 68.5 kg (Drop from 74kg noticed)
Rx: Metformin 500mg OD
Plan: Routine checkup in 4 weeks`);
                  }}
                  className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded shrink-0 hover:bg-amber-100"
                >
                  + Weight Drop
                </button>
              </div>

              <textarea
                rows={8}
                value={typedNoteText}
                onChange={(e) => setTypedNoteText(e.target.value)}
                placeholder="Type or paste doctor prescription, e.g.:&#10;Date: 2026-10-02&#10;BP: 148/92 mmHg&#10;Fasting Sugar: 178 mg/dL&#10;Rx: Metformin 500mg BD&#10;Review in 3 weeks"
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 leading-relaxed focus:outline-teal-600 shadow-2xs"
              />
            </div>
          )}

          {/* MODE 4: Digital Handwriting / Scribble Pad (Write with Finger / Stylus / Mouse) */}
          {inputMode === 'draw_handwritten' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-teal-700" />
                  Handwrite or Draw on Prescription Pad
                </span>
                <div className="flex items-center gap-2">
                  {/* Ink color picker */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDrawColor('#1e3a8a')}
                      className={`w-5 h-5 rounded-full bg-blue-900 border ${
                        drawColor === '#1e3a8a' ? 'ring-2 ring-teal-500 scale-110' : 'border-slate-300'
                      }`}
                      title="Blue Ink"
                    />
                    <button
                      type="button"
                      onClick={() => setDrawColor('#0f172a')}
                      className={`w-5 h-5 rounded-full bg-slate-900 border ${
                        drawColor === '#0f172a' ? 'ring-2 ring-teal-500 scale-110' : 'border-slate-300'
                      }`}
                      title="Black Ink"
                    />
                    <button
                      type="button"
                      onClick={() => setDrawColor('#b91c1c')}
                      className={`w-5 h-5 rounded-full bg-rose-700 border ${
                        drawColor === '#b91c1c' ? 'ring-2 ring-teal-500 scale-110' : 'border-slate-300'
                      }`}
                      title="Red Ink"
                    />
                  </div>
                  {/* Clear Button */}
                  <button
                    type="button"
                    onClick={clearDrawingCanvas}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear Pad
                  </button>
                </div>
              </div>

              {/* Touch & Stylus Canvas */}
              <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden shadow-inner bg-amber-50/20 touch-none">
                <canvas
                  ref={drawCanvasRef}
                  width={560}
                  height={320}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMove}
                  onTouchEnd={stopDrawing}
                  className="w-full h-auto cursor-crosshair block"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Use finger or mouse to write vitals, e.g. "BP 150/90", "Sugar 180"</span>
                {hasDrawnContent && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Handwritten Note Ready
                  </span>
                )}
              </div>
            </div>
          )}

          {/* MODE 5: 10 Pre-generated Benchmark Notes */}
          {inputMode === 'sample_gallery' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Pick From 10 Benchmark Clinic Notes
                </label>
                <span className="text-[10px] font-semibold text-slate-500">
                  Ground Truth Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                {SAMPLE_NOTES.map((sn) => {
                  const isSelected = selectedSample.id === sn.id;
                  return (
                    <button
                      key={sn.id}
                      type="button"
                      onClick={() => {
                        setCustomFile(null);
                        setSelectedSample(sn);
                      }}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all relative ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-200 text-teal-950 font-semibold'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[11px] truncate">{sn.title}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="capitalize">{sn.style}</span> • {sn.language}
                      </div>
                      {sn.unclearElementNote && (
                        <span className="inline-block mt-1 text-[9px] text-amber-800 bg-amber-100 px-1 py-0.2 rounded font-medium">
                          Smudged test
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Prescription Pad Preview & Action Box (Sticky on Desktop) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-16">
          {/* Target Patient Badge Card */}
          {selectedPatientObj && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                  Target Patient
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedPatientObj.name}{' '}
                  <span className="font-normal text-slate-500 text-xs">
                    ({selectedPatientObj.age}/{selectedPatientObj.sex} • {selectedPatientObj.village})
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-white px-2 py-1 rounded border border-teal-200">
                {selectedPatientObj.patient_id}
              </span>
            </div>
          )}

          {/* Source Note Preview Box */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Prescription Pad Preview</span>
              <span className="text-[11px] text-teal-700 font-medium">
                {inputMode === 'type_text' ? 'Live Canvas Pad' : inputMode === 'draw_handwritten' ? 'Handwritten Canvas' : 'Original Photo'}
              </span>
            </div>

            {selectedImageDataUrl ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-center max-h-72 sm:max-h-84">
                <img
                  src={selectedImageDataUrl}
                  alt="Selected or rendered prescription note"
                  className="max-h-68 sm:max-h-80 w-auto object-contain rounded shadow-2xs"
                />
              </div>
            ) : (
              <div className="h-56 sm:h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-xs text-slate-400 gap-1.5 p-4 text-center">
                <FileText className="w-8 h-8 text-slate-300" />
                <span>Upload, snap, write, or type note to preview prescription</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isReading || (!selectedImageDataUrl && inputMode !== 'type_text')}
              onClick={handleReadNote}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                isReading
                  ? 'bg-teal-800 text-white cursor-wait opacity-80'
                  : !selectedImageDataUrl && inputMode !== 'type_text'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isReading ? dict.readingNote : 'Read & Digitize Note with Gemini'}
            </button>

            <button
              type="button"
              onClick={handleEnterManually}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {dict.enterManuallyBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
