import {
  TrackedMaterial,
  CampusBin,
  CampusFacility,
  UserPreferences,
  WorkflowStatus,
  TimelineEvent,
} from '../types';

const MATERIALS_KEY = 'sra_tracked_materials_v1';
const PREFERENCES_KEY = 'sra_user_preferences_v1';
const BINS_KEY = 'sra_campus_bins_v1';

// Initial campus bins configuration
export const DEFAULT_CAMPUS_BINS: CampusBin[] = [
  {
    id: 'B01',
    name: 'Plastics & Metals Bin',
    location: 'Block A - Ground Floor Foyer',
    campusZone: 'Block A',
    acceptedTypes: ['plastic', 'metal', 'glass'],
    capacityKg: 50,
    currentFillPercent: 68,
    status: 'Normal',
    lastCollectionTime: '2 hours ago',
    colorHex: '#0d9488', // teal-600
  },
  {
    id: 'B02',
    name: 'Food & Organic Compost Bin',
    location: 'Campus Canteen - Dining Courtyard',
    campusZone: 'Canteen',
    acceptedTypes: ['organic material'],
    capacityKg: 75,
    currentFillPercent: 82,
    status: 'Near Full',
    lastCollectionTime: '45 mins ago',
    colorHex: '#16a34a', // green-600
  },
  {
    id: 'B03',
    name: 'Cardboard & Paper Bin',
    location: 'Hostel Wing B - Mail & Common Hall',
    campusZone: 'Hostel',
    acceptedTypes: ['paper/cardboard', 'textile'],
    capacityKg: 60,
    currentFillPercent: 45,
    status: 'Normal',
    lastCollectionTime: '4 hours ago',
    colorHex: '#2563eb', // blue-600
  },
  {
    id: 'B04',
    name: 'E-Waste & Battery Safe Locker',
    location: 'Block B - Electrical Engg Lab 102',
    campusZone: 'Block B',
    acceptedTypes: ['electronic material'],
    capacityKg: 30,
    currentFillPercent: 30,
    status: 'Normal',
    lastCollectionTime: 'Yesterday, 17:00',
    colorHex: '#9333ea', // purple-600
  },
];

// Initial campus facilities configuration
export const DEFAULT_CAMPUS_FACILITIES: CampusFacility[] = [
  {
    id: 'FAC-SORT',
    name: 'Campus Central Sorting & Intake Hub',
    type: 'sorting',
    location: 'Facilities Yard, North Quad',
    acceptedMaterials: ['plastic', 'paper/cardboard', 'glass', 'metal', 'textile', 'electronic material'],
    status: 'Operational',
    capacityKgPerDay: 500,
    currentLoadPercent: 62,
    description: 'Initial manual sorting, contamination filtration, and baling prior to destination dispatch.',
  },
  {
    id: 'FAC-COMPOST',
    name: 'Aerobic Composting & Bioreactor Unit',
    type: 'composting',
    location: 'Campus Botanical Gardens',
    acceptedMaterials: ['organic material'],
    status: 'Operational',
    capacityKgPerDay: 250,
    currentLoadPercent: 78,
    description: 'Converts canteen food scraps into nitrogen-rich organic compost for campus landscaping.',
  },
  {
    id: 'FAC-RECYCLE',
    name: 'Regional Materials Recovery Facility (MRF)',
    type: 'recycling',
    location: 'Metropolitan Circular Park (Off-Campus Partner)',
    acceptedMaterials: ['plastic', 'paper/cardboard', 'metal', 'glass'],
    status: 'Operational',
    capacityKgPerDay: 2000,
    currentLoadPercent: 55,
    description: 'Optical sorting, shredding, and secondary pelletizing of clean recyclables.',
  },
  {
    id: 'FAC-REUSE',
    name: 'EcoSwap Student Thrift & Upcycle Depot',
    type: 'reuse',
    location: 'Student Union Basement Room 04',
    acceptedMaterials: ['glass', 'paper/cardboard', 'textile', 'electronic material'],
    status: 'Operational',
    capacityKgPerDay: 100,
    currentLoadPercent: 40,
    description: 'Hostel book exchanges, glass jar distribution for storage, and student hardware refurbishment.',
  },
  {
    id: 'FAC-HAZARD',
    name: 'Certified E-Waste & Toxic Materials Locker',
    type: 'hazardous',
    location: 'Campus Environmental Safety Center',
    acceptedMaterials: ['electronic material'],
    status: 'Operational',
    capacityKgPerDay: 80,
    currentLoadPercent: 28,
    description: 'Compliant neutralization and hydrometallurgical recycling for lithium cells and toxic boards.',
  },
];

// Initial default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  setting: 'college',
  goal: 'reduce waste',
  preferredAction: 'reuse',
  locationName: 'Hostel Wing B',
};

// Realistic predefined sample demonstration records (clearly flagged as isSample: true)
export const SAMPLE_DEMO_MATERIALS: TrackedMaterial[] = [
  {
    id: 'M-1001',
    objectName: 'Clear PET Water Bottle (500ml)',
    materialType: 'plastic',
    categories: ['Recyclable', 'Reusable'],
    confidenceLevel: 'High',
    confidencePercent: 96,
    condition: 'Empty, rinsed, cap attached',
    contamination: 'No liquids detected',
    recommendedAction: 'Flatten to save space and place into Bin B01 for high-grade plastic recycling.',
    alternativeAction: 'Clean with warm soapy water and repurpose for student desk stationery holder.',
    safetyWarnings: ['Do not refill with boiling water.'],
    explanation: 'Clean single-use polyethylene terephthalate (PET #1) is 100% mechanically recyclable into new fibers and bottles.',
    sourceLocation: 'Block A',
    assignedBinId: 'B01',
    intendedDestination: 'Regional Materials Recovery Facility (MRF)',
    currentStatus: 'At Sorting Center',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isSample: true,
    estimatedWeightKg: 0.03,
    history: [
      {
        id: 'EVT-01',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'Identified',
        locationOrFacility: 'Block A - Ground Floor Foyer',
        note: 'Scanned via Computer Vision assistant.',
        actor: 'Student User',
        isSimulated: true,
      },
      {
        id: 'EVT-02',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'Assigned to Bin',
        locationOrFacility: 'Bin B01 (Block A Plastics)',
        note: 'Deposited into Bin B01.',
        actor: 'Student User',
        isSimulated: true,
      },
      {
        id: 'EVT-03',
        timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        status: 'Collected',
        locationOrFacility: 'Campus EcoShuttle EV-01',
        note: 'Emptied during midday collection route.',
        actor: 'EcoShuttle Logistics',
        isSimulated: true,
      },
      {
        id: 'EVT-04',
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        status: 'At Sorting Center',
        locationOrFacility: 'Campus Central Sorting & Intake Hub',
        note: 'Quality checked: 0% contamination. Baled for MRF pickup.',
        actor: 'Sorting Team Lead',
        isSimulated: true,
      },
    ],
  },
  {
    id: 'M-1002',
    objectName: 'Corrugated Delivery Box',
    materialType: 'paper/cardboard',
    categories: ['Recyclable'],
    confidenceLevel: 'High',
    confidencePercent: 94,
    condition: 'Flattened, shipping label present',
    contamination: 'Synthetic packing tape removed',
    recommendedAction: 'Drop off at Hostel B03 Paper & Cardboard intake.',
    alternativeAction: 'Keep in hostel storage for semester-end packing.',
    safetyWarnings: ['Watch for sharp metal box staples.'],
    explanation: 'Clean kraft paper fibers can be re-pulped 5 to 7 times into new packaging cartons.',
    sourceLocation: 'Hostel',
    assignedBinId: 'B03',
    intendedDestination: 'Regional Materials Recovery Facility (MRF)',
    currentStatus: 'Sent to Destination',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    isSample: true,
    estimatedWeightKg: 0.25,
    history: [
      {
        id: 'EVT-11',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        status: 'Identified',
        locationOrFacility: 'Hostel Wing B',
        note: 'Scanned package box after unboxing textbooks.',
        actor: 'Hostel Resident',
        isSimulated: true,
      },
      {
        id: 'EVT-12',
        timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
        status: 'Assigned to Bin',
        locationOrFacility: 'Bin B03 (Hostel Cardboard)',
        note: 'Cardboard flattened and placed in designated bin.',
        actor: 'Hostel Resident',
        isSimulated: true,
      },
      {
        id: 'EVT-13',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'Collected',
        locationOrFacility: 'Campus EcoShuttle EV-01',
        note: 'Picked up on Hostel morning sweep.',
        actor: 'Collection Crew',
        isSimulated: true,
      },
      {
        id: 'EVT-14',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        status: 'At Sorting Center',
        locationOrFacility: 'Campus Central Sorting Hub',
        note: 'Compressed into cardboard bale #B-42.',
        actor: 'Sorting Center',
        isSimulated: true,
      },
      {
        id: 'EVT-15',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        status: 'Sent to Destination',
        locationOrFacility: 'Regional Materials Recovery Facility (MRF)',
        note: 'Loaded on regional transport truck to paper mill.',
        actor: 'Logistics Partner',
        isSimulated: true,
      },
    ],
  },
  {
    id: 'M-1003',
    objectName: 'Rechargeable Li-Ion Phone Battery',
    materialType: 'electronic material',
    categories: ['Hazardous'],
    confidenceLevel: 'High',
    confidencePercent: 92,
    condition: 'Slightly aged, no swelling observed',
    contamination: 'Terminals unshielded',
    recommendedAction: 'CRITICAL: Tape contacts immediately and place in Block B E-Waste Locker B04.',
    alternativeAction: 'Hand directly to campus chemical & electronics safety coordinator.',
    safetyWarnings: [
      'FIRE HAZARD: Never throw into general trash or compactor trucks.',
      'Do not pierce, heat, or submerge in liquids.',
    ],
    explanation: 'Lithium batteries require specialized hydrometallurgical processing to recover cobalt and prevent landfill fires.',
    sourceLocation: 'Block B',
    assignedBinId: 'B04',
    intendedDestination: 'Certified E-Waste & Toxic Materials Locker',
    currentStatus: 'Assigned to Bin',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    isSample: true,
    estimatedWeightKg: 0.05,
    history: [
      {
        id: 'EVT-21',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'Identified',
        locationOrFacility: 'Block B Engineering Lab',
        note: 'Classified with strict safety warnings applied.',
        actor: 'Lab Technician',
        isSimulated: true,
      },
      {
        id: 'EVT-22',
        timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
        status: 'Assigned to Bin',
        locationOrFacility: 'Bin B04 (E-Waste Safe Locker)',
        note: 'Placed in insulated battery compartment.',
        actor: 'Lab Technician',
        isSimulated: true,
      },
    ],
  },
  {
    id: 'M-1004',
    objectName: 'Organic Fruit & Banana Peel',
    materialType: 'organic material',
    categories: ['Biodegradable'],
    confidenceLevel: 'High',
    confidencePercent: 98,
    condition: 'Natural organic decomposition',
    contamination: 'Sticker label peeled off',
    recommendedAction: 'Toss into Canteen Compost Bin B02 for the campus aerobic bioreactor.',
    alternativeAction: 'Bury in hostel potted plants for slow natural potassium fertilization.',
    safetyWarnings: ['Ensure all plastic stickers are removed before composting.'],
    explanation: 'Decomposes completely in 14-21 days in the campus aerated compost unit.',
    sourceLocation: 'Canteen',
    assignedBinId: 'B02',
    intendedDestination: 'Aerobic Composting & Bioreactor Unit',
    currentStatus: 'Composted',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    isSample: true,
    estimatedWeightKg: 0.12,
    history: [
      {
        id: 'EVT-31',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'Identified',
        locationOrFacility: 'Canteen Courtyard',
        note: 'Identified after lunch meal.',
        actor: 'Student',
        isSimulated: true,
      },
      {
        id: 'EVT-32',
        timestamp: new Date(Date.now() - 3600000 * 23.5).toISOString(),
        status: 'Assigned to Bin',
        locationOrFacility: 'Bin B02 (Canteen Organic)',
        note: 'Placed into food scrap hopper.',
        actor: 'Student',
        isSimulated: true,
      },
      {
        id: 'EVT-33',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        status: 'Collected',
        locationOrFacility: 'Campus EcoShuttle EV-01',
        note: 'Transferred to campus composting drum.',
        actor: 'Grounds Crew',
        isSimulated: true,
      },
      {
        id: 'EVT-34',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        status: 'Composted',
        locationOrFacility: 'Aerobic Composting & Bioreactor Unit',
        note: 'Converted to humus-rich compost for botanical garden beds.',
        actor: 'Bio-Unit Lead',
        isSimulated: true,
      },
    ],
  },
  {
    id: 'M-1005',
    objectName: 'Vintage Wide-Mouth Glass Jar',
    materialType: 'glass',
    categories: ['Reusable', 'Recyclable'],
    confidenceLevel: 'High',
    confidencePercent: 95,
    condition: 'Intact, clear glass with rubber seal intact',
    contamination: 'Rinsed clean',
    recommendedAction: 'Deliver to EcoSwap Student Thrift Depot for pantry refilling.',
    alternativeAction: 'Drop in Glass Recycling if chipped or damaged.',
    safetyWarnings: ['Handle carefully to prevent impact breakage.'],
    explanation: 'High quality reusable glass saves 100% of smelting energy when kept in circulation.',
    sourceLocation: 'Hostel',
    assignedBinId: 'B01',
    intendedDestination: 'EcoSwap Student Thrift & Upcycle Depot',
    currentStatus: 'Reused',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isSample: true,
    estimatedWeightKg: 0.35,
    history: [
      {
        id: 'EVT-41',
        timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
        status: 'Identified',
        locationOrFacility: 'Hostel Kitchenette',
        note: 'Identified after finishing pasta sauce.',
        actor: 'Hostel Resident',
        isSimulated: true,
      },
      {
        id: 'EVT-42',
        timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
        status: 'Sent to Destination',
        locationOrFacility: 'EcoSwap Student Thrift & Upcycle Depot',
        note: 'Donated to community pantry jar library.',
        actor: 'Student Volunteer',
        isSimulated: true,
      },
      {
        id: 'EVT-43',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'Reused',
        locationOrFacility: 'EcoSwap Depot',
        note: 'Adopted by a student for bulk tea storage.',
        actor: 'New Student Owner',
        isSimulated: true,
      },
    ],
  },
];

// Service functions
export const storageService = {
  getMaterials(): TrackedMaterial[] {
    try {
      const data = localStorage.getItem(MATERIALS_KEY);
      if (!data) {
        // Return sample demo records by default for instant hackathon demonstration
        this.saveMaterials(SAMPLE_DEMO_MATERIALS);
        return SAMPLE_DEMO_MATERIALS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading from localStorage, returning fallback samples:', e);
      return SAMPLE_DEMO_MATERIALS;
    }
  },

  saveMaterials(materials: TrackedMaterial[]): void {
    try {
      localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
      window.dispatchEvent(new Event('sra_materials_updated'));
    } catch (e) {
      console.error('Error saving materials to localStorage:', e);
    }
  },

  addMaterial(material: TrackedMaterial): void {
    const list = this.getMaterials();
    // Prepend newest item
    const updated = [material, ...list];
    this.saveMaterials(updated);
  },

  updateMaterial(id: string, updates: Partial<TrackedMaterial>): TrackedMaterial | null {
    const list = this.getMaterials();
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const current = list[index];
    const updatedItem: TrackedMaterial = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updatedItem;
    this.saveMaterials(list);
    return updatedItem;
  },

  addTimelineEvent(materialId: string, event: Omit<TimelineEvent, 'id' | 'timestamp'>): TrackedMaterial | null {
    const list = this.getMaterials();
    const item = list.find((m) => m.id === materialId);
    if (!item) return null;

    const newEvent: TimelineEvent = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    const updatedHistory = [...(item.history || []), newEvent];
    return this.updateMaterial(materialId, {
      currentStatus: event.status,
      history: updatedHistory,
    });
  },

  getBins(): CampusBin[] {
    try {
      const data = localStorage.getItem(BINS_KEY);
      if (!data) {
        this.saveBins(DEFAULT_CAMPUS_BINS);
        return DEFAULT_CAMPUS_BINS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_CAMPUS_BINS;
    }
  },

  saveBins(bins: CampusBin[]): void {
    try {
      localStorage.setItem(BINS_KEY, JSON.stringify(bins));
      window.dispatchEvent(new Event('sra_bins_updated'));
    } catch (e) {
      console.error('Error saving bins to localStorage:', e);
    }
  },

  updateBinFill(binId: string, incrementPercent: number): void {
    const bins = this.getBins();
    const bin = bins.find((b) => b.id === binId);
    if (bin) {
      bin.currentFillPercent = Math.min(100, Math.max(0, bin.currentFillPercent + incrementPercent));
      if (bin.currentFillPercent >= 90) bin.status = 'Full';
      else if (bin.currentFillPercent >= 75) bin.status = 'Near Full';
      else bin.status = 'Normal';
      this.saveBins(bins);
    }
  },

  getUserPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(PREFERENCES_KEY);
      if (!data) return DEFAULT_USER_PREFERENCES;
      return JSON.parse(data);
    } catch {
      return DEFAULT_USER_PREFERENCES;
    }
  },

  saveUserPreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Error saving preferences:', e);
    }
  },

  resetToDemoData(): void {
    this.saveMaterials(SAMPLE_DEMO_MATERIALS);
    this.saveBins(DEFAULT_CAMPUS_BINS);
  },

  clearAllData(): void {
    this.saveMaterials([]);
    this.saveBins(DEFAULT_CAMPUS_BINS);
  },
};
