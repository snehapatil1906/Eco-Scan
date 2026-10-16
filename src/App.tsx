import React, { useState, useEffect } from 'react';
import {
  TrackedMaterial,
  CampusBin,
  UserPreferences,
  WorkflowStatus,
} from './types';
import { storageService } from './services/storageService';
import { Sidebar } from './components/Navigation/Sidebar';
import { Header, MobileNav } from './components/Navigation/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ScanPage } from './pages/ScanPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { MaterialJourneyPage } from './pages/MaterialJourneyPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AboutSettingsPage } from './pages/AboutSettingsPage';
import { MobileCompanionView } from './components/Scan/MobileCompanionView';

export default function App() {
  const [mobileSessionId, setMobileSessionId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('mobileSession');
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [materials, setMaterials] = useState<TrackedMaterial[]>(() =>
    storageService.getMaterials()
  );
  const [bins, setBins] = useState<CampusBin[]>(() => storageService.getBins());
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() =>
    storageService.getUserPreferences()
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sync state with storage events
  useEffect(() => {
    const handleMaterialsUpdate = () => {
      setMaterials(storageService.getMaterials());
    };
    const handleBinsUpdate = () => {
      setBins(storageService.getBins());
    };

    window.addEventListener('sra_materials_updated', handleMaterialsUpdate);
    window.addEventListener('sra_bins_updated', handleBinsUpdate);

    return () => {
      window.removeEventListener('sra_materials_updated', handleMaterialsUpdate);
      window.removeEventListener('sra_bins_updated', handleBinsUpdate);
    };
  }, []);

  // Handle tab switching
  const handleTabChange = (tabId: string, materialId?: string) => {
    setCurrentTab(tabId);
    if (materialId) {
      setSelectedMaterialId(materialId);
    }
  };

  // Handle saving newly analyzed material
  const handleMaterialSaved = (newMaterial: TrackedMaterial) => {
    setMaterials(storageService.getMaterials());
    setSelectedMaterialId(newMaterial.id);
  };

  // Handle advancing material status in workflow / Digital Twin
  const handleAdvanceStatus = (
    materialId: string,
    nextStatus: WorkflowStatus,
    note: string
  ) => {
    const item = materials.find((m) => m.id === materialId);
    if (!item) return;

    let actor = 'Campus User';
    let locationOrFacility = item.sourceLocation;

    if (nextStatus === 'Assigned to Bin') {
      actor = 'Campus User';
      locationOrFacility = `Campus Bin ${item.assignedBinId || 'B01'}`;
      // Slightly increment bin fill percent
      if (item.assignedBinId) {
        storageService.updateBinFill(item.assignedBinId, 3);
      }
    } else if (nextStatus === 'Collected') {
      actor = 'EcoShuttle Logistics';
      locationOrFacility = 'Campus EcoShuttle EV-01';
      // Decrement bin fill percent upon collection
      if (item.assignedBinId) {
        storageService.updateBinFill(item.assignedBinId, -4);
      }
    } else if (nextStatus === 'At Sorting Center') {
      actor = 'Sorting Center Inspector';
      locationOrFacility = 'Campus Central Sorting Hub';
    } else if (nextStatus === 'Sent to Destination') {
      actor = 'Regional Transit Team';
      locationOrFacility = item.intendedDestination || 'Regional Recovery Hub';
    } else if (nextStatus === 'Processed') {
      actor = 'Materials Recovery Operator';
      locationOrFacility = 'Secondary Polymer Flake Line';
    } else if (nextStatus === 'Reused') {
      actor = 'EcoSwap Volunteer';
      locationOrFacility = 'EcoSwap Student Thrift Depot';
    } else if (nextStatus === 'Composted') {
      actor = 'Grounds Bioreactor Lead';
      locationOrFacility = 'Campus Aerobic Composting Facility';
    }

    storageService.addTimelineEvent(materialId, {
      status: nextStatus,
      locationOrFacility,
      note,
      actor,
      isSimulated: item.isSample,
    });

    setMaterials(storageService.getMaterials());
    setBins(storageService.getBins());
  };

  // Handle user preferences update
  const handleUpdatePreferences = (prefs: UserPreferences) => {
    setUserPreferences(prefs);
    storageService.saveUserPreferences(prefs);
  };

  // Active material for AI assistant / Journey
  const currentFocusedMaterial =
    materials.find((m) => m.id === selectedMaterialId) || materials[0] || null;

  // If user opened QR link on mobile phone, render dedicated companion camera view
  if (mobileSessionId) {
    return (
      <MobileCompanionView
        sessionId={mobileSessionId}
        onExit={() => {
          setMobileSessionId(null);
          try {
            window.history.replaceState({}, '', window.location.pathname);
          } catch {
            window.location.href = window.location.pathname;
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        unprocessedCount={
          materials.filter(
            (m) =>
              m.currentStatus === 'Assigned to Bin' ||
              m.currentStatus === 'Collected' ||
              m.currentStatus === 'At Sorting Center'
          ).length
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* App Top Header with persistence indicator */}
        <Header
          currentTab={currentTab}
          onTabChange={handleTabChange}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Mobile Navigation Drawer */}
        <MobileNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          isOpen={mobileMenuOpen}
          setIsOpen={setMobileMenuOpen}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              materials={materials}
              onNavigate={handleTabChange}
              onLoadDemoData={() => {
                storageService.resetToDemoData();
                setMaterials(storageService.getMaterials());
                setBins(storageService.getBins());
              }}
              onClearData={() => {
                storageService.clearAllData();
                setMaterials([]);
              }}
            />
          )}

          {currentTab === 'scan' && (
            <ScanPage
              bins={bins}
              onMaterialSaved={handleMaterialSaved}
              onNavigateToAssistant={(mat) => {
                setSelectedMaterialId(mat.id);
                setCurrentTab('assistant');
              }}
              onNavigateToJourney={(matId) => {
                setSelectedMaterialId(matId);
                setCurrentTab('journey');
              }}
            />
          )}

          {currentTab === 'digital-twin' && (
            <DigitalTwinPage
              materials={materials}
              bins={bins}
              onAdvanceMaterial={handleAdvanceStatus}
              onNavigateToJourney={(matId) => {
                setSelectedMaterialId(matId);
                setCurrentTab('journey');
              }}
              onNavigateToAssistant={(mat) => {
                setSelectedMaterialId(mat.id);
                setCurrentTab('assistant');
              }}
            />
          )}

          {currentTab === 'journey' && (
            <MaterialJourneyPage
              materials={materials}
              selectedMaterialId={selectedMaterialId}
              onSelectMaterial={(id) => setSelectedMaterialId(id)}
              onAdvanceStatus={handleAdvanceStatus}
              onNavigateToAssistant={(mat) => {
                setSelectedMaterialId(mat.id);
                setCurrentTab('assistant');
              }}
              bins={bins}
            />
          )}

          {currentTab === 'assistant' && (
            <AiAssistantPage
              currentMaterial={currentFocusedMaterial}
              onSelectMaterial={(mat) => setSelectedMaterialId(mat ? mat.id : null)}
              allMaterials={materials}
              userPreferences={userPreferences}
              onUpdatePreferences={handleUpdatePreferences}
              bins={bins}
            />
          )}

          {currentTab === 'settings' && (
            <AboutSettingsPage
              userPreferences={userPreferences}
              onUpdatePreferences={handleUpdatePreferences}
              materials={materials}
              onLoadDemoData={() => {
                storageService.resetToDemoData();
                setMaterials(storageService.getMaterials());
                setBins(storageService.getBins());
              }}
              onClearData={() => {
                storageService.clearAllData();
                setMaterials([]);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
