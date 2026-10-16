import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  SwitchCamera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Tv,
  Radio,
  Recycle,
  ShieldAlert,
  MapPin,
  X,
  Zap,
  Flashlight,
  QrCode,
  Save,
  Check,
} from 'lucide-react';
import { AnalysisResult, TrackedMaterial } from '../../types';
import { CategoryBadge } from '../Common/Badge';
import { storageService } from '../../services/storageService';
import { compressImageToDataUrl } from '../../utils/imageCompressor';

interface MobileCompanionViewProps {
  sessionId: string;
  onExit: () => void;
}

export function MobileCompanionView({ sessionId, onExit }: MobileCompanionViewProps) {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [connectedToLaptop, setConnectedToLaptop] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [shutterFlashing, setShutterFlashing] = useState<boolean>(false);
  const [savedToTwin, setSavedToTwin] = useState<boolean>(false);
  const [barcodeScanMode, setBarcodeScanMode] = useState<boolean>(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<any>(null);
  const barcodeIntervalRef = useRef<any>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const analyzingRef = useRef(analyzing);
  analyzingRef.current = analyzing;

  const capturedPhotoRef = useRef(capturedPhoto);
  capturedPhotoRef.current = capturedPhoto;

  // Play synthetic camera shutter audio using Web Audio API
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // AudioContext not available or blocked
    }
  };

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (barcodeIntervalRef.current) {
      clearInterval(barcodeIntervalRef.current);
      barcodeIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Connect phone to laptop companion session
  useEffect(() => {
    const connectToSession = async () => {
      try {
        const userAgent = navigator.userAgent;
        let deviceName = 'Mobile Phone';
        if (/iPhone/i.test(userAgent)) deviceName = 'Apple iPhone';
        else if (/Android/i.test(userAgent)) deviceName = 'Android Mobile';
        else if (/iPad/i.test(userAgent)) deviceName = 'iPad';

        await fetch(`/api/mirror/${sessionId}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceName }),
        });
        setConnectedToLaptop(true);
      } catch (e) {
        console.warn('Failed to register connection with session:', e);
      }
    };

    connectToSession();
  }, [sessionId]);

  // Start mobile camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setTorchOn(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Direct camera API is restricted in this browser context.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      // Check for torch capability on rear camera
      try {
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities && track.getCapabilities()) as any;
        setHasTorch(Boolean(caps && caps.torch));
      } catch {
        setHasTorch(false);
      }

      // Stream preview frames to mirror on laptop screen every 600ms
      frameIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current || analyzingRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0) return;

        // Downscale frame for fast, low-latency mirroring over HTTP
        canvas.width = 360;
        canvas.height = (video.videoHeight / video.videoWidth) * 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameBase64 = canvas.toDataURL('image/jpeg', 0.55);
          fetch(`/api/mirror/${sessionId}/frame`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frameBase64 }),
          }).catch(() => {});
        }
      }, 600);

      // Optional: Check for barcodes / QR codes on objects if supported
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
          });
          barcodeIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || analyzingRef.current || capturedPhotoRef.current) return;
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                setDetectedBarcode(code);
              }
            } catch {
              // ignore frame read errors
            }
          }, 800);
        } catch {}
      }
    } catch (err: any) {
      console.warn('Phone camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was not granted. Tap "Open Native Camera" below to scan directly using your phone camera!'
          : err.message || 'Could not open mobile camera stream.'
      );
      setCameraActive(false);
    }
  }, [facingMode, sessionId, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Flip camera between front and back
  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      }
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Trigger analysis for captured image
  const analyzeCapturedImage = async (photoBase64: string, mime: string = 'image/jpeg') => {
    setCapturedPhoto(photoBase64);
    setAnalyzing(true);
    setCameraError(null);
    setSavedToTwin(false);

    // Stop continuous frame stream while analyzing
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    try {
      // Ensure image is cleanly compressed for rapid AI processing
      const compressed = await compressImageToDataUrl(photoBase64, 1280, 0.85);
      const response = await fetch(`/api/mirror/${sessionId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.dataUrl,
          mimeType: compressed.mimeType,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e: any) {
      console.error('Scan error:', e);
      setCameraError(e.message || 'Failed to analyze photo with Gemini AI. Tap retry or scan again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Capture full resolution photo from live stream and analyze
  const handleCaptureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || analyzing) return;

    // Trigger visual flash + sound + haptic feedback
    setShutterFlashing(true);
    playShutterSound();
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => setShutterFlashing(false), 120);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.88);

    await analyzeCapturedImage(photoBase64, 'image/jpeg');
  };

  // Direct native camera capture fallback (works 100% on all mobile devices)
  const handleNativeCameraInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      playShutterSound();
      if (navigator.vibrate) navigator.vibrate(40);
      const compressed = await compressImageToDataUrl(file, 1280, 0.85);
      await analyzeCapturedImage(compressed.dataUrl, compressed.mimeType);
    } catch (err: any) {
      console.error('Failed to process camera photo:', err);
      setCameraError('Failed to process photo from camera.');
    }
  };

  // Reset to scan another physical object
  const handleResetForAnotherScan = async () => {
    setCapturedPhoto(null);
    setAnalysisResult(null);
    setCameraError(null);
    setSavedToTwin(false);
    setDetectedBarcode(null);
    try {
      await fetch(`/api/mirror/${sessionId}/reset`, { method: 'POST' });
    } catch (e) {}
    startCamera();
  };

  // Save directly to Campus Digital Twin from mobile!
  const handleSaveToDigitalTwin = () => {
    if (!analysisResult) return;

    const newMaterial: TrackedMaterial = {
      id: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      objectName: analysisResult.objectName,
      materialType: (analysisResult.materialType as any) || 'plastic',
      categories: analysisResult.categories as any,
      confidenceLevel: (analysisResult.confidenceLevel as any) || 'High',
      confidencePercent: analysisResult.confidencePercent || 92,
      condition: analysisResult.condition || 'Scanned via Mobile Camera',
      contamination: analysisResult.contamination || 'None observed',
      recommendedAction: analysisResult.recommendedAction,
      alternativeAction: analysisResult.alternativeAction,
      safetyWarnings: analysisResult.safetyWarnings,
      explanation: analysisResult.explanation,
      sourceLocation: 'Mobile Scan',
      assignedBinId: analysisResult.targetBinId || 'B01',
      intendedDestination: 'Campus Recycling Facility',
      currentStatus: 'Assigned to Bin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'Assigned to Bin',
          locationOrFacility: `Campus Bin ${analysisResult.targetBinId || 'B01'}`,
          actor: 'Mobile Phone User',
          note: `Scanned with mobile phone camera and synced live to session ${sessionId}.`,
          isSimulated: false,
        },
      ],
      isSample: false,
      imageDataUrl: capturedPhoto || undefined,
      estimatedWeightKg: 0.25,
    };

    storageService.addMaterial(newMaterial);
    setSavedToTwin(true);
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Hidden processing canvas & native camera file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCameraInput}
      />

      {/* Shutter flash overlay */}
      {shutterFlashing && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-75 opacity-90" />
      )}

      {/* Top Mobile Bar: Live Connection Status */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Recycle className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>Mobile Object Scanner</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h2>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <Tv className="w-3 h-3" />
              <span>Mirroring to PC ({sessionId})</span>
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Exit Mobile View"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Viewport: Live Camera Feed OR Analysis Result */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {!capturedPhoto ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Targeting Reticle & Alignment HUD */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-5">
                {/* Top HUD */}
                <div className="w-full flex justify-between items-center">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
                  <div className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-xs text-[10px] font-mono text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>POINT AT OBJECT</span>
                  </div>
                  <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
                </div>

                {/* Central Targeting Frame */}
                <div className="relative w-64 h-64 border border-emerald-500/50 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                  {/* Laser scan line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] absolute top-0 animate-bounce duration-1000" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/90 animate-ping" />
                  <span className="absolute bottom-2.5 text-[9px] font-mono tracking-widest text-emerald-300 bg-slate-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40">
                    ALIGN BOTTLE, CAN OR WASTE
                  </span>
                </div>

                {/* Detected Barcode Toast (if object packaging has barcode) */}
                {detectedBarcode && (
                  <div className="pointer-events-auto bg-slate-900/90 border border-emerald-500/60 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 shadow-lg">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Packaging Code: {detectedBarcode}</span>
                  </div>
                )}

                {/* Bottom HUD */}
                <div className="w-full flex justify-between">
                  <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>
            )}

            {/* Error or Restricted Permissions Box */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center space-y-4 z-30">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">Camera Notice</h4>
                  <p className="text-xs text-rose-300 mt-1 max-w-xs leading-relaxed">{cameraError}</p>
                </div>

                <div className="space-y-2 w-full max-w-xs pt-2">
                  <button
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Phone Camera Shutter Directly</span>
                  </button>

                  <button
                    onClick={() => startCamera()}
                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Retry Browser Permission
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Captured Photo & Result Card */
          <div className="w-full h-full relative flex flex-col justify-between p-4 bg-slate-900 overflow-y-auto">
            {/* Thumbnail Preview */}
            <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-black border border-slate-700 shrink-0">
              <img src={capturedPhoto} alt="Captured Object" className="w-full h-full object-contain" />
              <div className="absolute top-2 left-2 bg-slate-900/85 px-2.5 py-1 rounded-md text-[10px] font-semibold text-emerald-300 flex items-center gap-1.5 border border-emerald-500/30 shadow-xs">
                <Tv className="w-3 h-3" />
                <span>Mirrored to Laptop</span>
              </div>
            </div>

            {analyzing && (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-slate-100">Analyzing Object with Gemini 3.8 Flash...</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Identifying material polymers, recyclability, and designated campus bin destination.
                </p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-3 mt-3">
                <div className="p-3.5 bg-slate-800 rounded-xl border border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Identified Object
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      {analysisResult.confidencePercent || 94}% Confidence
                    </span>
                  </div>
                  <div className="text-base font-bold text-white mt-1">{analysisResult.objectName}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-xs text-slate-300 capitalize font-medium">
                      {analysisResult.materialType}
                    </span>
                    <span className="text-slate-500">•</span>
                    {analysisResult.categories.map((c) => (
                      <CategoryBadge key={c} category={c} />
                    ))}
                  </div>
                </div>

                {/* Recommended Handling Action */}
                <div className="p-3.5 bg-emerald-950/80 rounded-xl border border-emerald-600/60 text-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                    Recommended Handling
                  </span>
                  <p className="text-slate-200 mt-1 leading-relaxed">{analysisResult.recommendedAction}</p>
                </div>

                {/* Target Campus Bin */}
                <div className="p-3 bg-slate-800/90 rounded-xl flex items-center justify-between text-xs border border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
                      {analysisResult.targetBinId || 'B01'}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Designated Campus Bin</span>
                      <span className="font-bold text-slate-200">
                        Deposit into Bin {analysisResult.targetBinId || 'B01'}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Shutter & Controls Bar */}
      <div className="p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-20 shrink-0">
        {!capturedPhoto ? (
          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
            <div className="w-full flex items-center justify-between">
              {/* Flip Camera */}
              <button
                onClick={handleToggleFacing}
                className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-full text-slate-200 transition-colors shadow-xs"
                title="Flip Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* Main Shutter Button */}
              <button
                onClick={() => {
                  if (cameraActive) {
                    handleCaptureAndScan();
                  } else {
                    nativeCameraInputRef.current?.click();
                  }
                }}
                disabled={analyzing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  !analyzing
                    ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-slate-950 shadow-xl shadow-emerald-500/40 ring-4 ring-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 opacity-60'
                }`}
                aria-label="Capture and Scan Object"
              >
                <div className="w-16 h-16 rounded-full border-2 border-slate-950/40 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
              </button>

              {/* Flashlight / Torch or Native Camera */}
              {hasTorch ? (
                <button
                  onClick={handleToggleTorch}
                  className={`p-3 rounded-full transition-colors ${
                    torchOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200'
                  }`}
                  title="Flashlight"
                >
                  <Flashlight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-full text-slate-200 transition-colors"
                  title="Use Phone Camera Shutter"
                >
                  <Zap className="w-5 h-5 text-amber-400" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => nativeCameraInputRef.current?.click()}
                className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <Camera className="w-3 h-3" />
                <span>Or tap here to launch phone camera app directly</span>
              </button>
            </div>
          </div>
        ) : (
          /* Controls after Capture */
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToDigitalTwin}
                disabled={savedToTwin || !analysisResult}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                  savedToTwin
                    ? 'bg-emerald-800 text-emerald-200 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {savedToTwin ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{savedToTwin ? 'Saved to Digital Twin!' : 'Save to Campus Twin'}</span>
              </button>

              <button
                onClick={handleResetForAnotherScan}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Scan Next</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
