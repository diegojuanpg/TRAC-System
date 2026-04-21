// ══════════════════════════════════════════════════════════════════════════
// SCRIPT B — TRAC DATA LOGGER (Simplified — Per Coach)
//
// Este script SOLO lee y escribe datos. Todos los cálculos de métricas
// (Z-scores, EWMA, composites, ANS) se hacen en el frontend.
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New Deployment
//   Type: Web App
//   Execute as: Me (la cuenta del coach)
//   Who has access: Anyone
//
// REQUISITOS:
//   1. Habilitar la API de Google Sheets (Services → Google Sheets API)
// ══════════════════════════════════════════════════════════════════════════

const SHARED_TOKEN = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7B8C9D0E1F2';

// ── CONFIG ──
const CONFIG = {
  TRAC_DB: 'TRAC_database',
  TRAC_HEADER_ROW: 6,
  TRAC_DATA_START: 7,
  TRAC_COL_COUNT: 60,     // A:BH

  NUTR_DB: 'Nutrition_database',
  NUTR_HEADER_ROW: 6,
  NUTR_DATA_START: 7,
  NUTR_COL_COUNT: 10       // A:J
};


// ══════════════════════════════════════════
// ENTRY POINTS
// ══════════════════════════════════════════

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (!body.token || body.token !== SHARED_TOKEN) {
      return jsonResponse({ success: false, error: 'Token inválido.' });
    }

    const action = String(body.action || '').trim();
    const sheetId = String(body.sheetId || '').trim();

    if (!sheetId) {
      return jsonResponse({ success: false, error: 'sheetId no proporcionado.' });
    }

    // ── CHECK: ¿Ya se completó el Morning Survey hoy? ──
    if (action === 'check') {
      const alreadySubmitted = checkAlreadySubmitted(sheetId);
      return jsonResponse({ success: true, alreadySubmitted });
    }

    // ── APPEND TRAC: Escribir fila pre-calculada ──
    if (action === 'appendTRAC') {
      const row = body.row;
      if (!row || !Array.isArray(row)) {
        return jsonResponse({ success: false, error: 'row[] no proporcionado.' });
      }
      const result = appendTRACRow(sheetId, row);
      return jsonResponse({ success: true, result });
    }

    // ── WRITE TRAC: Escribir TODAS las filas (recalculadas) ──
    if (action === 'writeTRAC') {
      const rows = body.rows;
      if (!rows || !Array.isArray(rows)) {
        return jsonResponse({ success: false, error: 'rows[][] no proporcionado.' });
      }
      const result = writeTRACData(sheetId, rows);
      return jsonResponse({ success: true, result });
    }

    // ── SAVE NUTRITION: Upsert en Nutrition_database ──
    if (action === 'saveNutrition') {
      const data = body.data;
      if (!data) {
        return jsonResponse({ success: false, error: 'data no proporcionado.' });
      }
      const result = saveNutritionData(sheetId, data);
      return jsonResponse({ success: true, result });
    }

    return jsonResponse({ success: false, error: 'Acción desconocida: ' + action });

  } catch (err) {
    console.error('[DataLogger] doPost error: %s', err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet(e) {
  try {
    const token = e.parameter.token;
    const action = String(e.parameter.action || '').trim();
    const sheetId = String(e.parameter.sheetId || '').trim();

    if (!token || token !== SHARED_TOKEN) {
      return jsonResponse({ success: false, error: 'Token inválido.' });
    }

    if (!sheetId) {
      return jsonResponse({ success: false, error: 'sheetId no proporcionado.' });
    }

    // ── FETCH HISTORY: Devolver headers + últimas N filas de TRAC_database ──
    if (action === 'fetchHistory') {
      enforceHeaders(sheetId);
      const maxRows = parseInt(e.parameter.rows || '50');
      const result = fetchHistory(sheetId, maxRows);
      return jsonResponse({ success: true, data: result });
    }

    // ── FETCH DASHBOARD: Devolver datos para el dashboard ──
    if (action === 'fetchDashboard') {
      enforceHeaders(sheetId);
      const result = fetchDashboardData(sheetId);
      return jsonResponse({ success: true, data: result });
    }

    // ── FETCH NUTRITION HISTORY ──
    if (action === 'fetchNutrition') {
      const maxRows = parseInt(e.parameter.rows || '50');
      const result = fetchNutritionHistory(sheetId, maxRows);
      return jsonResponse({ success: true, data: result });
    }

    return ContentService.createTextOutput('TRAC DataLogger — OK').setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    console.error('[DataLogger] doGet error: %s', err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}


// ══════════════════════════════════════════
// TRAC_database: READ
// ══════════════════════════════════════════

function fetchHistory(ssId, maxRows) {
  const endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);
  const hdrRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW + ":" + endCol + CONFIG.TRAC_HEADER_ROW;
  const dataRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START + ":" + endCol + "5000";

  const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
  const headers = hdrResp.values ? hdrResp.values[0] : [];

  const allDataResp = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
  const allData = (allDataResp.values || []).filter(row => row[0] !== undefined && row[0] !== '');

  // Devolver solo las últimas maxRows filas
  const startIdx = Math.max(0, allData.length - maxRows);
  const rows = allData.slice(startIdx);

  return { headers, rows, totalRows: allData.length };
}


// ══════════════════════════════════════════
// TRAC_database: WRITE
// ══════════════════════════════════════════

function enforceHeaders(ssId) {
  const endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);
  const hdrRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW + ":" + endCol + CONFIG.TRAC_HEADER_ROW;
  
  const REQUIRED_HEADERS = "Date,Measurement_Time,Protocol_Confirmed,Context_Flag,Bodyweight,Tap Speed Test,Tap_Variance,Tap_Pauses,HR1,HR2,HR3,HR4,OrthoResponse,VagalRecovery,PosturalCost,POTS_Flag,Push Soreness,Pull Soreness,Legs Soreness,Lesión/Molestia,Cansancio,Carga de Trabajo Percibida,Recuperación Percibida,Horas de Sueño,Calidad de Sueño,Alimentacion,Motivación,Z-Tap Speed Test,Z-Tap Variance,Z-HR1,Z-HR2,Z-HR3,Z-HR4,Z-OrthoResponse,Z-VagalRecovery,Z-PosturalCost,Z-Push Soreness,Z-Pull Soreness,Z-Legs Soreness,Z-Lesión/Molestia,Z-Cansancio,Z-Carga de Trabajo Percibida,Z-Recuperación Percibida,Z-Horas de Sueño,Z-Calidad de Sueño,Z-Alimentacion,Z-Motivacion,Fatigue,Fitness,Readiness,Z-Readiness,Peripheral_Stress,Central_Stress,STF,LTF,STF_LTF_Ratio,ANS_Profile,Trend_7d,Alert_Level,TRAC_Action".split(",");
  
  const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
  const currentHeaders = hdrResp.values ? hdrResp.values[0] : [];
  
  let match = true;
  if (currentHeaders.length !== REQUIRED_HEADERS.length) {
    match = false;
  } else {
    for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
      if (String(currentHeaders[i] || '').trim() !== REQUIRED_HEADERS[i]) {
        match = false;
        break;
      }
    }
  }
  
  if (!match) {
    const paddedHeaders = [...REQUIRED_HEADERS];
    // Pad to 100 columns to ensure we overwrite any old legacy columns (like the 66-column schema)
    while (paddedHeaders.length < 100) paddedHeaders.push('');
    const fullHdrRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW + ":CV" + CONFIG.TRAC_HEADER_ROW;
    
    Sheets.Spreadsheets.Values.update(
      { values: [paddedHeaders] },
      ssId,
      fullHdrRange,
      { valueInputOption: 'RAW' }
    );
    console.log('[DataLogger] Headers did not match required format. Overwritten.');
  }
}

function appendTRACRow(ssId, row) {
  enforceHeaders(ssId);

  // Pad row to full column count
  while (row.length < CONFIG.TRAC_COL_COUNT) row.push('');

  // Read existing data to find next empty row
  const endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);
  const dataRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START + ":" + endCol + "5007";
  const existing = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
  const existingRows = (existing.values || []).filter(r => r[0] !== undefined && r[0] !== '');
  const insertRow = CONFIG.TRAC_DATA_START + existingRows.length;

  // Write the single row
  const writeRange = "'" + CONFIG.TRAC_DB + "'!A" + insertRow + ":" + endCol + insertRow;
  Sheets.Spreadsheets.Values.update(
    { values: [row] },
    ssId,
    writeRange,
    { valueInputOption: 'RAW' }
  );

  console.log('[DataLogger] appendTRACRow: fila %d escrita.', insertRow);
  return { row: insertRow };
}

function writeTRACData(ssId, rows) {
  enforceHeaders(ssId);

  // Write ALL data rows (used when frontend recalculates everything)
  const endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);

  // Pad each row
  rows.forEach(row => {
    while (row.length < CONFIG.TRAC_COL_COUNT) row.push('');
  });

  Sheets.Spreadsheets.Values.update(
    { values: rows },
    ssId,
    "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START,
    { valueInputOption: 'RAW' }
  );

  console.log('[DataLogger] writeTRACData: %d filas escritas.', rows.length);
  return { rowsWritten: rows.length };
}


// ══════════════════════════════════════════
// CHECK: ¿Ya se rellenó hoy?
// ══════════════════════════════════════════

function checkAlreadySubmitted(ssId) {
  try {
    const hdrRow = CONFIG.TRAC_HEADER_ROW;
    const endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);

    const hdrResp = Sheets.Spreadsheets.Values.get(
      ssId,
      "'" + CONFIG.TRAC_DB + "'!A" + hdrRow + ":" + endCol + hdrRow
    );
    const headers = hdrResp.values ? hdrResp.values[0] : [];
    let dateColIdx = -1;
    headers.forEach((h, i) => { if (String(h).trim() === 'Date') dateColIdx = i; });
    if (dateColIdx === -1) return false;

    const dateColLetter = columnToLetter(dateColIdx + 1);
    const dateRange = "'" + CONFIG.TRAC_DB + "'!" + dateColLetter + (hdrRow + 1) + ":" + dateColLetter + "5000";
    const dateResp = Sheets.Spreadsheets.Values.get(ssId, dateRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
    const dates = dateResp.values || [];

    const todaySerial = getTodaySerial();
    const todayStr = getTodayString();

    return dates.some(row => {
      const val = row[0];
      if (!val) return false;
      const strVal = String(val);
      if (strVal.includes('-') && strVal === todayStr) return true;
      const numVal = Number(val);
      if (!isNaN(numVal)) return Math.abs(numVal - todaySerial) < 1;
      return false;
    });

  } catch (e) {
    console.error('[DataLogger] checkAlreadySubmitted error: %s', e.message);
    return false;
  }
}


// ══════════════════════════════════════════
// DASHBOARD DATA (GET)
// ══════════════════════════════════════════

function fetchDashboardData(ssId) {
  const endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);
  const hdrRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW + ":" + endCol + CONFIG.TRAC_HEADER_ROW;
  const dataRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START + ":" + endCol + "5000";

  const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
  const rawHeaders = hdrResp.values ? hdrResp.values[0] : [];
  const hMap = {};
  rawHeaders.forEach((h, i) => { if (h) hMap[String(h).trim()] = i; });

  const allDataResp = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
  const allData = (allDataResp.values || []).filter(row => row[0] !== undefined && row[0] !== '');

  if (allData.length === 0) return { error: 'No hay datos' };

  const lastRow = allData[allData.length - 1];
  const prevRow = allData.length > 1 ? allData[allData.length - 2] : null;

  const getVal = (row, colName, fallback) => {
    fallback = fallback !== undefined ? fallback : null;
    const idx = hMap[colName];
    if (idx === undefined || !row) return fallback;
    const v = row[idx];
    return (v === undefined || v === '') ? fallback : v;
  };

  // Últimos 14 días para trend, 7 para barra
  const last7Days = [];
  const readinessTrend = [];
  const startIdx = Math.max(0, allData.length - 14);
  for (let i = startIdx; i < allData.length; i++) {
    const dateRaw = getVal(allData[i], 'Date');
    let dateStr = String(dateRaw);
    if (typeof dateRaw === 'number') {
      const dateObj = new Date((dateRaw - 25569) * 86400 * 1000);
      dateStr = dateObj.toISOString().split('T')[0];
    }

    readinessTrend.push({
      date: dateStr,
      readiness: getVal(allData[i], 'Z-Readiness', 0)
    });

    if (i >= allData.length - 7) {
      last7Days.push({
        date: dateStr,
        alertLevel: getVal(allData[i], 'Alert_Level', 0),
        ansProfile: getVal(allData[i], 'ANS_Profile', 'INSUFFICIENT_DATA')
      });
    }
  }

  return {
    date: getVal(lastRow, 'Date'),
    measurementTime: getVal(lastRow, 'Measurement_Time', ''),
    alertLevel: getVal(lastRow, 'Alert_Level', 0),
    ansProfile: getVal(lastRow, 'ANS_Profile', 'INSUFFICIENT_DATA'),
    action: getVal(lastRow, 'TRAC_Action', ''),
    readinessZ: getVal(lastRow, 'Z-Readiness', 0),
    fatigueZ: getVal(lastRow, 'Fatigue', 0),
    fitnessZ: getVal(lastRow, 'Fitness', 0),
    stfLtfRatio: getVal(lastRow, 'STF_LTF_Ratio', 0),
    stf: getVal(lastRow, 'STF', 0),
    ltf: getVal(lastRow, 'LTF', 0),
    soreness: {
      push: getVal(lastRow, 'Push Soreness', 0),
      pull: getVal(lastRow, 'Pull Soreness', 0),
      legs: getVal(lastRow, 'Legs Soreness', 0),
      injury: getVal(lastRow, 'Lesión/Molestia', 0)
    },
    peripheralStress: getVal(lastRow, 'Peripheral_Stress', 0),
    centralStress: getVal(lastRow, 'Central_Stress', 0),
    readinessTrend,
    last7Days
  };
}


// ══════════════════════════════════════════
// NUTRITION: READ / WRITE
// ══════════════════════════════════════════

function fetchNutritionHistory(ssId, maxRows) {
  const endCol = columnToLetter(CONFIG.NUTR_COL_COUNT);
  const hdrRange = "'" + CONFIG.NUTR_DB + "'!A" + CONFIG.NUTR_HEADER_ROW + ":" + endCol + CONFIG.NUTR_HEADER_ROW;
  const dataRange = "'" + CONFIG.NUTR_DB + "'!A" + CONFIG.NUTR_DATA_START + ":" + endCol + "5000";

  const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
  const headers = hdrResp.values ? hdrResp.values[0] : [];

  const allDataResp = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
  const allData = (allDataResp.values || []).filter(row => row[0] !== undefined && row[0] !== '');

  const startIdx = Math.max(0, allData.length - maxRows);
  return { headers, rows: allData.slice(startIdx), totalRows: allData.length };
}

function saveNutritionData(ssId, data) {
  const endCol = columnToLetter(CONFIG.NUTR_COL_COUNT);
  const hdrRange = "'" + CONFIG.NUTR_DB + "'!A" + CONFIG.NUTR_HEADER_ROW + ":" + endCol + CONFIG.NUTR_HEADER_ROW;
  const dataRange = "'" + CONFIG.NUTR_DB + "'!A" + CONFIG.NUTR_DATA_START + ":" + endCol + "5000";

  // Read headers
  const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
  const headers = hdrResp.values ? hdrResp.values[0] : [];
  const hMap = {};
  headers.forEach((h, i) => { if (h) hMap[String(h).trim()] = i; });

  // Read existing data
  const dataResp = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
  var allData = (dataResp.values || []).map(row => {
    var padded = row.slice();
    while (padded.length < CONFIG.NUTR_COL_COUNT) padded.push('');
    return padded;
  });

  var todaySerial = getTodaySerial();
  var dateIdx = hMap['Date'];

  // Find today's row
  var targetIdx = -1;
  if (dateIdx !== undefined) {
    targetIdx = allData.findIndex(row => {
      var val = row[dateIdx];
      if (!val && val !== 0) return false;
      var numVal = Number(val);
      return !isNaN(numVal) && Math.abs(numVal - todaySerial) < 1;
    });
  }

  if (targetIdx === -1) {
    var newRow = new Array(CONFIG.NUTR_COL_COUNT).fill('');
    if (dateIdx !== undefined) newRow[dateIdx] = todaySerial;
    allData.push(newRow);
    targetIdx = allData.length - 1;
  }

  // Map fields to headers
  var FIELD_TO_HEADER = {
    bodyweight: 'Bodyweight',
    calories: 'Calories (kcals)',
    protein: 'Protein (gr)',
    carbs: 'Carbs (gr)',
    fat: 'Fat (gr)',
    fiber: 'Fiber (gr)',
    water: 'Water (lt)',
    steps: 'Steps',
    cardio: 'Cardio'
  };

  for (var key in FIELD_TO_HEADER) {
    var header = FIELD_TO_HEADER[key];
    var value = data[key];
    if (value === null || value === undefined || value === '') continue;
    var colIdx = hMap[header];
    if (colIdx === undefined) {
      console.warn('[DataLogger] saveNutrition: header not found → "%s"', header);
      continue;
    }
    allData[targetIdx][colIdx] = isNaN(Number(value)) ? value : Number(value);
  }

  // Write back
  Sheets.Spreadsheets.Values.update(
    { values: allData },
    ssId,
    "'" + CONFIG.NUTR_DB + "'!A" + CONFIG.NUTR_DATA_START,
    { valueInputOption: 'RAW' }
  );

  console.log('[DataLogger] saveNutritionData: OK.');
  return { success: true };
}


// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function getTodaySerial() {
  var today = new Date();
  var epoch = new Date(1899, 11, 30);
  return Math.floor((today - epoch) / 86400000);
}

function getTodayString() {
  var now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
}

function columnToLetter(n) {
  var s = '';
  while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}