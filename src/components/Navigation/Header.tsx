import React from 'react';
import { StorageBadge } from '../Common/StorageBadge';
import { Menu, X, Recycle, Sparkles, PlusCircle, QrCode, Smartphone, Camera } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export function Header({
  currentTab,
  onTabChange,
  mobileMenuOpen,
  setMobileMenuOpen,
}: HeaderProps) {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Campus Recycling Ecosystem Overview';
      case 'scan':
        return 'Computer Vision Material Scanner';
      case 'digital-twin':
        return 'Campus Digital Twin & Material Flow';
      case 'journey':
        return 'Material Lifecycle & Journey Tracking';
      case 'assistant':
        return 'Personalized Circular Economy AI';
      case 'settings':
        return 'System Settings & Architecture';
      default:
        return 'Eco Scan';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Tab title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white border border-slate-800">
              <Recycle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white bg-slate-900 px-2.5 py-1 rounded-md">
              Eco Scan
            </span>
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wider uppercase px-2 py-0.5 rounded bg-slate-900 text-white shadow-xs">
                Eco Scan
              </span>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                {getTabTitle(currentTab)}
              </h2>
            </div>
            <p className="text-xs text-slate-500 hidden lg:block mt-0.5">
              Scan → Understand → Track → Act → Build a Circular Economy
            </p>
          </div>
        </div>

        {/* Right: Quick Action + Persistence Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onTabChange('scan')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Open camera scanner"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Camera Scanner</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {currentTab !== 'scan' && (
            <button
              onClick={() => onTabChange('scan')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Scan Item</span>
            </button>
          )}

          <StorageBadge />
        </div>
      </div>
    </header>
  );
}

export function MobileNav({
  currentTab,
  onTabChange,
  isOpen,
  setIsOpen,
}: {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'scan', label: 'Scan Material' },
    { id: 'digital-twin', label: 'Digital Twin' },
    { id: 'journey', label: 'Material Journey' },
    { id: 'assistant', label: 'AI Assistant' },
    { id: 'settings', label: 'Settings & About' },
  ];

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-start pt-16 px-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-2 divide-y divide-slate-100">
        <div className="p-3 bg-slate-900 rounded-lg mb-2 border border-slate-800">
          <p className="text-sm font-extrabold text-white">Eco Scan</p>
          <p className="text-[11px] text-slate-300">Campus Circular Economy Platform</p>
        </div>
        <div className="py-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pt-2 px-2 pb-1">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-xs py-2 text-slate-500 hover:text-slate-800"
          >
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
}
