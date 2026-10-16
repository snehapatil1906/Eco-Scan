export type MaterialCategory =
  | 'Recyclable'
  | 'Reusable'
  | 'Biodegradable'
  | 'Hazardous'
  | 'General / non-recyclable'
  | 'Uncertain / needs verification';

export type MaterialType =
  | 'plastic'
  | 'paper/cardboard'
  | 'glass'
  | 'metal'
  | 'organic material'
  | 'textile'
  | 'electronic material'
  | 'mixed material';

export type WorkflowStatus =
  | 'Identified'
  | 'Assigned to Bin'
  | 'Collected'
  | 'At Sorting Center'
  | 'Sent to Destination'
  | 'Processed'
  | 'Reused'
  | 'Composted'
  | 'Rejected'
  | 'Awaiting Verification';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: WorkflowStatus;
  locationOrFacility: string;
  note: string;
  actor: string;
  isSimulated: boolean;
}

export interface TrackedMaterial {
  id: string; // e.g. M-101
  objectName: string;
  materialType: MaterialType;
  categories: MaterialCategory[];
  confidenceLevel: 'High' | 'Medium' | 'Low';
  confidencePercent?: number;
  condition?: string;
  contamination?: string;
  recommendedAction: string;
  alternativeAction?: string;
  safetyWarnings: string[];
  explanation: string;
  sourceLocation: string;
  assignedBinId?: string;
  intendedDestination?: string;
  currentStatus: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  history: TimelineEvent[];
  isSample: boolean;
  imageDataUrl?: string;
  estimatedWeightKg?: number;
}

export interface CampusBin {
  id: 'B01' | 'B02' | 'B03' | 'B04';
  name: string;
  location: string;
  campusZone: 'Block A' | 'Block B' | 'Hostel' | 'Canteen';
  acceptedTypes: MaterialType[];
  capacityKg: number;
  currentFillPercent: number;
  status: 'Normal' | 'Near Full' | 'Full' | 'Maintenance';
  lastCollectionTime: string;
  colorHex: string;
}

export interface CampusFacility {
  id: string;
  name: string;
  type: 'sorting' | 'recycling' | 'composting' | 'hazardous' | 'reuse';
  location: string;
  acceptedMaterials: MaterialType[];
  status: 'Operational' | 'High Load' | 'Under Maintenance';
  capacityKgPerDay: number;
  currentLoadPercent: number;
  description: string;
}

export interface UserPreferences {
  setting: 'college' | 'hostel' | 'home' | 'office';
  goal: 'reduce waste' | 'reuse more' | 'recycle more' | 'save money';
  preferredAction: 'reuse' | 'repair' | 'donation' | 'recycling' | 'composting';
  locationName: string;
}

export interface AnalysisResult {
  objectName: string;
  materialType: MaterialType;
  categories: MaterialCategory[];
  confidenceLevel: 'High' | 'Medium' | 'Low';
  confidencePercent: number;
  condition: string;
  contamination: string;
  recommendedAction: string;
  alternativeAction?: string;
  safetyWarnings: string[];
  explanation: string;
  targetBinId: string;
  isUncertain?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedAction?: string;
}
