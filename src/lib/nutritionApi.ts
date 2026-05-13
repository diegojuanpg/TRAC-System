/**
 * Apps Script client for nutrition dashboard.
 *
 * Endpoints used (datalogger.js):
 *  POST  saveNutrition         { data, date? }
 *  GET   fetchNutrition        ?rows=N
 *  POST  saveNutritionGoals    { goals, userEmail }   ← coach-only
 *  GET   fetchNutritionGoals
 *  GET   fetchNutritionGoalsHistory
 *  POST  toggleRefeed          { date, refeed }
 *  GET   fetchRefeeds
 */

import { Goals, NutritionRow, parseNutritionRows } from './nutritionMath';

const SHARED_TOKEN = import.meta.env.VITE_SHARED_TOKEN as string;

interface UserContext {
  scriptUrl: string | null | undefined;
  sheetId: string | null | undefined;
}

function requireConfig(u: UserContext) {
  if (!u.scriptUrl || !u.sheetId) {
    throw new Error('Configuración de atleta no encontrada. Re-inicia sesión.');
  }
  return { scriptUrl: u.scriptUrl, sheetId: u.sheetId };
}

const GENERIC_ERROR = 'No se pudo completar la operación. Intenta de nuevo.';

// Reads: GET directly to Apps Script (doGet returns CORS headers without redirect).
async function scriptRequest(scriptUrl: string, params: Record<string, unknown>) {
  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('token', SHARED_TOKEN);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(GENERIC_ERROR);
    const json = await res.json();
    if (!json || typeof json !== 'object') throw new Error(GENERIC_ERROR);
    if (!json.success) throw new Error(GENERIC_ERROR);
    return json;
  } catch (err) {
    if (err instanceof Error && err.message === GENERIC_ERROR) throw err;
    throw new Error(GENERIC_ERROR);
  }
}

// Writes: POST to /api/proxy (Vercel serverless) which forwards as GET server-side.
// Avoids Apps Script POST→redirect CORS issue.
async function proxyWrite(scriptUrl: string, params: Record<string, unknown>) {
  try {
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl, params: { token: SHARED_TOKEN, ...params } }),
    });
    if (!res.ok) throw new Error(GENERIC_ERROR);
    const json = await res.json();
    if (!json || typeof json !== 'object') throw new Error(GENERIC_ERROR);
    if (!json.success) throw new Error(json.error ?? GENERIC_ERROR);
    return json;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(GENERIC_ERROR);
  }
}

const postJson = proxyWrite;
const getJson  = scriptRequest;

/* ── Fetch nutrition rows ── */

export async function fetchNutritionHistory(u: UserContext, rows = 500): Promise<NutritionRow[]> {
  const { scriptUrl, sheetId } = requireConfig(u);
  const json = await getJson(scriptUrl, {
    action: 'fetchNutrition',
    sheetId,
    rows: String(rows),
  });
  const data = json.data ?? {};
  return parseNutritionRows(data.headers ?? [], data.rows ?? []);
}

/* ── Save nutrition entry ── */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KEY_RE  = /^[a-zA-Z0-9_]{1,40}$/;

function sanitizeNutritionData(
  data: Record<string, number | string | null>
): Record<string, number | string | null> {
  const out: Record<string, number | string | null> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!KEY_RE.test(k)) continue;
    if (v === null || v === '') { out[k] = null; continue; }
    if (typeof v === 'number') {
      if (!isFinite(v) || v < 0 || v > 1e6) continue;
      out[k] = v;
    } else if (typeof v === 'string') {
      if (v.length > 200) continue;
      out[k] = v;
    }
  }
  return out;
}

export async function saveNutritionEntry(
  u: UserContext,
  data: Record<string, number | string | null>,
  date?: string
) {
  const { scriptUrl, sheetId } = requireConfig(u);
  if (date && !DATE_RE.test(date)) {
    throw new Error('Fecha inválida.');
  }
  return postJson(scriptUrl, {
    action: 'saveNutrition',
    sheetId,
    data: sanitizeNutritionData(data),
    ...(date ? { date } : {}),
  });
}

/* ── Goals ── */

function normalizeGoals(raw: Record<string, unknown>): Goals {
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const cleaned = typeof v === 'string'
      ? v.replace(/[​-‍﻿ ⁠]/g, '').trim()
      : v;
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return isNaN(n) ? null : n;
  };
  const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
  const mode = str(raw.mode);
  const validMode: Goals['mode'] = mode === 'cut' || mode === 'bulk' ? mode : 'maintenance';
  const mUnit = (v: unknown): 'gkg' | 'pct' => (v === 'pct' ? 'pct' : 'gkg');
  const aMode = (v: unknown): 'auto' | 'manual' => (v === 'manual' ? 'manual' : 'auto');
  return {
    mode: validMode,
    startWeight: num(raw.startWeight),
    startWeightMode: aMode(raw.startWeightMode),
    targetWeight: num(raw.targetWeight),
    targetRatePerWeek: num(raw.targetRatePerWeek),
    targetDate: str(raw.targetDate),
    maintenanceKcal: num(raw.maintenanceKcal),
    maintenanceMode: aMode(raw.maintenanceMode),
    kcalAdjPerDay: num(raw.kcalAdjPerDay),
    balanceKcal: num(raw.balanceKcal),
    proteinPerKg: num(raw.proteinPerKg),
    proteinPct: num(raw.proteinPct),
    proteinTarget: num(raw.proteinTarget),
    proteinUnit: mUnit(raw.proteinUnit),
    fatPerKg: num(raw.fatPerKg),
    fatPct: num(raw.fatPct),
    fatTarget: num(raw.fatTarget),
    fatUnit: mUnit(raw.fatUnit),
    carbsPerKg: num(raw.carbsPerKg),
    carbsPct: num(raw.carbsPct),
    carbsTarget: num(raw.carbsTarget),
    carbsUnit: mUnit(raw.carbsUnit),
    kcalTarget: num(raw.kcalTarget),
    fiberTarget: num(raw.fiberTarget),
    cardioTarget: num(raw.cardioTarget),
    waterTarget: num(raw.waterTarget),
    stepsTarget: num(raw.stepsTarget),
    updatedAt: str(raw.updatedAt) ?? undefined,
    updatedBy: str(raw.updatedBy) ?? undefined,
  };
}

export async function fetchGoals(u: UserContext): Promise<Goals> {
  const { scriptUrl, sheetId } = requireConfig(u);
  const json = await getJson(scriptUrl, { action: 'fetchNutritionGoals', sheetId });
  return normalizeGoals(json.data?.goals ?? {});
}

export async function saveGoals(u: UserContext, userEmail: string, goals: Partial<Goals>, note?: string) {
  const { scriptUrl, sheetId } = requireConfig(u);
  return postJson(scriptUrl, {
    action: 'saveNutritionGoals',
    sheetId,
    userEmail,
    goals,
    note: note ?? '',
  });
}

export interface GoalSnapshot {
  changedAt: string;
  changedBy: string;
  snapshot: Goals;
}

export async function fetchGoalsHistory(u: UserContext): Promise<GoalSnapshot[]> {
  const { scriptUrl, sheetId } = requireConfig(u);
  const json = await getJson(scriptUrl, { action: 'fetchNutritionGoalsHistory', sheetId });
  const list = (json.data?.history ?? []) as Array<{ changedAt: unknown; changedBy: unknown; snapshot: Record<string, unknown> }>;
  return list.map(h => ({
    changedAt: String(h.changedAt ?? ''),
    changedBy: String(h.changedBy ?? ''),
    snapshot: normalizeGoals(h.snapshot ?? {}),
  }));
}

/* ── Refeeds ── */

export async function fetchRefeeds(u: UserContext): Promise<Set<string>> {
  const { scriptUrl, sheetId } = requireConfig(u);
  const json = await getJson(scriptUrl, { action: 'fetchRefeeds', sheetId });
  const list = (json.data?.refeeds ?? []) as string[];
  return new Set(list);
}

export async function toggleRefeed(u: UserContext, date: string, refeed: boolean) {
  const { scriptUrl, sheetId } = requireConfig(u);
  if (!DATE_RE.test(date)) throw new Error('Fecha inválida.');
  return postJson(scriptUrl, {
    action: 'toggleRefeed',
    sheetId,
    date,
    refeed: !!refeed,
  });
}
