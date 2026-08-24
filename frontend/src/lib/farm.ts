// Farm profile + crop agronomy knowledge base.
//
// The profile is captured during onboarding and stored locally in the browser.
// No secrets, no server round-trip — this is the farmer's own configuration and
// is what makes the AI advisor's guidance specific to their crop.

import { IrrigationZone } from '../types';

export interface FarmProfile {
  farmName: string;
  crop: string;        // primary CROP value (first selected), e.g. 'maize'
  crops: string[];     // all crops the farmer grows — catalogue values or custom names
  growthStage: string; // GROWTH_STAGE value, e.g. 'vegetative'
  soilType: string;    // SOIL_TYPE value, e.g. 'loamy'
  productId?: string;
}

const STORAGE_KEY = 'agrosense.farmProfile';

export function getFarmProfile(): FarmProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.crop === 'string') {
      // Normalise older single-crop profiles into the crops[] shape.
      if (!Array.isArray(parsed.crops) || parsed.crops.length === 0) {
        parsed.crops = parsed.crop ? [parsed.crop] : [];
      }
      return parsed as FarmProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveFarmProfile(profile: FarmProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable — the app still works, advice is just generic */
  }
}

// ── Crop catalogue (used by onboarding + advisor) ────────────────────────────
export interface CropInfo {
  value: string;
  label: string;
  // Target soil-moisture band (%) for a healthy root zone
  moistureMin: number;
  moistureMax: number;
  waterNeed: 'low' | 'moderate' | 'high';
  note: string;
  watch: string; // common issues to watch for
}

export const CROPS: CropInfo[] = [
  { value: 'maize',    label: 'Maize (Corn)', moistureMin: 55, moistureMax: 75, waterNeed: 'high',     note: 'Maize is thirstiest during tasseling and cob fill. Keep the root zone consistently moist through those stages.', watch: 'fall armyworm, leaf blight, and nitrogen deficiency (pale lower leaves).' },
  { value: 'tomato',   label: 'Tomato',       moistureMin: 60, moistureMax: 80, waterNeed: 'high',     note: 'Tomatoes need steady moisture — swings between wet and dry cause blossom-end rot and fruit cracking.', watch: 'blight, blossom-end rot, and whitefly.' },
  { value: 'cassava',  label: 'Cassava',      moistureMin: 40, moistureMax: 65, waterNeed: 'low',      note: 'Cassava is drought-tolerant once established and dislikes waterlogging. Water sparingly.', watch: 'cassava mosaic disease and mealybug.' },
  { value: 'pepper',   label: 'Pepper',       moistureMin: 55, moistureMax: 70, waterNeed: 'moderate', note: 'Peppers like even moisture but are prone to root rot if the soil stays saturated.', watch: 'root rot above ~75% moisture, aphids, and anthracnose.' },
  { value: 'rice',     label: 'Rice (Paddy)', moistureMin: 75, moistureMax: 100, waterNeed: 'high',    note: 'Paddy rice is grown in saturated soil or standing water — keep moisture very high.', watch: 'blast disease and stem borer.' },
  { value: 'yam',      label: 'Yam',          moistureMin: 50, moistureMax: 70, waterNeed: 'moderate', note: 'Yam needs steady moisture during tuber bulking, then drier conditions near maturity.', watch: 'tuber rot in waterlogged mounds and nematodes.' },
  { value: 'plantain', label: 'Plantain',     moistureMin: 60, moistureMax: 80, waterNeed: 'high',     note: 'Plantain has shallow roots and high water demand — never let it dry out for long.', watch: 'black sigatoka and nematodes.' },
  { value: 'soybean',  label: 'Soybean',      moistureMin: 50, moistureMax: 70, waterNeed: 'moderate', note: 'Soybean is most water-sensitive during pod fill; earlier stages tolerate some dryness.', watch: 'rust, pod-sucking bugs, and iron chlorosis.' },
];

export interface GrowthStageInfo {
  value: string;
  label: string;
  desc: string;
  waterFactor: number; // multiplier on base water need
  note: string;
}

export const GROWTH_STAGES: GrowthStageInfo[] = [
  { value: 'seedling',   label: 'Seedling',            desc: '0–2 weeks after planting', waterFactor: 0.7, note: 'Roots are shallow — water lightly but often, and avoid saturating the bed.' },
  { value: 'vegetative', label: 'Vegetative',          desc: 'Active leaf & stem growth', waterFactor: 1.0, note: 'Steady growth phase — maintain the target moisture band consistently.' },
  { value: 'flowering',  label: 'Flowering / Fruiting', desc: 'Critical water period',   waterFactor: 1.3, note: 'This is the most water-sensitive stage. Do not let the root zone dry out — yield loss here is permanent.' },
  { value: 'maturity',   label: 'Maturity / Harvest',  desc: 'Approaching harvest',      waterFactor: 0.8, note: 'Begin tapering irrigation as the crop matures to firm up the harvest.' },
];

export interface SoilTypeInfo {
  value: string;
  label: string;
  desc: string;
  drainage: 'fast' | 'balanced' | 'moderate' | 'slow';
  note: string;
}

export const SOIL_TYPES: SoilTypeInfo[] = [
  { value: 'loamy', label: 'Loamy', desc: 'Balanced drainage & retention', drainage: 'balanced', note: 'Loam holds water well without waterlogging — the ideal medium.' },
  { value: 'sandy', label: 'Sandy', desc: 'Fast-draining, needs more water', drainage: 'fast', note: 'Sandy soil drains fast, so water in shorter, more frequent cycles to avoid runoff and loss below the roots.' },
  { value: 'clay',  label: 'Clay',  desc: 'Slow drainage, retains moisture', drainage: 'slow', note: 'Clay holds water and drains slowly — water deeply but less often, and watch for waterlogging.' },
  { value: 'silty', label: 'Silty', desc: 'Good retention, moderate drainage', drainage: 'moderate', note: 'Silt retains moisture well with moderate drainage — space out watering to avoid staying saturated.' },
];

export function getCropInfo(value?: string): CropInfo | undefined {
  return CROPS.find(c => c.value === value);
}
export function getGrowthStage(value?: string): GrowthStageInfo | undefined {
  return GROWTH_STAGES.find(s => s.value === value);
}
export function getSoilType(value?: string): SoilTypeInfo | undefined {
  return SOIL_TYPES.find(s => s.value === value);
}

// Label for any crop entry — a catalogue label for known crops, or the raw
// (custom) name the farmer typed in.
export function cropLabel(value: string): string {
  return getCropInfo(value)?.label ?? value;
}

// Natural-language list of every crop on the farm, e.g. "Maize, Tomato and Pepper".
export function cropsLabel(profile: FarmProfile | null): string {
  const list = profile?.crops?.length ? profile.crops : profile?.crop ? [profile.crop] : [];
  const labels = list.map(cropLabel);
  if (labels.length === 0) return 'your crops';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

// Human-readable one-liner describing the configured farm.
export function describeProfile(profile: FarmProfile | null): string {
  if (!profile) return 'your farm';
  const crop = cropsLabel(profile);
  const stage = getGrowthStage(profile.growthStage)?.label.toLowerCase() ?? profile.growthStage;
  const soil = getSoilType(profile.soilType)?.label.toLowerCase() ?? profile.soilType;
  return `${crop} at the ${stage} stage on ${soil} soil`;
}

// ── Zones ────────────────────────────────────────────────────────────────────
// The hardware is a single node with one pump. Zone 1 mirrors that live device;
// the remaining slots are shown as unlinked placeholders (add more devices to
// activate them) rather than filled with invented readings.
export interface LiveZoneInput {
  soilMoisture: number | null;
  pumpStatus: boolean | null;
  hasData: boolean;
}

export function buildZones(live: LiveZoneInput, profile: FarmProfile | null): IrrigationZone[] {
  const primaryName = profile?.farmName?.trim()
    ? profile.farmName.trim()
    : 'Field Zone';
  const primaryCropLabel = profile?.crops?.length
    ? cropLabel(profile.crops[0])
    : profile?.crop
    ? cropLabel(profile.crop)
    : undefined;

  const primary: IrrigationZone = {
    id: 'z1',
    name: primaryCropLabel ? `${primaryName} — ${primaryCropLabel}` : primaryName,
    status: live.hasData ? (live.pumpStatus ? 'active' : 'idle') : 'idle',
    moisture: live.hasData ? live.soilMoisture : null,
    lastIrrigated: null,
    nextScheduled: null,
    area: null,
    linked: true,
  };

  const placeholders: IrrigationZone[] = [2, 3, 4].map(n => ({
    id: `z${n}`,
    name: `Zone ${n}`,
    status: 'idle',
    moisture: null,
    lastIrrigated: null,
    nextScheduled: null,
    area: null,
    linked: false,
  }));

  return [primary, ...placeholders];
}
