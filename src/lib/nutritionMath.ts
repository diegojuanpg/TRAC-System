/**
 * Nutrition math helpers — maintenance calories, weight deltas, adherence.
 *
 * Energy balance constant: 1 kg tissue ≈ 7700 kcal
 * Method: linear regression on MA7 of bodyweight, paired with avg intake.
 */

export const KCAL_PER_KG = 7700;

export interface NutritionRow {
  date: string;            // YYYY-MM-DD
  bodyweight: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  water: number | null;
  steps: number | null;
  cardio: number | string | null;
}

export type AutoManual = 'auto' | 'manual';
export type MacroUnit = 'gkg' | 'pct';

export interface Goals {
  mode: 'cut' | 'maintenance' | 'bulk';

  // Athlete info
  startWeight: number | null;          // manual value (used when startWeightMode='manual')
  startWeightMode: AutoManual;         // 'auto' = latest from rows

  // Weight planning triangle
  targetWeight: number | null;
  targetRatePerWeek: number | null;    // kg/week (negative = cut)
  targetDate: string | null;

  // Calorie planning row
  maintenanceKcal: number | null;      // value to use (manual or snapshot of auto)
  maintenanceMode: AutoManual;
  kcalAdjPerDay: number | null;        // deficit (-) or surplus (+) kcal/day
  balanceKcal: number | null;          // = maintenance + kcalAdjPerDay (computed, stored)

  // Macros — store all representations for snapshot fidelity
  proteinPerKg: number | null;
  proteinPct: number | null;
  proteinTarget: number | null;        // grams
  proteinUnit: MacroUnit;

  fatPerKg: number | null;
  fatPct: number | null;
  fatTarget: number | null;
  fatUnit: MacroUnit;

  carbsPerKg: number | null;
  carbsPct: number | null;
  carbsTarget: number | null;
  carbsUnit: MacroUnit;

  // Other
  kcalTarget: number | null;           // mirrors balanceKcal
  fiberTarget: number | null;
  cardioTarget: number | null;         // min/day
  waterTarget: number | null;
  stepsTarget: number | null;

  updatedAt?: string;
  updatedBy?: string;
}

export const EMPTY_GOALS: Goals = {
  mode: 'maintenance',
  startWeight: null,
  startWeightMode: 'auto',
  targetWeight: null,
  targetRatePerWeek: null,
  targetDate: null,
  maintenanceKcal: null,
  maintenanceMode: 'auto',
  kcalAdjPerDay: null,
  balanceKcal: null,
  proteinPerKg: null,
  proteinPct: null,
  proteinTarget: null,
  proteinUnit: 'gkg',
  fatPerKg: null,
  fatPct: null,
  fatTarget: null,
  fatUnit: 'gkg',
  carbsPerKg: null,
  carbsPct: null,
  carbsTarget: null,
  carbsUnit: 'gkg',
  kcalTarget: null,
  fiberTarget: null,
  cardioTarget: null,
  waterTarget: null,
  stepsTarget: null,
};

/* ── Conversion helpers ── */

export const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 } as const;

export function kgWeekToKcalDay(rateKgWeek: number): number {
  return Math.round((rateKgWeek * KCAL_PER_KG) / 7);
}

export function kcalDayToKgWeek(kcalDay: number): number {
  return parseFloat(((kcalDay * 7) / KCAL_PER_KG).toFixed(3));
}

export function pctToGrams(pct: number, totalKcal: number, kcalPerG: number): number {
  return Math.round(((pct / 100) * totalKcal) / kcalPerG);
}

export function gramsToPct(grams: number, totalKcal: number, kcalPerG: number): number {
  if (totalKcal <= 0) return 0;
  return parseFloat((((grams * kcalPerG) / totalKcal) * 100).toFixed(1));
}

/* ── Date utils ── */

export function parseSheetDate(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  // Google Sheets serial number
  const n = Number(v);
  if (!isNaN(n) && n > 25569) {
    const d = new Date((n - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00');
  const b = new Date(bISO + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ── Parse rows from Apps Script ── */

export function parseNutritionRows(headers: unknown[], rows: unknown[][]): NutritionRow[] {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => {
    if (typeof h === 'string') idx[h.trim()] = i;
  });
  const get = (row: unknown[], key: string): number | string | null => {
    const i = idx[key];
    if (i === undefined) return null;
    const v = row[i];
    if (v === null || v === undefined || v === '') return null;
    return v as number | string;
  };
  const num = (v: number | string | null): number | null => {
    if (v === null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  return rows
    .map((row): NutritionRow | null => {
      const date = parseSheetDate(get(row, 'Date'));
      if (!date) return null;
      return {
        date,
        bodyweight: num(get(row, 'Bodyweight')),
        calories: num(get(row, 'Calories (kcals)')),
        protein: num(get(row, 'Protein (gr)')),
        carbs: num(get(row, 'Carbs (gr)')),
        fat: num(get(row, 'Fat (gr)')),
        fiber: num(get(row, 'Fiber (gr)')),
        water: num(get(row, 'Water (lt)')),
        steps: num(get(row, 'Steps')),
        cardio: get(row, 'Cardio'),
      };
    })
    .filter((r): r is NutritionRow => r !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ── Moving averages & regression ── */

export function rollingMean(values: (number | null)[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= i; j++) {
      const v = values[j];
      if (v !== null && !isNaN(v)) {
        sum += v;
        count++;
      }
    }
    out.push(count > 0 ? sum / count : null);
  }
  return out;
}

/** Linear regression slope (units of y per unit of x). x = day index, y = value. */
export function linearSlope(points: { x: number; y: number }[]): number | null {
  const n = points.length;
  if (n < 2) return null;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  if (den === 0) return null;
  return num / den;
}

/* ── Maintenance calorie estimation ── */

export interface MaintenanceResult {
  maintenance: number | null;
  slopeKgPerDay: number | null;
  avgIntake: number | null;
  daysUsed: number;
  confidence: 'low' | 'medium' | 'high' | 'insufficient';
  adherencePct: number;
}

/**
 * Estimate maintenance kcal using linear regression of MA7 bodyweight
 * over last `windowDays` days, paired with avg intake.
 *
 * maintenance = avg_intake - (slope_kg_per_day * 7700)
 */
export function estimateMaintenance(
  rows: NutritionRow[],
  windowDays = 21
): MaintenanceResult {
  if (rows.length === 0) {
    return {
      maintenance: null,
      slopeKgPerDay: null,
      avgIntake: null,
      daysUsed: 0,
      confidence: 'insufficient',
      adherencePct: 0,
    };
  }

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-windowDays);
  const bws = recent.map(r => r.bodyweight);
  const ma7 = rollingMean(bws, 7);

  // Build regression points: (day index, ma7 weight)
  const points: { x: number; y: number }[] = [];
  ma7.forEach((y, i) => {
    if (y !== null) points.push({ x: i, y });
  });

  const slope = linearSlope(points);

  // Avg intake — exclude null-calorie days
  const calsList = recent.map(r => r.calories).filter((v): v is number => v !== null);
  const avgIntake = calsList.length > 0
    ? calsList.reduce((a, b) => a + b, 0) / calsList.length
    : null;

  // Adherence: % of days with both bodyweight AND calories logged
  const daysWithBoth = recent.filter(r => r.bodyweight !== null && r.calories !== null).length;
  const adherencePct = recent.length > 0 ? (daysWithBoth / recent.length) * 100 : 0;

  let maintenance: number | null = null;
  if (slope !== null && avgIntake !== null) {
    maintenance = Math.round(avgIntake - slope * KCAL_PER_KG);
  }

  let confidence: MaintenanceResult['confidence'] = 'insufficient';
  if (recent.length < 10 || daysWithBoth < 7) confidence = 'insufficient';
  else if (adherencePct < 70) confidence = 'low';
  else if (adherencePct >= 85 && recent.length >= 21) confidence = 'high';
  else confidence = 'medium';

  return {
    maintenance,
    slopeKgPerDay: slope,
    avgIntake: avgIntake !== null ? Math.round(avgIntake) : null,
    daysUsed: recent.length,
    confidence,
    adherencePct,
  };
}

/* ── Week-over-week deltas ── */

export interface WeekDelta {
  currentAvg: number | null;
  previousAvg: number | null;
  deltaKg: number | null;
  deltaGr: number | null;
  deltaPct: number | null;
}

export function bodyweightWeekDelta(rows: NutritionRow[], today = todayLocalISO()): WeekDelta {
  const last7Start = addDays(today, -6);
  const prev7Start = addDays(today, -13);
  const prev7End = addDays(today, -7);

  const avgInRange = (from: string, to: string): number | null => {
    const inRange = rows.filter(r => r.date >= from && r.date <= to && r.bodyweight !== null);
    if (inRange.length === 0) return null;
    const sum = inRange.reduce((s, r) => s + (r.bodyweight as number), 0);
    return sum / inRange.length;
  };

  const currentAvg = avgInRange(last7Start, today);
  const previousAvg = avgInRange(prev7Start, prev7End);

  if (currentAvg === null || previousAvg === null) {
    return { currentAvg, previousAvg, deltaKg: null, deltaGr: null, deltaPct: null };
  }
  const deltaKg = currentAvg - previousAvg;
  return {
    currentAvg,
    previousAvg,
    deltaKg,
    deltaGr: Math.round(deltaKg * 1000),
    deltaPct: (deltaKg / previousAvg) * 100,
  };
}

export function calWeekDelta(rows: NutritionRow[], today = todayLocalISO()): {
  lastWeekAvg: number | null;
  prevWeekAvg: number | null;
  delta: number | null;
} {
  const last7Start = addDays(today, -6);
  const prev7Start = addDays(today, -13);
  const prev7End = addDays(today, -7);

  const avgInRange = (from: string, to: string): number | null => {
    const cals = rows
      .filter(r => r.date >= from && r.date <= to && r.calories !== null)
      .map(r => r.calories as number);
    if (!cals.length) return null;
    return cals.reduce((a, b) => a + b, 0) / cals.length;
  };

  const lastWeekAvg = avgInRange(last7Start, today);
  const prevWeekAvg = avgInRange(prev7Start, prev7End);
  return {
    lastWeekAvg: lastWeekAvg !== null ? Math.round(lastWeekAvg) : null,
    prevWeekAvg: prevWeekAvg !== null ? Math.round(prevWeekAvg) : null,
    delta: lastWeekAvg !== null && prevWeekAvg !== null ? Math.round(lastWeekAvg - prevWeekAvg) : null,
  };
}

export function computeMacrosFromKg(
  proteinPerKg: number | null | undefined,
  fatPerKg: number | null | undefined,
  carbsPerKg: number | null | undefined,
  weight: number
): { protein: number | null; fat: number | null; carbs: number | null; kcal: number | null } {
  const protein = proteinPerKg != null ? Math.round(proteinPerKg * weight) : null;
  const fat = fatPerKg != null ? Math.round(fatPerKg * weight) : null;
  const carbs = carbsPerKg != null ? Math.round(carbsPerKg * weight) : null;
  const kcal =
    protein != null && fat != null && carbs != null
      ? Math.round(protein * 4 + fat * 9 + carbs * 4)
      : null;
  return { protein, fat, carbs, kcal };
}

/* ── Adherence ── */

export function adherence(rows: NutritionRow[], rangeDays: number, today = todayLocalISO()) {
  const from = addDays(today, -(rangeDays - 1));
  const inRange = rows.filter(r => r.date >= from && r.date <= today);
  const fields: (keyof NutritionRow)[] = [
    'bodyweight', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'water', 'steps',
  ];
  let full = 0;
  let partial = 0;
  inRange.forEach(r => {
    const filled = fields.filter(k => r[k] !== null).length;
    if (filled === fields.length) full++;
    else if (filled > 0) partial++;
  });
  return {
    full,
    partial,
    none: rangeDays - full - partial,
    pctComplete: rangeDays > 0 ? (full / rangeDays) * 100 : 0,
    pctAny: rangeDays > 0 ? ((full + partial) / rangeDays) * 100 : 0,
  };
}

/* ── Daily status for calendar ── */

export type CalorieStatus = 'over' | 'slightly_over' | 'on' | 'slightly_under' | 'under' | 'none' | 'refeed';

export function calorieStatus(
  row: NutritionRow,
  kcalTarget: number | null,
  isRefeed: boolean
): CalorieStatus {
  if (isRefeed) return 'refeed';
  if (row.calories === null || kcalTarget === null) return 'none';
  const ratio = row.calories / kcalTarget;
  if (ratio > 1.10) return 'over';
  if (ratio > 1.05) return 'slightly_over';
  if (ratio >= 0.95) return 'on';
  if (ratio >= 0.90) return 'slightly_under';
  return 'under';
}

export type AdherenceStatus = 'full' | 'partial' | 'none';

export function rowAdherence(row: NutritionRow): AdherenceStatus {
  const fields: (keyof NutritionRow)[] = [
    'bodyweight', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'water', 'steps',
  ];
  const filled = fields.filter(k => row[k] !== null).length;
  if (filled === fields.length) return 'full';
  if (filled > 0) return 'partial';
  return 'none';
}

/* ── Goal projections ── */

export interface GoalProjection {
  weeksToTarget: number | null;
  estimatedDate: string | null;
  recommendedKcal: number | null; // target intake to hit ratePerWeek
  paceVsPlan: 'on_track' | 'slow' | 'fast' | 'wrong_direction' | 'unknown';
}

export function projectGoal(
  rows: NutritionRow[],
  goals: Goals,
  maintenance: number | null
): GoalProjection {
  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const currentWeight = lastRow?.bodyweight ?? null;

  if (!goals.targetWeight || currentWeight === null) {
    return { weeksToTarget: null, estimatedDate: null, recommendedKcal: null, paceVsPlan: 'unknown' };
  }

  const weightDiff = goals.targetWeight - currentWeight; // negative = need to lose

  let weeksToTarget: number | null = null;
  let estimatedDate: string | null = null;
  let recommendedKcal: number | null = null;

  if (goals.targetRatePerWeek && goals.targetRatePerWeek !== 0) {
    const rate = goals.targetRatePerWeek;
    const sameSign = (rate > 0 && weightDiff > 0) || (rate < 0 && weightDiff < 0);
    if (sameSign) {
      weeksToTarget = weightDiff / rate;
      estimatedDate = addDays(todayLocalISO(), Math.round(weeksToTarget * 7));
    }
    if (maintenance !== null) {
      // ratePerWeek kg/wk → kcal/day adjustment = rate * 7700 / 7
      const kcalAdjPerDay = (rate * KCAL_PER_KG) / 7;
      recommendedKcal = Math.round(maintenance + kcalAdjPerDay);
    }
  }

  // Pace check: compare actual slope vs target rate
  let paceVsPlan: GoalProjection['paceVsPlan'] = 'unknown';
  const main = estimateMaintenance(rows, 14);
  if (main.slopeKgPerDay !== null && goals.targetRatePerWeek !== null) {
    const actualPerWeek = main.slopeKgPerDay * 7;
    const targetPerWeek = goals.targetRatePerWeek;
    if (targetPerWeek === 0) {
      paceVsPlan = Math.abs(actualPerWeek) < 0.1 ? 'on_track' : 'fast';
    } else {
      const sameDirection = Math.sign(actualPerWeek) === Math.sign(targetPerWeek);
      if (!sameDirection) paceVsPlan = 'wrong_direction';
      else {
        const ratio = Math.abs(actualPerWeek / targetPerWeek);
        if (ratio >= 0.8 && ratio <= 1.2) paceVsPlan = 'on_track';
        else if (ratio < 0.8) paceVsPlan = 'slow';
        else paceVsPlan = 'fast';
      }
    }
  }

  return { weeksToTarget, estimatedDate, recommendedKcal, paceVsPlan };
}

/* ── Range filter ── */

export function filterByRange(rows: NutritionRow[], rangeDays: number, today = todayLocalISO()): NutritionRow[] {
  const from = addDays(today, -(rangeDays - 1));
  return rows.filter(r => r.date >= from && r.date <= today);
}

/* ── Build full date series with gaps filled (for calendar) ── */

export interface CalendarDay {
  date: string;
  row: NutritionRow | null;
  isRefeed: boolean;
}

export function buildCalendar(
  rows: NutritionRow[],
  refeeds: Set<string>,
  fromISO: string,
  toISO: string
): CalendarDay[] {
  const map = new Map(rows.map(r => [r.date, r]));
  const out: CalendarDay[] = [];
  let cursor = fromISO;
  while (cursor <= toISO) {
    out.push({
      date: cursor,
      row: map.get(cursor) ?? null,
      isRefeed: refeeds.has(cursor),
    });
    cursor = addDays(cursor, 1);
  }
  return out;
}

/* ── Weekly aggregates ── */

export interface WeeklyAgg {
  weekStart: string;
  avgWeight: number | null;
  avgCals: number | null;
  daysLogged: number;
}

export function weeklyAggregates(rows: NutritionRow[]): WeeklyAgg[] {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const buckets = new Map<string, NutritionRow[]>();

  sorted.forEach(r => {
    const d = new Date(r.date + 'T00:00:00');
    const day = d.getDay(); // 0=Sun
    const monOffset = (day + 6) % 7;
    d.setDate(d.getDate() - monOffset);
    const weekStart = d.toISOString().slice(0, 10);
    const bucket = buckets.get(weekStart) ?? [];
    bucket.push(r);
    buckets.set(weekStart, bucket);
  });

  const out: WeeklyAgg[] = [];
  Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([weekStart, bucket]) => {
      const ws = bucket.map(r => r.bodyweight).filter((v): v is number => v !== null);
      const cs = bucket.map(r => r.calories).filter((v): v is number => v !== null);
      out.push({
        weekStart,
        avgWeight: ws.length ? ws.reduce((a, b) => a + b, 0) / ws.length : null,
        avgCals: cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : null,
        daysLogged: bucket.length,
      });
    });

  return out;
}
