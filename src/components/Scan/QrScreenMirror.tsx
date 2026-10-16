import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Smartphone,
  Tv,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Radio,
  Sparkles,
  Maximize2,
  X,
  RotateCcw,
  Camera,
  Check,
} from 'lucide-react';
import { AnalysisResult } from '../../types';
import { MobileCompanionView } from './MobileCompanionView';

interface QrScreenMirrorProps {
  onScanCompleted: (analysis: AnalysisResult, imageBase64: string) => void;
  activeSessionId?: string;
}

export function QrScreenMirror({ onScanCompleted }: QrScreenMirrorProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionUrl, setSessionUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [largeQrModal, setLargeQrModal] = useState<boolean>(false);
  const [mobileSimulatorModal, setMobileSimulatorModal] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<
    'loading' | 'waiting' | 'connected' | 'streaming' | 'analyzing' | 'completed' | 'error'
  >('loading');
  const [deviceName, setDeviceName] = useState<string>('');
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [fullPhoto, setFullPhoto] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  const pollIntervalRef = useRef<any>(null);
  const lastCompletedPhotoRef = useRef<string | null>(null);

  // Initialize companion session with public origin
  const createSession = async () => {
    setSessionStatus('loading');
    setPreviewFrame(null);
    setFullPhoto(null);
    setLastAnalysis(null);

    try {
      const res = await fetch('/api/mirror/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientOrigin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error('Failed to create mirror session');

      setSessionId(data.sessionId);
      setSessionUrl(data.sessionUrl);
      setSessionStatus('waiting');

      // Generate sharp high-contrast QR code
      const qrUrl = await QRCode.toDataURL(data.sessionUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#022c22', // emerald-950
          light: '#ffffff',
        },
      });
      setQrDataUrl(qrUrl);
    } catch (err: any) {
      console.error('Session creation error:', err);
      setSessionStatus('error');
    }
  };

  useEffect(() => {
    createSession();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll session state every 500ms
  useEffect(() => {
    if (!sessionId) return;

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/mirror/${sessionId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.session) {
          const s = data.session;
          setSessionStatus(s.status);
          if (s.mobileDeviceName) setDeviceName(s.mobileDeviceName);
          if (s.previewFrame) setPreviewFrame(s.previewFrame);
          if (s.fullImage) setFullPhoto(s.fullImage);

          if (s.status === 'completed' && s.analysis && s.fullImage) {
            if (lastCompletedPhotoRef.current !== s.fullImage) {
              lastCompletedPhotoRef.current = s.fullImage;
              setLastAnalysis(s.analysis);
              onScanCompleted(s.analysis, s.fullImage);
            }
          }
        }
      } catch (e) {
        // network poll ignore
      }
    }, 500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId, onScanCompleted]);

  const handleCopyLink = () => {
    if (!sessionUrl) return;
    navigator.clipboard.writeText(sessionUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleResetForNext = async () => {
    lastCompletedPhotoRef.current = null;
    setLastAnalysis(null);
    setFullPhoto(null);
    setSessionStatus('streaming');
    try {
      await fetch(`/api/mirror/${sessionId}/reset`, { method: 'POST' });
    } catch (e) {}
  };

  return (
    <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>Mobile Phone QR Scanner & Live Feed Mirror</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Direct Mobile Camera
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan this QR code with your mobile camera to scan physical waste objects in real time!
            </p>
          </div>
        </div>

        {/* Live Session Status Pill */}
        <div className="flex items-center gap-2">
          {sessionStatus === 'waiting' && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Ready: Scan QR on Phone ({sessionId})</span>
            </span>
          )}

          {(sessionStatus === 'connected' || sessionStatus === 'streaming') && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{deviceName || 'Mobile Phone'} Connected & Live!</span>
            </span>
          )}

          {sessionStatus === 'analyzing' && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Gemini 3.8 Flash Analyzing Mobile Photo...</span>
            </span>
          )}

          {sessionStatus === 'completed' && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Scan Synced from Phone!</span>
            </span>
          )}
        </div>
      </div>

      {/* Main View Area: QR Code + Connection Instructions vs Mirrored Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: QR Code + Instructions (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center text-center p-5 bg-slate-950/70 rounded-xl border border-slate-800">
          {sessionStatus === 'loading' ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs text-slate-400">Generating direct mobile scanner QR...</p>
            </div>
          ) : qrDataUrl ? (
            <div className="space-y-3.5 w-full max-w-xs flex flex-col items-center">
              <div className="relative group">
                <div className="p-2.5 bg-white rounded-2xl inline-block shadow-xl shadow-emerald-950/60 border-2 border-emerald-500/40">
                  <img
                    src={qrDataUrl}
                    alt="Scan QR to open Mobile Camera Scanner"
                    className="w-56 h-56 object-contain rounded-lg"
                  />
                </div>
                <button
                  onClick={() => setLargeQrModal(true)}
                  className="absolute bottom-4 right-4 p-2 bg-slate-900/90 text-white rounded-lg shadow-md hover:bg-emerald-600 transition-colors"
                  title="Enlarge QR Code"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-widest text-emerald-300 bg-emerald-950 border border-emerald-700/60 font-bold uppercase mb-1">
                  Session PIN: {sessionId}
                </span>
                <p className="text-xs text-slate-200 font-bold">
                  1. Scan with iPhone or Android Camera
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  No app download needed • Directly uses phone camera to classify real physical waste
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={() => setMobileSimulatorModal(true)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 border border-emerald-400/30"
                  title="Open simulated phone camera scanner right on this screen"
                >
                  <Smartphone className="w-4 h-4 text-emerald-200" />
                  <span>📱 Launch Phone Simulator (Test Here)</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                </button>

                <a
                  href={sessionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 px-3 bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-emerald-600/50 shadow-xs"
                  title="Open companion scanner in a new window to test without phone"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Open in Tab</span>
                </a>

                <button
                  onClick={createSession}
                  className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700"
                  title="Generate Fresh Session QR"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={createSession}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white"
            >
              Retry Generating QR Code
            </button>
          )}
        </div>

        {/* Right Side: Mirrored Viewport (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 aspect-4/3 relative flex items-center justify-center overflow-hidden shadow-inner">
          {sessionStatus === 'waiting' && !previewFrame && (
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-md">
                <Camera className="w-8 h-8 animate-pulse text-emerald-400" />
              </div>
              <h4 className="font-bold text-sm text-slate-200">Waiting for Mobile Camera to Scan Objects</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Scan the QR code on the left with your phone camera. As soon as you point your phone at physical objects (plastic bottles, cups, paper, e-waste), the live viewfinder mirrors onto this screen!
              </p>
              <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-focus
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero installation
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Instant Gemini AI
                </span>
              </div>
            </div>
          )}

          {/* Real-time Mirrored Live Feed from Phone Camera */}
          {(sessionStatus === 'connected' || sessionStatus === 'streaming') && previewFrame && !fullPhoto && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={previewFrame}
                alt="Mirrored Mobile Camera Stream"
                className="w-full h-full object-cover"
              />

              {/* Mirrored HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-5">
                <div className="w-full flex justify-between items-center">
                  <div className="w-7 h-7 border-t-2 border-l-2 border-emerald-400" />
                  <div className="px-2.5 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-xs text-[10px] font-mono text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                    <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                    <span>LIVE STREAM: {deviceName.toUpperCase()}</span>
                  </div>
                  <div className="w-7 h-7 border-t-2 border-r-2 border-emerald-400" />
                </div>

                <div className="relative w-48 h-48 border border-emerald-500/50 rounded-xl flex items-center justify-center overflow-hidden">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] absolute top-0 animate-bounce duration-1000" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 animate-ping" />
                  <span className="absolute bottom-2 text-[9px] font-mono tracking-widest text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    TARGETING OBJECT
                  </span>
                </div>

                <div className="w-full flex justify-between">
                  <div className="w-7 h-7 border-b-2 border-l-2 border-emerald-400" />
                  <div className="w-7 h-7 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>
            </div>
          )}

          {/* Analyzing Mirrored Photo */}
          {sessionStatus === 'analyzing' && fullPhoto && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img src={fullPhoto} alt="Captured Specimen" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                <h4 className="font-bold text-sm text-slate-100">Analyzing Object with Gemini 3.8 Flash...</h4>
                <p className="text-xs text-slate-300 max-w-xs">
                  Identifying polymer, recyclability, contamination, and campus bin destination from your phone&apos;s capture!
                </p>
              </div>
            </div>
          )}

          {/* Completed Mirrored Photo & Ready to Track */}
          {sessionStatus === 'completed' && fullPhoto && (
            <div className="relative w-full h-full flex flex-col justify-between p-4 bg-slate-950">
              <div className="relative w-full h-56 rounded-lg overflow-hidden bg-black border border-slate-800">
                <img src={fullPhoto} alt="Scanned Object" className="w-full h-full object-contain" />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-[10px] font-semibold text-emerald-300 border border-emerald-600/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Captured on {deviceName} • Synced to Laptop</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400">Classified Item:</span>
                  <p className="font-bold text-emerald-400 text-sm">{lastAnalysis?.objectName || 'Identified Waste'}</p>
                </div>
                <button
                  onClick={handleResetForNext}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Next Object on Phone</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enlarge QR Modal for easy scanning across desks or in presentations */}
      {largeQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl">
            <button
              onClick={() => setLargeQrModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-white mb-1">Scan with Phone Camera</h3>
            <p className="text-xs text-slate-400 mb-4">
              Point your smartphone camera at this enlarged QR code
            </p>
            <div className="p-4 bg-white rounded-xl inline-block shadow-lg mx-auto">
              <img src={qrDataUrl} alt="Enlarged QR Code" className="w-64 h-64 object-contain" />
            </div>
            <div className="mt-4">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                PIN: {sessionId}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Mobile Companion Simulator Modal */}
      {mobileSimulatorModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-sm h-[88vh] max-h-[740px] rounded-[36px] border-4 border-slate-700 bg-black shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 pointer-events-none" />
            <MobileCompanionView
              sessionId={sessionId}
              onExit={() => setMobileSimulatorModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
