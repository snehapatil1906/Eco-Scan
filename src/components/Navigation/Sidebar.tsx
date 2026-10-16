import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Network,
  Milestone,
  Sparkles,
  Settings,
  Recycle,
  Leaf,
  Smartphone,
  QrCode,
  Camera,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  unprocessedCount?: number;
}

export function Sidebar({ currentTab, onTabChange, unprocessedCount = 0 }: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'scan',
      label: 'Scan Material',
      icon: ScanLine,
      highlight: true,
      badge: 'CV Vision',
    },
    {
      id: 'digital-twin',
      label: 'Digital Twin',
      icon: Network,
      badge: '2D Campus',
    },
    {
      id: 'journey',
      label: 'Material Journey',
      icon: Milestone,
      badge: unprocessedCount > 0 ? `${unprocessedCount} active` : undefined,
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      isAi: true,
      badge: 'GenAI',
    },
    {
      id: 'settings',
      label: 'Settings & About',
      icon: Settings,
      badge: undefined,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
            <Recycle className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              Eco Scan
            </h1>
            <p className="text-[11px] text-slate-300 font-medium">Campus Eco-Assistant</p>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 bg-slate-800/60 px-2.5 py-1.5 rounded-md border border-slate-700/60 flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Scan → Track → Circular Economy</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Ecosystem Hub
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? item.isAi
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? item.isAi
                        ? 'text-purple-400'
                        : 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    item.isAi
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
                      : isActive
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Camera Scanner Quick Action */}
      <div className="p-3 mx-3 mb-2 rounded-xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 text-left">
        <div className="flex items-center gap-2 mb-1.5">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">Live Camera Scanner</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug mb-2.5">
          Use your device camera or upload from gallery to classify waste in real time.
        </p>
        <button
          onClick={() => onTabChange('scan')}
          className="w-full py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Open Scanner</span>
        </button>
      </div>

      {/* Hackathon Campus Footer Banner */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/40">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-slate-300">Target Community</span>
          <span className="text-[10px] bg-teal-900/60 text-teal-300 px-1.5 py-0.5 rounded border border-teal-700/50">
            College Campus
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Block A • Block B • Hostel • Canteen
        </p>
      </div>
    </aside>
  );
}
