import { MaterialCategory, MaterialType, AnalysisResult } from '../types';

export interface KnowledgeRule {
  materialType: MaterialType;
  keywords: string[];
  canonicalName: string;
  defaultCategories: MaterialCategory[];
  preferredAction: string;
  alternativeAction: string;
  handlingInstructions: string[];
  safetyWarnings: string[];
  preferredDestination: string;
  recommendedBinId: 'B01' | 'B02' | 'B03' | 'B04';
  conditions: string[];
  isHazardousByDefault: boolean;
}

export const MATERIAL_KNOWLEDGE_BASE: Record<string, KnowledgeRule> = {
  'plastic-bottle': {
    materialType: 'plastic',
    keywords: ['bottle', 'pet', 'beverage bottle', 'water bottle', 'soda bottle', 'flask', 'shampoo bottle'],
    canonicalName: 'Plastic Beverage Bottle (PET / HDPE)',
    defaultCategories: ['Recyclable', 'Reusable'],
    preferredAction: 'Rinse thoroughly, flatten to save bin volume, and place into Bin B01.',
    alternativeAction: 'Repurpose as a plant waterer, storage container, or seedling pot if clean.',
    handlingInstructions: [
      'Empty any remaining liquids to prevent mold and weight skew.',
      'Check local campus policy: screw caps back on or deposit in cap collection.',
      'Remove non-recyclable promotional shrink sleeves if easily peelable.',
    ],
    safetyWarnings: ['Do not use single-use PET bottles for repeated hot liquid drinking.'],
    preferredDestination: 'Regional Material Recovery Hub (Plastics Pelletizer)',
    recommendedBinId: 'B01',
    conditions: ['Must be free of toxic chemical or motor oil residues.'],
    isHazardousByDefault: false,
  },
  'cardboard-box': {
    materialType: 'paper/cardboard',
    keywords: ['cardboard', 'box', 'carton', 'shipping box', 'amazon box', 'corrugated'],
    canonicalName: 'Corrugated Cardboard / Shipping Box',
    defaultCategories: ['Recyclable'],
    preferredAction: 'Flatten completely and place in Bin B03 for paper and cardboard recycling.',
    alternativeAction: 'Reuse for hostel moving, parcel shipping, or campus project modeling.',
    handlingInstructions: [
      'Remove packing tape, plastic bubble wrap, and polystyrene peanuts.',
      'Keep completely dry; moisture causes fiber degradation and mildew.',
      'Flatten all flaps flat to maximize bin density.',
    ],
    safetyWarnings: ['Watch for sharp metal shipping staples.'],
    preferredDestination: 'Campus Pulp & Paper Reprocessing Stream',
    recommendedBinId: 'B03',
    conditions: ['Greasy pizza box bottoms should go to organic composting or general waste, not clean cardboard stream.'],
    isHazardousByDefault: false,
  },
  'glass-container': {
    materialType: 'glass',
    keywords: ['glass', 'jar', 'glass bottle', 'jam jar', 'mason jar', 'beverage glass'],
    canonicalName: 'Glass Food / Beverage Jar',
    defaultCategories: ['Reusable', 'Recyclable'],
    preferredAction: 'Wash and sanitize for hostel desk storage, meal prep, or campus EcoSwap depot.',
    alternativeAction: 'Rinse and deposit into Glass/Dry Recyclables stream.',
    handlingInstructions: [
      'Inspect thoroughly for chips, fissures, or micro-cracks before reuse.',
      'Separate metal lids for separate metal stream collection.',
      'Do not mix heat-resistant Pyrex or lab glassware with standard soda-lime food glass.',
    ],
    safetyWarnings: [
      'Wrap broken glass in sturdy paper or cardboard before disposal to protect collection workers.',
    ],
    preferredDestination: 'EcoSwap Campus Reuse Depot or Cullet Glass Melter',
    recommendedBinId: 'B01',
    conditions: ['Intact jars should always prioritize reuse over melting down due to high energy savings.'],
    isHazardousByDefault: false,
  },
  'food-organic': {
    materialType: 'organic material',
    keywords: ['banana', 'apple', 'peel', 'food', 'scraps', 'vegetable', 'fruit', 'leftovers', 'coffee grounds', 'tea bag'],
    canonicalName: 'Organic Food Scraps & Compostables',
    defaultCategories: ['Biodegradable'],
    preferredAction: 'Deposit in Canteen Bin B02 for the Campus Aerobic Composting Facility.',
    alternativeAction: 'Add to hostel floor vermicomposting bin if non-citrus and non-greasy.',
    handlingInstructions: [
      'Remove all fruit sticker labels and plastic ties.',
      'Do not include plastic cutlery, wax-coated cups, or plastic wrappers.',
      'Empty into compost bin without tying inside non-compostable plastic bags.',
    ],
    safetyWarnings: ['Avoid handling decaying mold with bare hands if immunocompromised.'],
    preferredDestination: 'Campus Aerobic Composting & Organic Fertilizer Unit',
    recommendedBinId: 'B02',
    conditions: ['Campus composting unit accepts fruit peels, veggie trimmings, coffee grounds, and bread.'],
    isHazardousByDefault: false,
  },
  'battery-hazmat': {
    materialType: 'electronic material',
    keywords: ['battery', 'alkaline', 'lithium', 'aa', 'aaa', '18650', 'cell', 'power bank', 'button cell'],
    canonicalName: 'Dry Cell / Lithium-Ion Battery',
    defaultCategories: ['Hazardous'],
    preferredAction: 'Tape terminal ends with clear tape and deposit directly into E-Waste Locker B04 at Block B.',
    alternativeAction: 'Deliver to campus health & safety office during designated chemical drop-off hours.',
    handlingInstructions: [
      'NEVER throw into general trash or standard blue recycling bins (critical fire risk in compactors).',
      'Tape positive and negative terminals with electrical or Scotch tape to prevent short circuits.',
      'If swollen or leaking, place in a non-conductive sand bucket or plastic ziplock immediately.',
    ],
    safetyWarnings: [
      'CRITICAL: Lithium batteries can ignite or explode if compressed in waste compaction trucks.',
      'Do not puncture, incinerate, or attempt to recharge non-rechargeable alkaline cells.',
    ],
    preferredDestination: 'Authorized Hazardous E-Waste Smelter & Hydrometallurgical Recycler',
    recommendedBinId: 'B04',
    conditions: ['Must never enter mechanical shredders or landfill streams.'],
    isHazardousByDefault: true,
  },
  'old-electronics': {
    materialType: 'electronic material',
    keywords: ['phone', 'smartphone', 'laptop', 'tablet', 'charger', 'cable', 'headphones', 'motherboard', 'circuit'],
    canonicalName: 'Consumer Electronics & Mobile Devices',
    defaultCategories: ['Reusable', 'Hazardous'],
    preferredAction: 'Perform factory reset and list on Campus Tech Swap or donate to community refurbishers.',
    alternativeAction: 'Deposit at Block B E-Waste Recovery Locker for precious metal extraction.',
    handlingInstructions: [
      'Backup data and execute a cryptographic factory reset before handing over.',
      'Remove external SIM cards and micro-SD memory cards.',
      'Keep cords bundled with device to increase refurbishment utility.',
    ],
    safetyWarnings: [
      'Do not attempt to pry open glued lithium-ion battery packs with metal tools.',
    ],
    preferredDestination: 'Campus Tech Refurbishment Lab & Certified E-Waste Recycler',
    recommendedBinId: 'B04',
    conditions: ['Working items should prioritize student reuse and refurbishment over teardown.'],
    isHazardousByDefault: true,
  },
  'aluminium-can': {
    materialType: 'metal',
    keywords: ['can', 'tin', 'aluminium', 'soda can', 'coke can', 'beer can', 'foil'],
    canonicalName: 'Aluminium Beverage Can',
    defaultCategories: ['Recyclable'],
    preferredAction: 'Empty liquids, lightly crush, and place into Recyclables Bin B01.',
    alternativeAction: 'Collect in bulk for hostel charity scrap metal drives.',
    handlingInstructions: [
      'Rinse out sugary syrups to prevent attracting pests.',
      'Leave pull-tab attached to the can.',
    ],
    safetyWarnings: ['Beware of sharp torn metal rim edges.'],
    preferredDestination: 'Secondary Aluminium Smelter (95% energy savings vs bauxite)',
    recommendedBinId: 'B01',
    conditions: ['Aluminium can be recycled indefinitely without degradation.'],
    isHazardousByDefault: false,
  },
};

/**
 * Validates and adjusts Gemini AI analysis using the deterministic Knowledge Base
 */
export function applyKnowledgeRules(rawAnalysis: AnalysisResult): {
  verifiedAnalysis: AnalysisResult;
  ruleApplied?: KnowledgeRule;
  discrepancyDetected: boolean;
  discrepancyNote?: string;
} {
  const textToScan = `${rawAnalysis.objectName} ${rawAnalysis.materialType} ${rawAnalysis.condition || ''}`.toLowerCase();

  // Find best matching knowledge rule
  let matchedRule: KnowledgeRule | undefined;
  for (const rule of Object.values(MATERIAL_KNOWLEDGE_BASE)) {
    if (rule.keywords.some((k) => textToScan.includes(k))) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    return {
      verifiedAnalysis: rawAnalysis,
      discrepancyDetected: false,
    };
  }

  const updatedCategories = new Set(rawAnalysis.categories);
  let discrepancyDetected = false;
  let discrepancyNote: string | undefined;

  // SAFETY HARDENING: If it's a battery or hazardous item, STRICTLY enforce Hazardous category & Bin B04
  if (matchedRule.isHazardousByDefault) {
    if (!updatedCategories.has('Hazardous')) {
      updatedCategories.add('Hazardous');
      discrepancyDetected = true;
      discrepancyNote = `Safety Rule Triggered: Detected ${matchedRule.canonicalName} which requires strict Hazardous handling. Overriding general classification.`;
    }

    // Never allow batteries to go to regular recycling bin
    if (rawAnalysis.targetBinId !== 'B04') {
      rawAnalysis.targetBinId = 'B04';
      discrepancyDetected = true;
      discrepancyNote = (discrepancyNote ? discrepancyNote + ' ' : '') + `Redirected to Safe E-Waste Locker B04 at Block B.`;
    }
  }

  // Merge safety warnings from knowledge base
  const combinedWarnings = Array.from(
    new Set([...(rawAnalysis.safetyWarnings || []), ...matchedRule.safetyWarnings])
  );

  const verifiedAnalysis: AnalysisResult = {
    ...rawAnalysis,
    categories: Array.from(updatedCategories),
    safetyWarnings: combinedWarnings,
    recommendedAction: rawAnalysis.recommendedAction || matchedRule.preferredAction,
    alternativeAction: rawAnalysis.alternativeAction || matchedRule.alternativeAction,
    targetBinId: matchedRule.isHazardousByDefault ? 'B04' : (rawAnalysis.targetBinId || matchedRule.recommendedBinId),
    explanation: discrepancyDetected && discrepancyNote
      ? `${rawAnalysis.explanation} [Safety Verification Note: ${discrepancyNote}]`
      : rawAnalysis.explanation,
  };

  return {
    verifiedAnalysis,
    ruleApplied: matchedRule,
    discrepancyDetected,
    discrepancyNote,
  };
}
