// ══════════════════════════════════════════════════════════════════════════
// TRAC Engine — Client-Side Metric Calculations
//
// Port of the calculation logic from the original datalogger.js (Script B)
// to run in the browser. All Z-scores, EWMA, composites, ANS profiling,
// and TRAC_Action logic lives here.
// ══════════════════════════════════════════════════════════════════════════

// ── CONFIGURATION ──

export const CONFIG_TRAC = {
  DB_HEADER_ROW: 6,
  DB_DATA_START_ROW: 7,
  DB_COL_COUNT: 66,
  POTS_THRESHOLD: 30,
  Z_WINDOW_DEFAULT: 28,
  Z_WINDOW_ORTHO: 14,
  STF_WINDOW: 7,
  LTF_WINDOW: 28,
  EWMA_LAMBDA_STF: 0.25,
  EWMA_LAMBDA_LTF: 0.069,
  ALERT_THRESHOLDS: [-1.0, -1.5, -2.0] as readonly number[],

  MAP_GROUP1: [
    { search: "Tap Speed Test", dbCol: "Tap Speed Test", zCol: "Z-Tap Speed Test", category: "fatigue", window: 28 },
    { search: "Tap Variance", dbCol: "Tap_Variance", zCol: "Z-Tap Variance", category: null, window: 28 },
    { search: "Tap Pauses", dbCol: "Tap_Pauses", zCol: "Z-Tap Pauses", category: null, window: 28 },
    { search: "HRV/VFC", dbCol: "VFC/HRV", zCol: null, category: null, window: 14 },
    {
      search: "Orthostatic Test", isOrthostatic: true, category: "fatigue", window: 14,
      dbCol: "", zCol: null,
      hrMap: [
        { dbCol: "HR1", zCol: "Z-HR1", srcCol: 27 },
        { dbCol: "HR2", zCol: "Z-HR2", srcCol: 29 },
        { dbCol: "HR3", zCol: "Z-HR3", srcCol: 31 },
        { dbCol: "HR4", zCol: "Z-HR4", srcCol: 33 }
      ]
    },
    { search: "Contexto", dbCol: "Context_Flag", zCol: null, category: null, window: null }
  ],

  MAP_GROUP2: [
    { search: "Push Soreness", dbCol: "Push Soreness", zCol: "Z-Push Soreness", category: "fatigue", window: 28 },
    { search: "Pull Soreness", dbCol: "Pull Soreness", zCol: "Z-Pull Soreness", category: "fatigue", window: 28 },
    { search: "Legs Soreness", dbCol: "Legs Soreness", zCol: "Z-Legs Soreness", category: "fatigue", window: 28 },
    { search: "Lesión/Molestia", dbCol: "Lesión/Molestia", zCol: "Z-Lesión/Molestia", category: "fatigue", window: 28 },
    { search: "Cansancio", dbCol: "Cansancio", zCol: "Z-Cansancio", category: "fatigue", window: 28 },
    { search: "Carga de Trabajo Percibida", dbCol: "Carga de Trabajo Percibida", zCol: "Z-Carga de Trabajo Percibida", category: "fatigue", window: 28 },
    { search: "Recuperación Percibida", dbCol: "Recuperación Percibida", zCol: "Z-Recuperación Percibida", category: "fitness", window: 28 },
    { search: "Horas de Sueño", dbCol: "Horas de Sueño", zCol: "Z-Horas de Sueño", category: "fitness", window: 28 },
    { search: "Calidad de Sueño", dbCol: "Calidad de Sueño", zCol: "Z-Calidad de Sueño", category: "fitness", window: 28 },
    { search: "Alimentación", dbCol: "Alimentacion", zCol: "Z-Alimentacion", category: "fitness", window: 28 },
    { search: "Motivación", dbCol: "Motivación", zCol: "Z-Motivacion", category: "fitness", window: 28 }
  ],

  DERIVED_METRICS: [
    { dbCol: "ln_HRV", zCol: null, window: null },
    { dbCol: "lnHRV_7d_mean", zCol: "Z-ln_HRV", window: 28 },
    { dbCol: "CV_lnHRV", zCol: "Z-CV_lnHRV", window: 28 },
    { dbCol: "lnRMSSD_RR_ratio", zCol: "Z-lnRMSSD_RR", window: 14 },
    { dbCol: "OrthoResponse", zCol: "Z-OrthoResponse", window: 14 },
    { dbCol: "VagalRecovery", zCol: "Z-VagalRecovery", window: 14 },
    { dbCol: "PosturalCost", zCol: "Z-PosturalCost", window: 14 },
    { dbCol: "POTS_Flag", zCol: null, window: null },
    { dbCol: "Protocol_Confirmed", zCol: null, window: null }
  ],

  FATIGUE_Z_COLS: [
    "Z-HR1", "Z-HR2", "Z-HR4",
    "Z-OrthoResponse", "Z-PosturalCost",
    "Z-Push Soreness", "Z-Pull Soreness", "Z-Legs Soreness",
    "Z-Lesión/Molestia", "Z-Cansancio", "Z-Carga de Trabajo Percibida",
    "Z-Tap Speed Test"
  ],

  FITNESS_Z_COLS: [
    "Z-ln_HRV", "Z-Recuperación Percibida",
    "Z-Horas de Sueño", "Z-Calidad de Sueño",
    "Z-Alimentacion", "Z-Motivacion", "Z-VagalRecovery"
  ]
};


// ── Wellness scale conversions (1-5 → 0-10) ──

const SCALE_FATIGUE: Record<number, number> = { 1: 0, 2: 2.5, 3: 5, 4: 7.5, 5: 10 };
const SCALE_FITNESS: Record<number, number> = { 1: 10, 2: 7.5, 3: 5, 4: 2.5, 5: 0 };


// ── Types ──

export type CellValue = string | number | boolean | null | undefined;
export type DataRow = CellValue[];
export type HeaderMap = Record<string, number>;

export interface FormData {
  [key: string]: string | number | undefined;
  hrv?: number | string;
  hr1?: number | string;
  hr2?: number | string;
  hr3?: number | string;
  hr4?: number | string;
  tap_total?: number | string;
  tap_variance?: number | string;
  tap_pauses?: number | string;
  contexto?: string;
  bodyweight?: number | string;
  push_soreness?: number | string;
  pull_soreness?: number | string;
  legs_soreness?: number | string;
  lesion?: number | string;
  cansancio?: number | string;
  carga?: number | string;
  recuperacion?: number | string;
  horas_sueno?: number | string;
  calidad_sueno?: number | string;
  alimentacion?: number | string;
  motivacion?: number | string;
}

interface ZMetric {
  dbCol: string;
  zCol: string;
  window: number;
}


// ══════════════════════════════════════════
// MAIN ENTRY POINT
// ══════════════════════════════════════════

/**
 * Given form data from the Morning Survey and historical data from the sheet,
 * builds a fully calculated row ready to be appended.
 *
 * Also recalculates Z-scores and composites for ALL historical rows
 * (to keep them consistent with the rolling window).
 *
 * @returns The complete dataset (historical + new row), all recalculated.
 */
export function buildCalculatedData(
  formData: FormData,
  headers: string[],
  historyRows: DataRow[]
): { allRows: DataRow[]; newRowIndex: number } {

  // Build header map
  const hMap: HeaderMap = {};
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const name = String(h || '').trim();
    if (name) {
      hMap[name] = i;
      colMap[name] = i + 1; // 1-indexed for buildNewRow
    }
  });

  // Pad all existing rows
  const allData: DataRow[] = historyRows.map(row => {
    const padded = row.slice();
    while (padded.length < CONFIG_TRAC.DB_COL_COUNT) padded.push('');
    return padded;
  });

  // ── Derived metrics from form data ──
  const hrv = formData.hrv !== undefined ? parseFloat(String(formData.hrv)) : NaN;
  const hr1 = formData.hr1 !== undefined ? parseInt(String(formData.hr1)) : NaN;
  const hr2 = formData.hr2 !== undefined ? parseInt(String(formData.hr2)) : NaN;
  const hr3 = formData.hr3 !== undefined ? parseInt(String(formData.hr3)) : NaN;
  const hr4 = formData.hr4 !== undefined ? parseInt(String(formData.hr4)) : NaN;

  const ln_hrv = !isNaN(hrv) && hrv > 0 ? Math.log(hrv) : '';
  const orthoResponse = !isNaN(hr2) && !isNaN(hr1) ? hr2 - hr1 : '';
  const vagalRecovery = !isNaN(hr2) && !isNaN(hr3) ? hr2 - hr3 : '';
  const posturalCost = !isNaN(hr4) && !isNaN(hr1) ? hr4 - hr1 : '';
  const pots_flag = typeof orthoResponse === 'number' ? orthoResponse > CONFIG_TRAC.POTS_THRESHOLD : '';
  const lnRMSSD_RR = (ln_hrv !== '' && !isNaN(hr1) && hr1 > 0)
    ? (ln_hrv as number) / (60000 / hr1) : '';

  // ── Build the new row ──
  const newRow = buildNewRow(colMap, {
    'Date': getTodaySerial(),
    'Measurement_Time': formatTime(new Date()),
    'Protocol_Confirmed': true,
    'Context_Flag': formData.contexto || 'Normal',
    'Bodyweight': formData.bodyweight !== undefined ? parseFloat(String(formData.bodyweight)) : '',
    'VFC/HRV': !isNaN(hrv) ? hrv : '',
    'ln_HRV': ln_hrv,
    'lnRMSSD_RR_ratio': lnRMSSD_RR,
    'Tap Speed Test': formData.tap_total !== undefined ? parseInt(String(formData.tap_total)) : '',
    'Tap_Variance': formData.tap_variance !== undefined ? parseInt(String(formData.tap_variance)) : '',
    'Tap_Pauses': formData.tap_pauses !== undefined ? parseInt(String(formData.tap_pauses)) : '',
    'HR1': !isNaN(hr1) ? hr1 : '',
    'HR2': !isNaN(hr2) ? hr2 : '',
    'HR3': !isNaN(hr3) ? hr3 : '',
    'HR4': !isNaN(hr4) ? hr4 : '',
    'OrthoResponse': orthoResponse,
    'VagalRecovery': vagalRecovery,
    'PosturalCost': posturalCost,
    'POTS_Flag': pots_flag,
    'Push Soreness': convertWellness(formData.push_soreness, 'fatigue'),
    'Pull Soreness': convertWellness(formData.pull_soreness, 'fatigue'),
    'Legs Soreness': convertWellness(formData.legs_soreness, 'fatigue'),
    'Lesión/Molestia': convertWellness(formData.lesion, 'fatigue'),
    'Cansancio': convertWellness(formData.cansancio, 'fatigue'),
    'Carga de Trabajo Percibida': convertWellness(formData.carga, 'fatigue'),
    'Recuperación Percibida': convertWellness(formData.recuperacion, 'fitness'),
    'Horas de Sueño': convertWellness(formData.horas_sueno, 'fitness'),
    'Calidad de Sueño': convertWellness(formData.calidad_sueno, 'fitness'),
    'Alimentacion': convertWellness(formData.alimentacion, 'fitness'),
    'Motivación': convertWellness(formData.motivacion, 'fitness'),
  });

  while (newRow.length < CONFIG_TRAC.DB_COL_COUNT) newRow.push('');
  allData.push(newRow);
  const newRowIndex = allData.length - 1;

  // ── Collect Z-score metrics ──
  const zMetrics: ZMetric[] = [];
  CONFIG_TRAC.MAP_GROUP1.forEach(item => {
    if ('isOrthostatic' in item && item.isOrthostatic && item.hrMap) {
      item.hrMap.forEach(hr => { if (hr.zCol) zMetrics.push({ dbCol: hr.dbCol, zCol: hr.zCol, window: item.window! }); });
    } else if (item.zCol) {
      zMetrics.push({ dbCol: item.dbCol, zCol: item.zCol, window: item.window! });
    }
  });
  CONFIG_TRAC.DERIVED_METRICS.forEach(dm => {
    if (dm.zCol) zMetrics.push({ dbCol: dm.dbCol, zCol: dm.zCol, window: dm.window! });
  });
  CONFIG_TRAC.MAP_GROUP2.forEach(item => {
    if (item.zCol) zMetrics.push({ dbCol: item.dbCol, zCol: item.zCol, window: item.window! });
  });

  // ── Recalculate everything ──
  tracPreCalculate7dMetrics(allData, hMap);
  tracRecalculateZScores(allData, hMap, zMetrics);
  tracRecalculateComposites(allData, hMap);

  return { allRows: allData, newRowIndex };
}


// ══════════════════════════════════════════
// PRE-CALCULATE 7-day METRICS
// ══════════════════════════════════════════

export function tracPreCalculate7dMetrics(allData: DataRow[], hMap: HeaderMap): void {
  const lnHRVIdx = hMap['ln_HRV'];
  const lnHRV7dIdx = hMap['lnHRV_7d_mean'];
  const cvLnHRVIdx = hMap['CV_lnHRV'];
  const lnRRIdx = hMap['lnRMSSD_RR_ratio'];
  const hr1Idx = hMap['HR1'];

  for (let i = 0; i < allData.length; i++) {

    if (lnHRVIdx !== undefined) {
      const windowStart = Math.max(0, i - 6);
      const vals: number[] = [];
      for (let j = windowStart; j <= i; j++) {
        const v = parseFloat(String(allData[j][lnHRVIdx]));
        if (!isNaN(v)) vals.push(v);
      }
      if (vals.length > 0) {
        const mean7d = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (lnHRV7dIdx !== undefined) allData[i][lnHRV7dIdx] = mean7d;
        if (cvLnHRVIdx !== undefined && vals.length >= 2) {
          const variance = vals.reduce((a, b) => a + Math.pow(b - mean7d, 2), 0) / vals.length;
          allData[i][cvLnHRVIdx] = mean7d !== 0 ? (Math.sqrt(variance) / mean7d) * 100 : 0;
        }
      } else {
        if (lnHRV7dIdx !== undefined) allData[i][lnHRV7dIdx] = '';
        if (cvLnHRVIdx !== undefined) allData[i][cvLnHRVIdx] = '';
      }
    }

    if (lnRRIdx !== undefined && lnHRVIdx !== undefined && hr1Idx !== undefined) {
      const existing = allData[i][lnRRIdx];
      if (existing === '' || existing === null || existing === undefined || isNaN(parseFloat(String(existing)))) {
        const lnHRV = parseFloat(String(allData[i][lnHRVIdx]));
        const hr1 = parseFloat(String(allData[i][hr1Idx]));
        if (!isNaN(lnHRV) && !isNaN(hr1) && hr1 > 0) {
          allData[i][lnRRIdx] = lnHRV / (60000 / hr1);
        }
      }
    }
  }
}


// ══════════════════════════════════════════
// Z-SCORES
// ══════════════════════════════════════════

export function tracRecalculateZScores(allData: DataRow[], hMap: HeaderMap, metrics: ZMetric[]): void {
  const contextIdx = hMap['Context_Flag'];
  const insufficientIdx = hMap['INSUFFICIENT_DATA'];

  for (const metric of metrics) {
    const colIdx = hMap[metric.dbCol];
    const zColIdx = hMap[metric.zCol];
    if (colIdx === undefined || zColIdx === undefined) continue;

    const windowSize = metric.window || CONFIG_TRAC.Z_WINDOW_DEFAULT;
    const invertSign = (metric.zCol === 'Z-Tap Speed Test');
    const isOptional = (metric.zCol === 'Z-Tap Variance' || metric.zCol === 'Z-Tap Pauses');

    for (let i = 0; i < allData.length; i++) {
      const rawVal = allData[i][colIdx];

      if (isOptional && (rawVal === '' || rawVal === null || rawVal === undefined)) {
        allData[i][zColIdx] = ''; continue;
      }

      const currentVal = parseFloat(String(rawVal));
      if (isNaN(currentVal)) { allData[i][zColIdx] = ''; continue; }

      const windowStart = Math.max(0, i - windowSize + 1);
      const windowValues: number[] = [];
      for (let j = windowStart; j <= i; j++) {
        if (contextIdx !== undefined) {
          const ctx = String(allData[j][contextIdx] || '').trim();
          if (ctx !== '' && ctx !== 'Normal') continue;
        }
        const v = parseFloat(String(allData[j][colIdx]));
        if (!isNaN(v)) windowValues.push(v);
      }

      if (windowValues.length < 7) {
        allData[i][zColIdx] = 0;
        if (insufficientIdx !== undefined) allData[i][insufficientIdx] = true;
        continue;
      }

      const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
      const variance = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowValues.length;
      const stdev = Math.sqrt(variance);

      if (stdev === 0) { allData[i][zColIdx] = 0; continue; }

      let z = (currentVal - mean) / stdev;
      if (invertSign) z = z * -1;
      allData[i][zColIdx] = z;
    }
  }
}


// ══════════════════════════════════════════
// COMPOSITES
// ══════════════════════════════════════════

export function tracRecalculateComposites(allData: DataRow[], hMap: HeaderMap): void {
  const fatigueZIdx = CONFIG_TRAC.FATIGUE_Z_COLS.map(n => hMap[n]).filter(i => i !== undefined);
  const fitnessZIdx = CONFIG_TRAC.FITNESS_Z_COLS.map(n => hMap[n]).filter(i => i !== undefined);

  const colFatigue = hMap['Fatigue'];
  const colFitness = hMap['Fitness'];
  const colSTF = hMap['STF'];
  const colLTF = hMap['LTF'];
  const colReadiness = hMap['Readiness'];
  const colSTFLTF = hMap['STF_LTF_Ratio'];
  const colANS = hMap['ANS_Profile'];
  const colTrend = hMap['Trend_7d'];
  const colAlert = hMap['Alert_Level'];
  const colAction = hMap['TRAC_Action'];

  const zLnHRVIdx = hMap['Z-ln_HRV'];
  const zOrthoRespIdx = hMap['Z-OrthoResponse'];
  const zHR1Idx = hMap['Z-HR1'];
  const zPosturalIdx = hMap['Z-PosturalCost'];
  const zReadinessIdx = hMap['Z-Readiness'];
  const insufficientIdx = hMap['INSUFFICIENT_DATA'];

  const avgOfValid = (row: DataRow, indices: number[]): CellValue => {
    const vals = indices.map(i => parseFloat(String(row[i]))).filter(v => !isNaN(v));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : '';
  };

  // Pass 1: Fatigue, Fitness, Readiness
  for (let i = 0; i < allData.length; i++) {
    if (insufficientIdx !== undefined) allData[i][insufficientIdx] = false;
    if (colFatigue !== undefined) allData[i][colFatigue] = avgOfValid(allData[i], fatigueZIdx);
    if (colFitness !== undefined) allData[i][colFitness] = avgOfValid(allData[i], fitnessZIdx);
    if (colReadiness !== undefined && colFatigue !== undefined && colFitness !== undefined) {
      const fat = parseFloat(String(allData[i][colFatigue]));
      const fit = parseFloat(String(allData[i][colFitness]));
      allData[i][colReadiness] = (!isNaN(fat) && !isNaN(fit)) ? fit - fat : '';
    }
  }

  // Pass 2: STF, LTF (EWMA)
  if (colFatigue !== undefined) {
    if (colSTF !== undefined) {
      const lambda = CONFIG_TRAC.EWMA_LAMBDA_STF;
      let ewma: number | null = null;
      for (let i = 0; i < allData.length; i++) {
        const v = parseFloat(String(allData[i][colFatigue]));
        if (!isNaN(v)) { ewma = ewma === null ? v : v * lambda + (1 - lambda) * ewma; allData[i][colSTF] = ewma; }
        else allData[i][colSTF] = ewma !== null ? ewma : '';
      }
    }
    if (colLTF !== undefined) {
      const lambda = CONFIG_TRAC.EWMA_LAMBDA_LTF;
      let ewma: number | null = null;
      for (let i = 0; i < allData.length; i++) {
        const v = parseFloat(String(allData[i][colFatigue]));
        if (!isNaN(v)) { ewma = ewma === null ? v : v * lambda + (1 - lambda) * ewma; allData[i][colLTF] = ewma; }
        else allData[i][colLTF] = ewma !== null ? ewma : '';
      }
    }
    if (colSTFLTF !== undefined && colSTF !== undefined && colLTF !== undefined) {
      for (let i = 0; i < allData.length; i++) {
        const stf = parseFloat(String(allData[i][colSTF]));
        const ltf = parseFloat(String(allData[i][colLTF]));
        allData[i][colSTFLTF] = (!isNaN(stf) && !isNaN(ltf) && ltf !== 0) ? stf / ltf : '';
      }
    }
  }

  // Z-Readiness
  if (colReadiness !== undefined && zReadinessIdx !== undefined) {
    const contextIdx = hMap['Context_Flag'];
    const windowSize = CONFIG_TRAC.Z_WINDOW_DEFAULT;
    for (let i = 0; i < allData.length; i++) {
      const currentVal = parseFloat(String(allData[i][colReadiness]));
      if (isNaN(currentVal)) { allData[i][zReadinessIdx] = ''; continue; }
      const windowStart = Math.max(0, i - windowSize + 1);
      const windowValues: number[] = [];
      for (let j = windowStart; j <= i; j++) {
        if (contextIdx !== undefined) {
          const ctx = String(allData[j][contextIdx] || '').trim();
          if (ctx !== '' && ctx !== 'Normal') continue;
        }
        const v = parseFloat(String(allData[j][colReadiness]));
        if (!isNaN(v)) windowValues.push(v);
      }
      if (windowValues.length < 7) { allData[i][zReadinessIdx] = 0; continue; }
      const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
      const variance = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowValues.length;
      const stdev = Math.sqrt(variance);
      allData[i][zReadinessIdx] = stdev === 0 ? 0 : (currentVal - mean) / stdev;
    }
  }

  // Pass 3: Alert, ANS, Trend, Action
  for (let i = 0; i < allData.length; i++) {

    if (colAlert !== undefined) {
      const zRead = zReadinessIdx !== undefined ? parseFloat(String(allData[i][zReadinessIdx])) : NaN;
      if (isNaN(zRead)) allData[i][colAlert] = 0;
      else if (zRead <= CONFIG_TRAC.ALERT_THRESHOLDS[2]) allData[i][colAlert] = 3;
      else if (zRead <= CONFIG_TRAC.ALERT_THRESHOLDS[1]) allData[i][colAlert] = 2;
      else if (zRead <= CONFIG_TRAC.ALERT_THRESHOLDS[0]) allData[i][colAlert] = 1;
      else allData[i][colAlert] = 0;
    }

    if (colANS !== undefined) {
      const zRead = zReadinessIdx !== undefined ? parseFloat(String(allData[i][zReadinessIdx])) : NaN;
      const alertLvl = colAlert !== undefined ? allData[i][colAlert] : 0;
      const insuffFlag = insufficientIdx !== undefined ? allData[i][insufficientIdx] : false;
      const zLnHRV = zLnHRVIdx !== undefined ? parseFloat(String(allData[i][zLnHRVIdx])) : NaN;
      const zOrthoResp = zOrthoRespIdx !== undefined ? parseFloat(String(allData[i][zOrthoRespIdx])) : NaN;
      const zHR1 = zHR1Idx !== undefined ? parseFloat(String(allData[i][zHR1Idx])) : NaN;
      const zPostural = zPosturalIdx !== undefined ? parseFloat(String(allData[i][zPosturalIdx])) : NaN;
      const zLnRRIdx = hMap['Z-lnRMSSD_RR'];
      const zLnRR = zLnRRIdx !== undefined ? parseFloat(String(allData[i][zLnRRIdx])) : NaN;

      if (insuffFlag === true) allData[i][colANS] = 'INSUFFICIENT_DATA';
      else if (!isNaN(zRead) && zRead > 0 && alertLvl === 0) allData[i][colANS] = 'OPTIMAL';
      else if (!isNaN(zLnHRV) && zLnHRV < -1.0 && !isNaN(zOrthoResp) && zOrthoResp > 1.0) allData[i][colANS] = 'SNS_DOMINANT';
      else if (!isNaN(zLnHRV) && zLnHRV < -1.0 && !isNaN(zHR1) && zHR1 < -1.0 && !isNaN(zPostural) && zPostural < -1.0) {
        allData[i][colANS] = (!isNaN(zLnRR) && zLnRR < -1.0) ? 'PSNS_SATURATION' : 'PSNS_DOMINANT';
      }
      else if (!isNaN(zRead) && zRead < -1.0) allData[i][colANS] = 'BALANCED_FATIGUED';
      else allData[i][colANS] = 'OPTIMAL';

      const colNFOR = hMap['NFOR_Risk'];
      if (colNFOR !== undefined) {
        const zCVIdx = hMap['Z-CV_lnHRV'];
        const zCV = zCVIdx !== undefined ? parseFloat(String(allData[i][zCVIdx])) : NaN;
        allData[i][colNFOR] = !isNaN(zCV) && zCV < -1.0;
      }
    }

    if (colTrend !== undefined && colReadiness !== undefined) {
      const start = Math.max(0, i - 6);
      const readVals: { x: number; y: number }[] = [];
      for (let j = start; j <= i; j++) {
        const v = parseFloat(String(allData[j][colReadiness]));
        if (!isNaN(v)) readVals.push({ x: j - start, y: v });
      }
      if (readVals.length >= 3) {
        const n = readVals.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (const p of readVals) { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x; }
        const denom = n * sumX2 - sumX * sumX;
        allData[i][colTrend] = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
      } else {
        allData[i][colTrend] = '';
      }
    }

    if (colAction !== undefined) {
      allData[i][colAction] = calculateTRACAction(allData[i], hMap);
    }
  }
}


// ══════════════════════════════════════════
// TRAC ACTION
// ══════════════════════════════════════════

export function calculateTRACAction(row: DataRow, hMap: HeaderMap): string {
  const potsFlag = hMap['POTS_Flag'] !== undefined ? row[hMap['POTS_Flag']] : false;
  const alertLevel = hMap['Alert_Level'] !== undefined ? row[hMap['Alert_Level']] : 0;
  const ansProfile = hMap['ANS_Profile'] !== undefined ? String(row[hMap['ANS_Profile']]) : '';
  const insuffFlag = hMap['INSUFFICIENT_DATA'] !== undefined ? row[hMap['INSUFFICIENT_DATA']] : false;
  const nforRisk = hMap['NFOR_Risk'] !== undefined ? row[hMap['NFOR_Risk']] : false;

  if (potsFlag === true) return 'REPOSO TOTAL - Delta ortostatico critico (>30bpm). No entrenar.';
  if (alertLevel === 3) return 'Descanso completo o sesion regenerativa (RPE 2-3) - Nivel de fatiga critico.';
  if (nforRisk === true && alertLevel === 0) return 'Alerta NFOR - Variabilidad del HRV en declive. Reducir volumen preventivamente esta semana aunque el readiness parezca ok.';
  if (ansProfile === 'SNS_DOMINANT') return 'Fatiga Simpatica - Reducir intensidad drasticamente (cap RPE 6). Mantener volumen moderado.';
  if (ansProfile === 'PSNS_DOMINANT') return 'Fatiga Parasimpatica - Reduccion moderada: RPE -1 sobre plan, volumen 65-70%. Evitar cargas maximas y PRs.';
  if (ansProfile === 'PSNS_SATURATION') return 'Saturacion Parasimpatica (Superforma) - HRV bajo por tono vagal elevado, no por fatiga. Sesion normal, posibilidad de PR.';
  if (ansProfile === 'BALANCED_FATIGUED') return 'Fatiga Generalizada - Reduccion moderada de volumen e intensidad (RPE -1 y Series -1).';
  if (alertLevel === 2) return 'Fatiga Moderada - Sesion ligera/moderada (RPE 5-6).';
  if (alertLevel === 1) return 'Fatiga Leve - Reduccion preventiva de intensidad (RPE -1).';
  if (alertLevel === 0 && ansProfile !== 'INSUFFICIENT_DATA' && insuffFlag !== true) return 'Readiness Optimo - Sesion segun plan. Posibilidad de records personales (PR).';
  return 'Datos Insuficientes - Entrenar segun sensaciones hasta completar ventana de 7 dias.';
}


// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

export function convertWellness(raw: string | number | undefined, category: 'fatigue' | 'fitness'): CellValue {
  const num = parseInt(String(raw));
  if (isNaN(num) || num < 1 || num > 5) return '';
  const scale = category === 'fitness' ? SCALE_FITNESS : SCALE_FATIGUE;
  return scale[num];
}

function buildNewRow(colMap: Record<string, number>, values: Record<string, CellValue>): DataRow {
  const maxCol = Math.max(...Object.values(colMap));
  const row: DataRow = new Array(maxCol).fill('');
  Object.entries(values).forEach(([header, val]) => {
    const colIdx = colMap[header];
    if (colIdx) row[colIdx - 1] = (val === null || val === undefined) ? '' : val;
  });
  return row;
}

export function getTodaySerial(): number {
  const today = new Date();
  const epoch = new Date(1899, 11, 30);
  return Math.floor((today.getTime() - epoch.getTime()) / 86400000);
}

function formatTime(date: Date): string {
  return date.getHours().toString().padStart(2, '0') + ':' +
    date.getMinutes().toString().padStart(2, '0');
}
