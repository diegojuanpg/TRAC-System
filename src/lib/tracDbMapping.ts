/**
 * Mapping between TRAC sheet headers (used by tracEngine) and trac_entries DB columns.
 */

export const TRAC_HEADERS = [
  'Date', 'Measurement_Time', 'Protocol_Confirmed', 'Context_Flag', 'Bodyweight',
  'Tap Speed Test', 'Tap_Variance', 'Tap_Pauses',
  'HR1', 'HR2', 'HR3', 'HR4',
  'OrthoResponse', 'VagalRecovery', 'PosturalCost', 'POTS_Flag',
  'Push Soreness', 'Pull Soreness', 'Legs Soreness', 'Lesión/Molestia',
  'Cansancio', 'Carga de Trabajo Percibida', 'Recuperación Percibida',
  'Horas de Sueño', 'Calidad de Sueño', 'Alimentacion', 'Motivación',
  'Estrés Percibido',
  'Z-Tap Speed Test', 'Z-Tap Variance',
  'Z-HR1', 'Z-HR2', 'Z-HR3', 'Z-HR4',
  'Z-OrthoResponse', 'Z-VagalRecovery', 'Z-PosturalCost',
  'Z-Push Soreness', 'Z-Pull Soreness', 'Z-Legs Soreness', 'Z-Lesión/Molestia',
  'Z-Cansancio', 'Z-Carga de Trabajo Percibida', 'Z-Recuperación Percibida',
  'Z-Horas de Sueño', 'Z-Calidad de Sueño', 'Z-Alimentacion', 'Z-Motivacion',
  'Z-Estrés Percibido',
  'Fatigue', 'Fitness', 'Readiness', 'Z-Readiness',
  'Peripheral_Stress', 'Central_Stress',
  'STF', 'LTF', 'STF_LTF_Ratio', 'ANS_Profile', 'Trend_7d',
  'Alert_Level', 'TRAC_Action',
  'Monotony', 'Strain', 'Parasympathetic_Saturation',
];

/** Header → DB column name */
export const HEADER_TO_DB: Record<string, string> = {
  'Date': 'date',
  'Measurement_Time': 'measurement_time',
  'Protocol_Confirmed': 'protocol_confirmed',
  'Context_Flag': 'context_flag',
  'Bodyweight': 'bodyweight',
  'Tap Speed Test': 'tap_speed_test',
  'Tap_Variance': 'tap_variance',
  'Tap_Pauses': 'tap_pauses',
  'HR1': 'hr1', 'HR2': 'hr2', 'HR3': 'hr3', 'HR4': 'hr4',
  'OrthoResponse': 'ortho_response',
  'VagalRecovery': 'vagal_recovery',
  'PosturalCost': 'postural_cost',
  'POTS_Flag': 'pots_flag',
  'Push Soreness': 'push_soreness',
  'Pull Soreness': 'pull_soreness',
  'Legs Soreness': 'legs_soreness',
  'Lesión/Molestia': 'injury',
  'Cansancio': 'fatigue_input',
  'Carga de Trabajo Percibida': 'workload',
  'Recuperación Percibida': 'recovery',
  'Horas de Sueño': 'sleep_hours',
  'Calidad de Sueño': 'sleep_quality',
  'Alimentacion': 'nutrition_quality',
  'Motivación': 'motivation',
  'Estrés Percibido': 'stress_perceived',
  'Z-Tap Speed Test': 'z_tap_speed',
  'Z-Tap Variance': 'z_tap_var',
  'Z-HR1': 'z_hr1', 'Z-HR2': 'z_hr2', 'Z-HR3': 'z_hr3', 'Z-HR4': 'z_hr4',
  'Z-OrthoResponse': 'z_ortho',
  'Z-VagalRecovery': 'z_vagal',
  'Z-PosturalCost': 'z_postural',
  'Z-Push Soreness': 'z_push',
  'Z-Pull Soreness': 'z_pull',
  'Z-Legs Soreness': 'z_legs',
  'Z-Lesión/Molestia': 'z_injury',
  'Z-Cansancio': 'z_fatigue',
  'Z-Carga de Trabajo Percibida': 'z_workload',
  'Z-Recuperación Percibida': 'z_recovery',
  'Z-Horas de Sueño': 'z_sleep_h',
  'Z-Calidad de Sueño': 'z_sleep_q',
  'Z-Alimentacion': 'z_nutrition',
  'Z-Motivacion': 'z_motivation',
  'Z-Estrés Percibido': 'z_stress',
  'Fatigue': 'fatigue',
  'Fitness': 'fitness',
  'Readiness': 'readiness',
  'Z-Readiness': 'z_readiness',
  'Peripheral_Stress': 'peripheral_stress',
  'Central_Stress': 'central_stress',
  'STF': 'stf',
  'LTF': 'ltf',
  'STF_LTF_Ratio': 'stf_ltf_ratio',
  'ANS_Profile': 'ans_profile',
  'Trend_7d': 'trend_7d',
  'Alert_Level': 'alert_level',
  'TRAC_Action': 'trac_action',
  'Monotony': 'monotony',
  'Strain': 'strain',
  'Parasympathetic_Saturation': 'parasympathetic_saturation',
};

/** DB column → header (inverse) */
export const DB_TO_HEADER: Record<string, string> = Object.fromEntries(
  Object.entries(HEADER_TO_DB).map(([h, db]) => [db, h]),
);

/* ── Date serial helpers (Google Sheets epoch: 1899-12-30) ── */

const SHEETS_EPOCH = Date.UTC(1899, 11, 30);

export function serialToISODate(serial: number): string {
  const ms = SHEETS_EPOCH + serial * 86400 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function isoDateToSerial(iso: string): number {
  const d = new Date(iso + 'T00:00:00Z').getTime();
  return Math.round((d - SHEETS_EPOCH) / 86400000);
}

/* ── Conversion: DB row ↔ sheet DataRow ── */

export type CellValue = string | number | boolean | null | undefined;

/** Convert a trac_entries DB row to a sheet-style array indexed by TRAC_HEADERS. */
export function dbRowToDataRow(db: Record<string, unknown>): CellValue[] {
  return TRAC_HEADERS.map(header => {
    const col = HEADER_TO_DB[header];
    let v = db[col] as CellValue;
    // Date stored as ISO; tracEngine expects serial number
    if (header === 'Date' && typeof v === 'string') v = isoDateToSerial(v);
    return v === null || v === undefined ? '' : v;
  });
}

/** Convert a sheet-style DataRow back to a DB-shaped object (for upsert). */
export function dataRowToDbRow(row: CellValue[], athleteId: string): Record<string, unknown> {
  const out: Record<string, unknown> = { athlete_id: athleteId };
  TRAC_HEADERS.forEach((header, i) => {
    const col = HEADER_TO_DB[header];
    let v = row[i];
    if (v === '' || v === undefined) v = null;
    if (header === 'Date' && typeof v === 'number') {
      out[col] = serialToISODate(v);
    } else if (header === 'POTS_Flag' || header === 'Protocol_Confirmed') {
      out[col] = v === null ? null : String(v);
    } else if (header === 'Parasympathetic_Saturation') {
      out[col] = v === null ? null : v === true || v === 'true';
    } else {
      out[col] = v;
    }
  });
  return out;
}
