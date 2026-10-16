import React, { useState } from 'react';
import { Database, Info, HardDrive } from 'lucide-react';

export function StorageBadge() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
        aria-label="Storage status info"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
        <span>Demo Mode — Local Storage (Device Only)</span>
        <Info className="w-3 h-3 text-emerald-600 ml-0.5" />
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-white text-slate-800 text-xs rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-2 mb-1.5">
            <Database className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span className="font-semibold text-slate-900">Local Persistence Active</span>
          </div>
          <p className="text-slate-600 leading-relaxed mb-2">
            Your scanned materials, Digital Twin stages, and preferences are saved in your browser&apos;s LocalStorage. Data is not shared across devices.
          </p>
          <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-500">
            Cloud Firestore database structure is ready for production scaling.
          </div>
        </div>
      )}
    </div>
  );
}
