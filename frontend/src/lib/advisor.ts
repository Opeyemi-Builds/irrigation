// Offline AI advisor engine.
//
// This produces genuinely useful, specific irrigation guidance with no API key
// and no network call. It reasons over the live sensor readings and the farmer's
// own crop profile (crop, growth stage, soil type) to give grounded advice.
//
// Everything here is deterministic. Output is plain markdown (headings, bold,
// bullet lists) rendered by the chat UIs. No emojis.

import {
  FarmProfile,
  getCropInfo,
  getGrowthStage,
  getSoilType,
  describeProfile,
} from './farm';

export interface AdvisorContext {
  temperature: number | null;
  humidity: number | null;
  soilMoisture: number | null;
  reservoirPct: number | null;
  pumpStatus: boolean | null;
  hasData: boolean;
  profile: FarmProfile | null;
}

// Firmware hysteresis thresholds — kept in sync with agrosense_firmware.ino.
const RELAY_ON = 60;
const RELAY_OFF = 75;

// ── Assessment ───────────────────────────────────────────────────────────────
type Level = 'low' | 'ok' | 'high';

interface Assessment {
  // Crop-adjusted target band for soil moisture
  targetMin: number;
  targetMax: number;
  soilLevel: Level | null;
  soilVerdict: string;
  tempVerdict: string;
  humidityVerdict: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function assess(ctx: AdvisorContext): Assessment {
  const crop = getCropInfo(ctx.profile?.crop);
  const stage = getGrowthStage(ctx.profile?.growthStage);

  // Base band from the crop, nudged by growth stage (flowering wants it wetter,
  // maturity a little drier). Falls back to the device's own 60–75 hysteresis.
  let targetMin = crop?.moistureMin ?? RELAY_ON;
  let targetMax = crop?.moistureMax ?? RELAY_OFF;
  if (stage) {
    const shift = (stage.waterFactor - 1) * 10; // ±3 at flowering, etc.
    targetMin = Math.round(clamp(targetMin + shift, 20, 90));
    targetMax = Math.round(clamp(targetMax + shift, targetMin + 5, 100));
  }

  let soilLevel: Level | null = null;
  let soilVerdict = 'Soil moisture reading is not in yet.';
  if (ctx.soilMoisture != null) {
    if (ctx.soilMoisture < targetMin) {
      soilLevel = 'low';
      soilVerdict = `Soil is at ${ctx.soilMoisture}%, below the ${targetMin}–${targetMax}% target for your crop — the root zone is drying out.`;
    } else if (ctx.soilMoisture > targetMax) {
      soilLevel = 'high';
      soilVerdict = `Soil is at ${ctx.soilMoisture}%, above the ${targetMin}–${targetMax}% target — the ground is wetter than it needs to be.`;
    } else {
      soilLevel = 'ok';
      soilVerdict = `Soil is at ${ctx.soilMoisture}%, comfortably inside the ${targetMin}–${targetMax}% target band.`;
    }
  }

  let tempVerdict = 'Temperature reading is not in yet.';
  if (ctx.temperature != null) {
    if (ctx.temperature >= 35) tempVerdict = `At ${ctx.temperature}°C it is hot — evaporation is high, so soil dries faster and midday watering is wasteful.`;
    else if (ctx.temperature >= 28) tempVerdict = `${ctx.temperature}°C is warm and typical for the growing season — normal water demand.`;
    else if (ctx.temperature >= 18) tempVerdict = `${ctx.temperature}°C is mild — water demand is moderate.`;
    else tempVerdict = `${ctx.temperature}°C is on the cool side — the crop uses less water, so avoid overwatering.`;
  }

  let humidityVerdict = 'Humidity reading is not in yet.';
  if (ctx.humidity != null) {
    if (ctx.humidity >= 80) humidityVerdict = `Humidity is high at ${ctx.humidity}% — soil loses water slowly, but watch for fungal disease in dense foliage.`;
    else if (ctx.humidity >= 50) humidityVerdict = `Humidity is a comfortable ${ctx.humidity}%.`;
    else humidityVerdict = `Humidity is low at ${ctx.humidity}% — the air is dry and plants transpire faster, raising water demand.`;
  }

  return { targetMin, targetMax, soilLevel, soilVerdict, tempVerdict, humidityVerdict };
}

// ── Shared building blocks ───────────────────────────────────────────────────
function noDataNote(): string {
  return [
    "I don't have any live readings from your device yet, so I can't give numbers-based advice at the moment.",
    '',
    'Once your AgroSense node is powered on and connected, its temperature, humidity, and soil-moisture readings will appear here automatically and I can tailor everything to your field in real time.',
    '',
    'In the meantime, ask me anything about your crop and I can share general guidance from your farm profile.',
  ].join('\n');
}

function profileLine(profile: FarmProfile | null): string {
  return `Working with **${describeProfile(profile)}**.`;
}

// ── Intent handlers ──────────────────────────────────────────────────────────
function replyIrrigation(ctx: AdvisorContext, a: Assessment): string {
  const stage = getGrowthStage(ctx.profile?.growthStage);
  const soil = getSoilType(ctx.profile?.soilType);

  if (ctx.soilMoisture == null) {
    return [
      '**Should you irrigate?**',
      '',
      "I need a live soil-moisture reading to answer that with confidence, and none has arrived yet.",
      '',
      `As a rule for ${describeProfile(ctx.profile)}, aim to keep soil moisture in the **${a.targetMin}–${a.targetMax}%** band. Water when it drops below ${a.targetMin}% and stop by the time it reaches ${a.targetMax}%.`,
    ].join('\n');
  }

  const lines: string[] = ['**Irrigation recommendation**', ''];

  if (a.soilLevel === 'low') {
    const deficit = a.targetMin - (ctx.soilMoisture as number);
    lines.push(`Yes — water now. ${a.soilVerdict}`);
    lines.push('');
    lines.push(`- The soil is about **${deficit}% below** the bottom of your target band.`);
    if (ctx.pumpStatus) {
      lines.push('- Your pump is already running, which is correct. Let it bring the level back up toward ' + a.targetMax + '%.');
    } else {
      lines.push('- The pump is currently off. On automatic control it should switch on at or below ' + RELAY_ON + '% and run until the soil recovers to ' + RELAY_OFF + '%.');
    }
    if (soil?.drainage === 'fast') lines.push('- Your ' + soil.label.toLowerCase() + ' soil drains quickly, so a shorter run repeated later beats one long soak that runs past the roots.');
    if (soil?.drainage === 'slow') lines.push('- Your ' + soil.label.toLowerCase() + ' soil holds water, so water deeply once rather than little and often.');
    if (ctx.temperature != null && ctx.temperature >= 32) lines.push('- It is hot right now — water early morning or late evening to cut evaporation loss.');
    if (stage?.value === 'flowering') lines.push('- This is the flowering/fruiting stage, the most water-sensitive point in the season. Do not delay.');
  } else if (a.soilLevel === 'high') {
    lines.push(`No — hold off. ${a.soilVerdict}`);
    lines.push('');
    lines.push('- Watering now risks waterlogging and root stress.');
    if (ctx.pumpStatus) lines.push('- The pump is on; it should stop by ' + RELAY_OFF + '%. Keep an eye on it.');
    else lines.push('- The pump is correctly off. Let the soil draw down before the next cycle.');
    const crop = getCropInfo(ctx.profile?.crop);
    if (crop) lines.push(`- Watch for ${crop.watch}`);
  } else {
    lines.push(`No action needed right now. ${a.soilVerdict}`);
    lines.push('');
    lines.push(`- Keep it in the **${a.targetMin}–${a.targetMax}%** band. The next watering is due when it falls below ${a.targetMin}%.`);
    if (ctx.pumpStatus) lines.push('- The pump is running — it should switch off automatically at ' + RELAY_OFF + '%.');
  }

  return lines.join('\n');
}

function replySoil(ctx: AdvisorContext, a: Assessment): string {
  const soil = getSoilType(ctx.profile?.soilType);
  const lines = ['**Soil & moisture**', '', profileLine(ctx.profile), '', a.soilVerdict];
  if (ctx.soilMoisture != null) {
    lines.push('');
    lines.push(`- Target band for this crop and stage: **${a.targetMin}–${a.targetMax}%**.`);
    if (soil) lines.push(`- ${soil.note}`);
    if (a.soilLevel === 'low') lines.push('- Action: irrigate to bring it back up.');
    if (a.soilLevel === 'high') lines.push('- Action: let it drain — no watering needed.');
    if (a.soilLevel === 'ok') lines.push('- Action: none — hold steady.');
  } else if (soil) {
    lines.push('');
    lines.push(`- ${soil.note}`);
  }
  return lines.join('\n');
}

function replyWeatherRain(ctx: AdvisorContext): string {
  return [
    '**Weather & rain**',
    '',
    "A live weather feed isn't connected to your system yet, so I can't forecast rain for your location. Once a weather source is added I'll factor incoming rain into the irrigation timing automatically.",
    '',
    ctx.humidity != null
      ? `For now I can only read your on-site humidity, currently **${ctx.humidity}%**. High humidity often precedes rain, but it isn't a forecast.`
      : 'For now I work from your on-site sensors once their readings arrive.',
    '',
    'Practical tip: if you know rain is coming, skip the next scheduled watering to save water and avoid saturating the root zone.',
  ].join('\n');
}

function replyTemperature(ctx: AdvisorContext, a: Assessment): string {
  const lines = ['**Temperature**', '', a.tempVerdict];
  if (ctx.temperature != null) {
    lines.push('');
    if (ctx.temperature >= 32) {
      lines.push('- Shift watering to early morning or evening to reduce evaporation.');
      lines.push('- Check soil moisture more often on hot days — it falls faster.');
    } else if (ctx.temperature < 18) {
      lines.push('- Cool conditions slow water use; ease off to avoid soggy soil.');
    } else {
      lines.push('- Conditions are in a comfortable range for steady growth.');
    }
  }
  return lines.join('\n');
}

function replyHumidity(ctx: AdvisorContext, a: Assessment): string {
  const crop = getCropInfo(ctx.profile?.crop);
  const lines = ['**Humidity**', '', a.humidityVerdict];
  if (ctx.humidity != null) {
    lines.push('');
    if (ctx.humidity >= 80) {
      lines.push('- Improve airflow and avoid wetting the leaves to limit fungal risk.');
      if (crop) lines.push(`- For your crop, watch for ${crop.watch}`);
    } else if (ctx.humidity < 50) {
      lines.push('- Dry air raises water demand — expect the soil to dry a little faster.');
    }
  }
  return lines.join('\n');
}

function replyReservoir(ctx: AdvisorContext): string {
  if (ctx.reservoirPct == null) {
    return ['**Water reservoir**', '', "The reservoir level reading hasn't arrived yet. Once your device reports the tank depth I'll track it and warn you before it runs low."].join('\n');
  }
  const lines = ['**Water reservoir**', '', `The tank is at **${ctx.reservoirPct}%**.`];
  lines.push('');
  if (ctx.reservoirPct <= 20) lines.push('- This is low. Refill soon so an irrigation cycle is never skipped for lack of water.');
  else if (ctx.reservoirPct <= 40) lines.push('- Getting low — plan a refill in the next day or two.');
  else lines.push('- Comfortable level. No action needed.');
  if (ctx.pumpStatus) lines.push('- The pump is currently drawing from the tank.');
  return lines.join('\n');
}

function replyDisease(ctx: AdvisorContext): string {
  const crop = getCropInfo(ctx.profile?.crop);
  const lines = ['**Crop health watch**', ''];
  if (crop) {
    lines.push(`For ${crop.label.toLowerCase()}, keep an eye out for ${crop.watch}`);
    lines.push('');
  }
  if (ctx.humidity != null && ctx.humidity >= 80) lines.push('- Humidity is high right now, which favours fungal disease. Water at the base, not the leaves, and keep foliage airy.');
  if (ctx.soilMoisture != null && ctx.soilMoisture > 80) lines.push('- Soil is very wet — persistently saturated roots invite rot. Let it drain between waterings.');
  lines.push('- General rule: consistent moisture and good drainage prevent most stress-related problems.');
  return lines.join('\n');
}

function replyWaterSaving(ctx: AdvisorContext, a: Assessment): string {
  const soil = getSoilType(ctx.profile?.soilType);
  const lines = ['**Saving water**', '', 'Your system already conserves water automatically — the pump only runs when soil moisture drops to ' + RELAY_ON + '% and stops at ' + RELAY_OFF + '%, so no water is wasted on already-moist soil.', '', 'To save even more:'];
  lines.push('- Water in the early morning or evening to cut evaporation losses.');
  if (soil?.drainage === 'fast') lines.push('- On your fast-draining soil, shorter and more frequent cycles waste less than one long soak.');
  lines.push('- Skip a cycle when rain is expected.');
  lines.push('- Mulch around plants to hold moisture in the root zone longer.');
  if (ctx.soilMoisture != null && a.soilLevel === 'high') lines.push('- Right now the soil is above target, so the best saving is simply not watering yet.');
  return lines.join('\n');
}

function replySummary(ctx: AdvisorContext, a: Assessment): string {
  if (!ctx.hasData) {
    return ['**Farm status**', '', profileLine(ctx.profile), '', noDataNote()].join('\n');
  }
  const lines = ['**Farm status**', '', profileLine(ctx.profile), ''];
  lines.push('Current readings:');
  lines.push(`- Temperature: ${ctx.temperature != null ? ctx.temperature + '°C' : '—'}`);
  lines.push(`- Humidity: ${ctx.humidity != null ? ctx.humidity + '%' : '—'}`);
  lines.push(`- Soil moisture: ${ctx.soilMoisture != null ? ctx.soilMoisture + '%' : '—'}`);
  if (ctx.reservoirPct != null) lines.push(`- Reservoir: ${ctx.reservoirPct}%`);
  lines.push(`- Pump: ${ctx.pumpStatus ? 'running' : 'off'}`);
  lines.push('');
  lines.push('Assessment:');
  lines.push(`- ${a.soilVerdict}`);
  if (ctx.temperature != null) lines.push(`- ${a.tempVerdict}`);
  lines.push('');
  if (a.soilLevel === 'low') lines.push('Bottom line: **the field needs water.** See my irrigation recommendation.');
  else if (a.soilLevel === 'high') lines.push('Bottom line: **hold off watering** — the soil is wetter than the target.');
  else lines.push('Bottom line: **everything is on track.** No action needed right now.');
  return lines.join('\n');
}

function replyHelp(ctx: AdvisorContext): string {
  return [
    '**How I can help**',
    '',
    profileLine(ctx.profile),
    '',
    'I read your live sensors and your crop profile to answer questions like:',
    '- Should I water now?',
    '- How is my soil moisture doing?',
    '- Is the temperature or humidity a problem?',
    '- How is my water reservoir?',
    '- How can I save water?',
    '- What diseases should I watch for?',
    '- Give me a full status of my farm.',
    '',
    'Just ask in your own words.',
  ].join('\n');
}

function replyGreeting(ctx: AdvisorContext): string {
  const name = ctx.profile?.farmName?.trim();
  const hi = name ? `Hello — welcome back to ${name}.` : 'Hello.';
  const status = ctx.hasData
    ? "I've got your live readings in front of me."
    : "I'm ready as soon as your device starts sending readings.";
  return `${hi} I'm your irrigation advisor. ${status} Ask me whether to water, how your soil is doing, or for a full farm status.`;
}

// ── Intent routing ───────────────────────────────────────────────────────────
type Handler = (ctx: AdvisorContext, a: Assessment) => string;

interface Intent {
  keywords: string[];
  handler: Handler;
}

// Order matters — earlier intents win when multiple match.
const INTENTS: Intent[] = [
  { keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you'], handler: replyGreeting },
  { keywords: ['help', 'what can you', 'what do you', 'how do you work', 'commands'], handler: replyHelp },
  { keywords: ['summary', 'status', 'overview', 'how is my farm', 'how is my field', 'report', 'everything'], handler: replySummary },
  { keywords: ['irrigate', 'water now', 'should i water', 'watering', 'turn on the pump', 'need water', 'schedule'], handler: replyIrrigation },
  { keywords: ['reservoir', 'tank', 'water level', 'water tank', 'refill'], handler: replyReservoir },
  { keywords: ['soil', 'moisture', 'dry', 'dryness', 'wet'], handler: replySoil },
  { keywords: ['rain', 'weather', 'forecast', 'storm', 'cloud'], handler: replyWeatherRain },
  { keywords: ['temp', 'temperature', 'hot', 'cold', 'heat'], handler: replyTemperature },
  { keywords: ['humid', 'humidity', 'moist air'], handler: replyHumidity },
  { keywords: ['disease', 'pest', 'fungus', 'rot', 'blight', 'insect', 'bug', 'sick', 'yellow'], handler: replyDisease },
  { keywords: ['save water', 'conserve', 'reduce water', 'waste', 'efficient', 'saving'], handler: replyWaterSaving },
  { keywords: ['fertiliz', 'fertilis', 'nutrient', 'feed'], handler: (ctx) => replyDisease(ctx) },
];

export function getAdvisorReply(question: string, ctx: AdvisorContext): string {
  const q = question.toLowerCase().trim();
  const a = assess(ctx);

  for (const intent of INTENTS) {
    if (intent.keywords.some(k => q.includes(k))) {
      return intent.handler(ctx, a);
    }
  }

  // Fallback: give the most useful thing we can — a grounded assessment.
  if (!ctx.hasData) {
    return [profileLine(ctx.profile), '', noDataNote()].join('\n');
  }
  return [
    "Here's where things stand — ask me about watering, soil, temperature, or your reservoir for more detail.",
    '',
    replySummary(ctx, a),
  ].join('\n');
}

// Suggested prompts surfaced in the chat UIs.
export const ADVISOR_SUGGESTIONS: string[] = [
  'Should I water my field now?',
  'How is my soil moisture doing?',
  'Give me a full status of my farm',
  'How can I save water?',
  'What diseases should I watch for?',
  'Is the temperature a problem right now?',
];
