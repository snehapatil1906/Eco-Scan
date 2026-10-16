import React, { useState, useMemo } from 'react';
import {
  TrackedMaterial,
  WorkflowStatus,
  TimelineEvent,
  CampusBin,
} from '../types';
import { StatusBadge, CategoryBadge, DemoBadge } from '../components/Common/Badge';
import {
  Milestone,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Truck,
  Trash2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  MapPin,
  Calendar,
} from 'lucide-react';

interface MaterialJourneyPageProps {
  materials: TrackedMaterial[];
  selectedMaterialId?: string | null;
  onSelectMaterial: (id: string) => void;
  onAdvanceStatus: (materialId: string, nextStatus: WorkflowStatus, note: string) => void;
  onNavigateToAssistant: (material: TrackedMaterial) => void;
  bins: CampusBin[];
}

// Standard sequential workflow chain
const WORKFLOW_ORDER: WorkflowStatus[] = [
  'Identified',
  'Assigned to Bin',
  'Collected',
  'At Sorting Center',
  'Sent to Destination',
  'Processed',
];

export function MaterialJourneyPage({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  onAdvanceStatus,
  onNavigateToAssistant,
  bins,
}: MaterialJourneyPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advanceModalOpen, setAdvanceModalOpen] = useState<boolean>(false);
  const [advanceTargetStatus, setAdvanceTargetStatus] = useState<WorkflowStatus>('Assigned to Bin');
  const [advanceCustomNote, setAdvanceCustomNote] = useState<string>('');

  // Currently focused material
  const activeMaterial = useMemo(() => {
    if (selectedMaterialId) {
      const found = materials.find((m) => m.id === selectedMaterialId);
      if (found) return found;
    }
    return materials[0] || null;
  }, [materials, selectedMaterialId]);

  // Filter materials list
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.objectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sourceLocation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || m.currentStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [materials, searchQuery, statusFilter]);

  // Determine allowed next states based on current workflow status
  const validNextStates = useMemo<WorkflowStatus[]>(() => {
    if (!activeMaterial) return [];

    switch (activeMaterial.currentStatus) {
      case 'Identified':
        return ['Assigned to Bin', 'Awaiting Verification'];
      case 'Assigned to Bin':
        return ['Collected', 'Awaiting Verification'];
      case 'Collected':
        return ['At Sorting Center'];
      case 'At Sorting Center':
        return ['Sent to Destination', 'Rejected'];
      case 'Sent to Destination':
        if (activeMaterial.categories.includes('Reusable')) {
          return ['Reused', 'Processed'];
        }
        if (activeMaterial.categories.includes('Biodegradable')) {
          return ['Composted'];
        }
        return ['Processed', 'Rejected'];
      default:
        return [];
    }
  }, [activeMaterial]);

  // Execute stage advance
  const handleConfirmAdvance = () => {
    if (!activeMaterial) return;

    const defaultNotes: Record<string, string> = {
      'Assigned to Bin': `Deposited into Campus Bin ${activeMaterial.assignedBinId || 'B01'} at ${activeMaterial.sourceLocation}.`,
      'Collected': 'Collected by EcoShuttle EV-01 on morning campus logistics route.',
      'At Sorting Center': 'Delivered to Campus Central Sorting Hub; passed contamination check.',
      'Sent to Destination': `Dispatched in sealed batch to ${activeMaterial.intendedDestination || 'Regional MRF'}.`,
      'Processed': 'Mechanical pelletizing & shredding completed; turned into raw recycled flake.',
      'Reused': 'Accepted into student community library / EcoSwap depot for ongoing reuse.',
      'Composted': 'Converted into dark organic humus inside aerobic composting bioreactor.',
      'Rejected': 'Flagged as contaminated or unrecyclable; redirected to managed recovery.',
      'Awaiting Verification': 'Flagged for campus safety officer review before further processing.',
    };

    const finalNote = advanceCustomNote.trim() || defaultNotes[advanceTargetStatus] || 'Status advanced in Digital Twin.';

    onAdvanceStatus(activeMaterial.id, advanceTargetStatus, finalNote);
    setAdvanceModalOpen(false);
    setAdvanceCustomNote('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Chain of Custody Tracking
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Material Journey & Workflow Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically unique IDs track every item through physical handoffs, verifying each step.
          </p>
        </div>

        {activeMaterial && validNextStates.length > 0 && (
          <button
            onClick={() => {
              setAdvanceTargetStatus(validNextStates[0]);
              setAdvanceModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
          >
            <span>Advance Next Stage</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Layout: Master List on Left, Detailed Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Material Directory (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-[700px]">
          {/* Search & Filter Header */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID (e.g. M-1001), name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium"
              aria-label="Filter by Status"
            >
              <option value="all">All Lifecycle Statuses ({materials.length})</option>
              <option value="Identified">Identified</option>
              <option value="Assigned to Bin">Assigned to Bin</option>
              <option value="Collected">Collected</option>
              <option value="At Sorting Center">At Sorting Center</option>
              <option value="Sent to Destination">Sent to Destination</option>
              <option value="Processed">Processed</option>
              <option value="Reused">Reused</option>
              <option value="Composted">Composted</option>
            </select>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredMaterials.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-xs font-medium">No items found</p>
              </div>
            ) : (
              filteredMaterials.map((m) => {
                const isSelected = activeMaterial?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMaterial(m.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {m.id}
                      </span>
                      {m.isSample ? (
                        <DemoBadge />
                      ) : (
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                          Real
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                      {m.objectName}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span className="capitalize">{m.sourceLocation}</span>
                      <StatusBadge status={m.currentStatus} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Lifecycle Journey (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          {!activeMaterial ? (
            <div className="py-24 text-center text-slate-400">
              <p className="text-sm font-semibold">Select a material to inspect its chain of custody</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header card of selected material */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300">
                      {activeMaterial.id}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">
                      {activeMaterial.objectName}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                    <span className="capitalize">
                      Type: <strong className="text-slate-800">{activeMaterial.materialType}</strong>
                    </span>
                    <span>•</span>
                    <span>Origin: {activeMaterial.sourceLocation}</span>
                    <span>•</span>
                    <span>Logged: {new Date(activeMaterial.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToAssistant(activeMaterial)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                    <span>Ask AI About This</span>
                  </button>
                </div>
              </div>

              {/* Verified Chain of Custody Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sequential Workflow Timeline</span>
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {activeMaterial.history && activeMaterial.history.length > 0 ? (
                    activeMaterial.history.map((event, idx) => {
                      const isLatest = idx === activeMaterial.history.length - 1;
                      return (
                        <div key={event.id || idx} className="relative group">
                          {/* Dot indicator */}
                          <div
                            className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isLatest
                                ? 'bg-emerald-600 border-white ring-4 ring-emerald-100 text-white'
                                : 'bg-white border-emerald-600 text-emerald-600'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          </div>

                          {/* Event Card */}
                          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={event.status} />
                                <span className="font-semibold text-xs text-slate-800">
                                  {event.locationOrFacility}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 mt-1">{event.note}</p>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-200/60">
                              <span>Actor: {event.actor}</span>
                              {event.isSimulated && (
                                <span className="text-amber-800 font-medium">
                                  [Simulated Event]
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-xs text-slate-500 italic">No events recorded.</div>
                  )}
                </div>
              </div>

              {/* State Transition Action Bar */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Next Permitted Transitions
                    </span>
                    <p className="text-xs text-emerald-950 font-medium mt-0.5">
                      {validNextStates.length > 0
                        ? `Eligible to progress to: ${validNextStates.join(', ')}`
                        : 'This material has reached its terminal circular state (Processed / Reused / Composted).'}
                    </p>
                  </div>

                  {validNextStates.length > 0 && (
                    <button
                      onClick={() => {
                        setAdvanceTargetStatus(validNextStates[0]);
                        setAdvanceModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors shrink-0"
                    >
                      Advance to {validNextStates[0]}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advance Modal */}
      {advanceModalOpen && activeMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Advance Material State: {activeMaterial.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Progress this material through the campus circular economy workflow.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Next Status
                </label>
                <select
                  value={advanceTargetStatus}
                  onChange={(e) => setAdvanceTargetStatus(e.target.value as WorkflowStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                >
                  {validNextStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Note / Station (Optional)
                </label>
                <textarea
                  value={advanceCustomNote}
                  onChange={(e) => setAdvanceCustomNote(e.target.value)}
                  placeholder="e.g. Scanned at Sorting Center Gate 2, quality certified."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 h-20"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                Notice: Sequential transition rules enforce that items cannot jump directly to final processing without traversing bin and sorting checks.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setAdvanceModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdvance}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                Confirm Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
