import React, { useState } from 'react';
import {
  TrackedMaterial,
  CampusBin,
  CampusFacility,
  WorkflowStatus,
  MaterialType,
} from '../types';
import {
  DEFAULT_CAMPUS_FACILITIES,
} from '../services/storageService';
import { StatusBadge, CategoryBadge, DemoBadge } from '../components/Common/Badge';
import {
  Network,
  Truck,
  Building2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  MapPin,
  Play,
  Pause,
  AlertCircle,
  Eye,
  Info,
  Clock,
  Activity,
} from 'lucide-react';

interface DigitalTwinPageProps {
  materials: TrackedMaterial[];
  bins: CampusBin[];
  onAdvanceMaterial: (materialId: string, nextStatus: WorkflowStatus, note: string) => void;
  onNavigateToJourney: (materialId: string) => void;
  onNavigateToAssistant: (material: TrackedMaterial) => void;
}

export function DigitalTwinPage({
  materials,
  bins,
  onAdvanceMaterial,
  onNavigateToJourney,
  onNavigateToAssistant,
}: DigitalTwinPageProps) {
  const [selectedNode, setSelectedNode] = useState<{
    type: 'zone' | 'bin' | 'vehicle' | 'facility';
    data: any;
  } | null>(null);

  const [filterMaterialType, setFilterMaterialType] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStepMessage, setSimStepMessage] = useState<string | null>(null);

  // Group materials by stage in the Digital Twin
  const materialsInZones = materials.filter((m) => m.currentStatus === 'Identified');
  const materialsInBins = materials.filter((m) => m.currentStatus === 'Assigned to Bin');
  const materialsInTransit = materials.filter((m) => m.currentStatus === 'Collected');
  const materialsInSorting = materials.filter((m) => m.currentStatus === 'At Sorting Center');
  const materialsInDestination = materials.filter((m) => m.currentStatus === 'Sent to Destination');
  const materialsRecovered = materials.filter(
    (m) => m.currentStatus === 'Processed' || m.currentStatus === 'Reused' || m.currentStatus === 'Composted'
  );

  // Step-by-step Demo Simulation Runner
  const handleRunSimulationStep = () => {
    // Find an item eligible to advance
    const candidate = materials.find(
      (m) =>
        m.currentStatus === 'Identified' ||
        m.currentStatus === 'Assigned to Bin' ||
        m.currentStatus === 'Collected' ||
        m.currentStatus === 'At Sorting Center' ||
        m.currentStatus === 'Sent to Destination'
    );

    if (!candidate) {
      setSimStepMessage('All active items in the ecosystem have completed their circular journey!');
      return;
    }

    let nextStatus: WorkflowStatus = 'Assigned to Bin';
    let stepNote = '';

    if (candidate.currentStatus === 'Identified') {
      nextStatus = 'Assigned to Bin';
      stepNote = `Deposited into assigned Campus Bin ${candidate.assignedBinId || 'B01'}.`;
    } else if (candidate.currentStatus === 'Assigned to Bin') {
      nextStatus = 'Collected';
      stepNote = 'EcoShuttle EV-01 collected item from bin station.';
    } else if (candidate.currentStatus === 'Collected') {
      nextStatus = 'At Sorting Center';
      stepNote = 'Received at Campus Central Sorting Hub for inspection & bailing.';
    } else if (candidate.currentStatus === 'At Sorting Center') {
      nextStatus = 'Sent to Destination';
      stepNote = `Dispatched to ${candidate.intendedDestination || 'Regional MRF'}.`;
    } else if (candidate.currentStatus === 'Sent to Destination') {
      if (candidate.categories.includes('Reusable')) {
        nextStatus = 'Reused';
        stepNote = 'Adopted and circulating in campus student community.';
      } else if (candidate.categories.includes('Biodegradable')) {
        nextStatus = 'Composted';
        stepNote = 'Converted into nutrient-rich compost in aerobic unit.';
      } else {
        nextStatus = 'Processed';
        stepNote = 'Recycled into clean secondary raw material pellets.';
      }
    }

    onAdvanceMaterial(candidate.id, nextStatus, stepNote);
    setSimStepMessage(
      `[Simulation Step]: Advanced "${candidate.objectName}" (${candidate.id}) to "${nextStatus}".`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Simulation Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Campus 2D Digital Twin
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Simulation Engine (Virtual Sensor Models)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Interactive Campus Material Flow Ecosystem
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time digital representation of physical collection bins, logistics shuttle, sorting hub, and recovery depots.
          </p>
        </div>

        {/* Simulation step button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunSimulationStep}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Advance Simulation Step</span>
          </button>
        </div>
      </div>

      {simStepMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{simStepMessage}</span>
          </div>
          <button
            onClick={() => setSimStepMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2D Interactive Campus Ecosystem Map */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">
              Live Topology State: Active Simulation
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Click any node, bin, or facility to view live telemetry</span>
          </div>
        </div>

        {/* 5-Stage Visual Workflow Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* STAGE 1: Campus Generation Zones */}
          <div className="space-y-3">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Campus Sources
              </span>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {materialsInZones.length} items logged
              </div>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Block A (Academic)', zone: 'Block A', desc: 'Plastics & Paper' },
                { name: 'Block B (Engg Labs)', zone: 'Block B', desc: 'E-Waste & Batteries' },
                { name: 'Hostel Wing B', zone: 'Hostel', desc: 'Cardboard & Glass' },
                { name: 'Campus Canteen', zone: 'Canteen', desc: 'Organics & Food Scraps' },
              ].map((zone) => {
                const zoneCount = materialsInZones.filter((m) => m.sourceLocation === zone.zone).length;
                return (
                  <button
                    key={zone.zone}
                    onClick={() => setSelectedNode({ type: 'zone', data: zone })}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 transition-all hover:scale-[1.02] shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">{zone.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-700 text-emerald-300">
                        {zoneCount}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{zone.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STAGE 2: Smart Collection Bins */}
          <div className="space-y-3">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                2. Collection Bins
              </span>
              <div className="text-[11px] text-teal-300/80 mt-0.5">
                {materialsInBins.length} items waiting
              </div>
            </div>

            <div className="space-y-2">
              {bins.map((bin) => {
                const binItems = materialsInBins.filter((m) => m.assignedBinId === bin.id);
                return (
                  <button
                    key={bin.id}
                    onClick={() => setSelectedNode({ type: 'bin', data: bin })}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition-all hover:scale-[1.02] shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: bin.colorHex }}
                        />
                        <span>{bin.id}</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-300">
                        {bin.currentFillPercent}% Fill
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate mt-1">{bin.name}</p>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          bin.currentFillPercent > 80
                            ? 'bg-amber-400'
                            : bin.currentFillPercent > 90
                            ? 'bg-rose-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${bin.currentFillPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{bin.campusZone}</span>
                      <span className="text-emerald-300">{binItems.length} active items</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STAGE 3: Collection Logistics & Transit */}
          <div className="space-y-3">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                3. Active Transit
              </span>
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                {materialsInTransit.length} in route
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() =>
                  setSelectedNode({
                    type: 'vehicle',
                    data: {
                      id: 'VEH-01',
                      name: 'Campus EcoShuttle EV-01',
                      route: 'Block A → Hostel → Canteen → Hub',
                      driver: 'Campus Sustainability Logistics',
                      status: materialsInTransit.length > 0 ? 'In Transit' : 'Idling at Depot',
                      carryingCount: materialsInTransit.length,
                    },
                  })
                }
                className="w-full text-left p-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 transition-all hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Truck className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-amber-200">EcoShuttle EV-01</span>
                    <p className="text-[10px] text-amber-300/70">Electric Waste Vehicle</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 mt-2 bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span>Cargo Load:</span>
                    <strong className="text-amber-300">{materialsInTransit.length} items</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Route: Hourly Campus Circuit
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* STAGE 4: Central Sorting Hub */}
          <div className="space-y-3">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                4. Sorting Center
              </span>
              <div className="text-[11px] text-purple-300/80 mt-0.5">
                {materialsInSorting.length} items baling
              </div>
            </div>

            <button
              onClick={() =>
                setSelectedNode({
                  type: 'facility',
                  data: DEFAULT_CAMPUS_FACILITIES[0],
                })
              }
              className="w-full text-left p-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/40 transition-all hover:scale-[1.02] shadow-xs"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-purple-200">Central Sorting Hub</span>
                  <p className="text-[10px] text-purple-300/70">North Quad Yard</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 mt-2 bg-slate-900/60 p-2 rounded border border-slate-800">
                <div className="flex items-center justify-between">
                  <span>Queued Items:</span>
                  <strong className="text-purple-300">{materialsInSorting.length} items</strong>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Process: Optical sort & decontamination
                </div>
              </div>
            </button>
          </div>

          {/* STAGE 5: Recovery Facilities & End Destinations */}
          <div className="space-y-3">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                5. Circular Endpoints
              </span>
              <div className="text-[11px] text-emerald-300/80 mt-0.5">
                {materialsRecovered.length} completed
              </div>
            </div>

            <div className="space-y-2">
              {DEFAULT_CAMPUS_FACILITIES.slice(1).map((fac) => {
                return (
                  <button
                    key={fac.id}
                    onClick={() => setSelectedNode({ type: 'facility', data: fac })}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all hover:scale-[1.02] shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-emerald-300 truncate">
                        {fac.name.split('(')[0]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {fac.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{fac.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Disclaimer about IoT vs Simulation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Digital Twin Sensor Models: Ultrasonic fill-level & vehicle transit are currently algorithmic simulations.</span>
          </div>
          <span className="text-slate-500">Physical IoT load-cell hardware integration ready.</span>
        </div>
      </div>

      {/* Node Detail Drawer / Inspection Panel */}
      {selectedNode && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  {selectedNode.type} Node Inspection
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedNode.data.name || selectedNode.data.id}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedNode.data.location || selectedNode.data.desc || selectedNode.data.route}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs font-semibold px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Current Capacity / Status</span>
              <div className="text-slate-800 font-bold text-sm mt-1">
                {selectedNode.data.currentFillPercent !== undefined
                  ? `${selectedNode.data.currentFillPercent}% Fill Level`
                  : selectedNode.data.status || 'Active Operational'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Last checked: {selectedNode.data.lastCollectionTime || 'Real-time telemetry'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Accepted Waste Streams</span>
              <div className="text-slate-800 font-medium text-xs mt-1">
                {selectedNode.data.acceptedTypes?.join(', ') || selectedNode.data.acceptedMaterials?.join(', ') || 'All general streams'}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-emerald-800 uppercase">Ecosystem Action</span>
                <p className="text-emerald-950 text-xs font-medium mt-1">
                  Ready to intake new verified scans from Computer Vision.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
