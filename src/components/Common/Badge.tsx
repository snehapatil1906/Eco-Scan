import React from 'react';
import { MaterialCategory, WorkflowStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'category' | 'status' | 'outline' | 'purple' | 'demo';
  className?: string;
}

export function CategoryBadge({ category }: { category: MaterialCategory | string }) {
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (category === 'Recyclable') {
    colorStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (category === 'Reusable') {
    colorStyle = 'bg-teal-50 text-teal-800 border-teal-300';
  } else if (category === 'Biodegradable') {
    colorStyle = 'bg-lime-50 text-lime-800 border-lime-300';
  } else if (category === 'Hazardous') {
    colorStyle = 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse';
  } else if (category === 'General / non-recyclable') {
    colorStyle = 'bg-amber-50 text-amber-800 border-amber-300';
  } else if (category === 'Uncertain / needs verification') {
    colorStyle = 'bg-purple-50 text-purple-800 border-purple-300';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle}`}
    >
      {category}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkflowStatus | string }) {
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Identified':
      badgeColor = 'bg-sky-50 text-sky-800 border-sky-300';
      break;
    case 'Assigned to Bin':
      badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-300';
      break;
    case 'Collected':
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'At Sorting Center':
      badgeColor = 'bg-purple-50 text-purple-800 border-purple-300';
      break;
    case 'Sent to Destination':
      badgeColor = 'bg-blue-50 text-blue-800 border-blue-300';
      break;
    case 'Processed':
      badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      break;
    case 'Reused':
      badgeColor = 'bg-teal-50 text-teal-800 border-teal-300';
      break;
    case 'Composted':
      badgeColor = 'bg-lime-50 text-lime-800 border-lime-300';
      break;
    case 'Rejected':
      badgeColor = 'bg-rose-50 text-rose-800 border-rose-300';
      break;
    case 'Awaiting Verification':
      badgeColor = 'bg-yellow-50 text-yellow-800 border-yellow-300';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
      Demo Record
    </span>
  );
}
