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
  Image as ImageIcon,
  RotateCcw,
  Video,
  X,
  Plus,
  PenTool,
  Check,
} from 'lucide-react';

type InputMode = 'upload_file' | 'camera_capture' | 'type_text' | 'sample_gallery';

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

  // Sample Note State
  const [selectedSample, setSelectedSample] = useState<SampleNote>(SAMPLE_NOTES[0]);

  // Live Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isReading, setIsReading] = useState(false);

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

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access camera. Please check permissions or upload a file.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImageDataUrl(dataUrl);
      setCustomFile(new File([dataUrl], 'camera_note.jpg', { type: 'image/jpeg' }));
      stopCamera();
      showToast('Photo captured successfully! Ready to extract.');
    }
  };

  // Handle file selection / drop
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }
    setCustomFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImageDataUrl(e.target.result as string);
        showToast(`Loaded ${file.name} successfully.`);
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
  };

  // Run Extraction
  const handleReadNote = async () => {
    if (inputMode === 'type_text') {
      if (!typedNoteText.trim()) {
        showToast('Please enter note text to extract.');
        return;
      }
    } else if (!selectedImageDataUrl) {
      showToast('Please select or upload a note image first.');
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
      } else {
        const isSample = inputMode === 'sample_gallery' && !customFile;
        res = await extractNote(
          selectedImageDataUrl,
          customFile?.type || 'image/png',
          demoToday,
          isSample ? selectedSample : undefined
        );
      }

      navigateToReview({
        noteImage: finalImageUrl,
        extracted: res.data,
        patientId: targetPatientId,
        isManual: false,
        sampleNoteId: inputMode === 'sample_gallery' && !customFile ? selectedSample.id : undefined,
      });
    } catch (err: any) {
      console.error('Extraction error:', err);
      showToast('Extraction failed. Switching to manual check form.');
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

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-teal-700" />
          {dict.uploadTitle}
        </h2>
        <p className="text-xs text-slate-500">
          Upload photo of paper prescription, snap with camera, or type/paste doctor's notes.
        </p>
      </div>

      {/* Target Patient Selector */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-teal-700" />
          {dict.selectPatient}
        </label>
        <select
          value={targetPatientId}
          onChange={(e) => setTargetPatientId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-teal-600 shadow-2xs"
        >
          {patients.map((p) => (
            <option key={p.patient_id} value={p.patient_id}>
              {p.name} ({p.patient_id} • {p.age}/{p.sex} • {p.village})
            </option>
          ))}
        </select>
      </div>

      {/* Input Mode Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setInputMode('upload_file')}
          className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center gap-0.5 ${
            inputMode === 'upload_file'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span className="text-[10px]">Upload Photo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setInputMode('camera_capture');
            startCamera();
          }}
          className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center gap-0.5 ${
            inputMode === 'camera_capture'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px]">Snap Photo</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode('type_text')}
          className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center gap-0.5 ${
            inputMode === 'type_text'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span className="text-[10px]">Type / Paste</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode('sample_gallery')}
          className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center gap-0.5 ${
            inputMode === 'sample_gallery'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">10 Samples</span>
        </button>
      </div>

      {/* MODE 1: Upload File / Drag & Drop */}
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
            accept="image/*"
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
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-teal-500 bg-teal-50/70'
                  : 'border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/30'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Drop handwritten note or prescription photo here
                </p>
                <p className="text-[11px] text-slate-500">
                  or click to browse from device (JPG, PNG, WebP)
                </p>
              </div>
              <button
                type="button"
                className="mt-1 px-3 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800"
              >
                Choose Photo
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Uploaded Note Ready
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
              Camera Viewfinder
            </span>
            {cameraActive && (
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            )}
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
                <span className="text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded self-start font-mono">
                  Align prescription note inside frame
                </span>
                <span className="text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded self-end font-mono">
                  Ensure good lighting
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-600">
                Camera snapshot ready or camera inactive.
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
              Snap Note Photo Now
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

      {/* MODE 3: Type / Paste Doctor's Note */}
      {inputMode === 'type_text' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-teal-700" />
              Type or Paste Clinical Note (English, Hindi, or Hinglish)
            </label>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <span>Preview Style:</span>
              <button
                type="button"
                onClick={() => setTypedStyle(typedStyle === 'handwritten' ? 'typed' : 'handwritten')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-teal-800 font-bold border border-slate-300"
              >
                {typedStyle === 'handwritten' ? 'Handwritten Rx' : 'Printed OPD'}
              </button>
            </div>
          </div>

          {/* Quick preset templates */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] text-slate-400 shrink-0">Quick Templates:</span>
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
              + Worsening High BP
            </button>
            <button
              type="button"
              onClick={() => {
                setTypedNoteText(`प्राथमिक स्वास्थ्य केंद्र (PHC)
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
              + Hindi Prescription
            </button>
            <button
              type="button"
              onClick={() => {
                setTypedNoteText(`RAMPUR DISPENSARY
Date: ${demoToday}
Patient: Anita Mishra (45/F)
BP: 124/80 mmHg
Sugar: 115 mg/dL (fasting)
Weight: 68.5 kg (Drop from 74kg noticed)
Rx: Metformin 500mg OD
Plan: Routine checkup in 4 weeks`);
              }}
              className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded shrink-0 hover:bg-amber-100"
            >
              + Weight Loss Note
            </button>
          </div>

          <textarea
            rows={7}
            value={typedNoteText}
            onChange={(e) => setTypedNoteText(e.target.value)}
            placeholder="Type or paste doctor prescription, e.g.:&#10;Date: 2026-10-02&#10;BP: 148/92 mmHg&#10;Fasting Sugar: 178 mg/dL&#10;Rx: Metformin 500mg BD&#10;Review in 3 weeks"
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 leading-relaxed focus:outline-teal-600 shadow-2xs"
          />

          {/* Generated Canvas Prescription Preview */}
          {selectedImageDataUrl && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600">
                Prescription Pad Render ({typedStyle}):
              </span>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={selectedImageDataUrl}
                  alt="Rendered clinical prescription"
                  className="max-h-52 w-auto object-contain rounded shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: 10 Pre-generated Sample Notes */}
      {inputMode === 'sample_gallery' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Pick From 10 Benchmark Clinic Notes
            </label>
            <span className="text-[10px] font-semibold text-slate-500">
              Canvas Rendered
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
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

          {selectedImageDataUrl && (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-center max-h-64">
              <img
                src={selectedImageDataUrl}
                alt="Selected sample note"
                className="max-h-60 w-auto object-contain rounded shadow-2xs"
              />
            </div>
          )}
        </div>
      )}

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
  );
};
