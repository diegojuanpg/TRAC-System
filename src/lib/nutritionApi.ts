/**
 * Supabase-backed nutrition data layer.
 * Tables: nutrition_entries, nutrition_goals, nutrition_goals_history, refeeds.
 * Multi-tenant via athlete_id; RLS enforces access.
 */

import { supabase } from './supabase';
import { Goals, EMPTY_GOALS, NutritionRow } from './nutritionMath';

export interface AthleteContext {
  athleteId: string | null | undefined;
}

function requireAthlete(c: AthleteContext): string {
  if (!c.athleteId) throw new Error('Atleta no seleccionado.');
  return c.athleteId;
}

/* ── Nutrition rows ─────────────────────────────────────────────────── */

interface NutritionRowDB {
  date: string;
  bodyweight: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  water: number | null;
  steps: number | null;
  cardio: string | null;
}

function rowFromDB(r: NutritionRowDB): NutritionRow {
  return {
    date: r.date,
    bodyweight: r.bodyweight,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    fiber: r.fiber,
    water: r.water,
    steps: r.steps,
    cardio: r.cardio,
  };
}

export async function fetchNutritionHistory(c: AthleteContext, rows = 500): Promise<NutritionRow[]> {
  const athleteId = requireAthlete(c);
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('date, bodyweight, calories, protein, carbs, fat, fiber, water, steps, cardio')
    .eq('athlete_id', athleteId)
    .order('date', { ascending: false })
    .limit(rows);
  if (error) throw new Error(error.message);
  return (data ?? []).reverse().map(rowFromDB);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const NUTRITION_FIELDS = [
  'bodyweight', 'calories', 'protein', 'carbs', 'fat',
  'fiber', 'water', 'steps', 'cardio',
] as const;

function sanitizeNutritionData(data: Record<string, number | string | null>) {
  const out: Record<string, number | string | null> = {};
  for (const key of NUTRITION_FIELDS) {
    if (!(key in data)) continue;
    const v = data[key];
    if (v === null || v === '') { out[key] = null; continue; }
    if (typeof v === 'number') {
      if (!isFinite(v) || v < 0 || v > 1e6) continue;
      out[key] = v;
    } else if (typeof v === 'string') {
      if (v.length > 200) continue;
      out[key] = v;
    }
  }
  return out;
}

export async function saveNutritionEntry(
  c: AthleteContext,
  data: Record<string, number | string | null>,
  date?: string,
) {
  const athleteId = requireAthlete(c);
  if (date && !DATE_RE.test(date)) throw new Error('Fecha inválida.');
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const clean = sanitizeNutritionData(data);

  const { error } = await supabase
    .from('nutrition_entries')
    .upsert(
      { athlete_id: athleteId, date: targetDate, ...clean },
      { onConflict: 'athlete_id,date' },
    );
  if (error) throw new Error(error.message);
  return { success: true };
}

/* ── Goals ──────────────────────────────────────────────────────────── */

// Map between camelCase (frontend) and snake_case (DB)
function goalsToDB(g: Partial<Goals>): Record<string, unknown> {
  return {
    mode: g.mode,
    start_weight: g.startWeight ?? null,
    start_weight_mode: g.startWeightMode ?? null,
    target_weight: g.targetWeight ?? null,
    target_rate_per_week: g.targetRatePerWeek ?? null,
    target_date: g.targetDate ?? null,
    maintenance_kcal: g.maintenanceKcal ?? null,
    maintenance_mode: g.maintenanceMode ?? null,
    kcal_adj_per_day: g.kcalAdjPerDay ?? null,
    balance_kcal: g.balanceKcal ?? null,
    protein_per_kg: g.proteinPerKg ?? null,
    protein_pct: g.proteinPct ?? null,
    protein_target: g.proteinTarget ?? null,
    protein_unit: g.proteinUnit ?? null,
    fat_per_kg: g.fatPerKg ?? null,
    fat_pct: g.fatPct ?? null,
    fat_target: g.fatTarget ?? null,
    fat_unit: g.fatUnit ?? null,
    carbs_per_kg: g.carbsPerKg ?? null,
    carbs_pct: g.carbsPct ?? null,
    carbs_target: g.carbsTarget ?? null,
    carbs_unit: g.carbsUnit ?? null,
    kcal_target: g.kcalTarget ?? null,
    fiber_target: g.fiberTarget ?? null,
    cardio_target: g.cardioTarget ?? null,
    water_target: g.waterTarget ?? null,
    steps_target: g.stepsTarget ?? null,
  };
}

function goalsFromDB(r: Record<string, unknown>): Goals {
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const s = typeof v === 'string' ? v.replace(/[​-‍﻿ ⁠]/g, '').trim() : v;
    if (s === '') return null;
    const n = Number(s);
    return isNaN(n) ? null : n;
  };
  const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
  const mode = str(r.mode);
  const validMode: Goals['mode'] = mode === 'cut' || mode === 'bulk' ? mode : 'maintenance';
  const mUnit = (v: unknown): 'gkg' | 'pct' => (v === 'pct' ? 'pct' : 'gkg');
  const aMode = (v: unknown): 'auto' | 'manual' => (v === 'manual' ? 'manual' : 'auto');
  return {
    mode: validMode,
    startWeight: num(r.start_weight),
    startWeightMode: aMode(r.start_weight_mode),
    targetWeight: num(r.target_weight),
    targetRatePerWeek: num(r.target_rate_per_week),
    targetDate: str(r.target_date),
    maintenanceKcal: num(r.maintenance_kcal),
    maintenanceMode: aMode(r.maintenance_mode),
    kcalAdjPerDay: num(r.kcal_adj_per_day),
    balanceKcal: num(r.balance_kcal),
    proteinPerKg: num(r.protein_per_kg),
    proteinPct: num(r.protein_pct),
    proteinTarget: num(r.protein_target),
    proteinUnit: mUnit(r.protein_unit),
    fatPerKg: num(r.fat_per_kg),
    fatPct: num(r.fat_pct),
    fatTarget: num(r.fat_target),
    fatUnit: mUnit(r.fat_unit),
    carbsPerKg: num(r.carbs_per_kg),
    carbsPct: num(r.carbs_pct),
    carbsTarget: num(r.carbs_target),
    carbsUnit: mUnit(r.carbs_unit),
    kcalTarget: num(r.kcal_target),
    fiberTarget: num(r.fiber_target),
    cardioTarget: num(r.cardio_target),
    waterTarget: num(r.water_target),
    stepsTarget: num(r.steps_target),
    updatedAt: str(r.updated_at) ?? undefined,
    updatedBy: str(r.prescribed_by) ?? undefined,
  };
}

export async function fetchGoals(c: AthleteContext): Promise<Goals> {
  const athleteId = requireAthlete(c);
  const { data, error } = await supabase
    .from('nutrition_goals')
    .select('*')
    .eq('athlete_id', athleteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? goalsFromDB(data as Record<string, unknown>) : EMPTY_GOALS;
}

export async function saveGoals(c: AthleteContext, userEmail: string, goals: Partial<Goals>, note?: string) {
  const athleteId = requireAthlete(c);
  const payload = {
    athlete_id: athleteId,
    ...goalsToDB(goals),
    updated_at: new Date().toISOString(),
    prescribed_by: userEmail,
    note: note ?? null,
  };

  const { error: upsertErr } = await supabase
    .from('nutrition_goals')
    .upsert(payload, { onConflict: 'athlete_id' });
  if (upsertErr) throw new Error(upsertErr.message);

  // Append to history
  const { error: histErr } = await supabase
    .from('nutrition_goals_history')
    .insert({
      athlete_id: athleteId,
      changed_by: userEmail,
      snapshot: payload,
      note: note ?? null,
    });
  if (histErr) console.warn('[nutritionApi] history insert failed:', histErr.message);

  return { success: true };
}

export interface GoalSnapshot {
  changedAt: string;
  changedBy: string;
  snapshot: Goals;
}

export async function fetchGoalsHistory(c: AthleteContext): Promise<GoalSnapshot[]> {
  const athleteId = requireAthlete(c);
  const { data, error } = await supabase
    .from('nutrition_goals_history')
    .select('changed_at, changed_by, snapshot')
    .eq('athlete_id', athleteId)
    .order('changed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(h => ({
    changedAt: String(h.changed_at ?? ''),
    changedBy: String(h.changed_by ?? ''),
    snapshot: goalsFromDB((h.snapshot ?? {}) as Record<string, unknown>),
  }));
}

/* ── Refeeds ────────────────────────────────────────────────────────── */

export async function fetchRefeeds(c: AthleteContext): Promise<Set<string>> {
  const athleteId = requireAthlete(c);
  const { data, error } = await supabase
    .from('refeeds')
    .select('date')
    .eq('athlete_id', athleteId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map(r => String(r.date)));
}

export async function toggleRefeed(c: AthleteContext, date: string, refeed: boolean) {
  const athleteId = requireAthlete(c);
  if (!DATE_RE.test(date)) throw new Error('Fecha inválida.');
  if (refeed) {
    const { error } = await supabase
      .from('refeeds')
      .upsert({ athlete_id: athleteId, date }, { onConflict: 'athlete_id,date' });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('refeeds')
      .delete()
      .eq('athlete_id', athleteId)
      .eq('date', date);
    if (error) throw new Error(error.message);
  }
  return { success: true };
}
