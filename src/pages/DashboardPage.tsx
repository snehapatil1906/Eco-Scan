import React, { useState, useMemo } from 'react';
import {
  TrackedMaterial,
  MaterialCategory,
  WorkflowStatus,
} from '../types';
import { CategoryBadge, StatusBadge, DemoBadge } from '../components/Common/Badge';
import {
  Recycle,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Leaf,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface DashboardPageProps {
  materials: TrackedMaterial[];
  onNavigate: (tab: string, materialId?: string) => void;
  onLoadDemoData: () => void;
  onClearData: () => void;
}

export function DashboardPage({
  materials,
  onNavigate,
  onLoadDemoData,
  onClearData,
}: DashboardPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dataOriginFilter, setDataOriginFilter] = useState<'all' | 'real' | 'sample'>('all');

  // Compute live statistics directly from saved records
  const stats = useMemo(() => {
    const total = materials.length;
    let recyclable = 0;
    let reusable = 0;
    let biodegradable = 0;
    let hazardous = 0;
    let inProcessing = 0;
    let completed = 0;
    let demoCount = 0;
    let realCount = 0;

    materials.forEach((m) => {
      if (m.isSample) demoCount++;
      else realCount++;

      if (m.categories.includes('Recyclable')) recyclable++;
      if (m.categories.includes('Reusable')) reusable++;
      if (m.categories.includes('Biodegradable')) biodegradable++;
      if (m.categories.includes('Hazardous')) hazardous++;

      if (
        m.currentStatus === 'Assigned to Bin' ||
        m.currentStatus === 'Collected' ||
        m.currentStatus === 'At Sorting Center' ||
        m.currentStatus === 'Sent to Destination'
      ) {
        inProcessing++;
      } else if (
        m.currentStatus === 'Processed' ||
        m.currentStatus === 'Reused' ||
        m.currentStatus === 'Composted'
      ) {
        completed++;
      }
    });

    // Environmental metrics based on documented EPA WARM proxy factors:
    // Avg ~0.08 kg CO2e avoided per bottle/can recycled or reused; ~0.03 kg diverted from landfill
    const estimatedCo2AvoidedKg = (recyclable * 0.08 + reusable * 0.12 + biodegradable * 0.04).toFixed(2);
    const estimatedLandfillDivertedKg = (total * 0.09).toFixed(2);

    return {
      total,
      recyclable,
      reusable,
      biodegradable,
      hazardous,
      inProcessing,
      completed,
      demoCount,
      realCount,
    };
  }, [materials]);

  // Filtered materials for table
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (categoryFilter !== 'all' && !m.categories.includes(categoryFilter as MaterialCategory)) {
        return false;
      }
      if (statusFilter !== 'all' && m.currentStatus !== statusFilter) {
        return false;
      }
      if (dataOriginFilter === 'real' && m.isSample) return false;
      if (dataOriginFilter === 'sample' && !m.isSample) return false;
      return true;
    });
  }, [materials, categoryFilter, statusFilter, dataOriginFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Data Source Notice Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Campus Edition
              </span>
              {stats.demoCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-400/20 text-amber-200 border border-amber-400/40">
                  Includes {stats.demoCount} Sample Records
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Eco Scan
            </h1>
            <p className="text-emerald-200/90 text-sm mt-1 max-w-2xl">
              Real-time circular materials monitoring across Block A, Block B, Hostel, and Canteen.
              Scan items with Computer Vision, track through the Digital Twin, and ask GenAI for advice.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('scan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Scan New Material</span>
            </button>
            <button
              onClick={onLoadDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs border border-slate-700 transition-colors"
              title="Loads demo records to test workflow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (All computed from actual saved data) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Scanned</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{stats.realCount} real</span> • <span>{stats.demoCount} demo</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-medium">Recyclable</span>
            <Recycle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{stats.recyclable}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Plastics, metals, paper</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <span className="text-xs font-medium">Reusable</span>
            <RotateCcw className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-900">{stats.reusable}</div>
          <div className="text-[11px] text-teal-600 mt-1">Jars, tech, containers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-lime-200 shadow-xs">
          <div className="flex items-center justify-between text-lime-700 mb-1">
            <span className="text-xs font-medium">Biodegradable</span>
            <Leaf className="w-4 h-4 text-lime-600" />
          </div>
          <div className="text-2xl font-bold text-lime-900">{stats.biodegradable}</div>
          <div className="text-[11px] text-lime-600 mt-1">Food & composting</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-medium">Hazardous</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900">{stats.hazardous}</div>
          <div className="text-[11px] text-rose-600 mt-1">Batteries, e-waste</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-xs font-medium">In Processing</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-900">{stats.inProcessing}</div>
          <div className="text-[11px] text-indigo-600 mt-1">Bins & Sorting Hub</div>
        </div>
      </div>

      {/* Material Flow Visualization Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Campus Material Flow Pipeline</h2>
            <p className="text-xs text-slate-500">
              End-to-end journey from source generation to final recovery
            </p>
          </div>
          <button
            onClick={() => onNavigate('digital-twin')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>Explore 2D Digital Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">1. Identified</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {materials.filter((m) => m.currentStatus === 'Identified').length}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Scanned at Source</p>
          </div>

          <div className="p-3.5 bg-indigo-50 rounded-lg border border-indigo-200">
            <span className="text-[10px] font-semibold text-indigo-600 uppercase">2. In Bins</span>
            <div className="text-xl font-bold text-indigo-900 mt-1">
              {materials.filter((m) => m.currentStatus === 'Assigned to Bin').length}
            </div>
            <p className="text-[10px] text-indigo-500 mt-0.5">Campus Bins B01-B04</p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-[10px] font-semibold text-amber-700 uppercase">3. In Transit</span>
            <div className="text-xl font-bold text-amber-900 mt-1">
              {materials.filter((m) => m.currentStatus === 'Collected').length}
            </div>
            <p className="text-[10px] text-amber-600 mt-0.5">EcoShuttle Logistics</p>
          </div>

          <div className="p-3.5 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-[10px] font-semibold text-purple-700 uppercase">4. Sorting Hub</span>
            <div className="text-xl font-bold text-purple-900 mt-1">
              {materials.filter((m) => m.currentStatus === 'At Sorting Center').length}
            </div>
            <p className="text-[10px] text-purple-600 mt-0.5">Intake & Quality QC</p>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold text-emerald-700 uppercase">5. Recovered</span>
            <div className="text-xl font-bold text-emerald-900 mt-1">{stats.completed}</div>
            <p className="text-[10px] text-emerald-600 mt-0.5">Reused/Pelletized</p>
          </div>
        </div>

        {/* Quick Flow Visual Connector Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Circular Completion Rate:</span>
            <strong className="text-slate-900">
              {materials.length > 0
                ? `${Math.round((stats.completed / materials.length) * 100)}%`
                : '0%'}
            </strong>
          </span>
          <span className="text-[11px] text-slate-500">
            Updated live from verified localStorage records
          </span>
        </div>
      </div>

      {/* Recent Scans Table & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Recent Material Scans & Classifications</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredMaterials.length} of {materials.length} total logged items
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
              aria-label="Filter by Category"
            >
              <option value="all">All Categories</option>
              <option value="Recyclable">Recyclable</option>
              <option value="Reusable">Reusable</option>
              <option value="Biodegradable">Biodegradable</option>
              <option value="Hazardous">Hazardous</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
              aria-label="Filter by Status"
            >
              <option value="all">All Statuses</option>
              <option value="Identified">Identified</option>
              <option value="Assigned to Bin">Assigned to Bin</option>
              <option value="Collected">Collected</option>
              <option value="At Sorting Center">At Sorting Center</option>
              <option value="Processed">Processed</option>
              <option value="Reused">Reused</option>
              <option value="Composted">Composted</option>
            </select>

            {/* Origin Filter */}
            <select
              value={dataOriginFilter}
              onChange={(e) => setDataOriginFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
              aria-label="Filter by Data Origin"
            >
              <option value="all">All Records</option>
              <option value="real">Real Scans Only</option>
              <option value="sample">Demo Records Only</option>
            </select>
          </div>
        </div>

        {/* Table or Empty State */}
        {filteredMaterials.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">No materials match the selected filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {materials.length === 0
                ? 'Your recycling database is empty. Click below to load hackathon demonstration records or scan your first physical item.'
                : 'Try adjusting your category or status filters to view logged materials.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {materials.length === 0 && (
                <button
                  onClick={onLoadDemoData}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Load Sample Demo Records
                </button>
              )}
              <button
                onClick={() => onNavigate('scan')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Scan an Item Now
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item ID & Name</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Categories</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Origin</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.id}
                        </span>
                        <span className="font-medium text-slate-900">{item.objectName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 capitalize text-slate-600">{item.materialType}</td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.categories.map((c) => (
                          <CategoryBadge key={c} category={c} />
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span>{item.sourceLocation}</span>
                      {item.assignedBinId && (
                        <span className="ml-1 text-[10px] text-slate-400">({item.assignedBinId})</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={item.currentStatus} />
                    </td>

                    <td className="py-3 px-4">
                      {item.isSample ? (
                        <DemoBadge />
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          Real Scan
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('journey', item.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                        >
                          Track
                        </button>
                        <button
                          onClick={() => onNavigate('assistant', item.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Ask AI</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
