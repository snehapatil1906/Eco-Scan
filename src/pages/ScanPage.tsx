import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AnalysisResult,
  TrackedMaterial,
  CampusBin,
} from '../types';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { CategoryBadge } from '../components/Common/Badge';
import { QrScreenMirror } from '../components/Scan/QrScreenMirror';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import {
  QrCode,
  Tv,
  Camera,
  CameraOff,
  SwitchCamera,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Info,
  MapPin,
  X,
  FileCheck,
  Zap,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

interface ScanPageProps {
  onMaterialSaved: (material: TrackedMaterial) => void;
  onNavigateToAssistant: (material: TrackedMaterial) => void;
  onNavigateToJourney: (materialId: string) => void;
  bins: CampusBin[];
}

export function ScanPage({
  onMaterialSaved,
  onNavigateToAssistant,
  onNavigateToJourney,
  bins,
}: ScanPageProps) {
  // Mode: 'camera' (Live Camera) | 'upload' (Gallery / File) | 'qr-mirror' (Desktop QR Mirror)
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'qr-mirror'>('camera');

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [savedMaterial, setSavedMaterial] = useState<TrackedMaterial | null>(null);
  const [selectedCampusZone, setSelectedCampusZone] = useState<string>('Block A');

  // Camera states: default to rear-facing camera on mobile
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly and release hardware
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  // Start live camera stream (prefer rear-facing lens on mobile)
  const startCamera = useCallback(async (facing: 'environment' | 'user' = cameraFacingMode) => {
    stopCamera();
    setCameraError(null);
    setCameraLoading(true);

    // Check secure context for mobile devices (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setCameraError('Camera access requires HTTPS. Mobile browsers restrict camera access on non-HTTPS connections.');
      setCameraLoading(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Direct live camera is not supported in this browser context. Please tap "Choose from Gallery" below to select or take a photo.');
      setCameraLoading(false);
      return;
    }

    let stream: MediaStream | null = null;

    // Attempt 1: Ideal facingMode and standard resolution (rear lens on mobile)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1: any) {
      console.warn('Camera attempt 1 failed, trying fallback constraints:', err1);
      // Attempt 2: Simple string facingMode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      } catch (err2: any) {
        console.warn('Camera attempt 2 failed, trying ideal string:', err2);
        // Attempt 3: Ideal string without dimensions
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facing } },
            audio: false,
          });
        } catch (err3: any) {
          console.warn('Camera attempt 3 failed, trying basic video: true:', err3);
          // Attempt 4: Basic video fallback
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch (err4: any) {
            console.error('All camera attempts failed:', err4);
            const finalError = err4 || err3 || err2 || err1;
            let errorMsg = 'Could not open camera stream.';
            if (finalError.name === 'NotAllowedError' || finalError.name === 'PermissionDeniedError') {
              errorMsg = 'Camera permission was denied. Tap the lock or settings icon in your mobile browser address bar to allow Camera access, then tap "Try Again", or choose a photo from your gallery.';
            } else if (finalError.name === 'NotFoundError' || finalError.name === 'DevicesNotFoundError') {
              errorMsg = 'No camera found on this device. You can upload an image from your photo gallery.';
            } else if (finalError.name === 'NotReadableError' || finalError.name === 'TrackStartError') {
              errorMsg = 'Camera is currently in use by another app or browser tab. Please close other camera apps and try again.';
            } else if (finalError.name === 'OverconstrainedError') {
              errorMsg = 'Requested camera resolution is not supported by your device lens.';
            } else if (finalError.name === 'SecurityError') {
              errorMsg = 'Camera access was blocked by browser security policy. Make sure you are using HTTPS.';
            } else if (finalError.message) {
              errorMsg = finalError.message;
            }
            setCameraError(errorMsg);
            setCameraActive(false);
            setCameraLoading(false);
            return;
          }
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      setCameraActive(true);
      setCameraError(null);
      setCameraLoading(false);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        try {
          await video.play();
        } catch (playErr) {
          console.warn('Video play deferred until metadata:', playErr);
        }
      }
    }
  }, [cameraFacingMode, stopCamera]);

  // Ensure video element receives stream and plays on iOS/Android if camera is active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.play().catch((err) => console.warn('Stream play caught:', err));
    }
  }, [cameraActive]);

  // Clean up camera when user switches modes away from camera or an image is set
  useEffect(() => {
    if (scanMode !== 'camera' || selectedImage) {
      stopCamera();
    }
  }, [scanMode, selectedImage, stopCamera]);

  // Stop camera when user navigates away or component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Stop camera stream when tab/app goes into background or screen locks
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopCamera]);

  // Toggle camera direction (rear vs front)
  const handleToggleFacingMode = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    if (cameraActive) {
      startCamera(nextMode);
    }
  };

  // Capture frame from live video and trigger classification flow
  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || analyzing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.85);

    setSelectedImage(base64Data);
    setImageMimeType('image/jpeg');
    setImageFileName(`Live Camera Scan (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
    
    // Stop camera immediately upon capture to save battery & release device
    stopCamera();

    await triggerAnalysis(base64Data, 'image/jpeg');
  };

  // Re-open camera after scan
  const handleRetakeCamera = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setSavedMaterial(null);
    setAnalysisError(null);
    startCamera(cameraFacingMode);
  };

  // Handle direct phone camera input fallback
  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysisError(null);
    setAnalysisResult(null);
    setSavedMaterial(null);
    setImageFileName(file.name || 'Mobile Camera Capture');
    stopCamera();

    try {
      const compressed = await compressImageToDataUrl(file, 1280, 0.85);
      setSelectedImage(compressed.dataUrl);
      setImageMimeType(compressed.mimeType);
      await triggerAnalysis(compressed.dataUrl, compressed.mimeType);
    } catch (err: any) {
      console.error('Camera capture compression error:', err);
      setAnalysisError('Could not process photo from camera. Please try again.');
    }
  };

  // Handle standard file selection from gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setAnalysisError('File is too large. Please select an image under 25MB.');
      return;
    }

    setAnalysisError(null);
    setAnalysisResult(null);
    setSavedMaterial(null);
    setImageFileName(file.name || 'Gallery Upload');
    stopCamera();

    try {
      const compressed = await compressImageToDataUrl(file, 1280, 0.85);
      setSelectedImage(compressed.dataUrl);
      setImageMimeType(compressed.mimeType);
      await triggerAnalysis(compressed.dataUrl, compressed.mimeType);
    } catch (err: any) {
      console.error('File compression error:', err);
      setAnalysisError('Failed to read image file.');
    }
  };

  // Core analysis trigger
  const triggerAnalysis = async (imgBase64: string, mime: string, fallback?: AnalysisResult) => {
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const result = await apiService.analyzeMaterialImage(
        imgBase64,
        mime,
        fallback
      );
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Scan analysis error:', err);
      setAnalysisError(
        err.message || 'Failed to analyze material. Please check that server Gemini API is available.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Handler when QR Mobile Mirror completes scan
  const handleQrMirrorCompleted = (analysis: AnalysisResult, photoBase64: string) => {
    setAnalysisResult(analysis);
    setSelectedImage(photoBase64);
    setImageFileName('Mobile QR Mirrored Capture');
    setAnalysisError(null);
  };

  // Reset image
  const handleClearImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setSavedMaterial(null);
    setAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
    if (scanMode === 'camera') {
      startCamera();
    }
  };

  // Save as tracked material record
  const handleTrackMaterial = () => {
    if (!analysisResult || saving) return;

    setSaving(true);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newId = `M-${randomSuffix}`;
      const nowIso = new Date().toISOString();

      const newMaterial: TrackedMaterial = {
        id: newId,
        objectName: analysisResult.objectName,
        materialType: analysisResult.materialType,
        categories: analysisResult.categories,
        confidenceLevel: analysisResult.confidenceLevel,
        confidencePercent: analysisResult.confidencePercent,
        condition: analysisResult.condition,
        contamination: analysisResult.contamination,
        recommendedAction: analysisResult.recommendedAction,
        alternativeAction: analysisResult.alternativeAction,
        safetyWarnings: analysisResult.safetyWarnings || [],
        explanation: analysisResult.explanation,
        sourceLocation: selectedCampusZone,
        assignedBinId: analysisResult.targetBinId || 'B01',
        intendedDestination:
          analysisResult.targetBinId === 'B04'
            ? 'Certified E-Waste & Toxic Materials Locker'
            : analysisResult.targetBinId === 'B02'
            ? 'Aerobic Composting & Bioreactor Unit'
            : 'Regional Materials Recovery Facility (MRF)',
        currentStatus: 'Identified',
        createdAt: nowIso,
        updatedAt: nowIso,
        isSample: false,
        imageDataUrl: selectedImage || undefined,
        estimatedWeightKg: 0.1,
        history: [
          {
            id: `EVT-${Date.now()}-1`,
            timestamp: nowIso,
            status: 'Identified',
            locationOrFacility: `${selectedCampusZone} Intake`,
            note: `Identified by Gemini Computer Vision as ${analysisResult.objectName}.`,
            actor: 'Campus User',
            isSimulated: false,
          },
        ],
      };

      storageService.addMaterial(newMaterial);
      setSavedMaterial(newMaterial);
      onMaterialSaved(newMaterial);
    } catch (e: any) {
      setAnalysisError('Could not save material to storage: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden native camera capture input for phones/tablets */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={handleNativeCameraCapture}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Hidden standard file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Gemini 3.8 Flash Vision Engine</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Scan & Classify Waste Material</h1>
            <p className="text-slate-500 text-xs mt-1">
              Scan the QR code with your mobile camera to scan physical objects directly with real-time screen sync, or use your computer webcam.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Source Location:</span>
            <select
              value={selectedCampusZone}
              onChange={(e) => setSelectedCampusZone(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              aria-label="Campus Source Location"
            >
              <option value="Block A">Block A (Academic)</option>
              <option value="Block B">Block B (Engineering Lab)</option>
              <option value="Hostel">Hostel Residence Wing</option>
              <option value="Canteen">Campus Canteen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs: Live Camera vs Upload from Gallery vs Desktop QR Mirror */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl w-full border border-slate-200 shadow-2xs">
          <button
            onClick={() => {
              setScanMode('camera');
              setSelectedImage(null);
              setAnalysisResult(null);
              setSavedMaterial(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scanMode === 'camera'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan with Camera</span>
          </button>

          <button
            onClick={() => {
              setScanMode('upload');
              stopCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scanMode === 'upload'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload from Gallery</span>
          </button>

          <button
            onClick={() => {
              setScanMode('qr-mirror');
              stopCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scanMode === 'qr-mirror'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-300" />
            <span>Mobile QR Mirror</span>
          </button>
        </div>
      </div>

      {/* FEATURE 1: QR CODE MOBILE COMPANION SCANNER & SCREEN MIRROR */}
      {scanMode === 'qr-mirror' && (
        <QrScreenMirror onScanCompleted={handleQrMirrorCompleted} />
      )}

      {/* FEATURE 2 & 3: LIVE CAMERA OR FILE UPLOAD & RESULTS VIEW */}
      {(scanMode !== 'qr-mirror' || analysisResult || selectedImage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Webcam or File Dropzone */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  {scanMode === 'camera' ? (
                    <>
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>Live Camera Viewfinder</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-emerald-700" />
                      <span>Selected Specimen Image</span>
                    </>
                  )}
                </h2>

                <div className="flex items-center gap-2">
                  {scanMode === 'camera' && cameraActive && !selectedImage && (
                    <>
                      <button
                        onClick={handleToggleFacingMode}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Switch camera lens (rear/front)"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                        <span className="capitalize">{cameraFacingMode === 'environment' ? 'Rear' : 'Front'}</span>
                      </button>
                      <button
                        onClick={stopCamera}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        title="Close live camera"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Camera Scanner Viewport */}
              {scanMode === 'camera' && !selectedImage && (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner group">
                  {/* Video element is permanently mounted inside viewfinder so videoRef.current is never null on mobile */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    onLoadedMetadata={async () => {
                      try {
                        if (videoRef.current) {
                          videoRef.current.muted = true;
                          videoRef.current.playsInline = true;
                          await videoRef.current.play();
                        }
                      } catch (err) {
                        console.warn('Metadata play error:', err);
                      }
                    }}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      cameraActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                    }`}
                  />

                  {/* State A: Camera Active Viewfinder Overlays & Reticle */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-5">
                      <div className="w-full flex justify-between items-center">
                        <div className="w-7 h-7 border-t-2 border-l-2 border-emerald-400" />
                        <div className="px-2.5 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-xs text-[10px] font-mono text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>LIVE LENS ({cameraFacingMode === 'environment' ? 'REAR' : 'FRONT'})</span>
                        </div>
                        <div className="w-7 h-7 border-t-2 border-r-2 border-emerald-400" />
                      </div>

                      <div className="relative w-48 h-48 sm:w-56 sm:h-56 border border-emerald-500/40 rounded-xl flex items-center justify-center overflow-hidden">
                        <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] absolute top-0 animate-bounce duration-1000" />
                        <div className="w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" />
                        <span className="absolute bottom-2 text-[10px] text-emerald-300 font-mono tracking-wider bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          ALIGN OBJECT
                        </span>
                      </div>

                      <div className="w-full flex justify-between">
                        <div className="w-7 h-7 border-b-2 border-l-2 border-emerald-400" />
                        <div className="w-7 h-7 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>
                  )}

                  {/* State B: Loading Camera */}
                  {cameraLoading && (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-white p-6 z-10">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
                      <p className="text-sm font-bold text-slate-100">Accessing Camera...</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
                        Please grant camera permission when prompted by your mobile browser.
                      </p>
                    </div>
                  )}

                  {/* State C: Camera Error with fallbacks */}
                  {cameraError && !cameraLoading && (
                    <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center text-white space-y-3 aspect-4/3 z-10 border border-rose-900/50">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                        <CameraOff className="w-6 h-6" />
                      </div>
                      <div className="max-w-xs">
                        <h4 className="font-bold text-sm text-slate-100">Camera Notice</h4>
                        <p className="text-xs text-rose-300 mt-1 leading-relaxed">{cameraError}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs pt-1">
                        <button
                          onClick={() => startCamera(cameraFacingMode)}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Try Again</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Upload from Gallery</span>
                        </button>
                      </div>
                      <button
                        onClick={() => nativeCameraInputRef.current?.click()}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline pt-1 cursor-pointer"
                      >
                        Or tap here to launch phone camera app directly
                      </button>
                    </div>
                  )}

                  {/* State D: Standby / Ready to Scan (Permission requested only on tap) */}
                  {!cameraActive && !cameraLoading && !cameraError && (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-lg">
                        <Camera className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Live Camera Ready</h3>
                      <p className="text-xs text-slate-300 max-w-xs mb-4">
                        Tap &quot;Scan with Camera&quot; to activate your phone camera and classify waste objects in real time.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
                        <button
                          onClick={() => startCamera('environment')}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ring-2 ring-emerald-500/40"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Scan with Camera</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        >
                          <UploadCloud className="w-4 h-4 text-emerald-400" />
                          <span>Choose from Gallery</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
                        <span>Prefers rear camera on mobile • Activates on tap</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Standard File Upload View */}
              {scanMode === 'upload' && !selectedImage && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-xl p-8 text-center cursor-pointer transition-all group aspect-4/3 flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mx-auto text-slate-500 group-hover:text-emerald-700 mb-3 transition-colors">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to choose photo from device gallery
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports camera photos, screenshots, or images up to 25MB
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    <UploadCloud className="w-4 h-4" />
                    <span>Browse Gallery / Files</span>
                  </div>
                </div>
              )}

              {/* Captured Image Preview */}
              {selectedImage && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-4/3 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Scanned specimen"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md cursor-pointer"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-lg flex items-center justify-between">
                    <span className="truncate">{imageFileName || 'Captured Specimen'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Trigger Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {analysisError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Analysis Notice</p>
                    <p>{analysisError}</p>
                  </div>
                </div>
              )}

              {scanMode === 'camera' && !selectedImage ? (
                cameraActive ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCaptureAndAnalyze}
                      disabled={analyzing}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 shadow-md cursor-pointer ring-4 ring-emerald-100"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Analyzing Object Directly...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          <span>📸 Snap & Classify Object</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 cursor-pointer"
                      title="Stop camera"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startCamera('environment')}
                      disabled={cameraLoading}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 shadow-md cursor-pointer ring-2 ring-emerald-400/40"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scan with Camera</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 cursor-pointer flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-700" />
                      <span>Gallery</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => triggerAnalysis(selectedImage!, imageMimeType)}
                    disabled={!selectedImage || analyzing}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all ${
                      !selectedImage || analyzing
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98 cursor-pointer'
                    }`}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing with Gemini 3.8 Flash...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>Analyze Material</span>
                      </>
                    )}
                  </button>

                  {scanMode === 'camera' && selectedImage && (
                    <button
                      onClick={handleRetakeCamera}
                      className="px-3.5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>
                  )}

                  {selectedImage && (
                    <button
                      onClick={handleClearImage}
                      className="px-3.5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Real-Time Results Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Detection & Knowledge Rules</span>
                </h2>

                {analysisResult && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                    {analysisResult.confidenceLevel} Confidence (~{analysisResult.confidencePercent}%)
                  </span>
                )}
              </div>

              {!analysisResult && !analyzing && (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">Awaiting specimen scan</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Scan with your mobile phone QR code above, snap with your webcam, or upload an image to analyze immediately.
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800">Processing visual features...</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Gemini 3.8 Flash is detecting material boundaries, polymers, and safety classifications.
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-4">
                  {/* Detected Title & Categories */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Identified Object
                    </span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {analysisResult.objectName}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-xs text-slate-600 font-medium capitalize">
                        Material: <strong className="text-slate-800">{analysisResult.materialType}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      {analysisResult.categories.map((c) => (
                        <CategoryBadge key={c} category={c} />
                      ))}
                    </div>
                  </div>

                  {/* Condition & Contamination */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Visible Condition</span>
                      <p className="text-slate-800 font-medium mt-0.5 text-[11px] leading-tight">
                        {analysisResult.condition || 'Clean & intact'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Contamination</span>
                      <p className="text-slate-800 font-medium mt-0.5 text-[11px] leading-tight">
                        {analysisResult.contamination || 'None observed'}
                      </p>
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-300/80">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Recommended Next Step</span>
                    </span>
                    <p className="text-xs text-emerald-950 font-medium mt-1 leading-relaxed">
                      {analysisResult.recommendedAction}
                    </p>
                    {analysisResult.alternativeAction && (
                      <p className="text-[11px] text-emerald-700 mt-1 italic">
                        Alternative: {analysisResult.alternativeAction}
                      </p>
                    )}
                  </div>

                  {/* Safety Precautions */}
                  {analysisResult.safetyWarnings && analysisResult.safetyWarnings.length > 0 && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Handling Safety Warnings</span>
                      </span>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-rose-900">
                        {analysisResult.safetyWarnings.map((warning, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Target Bin Indicator */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-700" />
                      <span>Suggested Campus Bin:</span>
                    </span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Bin {analysisResult.targetBinId || 'B01'} ({bins.find((b) => b.id === analysisResult.targetBinId)?.name || 'Recyclables'})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Track This Material / Ask AI */}
            {analysisResult && (
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                {savedMaterial ? (
                  <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Saved as {savedMaterial.id}</span>
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Now active in Campus Digital Twin & Material Journey.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToJourney(savedMaterial.id)}
                      className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 transition-colors shadow-2xs"
                    >
                      View Timeline
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTrackMaterial}
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Track This Material (Generate ID)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (savedMaterial) {
                      onNavigateToAssistant(savedMaterial);
                    } else {
                      const transientItem: TrackedMaterial = {
                        id: 'NEW-SCAN',
                        objectName: analysisResult.objectName,
                        materialType: analysisResult.materialType,
                        categories: analysisResult.categories,
                        confidenceLevel: analysisResult.confidenceLevel,
                        condition: analysisResult.condition,
                        recommendedAction: analysisResult.recommendedAction,
                        safetyWarnings: analysisResult.safetyWarnings || [],
                        explanation: analysisResult.explanation,
                        sourceLocation: selectedCampusZone,
                        currentStatus: 'Identified',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        history: [],
                        isSample: false,
                      };
                      onNavigateToAssistant(transientItem);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  <span>Ask AI About This Item</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
