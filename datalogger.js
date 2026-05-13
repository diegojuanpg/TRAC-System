// ══════════════════════════════════════════════════════════════════════════
// SCRIPT B — TRAC DATA LOGGER (Per Coach)
//
// Lee y escribe datos. Todos los cálculos se hacen en el frontend.
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New Deployment
//   Type: Web App  |  Execute as: Me  |  Who has access: Anyone
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
  TRAC_COL_COUNT: 60,

  NUTR_DB: 'Nutrition_database',
  NUTR_HEADER_ROW: 6,
  NUTR_DATA_START: 7,

  // Nutrition table: A(1):J(10)
  NUTR_COL_START:  1,
  NUTR_COL_COUNT:  10,

  // Goals table: L(12):AO(41) — single data row, overwritten on each save
  GOALS_COL_START: 12,
  GOALS_COL_COUNT: 30,

  // Goals_History table: AQ(43):BT(72) — append-only
  GHIST_COL_START: 43,
  GHIST_COL_COUNT: 30,

  // Refeeds table: BV(74):BW(75)
  REFEED_COL_START: 74,
  REFEED_COL_COUNT: 2,
};

// Goals columns (same structure for Goals table and Goals_History table)
const GOALS_HEADERS = [
  'mode', 'startWeight', 'startWeightMode', 'targetWeight', 'targetRatePerWeek',
  'targetDate', 'maintenanceKcal', 'maintenanceMode', 'kcalAdjPerDay', 'balanceKcal',
  'proteinPerKg', 'proteinPct', 'proteinTarget', 'proteinUnit',
  'fatPerKg', 'fatPct', 'fatTarget', 'fatUnit',
  'carbsPerKg', 'carbsPct', 'carbsTarget', 'carbsUnit',
  'kcalTarget', 'fiberTarget', 'cardioTarget', 'waterTarget', 'stepsTarget',
  'updatedAt', 'prescribedBy', 'note'
];

const NUTRITION_HEADERS = [
  'Date', 'Bodyweight', 'Calories (kcals)', 'Protein (gr)', 'Carbs (gr)',
  'Fat (gr)', 'Fiber (gr)', 'Water (lt)', 'Steps', 'Cardio'
];

const REFEED_HEADERS = ['date', 'note'];


// ══════════════════════════════════════════
// ENTRY POINTS
// ══════════════════════════════════════════

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (!body.token || body.token !== SHARED_TOKEN) {
      return jsonResponse({ success: false, error: 'Token inválido.' });
    }

    const action  = String(body.action  || '').trim();
    const sheetId = String(body.sheetId || '').trim();

    if (!sheetId) return jsonResponse({ success: false, error: 'sheetId no proporcionado.' });

    if (action === 'check') {
      return jsonResponse({ success: true, alreadySubmitted: checkAlreadySubmitted(sheetId) });
    }

    if (action === 'appendTRAC') {
      if (!body.row || !Array.isArray(body.row))
        return jsonResponse({ success: false, error: 'row[] no proporcionado.' });
      return jsonResponse({ success: true, result: appendTRACRow(sheetId, body.row) });
    }

    if (action === 'writeTRAC') {
      if (!body.rows || !Array.isArray(body.rows))
        return jsonResponse({ success: false, error: 'rows[][] no proporcionado.' });
      return jsonResponse({ success: true, result: writeTRACData(sheetId, body.rows) });
    }

    if (action === 'saveNutrition') {
      if (!body.data) return jsonResponse({ success: false, error: 'data no proporcionado.' });
      return jsonResponse({ success: true, result: saveNutritionData(sheetId, body.data, body.date || null) });
    }

    if (action === 'saveNutritionGoals') {
      if (!body.goals) return jsonResponse({ success: false, error: 'goals no proporcionado.' });
      return jsonResponse({ success: true, result: saveNutritionGoals(sheetId, body.goals, body.userEmail || '', body.note || '') });
    }

    if (action === 'toggleRefeed') {
      if (!body.date) return jsonResponse({ success: false, error: 'date no proporcionado.' });
      return jsonResponse({ success: true, result: toggleRefeed(sheetId, body.date, !!body.refeed) });
    }

    return jsonResponse({ success: false, error: 'Acción desconocida: ' + action });

  } catch (err) {
    console.error('[DataLogger] doPost error: %s', err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet(e) {
  try {
    const token   = e.parameter.token;
    const action  = String(e.parameter.action  || '').trim();
    const sheetId = String(e.parameter.sheetId || '').trim();

    if (!token || token !== SHARED_TOKEN)
      return jsonResponse({ success: false, error: 'Token inválido.' });
    if (!sheetId)
      return jsonResponse({ success: false, error: 'sheetId no proporcionado.' });

    if (action === 'fetchHistory') {
      enforceHeaders(sheetId);
      const maxRows = parseInt(e.parameter.rows || '50');
      return jsonResponse({ success: true, data: fetchHistory(sheetId, maxRows) });
    }

    if (action === 'fetchDashboard') {
      enforceHeaders(sheetId);
      return jsonResponse({ success: true, data: fetchDashboardData(sheetId) });
    }

    if (action === 'fetchNutrition') {
      const maxRows = parseInt(e.parameter.rows || '500');
      return jsonResponse({ success: true, data: fetchNutritionHistory(sheetId, maxRows) });
    }

    if (action === 'fetchNutritionGoals') {
      return jsonResponse({ success: true, data: fetchNutritionGoals(sheetId) });
    }

    if (action === 'fetchNutritionGoalsHistory') {
      return jsonResponse({ success: true, data: fetchNutritionGoalsHistory(sheetId) });
    }

    if (action === 'fetchRefeeds') {
      return jsonResponse({ success: true, data: fetchRefeeds(sheetId) });
    }

    // ── WRITE ACTIONS (routed via GET by Vercel proxy — same handlers as doPost) ──

    if (action === 'check') {
      return jsonResponse({ success: true, alreadySubmitted: checkAlreadySubmitted(sheetId) });
    }

    if (action === 'writeTRAC') {
      var rows = JSON.parse(e.parameter.rows || '[]');
      if (!rows || !Array.isArray(rows))
        return jsonResponse({ success: false, error: 'rows[][] no proporcionado.' });
      return jsonResponse({ success: true, result: writeTRACData(sheetId, rows) });
    }

    if (action === 'saveNutrition') {
      var data = JSON.parse(e.parameter.data || '{}');
      if (!data) return jsonResponse({ success: false, error: 'data no proporcionado.' });
      return jsonResponse({ success: true, result: saveNutritionData(sheetId, data, e.parameter.date || null) });
    }

    if (action === 'saveNutritionGoals') {
      var goals = JSON.parse(e.parameter.goals || '{}');
      if (!goals) return jsonResponse({ success: false, error: 'goals no proporcionado.' });
      return jsonResponse({ success: true, result: saveNutritionGoals(sheetId, goals, e.parameter.userEmail || '', e.parameter.note || '') });
    }

    if (action === 'toggleRefeed') {
      var date = String(e.parameter.date || '').trim();
      if (!date) return jsonResponse({ success: false, error: 'date no proporcionado.' });
      return jsonResponse({ success: true, result: toggleRefeed(sheetId, date, e.parameter.refeed === 'true') });
    }

    if (action === 'appendTRAC') {
      var row = JSON.parse(e.parameter.row || '[]');
      if (!row || !Array.isArray(row))
        return jsonResponse({ success: false, error: 'row[] no proporcionado.' });
      return jsonResponse({ success: true, result: appendTRACRow(sheetId, row) });
    }

    return ContentService.createTextOutput('TRAC DataLogger — OK').setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    console.error('[DataLogger] doGet error: %s', err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}


// ══════════════════════════════════════════
// INIT: auto-create missing Nutrition tables
// ══════════════════════════════════════════

function initNutritionTables(ssId) {
  var hRow = CONFIG.NUTR_HEADER_ROW;
  var db   = CONFIG.NUTR_DB;

  // Ensure sheet has enough columns for all tables (need up to col BW = 75)
  var REQUIRED_COLS = CONFIG.REFEED_COL_START + CONFIG.REFEED_COL_COUNT - 1; // 75
  var REQUIRED_ROWS = 1000;
  try {
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheetByName(db);
    if (sheet) {
      if (sheet.getMaxColumns() < REQUIRED_COLS) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), REQUIRED_COLS - sheet.getMaxColumns());
        console.log('[DataLogger] initNutritionTables: expanded to ' + REQUIRED_COLS + ' cols.');
      }
      if (sheet.getMaxRows() < REQUIRED_ROWS) {
        sheet.insertRowsAfter(sheet.getMaxRows(), REQUIRED_ROWS - sheet.getMaxRows());
      }
    }
  } catch(e) {
    console.warn('[DataLogger] initNutritionTables expand error: ' + e.message);
  }

  function colRange(start, count) {
    return "'" + db + "'!" + columnToLetter(start) + hRow + ':' + columnToLetter(start + count - 1) + hRow;
  }

  function needsInit(start, count, expectedHeaders) {
    try {
      var resp = Sheets.Spreadsheets.Values.get(ssId, colRange(start, count));
      var existing = (resp.values && resp.values[0]) ? resp.values[0] : [];
      return existing[0] !== expectedHeaders[0];
    } catch(e) {
      return true;
    }
  }

  // Goals table (L:AO)
  if (needsInit(CONFIG.GOALS_COL_START, CONFIG.GOALS_COL_COUNT, GOALS_HEADERS)) {
    Sheets.Spreadsheets.Values.update(
      { values: [GOALS_HEADERS] },
      ssId,
      "'" + db + "'!" + columnToLetter(CONFIG.GOALS_COL_START) + hRow,
      { valueInputOption: 'RAW' }
    );
    console.log('[DataLogger] initNutritionTables: Goals headers written.');
  }

  // Goals_History table (AQ:BT)
  if (needsInit(CONFIG.GHIST_COL_START, CONFIG.GHIST_COL_COUNT, GOALS_HEADERS)) {
    Sheets.Spreadsheets.Values.update(
      { values: [GOALS_HEADERS] },
      ssId,
      "'" + db + "'!" + columnToLetter(CONFIG.GHIST_COL_START) + hRow,
      { valueInputOption: 'RAW' }
    );
    console.log('[DataLogger] initNutritionTables: Goals_History headers written.');
  }

  // Refeeds table (BV:BW)
  if (needsInit(CONFIG.REFEED_COL_START, CONFIG.REFEED_COL_COUNT, REFEED_HEADERS)) {
    Sheets.Spreadsheets.Values.update(
      { values: [REFEED_HEADERS] },
      ssId,
      "'" + db + "'!" + columnToLetter(CONFIG.REFEED_COL_START) + hRow,
      { valueInputOption: 'RAW' }
    );
    console.log('[DataLogger] initNutritionTables: Refeeds headers written.');
  }
}


// ══════════════════════════════════════════
// TRAC_database: READ / WRITE
// ══════════════════════════════════════════

function fetchHistory(ssId, maxRows) {
  var endCol   = columnToLetter(CONFIG.TRAC_COL_COUNT);
  var hdrRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW + ':' + endCol + CONFIG.TRAC_HEADER_ROW;
  var datRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START  + ':' + endCol + '5000';

  var headers = safeGet(ssId, hdrRange, true);
  var allData = safeGet(ssId, datRange, false).filter(r => r[0] !== undefined && r[0] !== '');
  var startIdx = Math.max(0, allData.length - maxRows);
  return { headers, rows: allData.slice(startIdx), totalRows: allData.length };
}

function enforceHeaders(ssId) {
  var endCol   = columnToLetter(CONFIG.TRAC_COL_COUNT);
  var hdrRange = "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW + ':' + endCol + CONFIG.TRAC_HEADER_ROW;

  var REQUIRED = "Date,Measurement_Time,Protocol_Confirmed,Context_Flag,Bodyweight,Tap Speed Test,Tap_Variance,Tap_Pauses,HR1,HR2,HR3,HR4,OrthoResponse,VagalRecovery,PosturalCost,POTS_Flag,Push Soreness,Pull Soreness,Legs Soreness,Lesión/Molestia,Cansancio,Carga de Trabajo Percibida,Recuperación Percibida,Horas de Sueño,Calidad de Sueño,Alimentacion,Motivación,Z-Tap Speed Test,Z-Tap Variance,Z-HR1,Z-HR2,Z-HR3,Z-HR4,Z-OrthoResponse,Z-VagalRecovery,Z-PosturalCost,Z-Push Soreness,Z-Pull Soreness,Z-Legs Soreness,Z-Lesión/Molestia,Z-Cansancio,Z-Carga de Trabajo Percibida,Z-Recuperación Percibida,Z-Horas de Sueño,Z-Calidad de Sueño,Z-Alimentacion,Z-Motivacion,Fatigue,Fitness,Readiness,Z-Readiness,Peripheral_Stress,Central_Stress,STF,LTF,STF_LTF_Ratio,ANS_Profile,Trend_7d,Alert_Level,TRAC_Action".split(',');

  var current = safeGet(ssId, hdrRange, true);
  var match = current.length === REQUIRED.length && REQUIRED.every((h, i) => String(current[i] || '').trim() === h);

  if (!match) {
    try { Sheets.Spreadsheets.Values.clear({}, ssId, "'" + CONFIG.TRAC_DB + "'!6:6"); } catch(e) {}
    Sheets.Spreadsheets.Values.update(
      { values: [REQUIRED] }, ssId,
      "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW,
      { valueInputOption: 'RAW' }
    );
  }
}

function appendTRACRow(ssId, row) {
  enforceHeaders(ssId);
  var endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);
  while (row.length < CONFIG.TRAC_COL_COUNT) row.push('');
  var existing = safeGet(ssId, "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START + ':' + endCol + '5007', false)
    .filter(r => r[0] !== undefined && r[0] !== '');
  var insertRow = CONFIG.TRAC_DATA_START + existing.length;
  Sheets.Spreadsheets.Values.update(
    { values: [row] }, ssId,
    "'" + CONFIG.TRAC_DB + "'!A" + insertRow + ':' + endCol + insertRow,
    { valueInputOption: 'RAW' }
  );
  return { row: insertRow };
}

function writeTRACData(ssId, rows) {
  enforceHeaders(ssId);
  rows.forEach(r => { while (r.length < CONFIG.TRAC_COL_COUNT) r.push(''); });
  Sheets.Spreadsheets.Values.update(
    { values: rows }, ssId,
    "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START,
    { valueInputOption: 'RAW' }
  );
  return { rowsWritten: rows.length };
}


// ══════════════════════════════════════════
// CHECK: ¿Ya se rellenó hoy?
// ══════════════════════════════════════════

function checkAlreadySubmitted(ssId) {
  try {
    var hdrRow = CONFIG.TRAC_HEADER_ROW;
    var endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);
    var headers = safeGet(ssId, "'" + CONFIG.TRAC_DB + "'!A" + hdrRow + ':' + endCol + hdrRow, true);
    var dateColIdx = headers.findIndex(h => String(h).trim() === 'Date');
    if (dateColIdx === -1) return false;
    var dateLetter = columnToLetter(dateColIdx + 1);
    var dates = safeGet(ssId, "'" + CONFIG.TRAC_DB + "'!" + dateLetter + (hdrRow + 1) + ':' + dateLetter + '5000', false);
    var todaySerial = getTodaySerial();
    var todayStr = getTodayString();
    return dates.some(r => {
      var val = r[0]; if (!val) return false;
      var s = String(val);
      if (s.includes('-') && s === todayStr) return true;
      var n = Number(val);
      return !isNaN(n) && Math.abs(n - todaySerial) < 1;
    });
  } catch(e) {
    return false;
  }
}


// ══════════════════════════════════════════
// DASHBOARD DATA
// ══════════════════════════════════════════

function fetchDashboardData(ssId) {
  var endCol = columnToLetter(CONFIG.TRAC_COL_COUNT);
  var headers = safeGet(ssId, "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_HEADER_ROW + ':' + endCol + CONFIG.TRAC_HEADER_ROW, true);
  var hMap = {};
  headers.forEach((h, i) => { if (h) hMap[String(h).trim()] = i; });
  var allData = safeGet(ssId, "'" + CONFIG.TRAC_DB + "'!A" + CONFIG.TRAC_DATA_START + ':' + endCol + '5000', false)
    .filter(r => r[0] !== undefined && r[0] !== '');

  if (allData.length === 0) return { error: 'No hay datos' };

  var lastRow = allData[allData.length - 1];
  var getVal = (row, col, fb) => {
    fb = fb !== undefined ? fb : null;
    var idx = hMap[col]; if (idx === undefined || !row) return fb;
    var v = row[idx]; return (v === undefined || v === '') ? fb : v;
  };

  var readinessTrend = [], last7Days = [];
  var startIdx = Math.max(0, allData.length - 14);
  for (var i = startIdx; i < allData.length; i++) {
    var dateRaw = getVal(allData[i], 'Date');
    var dateStr = String(dateRaw);
    if (typeof dateRaw === 'number') {
      var dateObj = new Date((dateRaw - 25569) * 86400 * 1000);
      dateStr = dateObj.toISOString().split('T')[0];
    }
    readinessTrend.push({ date: dateStr, readiness: getVal(allData[i], 'Z-Readiness', 0) });
    if (i >= allData.length - 7)
      last7Days.push({ date: dateStr, alertLevel: getVal(allData[i], 'Alert_Level', 0), ansProfile: getVal(allData[i], 'ANS_Profile', 'INSUFFICIENT_DATA') });
  }

  return {
    date: getVal(lastRow, 'Date'), measurementTime: getVal(lastRow, 'Measurement_Time', ''),
    alertLevel: getVal(lastRow, 'Alert_Level', 0), ansProfile: getVal(lastRow, 'ANS_Profile', 'INSUFFICIENT_DATA'),
    action: getVal(lastRow, 'TRAC_Action', ''), readinessZ: getVal(lastRow, 'Z-Readiness', 0),
    fatigueZ: getVal(lastRow, 'Fatigue', 0), fitnessZ: getVal(lastRow, 'Fitness', 0),
    stfLtfRatio: getVal(lastRow, 'STF_LTF_Ratio', 0), stf: getVal(lastRow, 'STF', 0), ltf: getVal(lastRow, 'LTF', 0),
    soreness: { push: getVal(lastRow, 'Push Soreness', 0), pull: getVal(lastRow, 'Pull Soreness', 0), legs: getVal(lastRow, 'Legs Soreness', 0), injury: getVal(lastRow, 'Lesión/Molestia', 0) },
    peripheralStress: getVal(lastRow, 'Peripheral_Stress', 0), centralStress: getVal(lastRow, 'Central_Stress', 0),
    readinessTrend, last7Days
  };
}


// ══════════════════════════════════════════
// NUTRITION: READ / WRITE
// ══════════════════════════════════════════

function fetchNutritionHistory(ssId, maxRows) {
  var startCol = columnToLetter(CONFIG.NUTR_COL_START);
  var endCol   = columnToLetter(CONFIG.NUTR_COL_START + CONFIG.NUTR_COL_COUNT - 1);
  var hdrRange = "'" + CONFIG.NUTR_DB + "'!" + startCol + CONFIG.NUTR_HEADER_ROW + ':' + endCol + CONFIG.NUTR_HEADER_ROW;
  var datRange = "'" + CONFIG.NUTR_DB + "'!" + startCol + CONFIG.NUTR_DATA_START  + ':' + endCol + '5000';

  var headers = safeGet(ssId, hdrRange, true);
  var allData = safeGet(ssId, datRange, false).filter(r => r[0] !== undefined && r[0] !== '');
  var startIdx = Math.max(0, allData.length - maxRows);
  return { headers, rows: allData.slice(startIdx), totalRows: allData.length };
}

function saveNutritionData(ssId, data, isoDate) {
  var startCol = columnToLetter(CONFIG.NUTR_COL_START);
  var endCol   = columnToLetter(CONFIG.NUTR_COL_START + CONFIG.NUTR_COL_COUNT - 1);
  var hdrRange = "'" + CONFIG.NUTR_DB + "'!" + startCol + CONFIG.NUTR_HEADER_ROW + ':' + endCol + CONFIG.NUTR_HEADER_ROW;
  var datRange = "'" + CONFIG.NUTR_DB + "'!" + startCol + CONFIG.NUTR_DATA_START  + ':' + endCol + '5000';

  var headers = safeGet(ssId, hdrRange, true);
  var hMap = {};
  headers.forEach((h, i) => { if (h) hMap[String(h).trim()] = i; });

  var allData = safeGet(ssId, datRange, false).map(r => {
    var p = r.slice();
    while (p.length < CONFIG.NUTR_COL_COUNT) p.push('');
    return p;
  });

  // Determine target date serial
  var targetSerial;
  if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    var parts = isoDate.split('-');
    var d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    var epoch = new Date(Date.UTC(1899, 11, 30));
    targetSerial = Math.floor((d - epoch) / 86400000);
  } else {
    targetSerial = getTodaySerial();
  }

  var dateIdx = hMap['Date'];
  var targetIdx = -1;
  if (dateIdx !== undefined) {
    targetIdx = allData.findIndex(r => {
      var val = r[dateIdx];
      if (!val && val !== 0) return false;
      return !isNaN(Number(val)) && Math.abs(Number(val) - targetSerial) < 1;
    });
  }

  if (targetIdx === -1) {
    var newRow = new Array(CONFIG.NUTR_COL_COUNT).fill('');
    if (dateIdx !== undefined) newRow[dateIdx] = targetSerial;
    allData.push(newRow);
    targetIdx = allData.length - 1;
  }

  var FIELD_MAP = {
    bodyweight: 'Bodyweight',
    calories:   'Calories (kcals)',
    protein:    'Protein (gr)',
    carbs:      'Carbs (gr)',
    fat:        'Fat (gr)',
    fiber:      'Fiber (gr)',
    water:      'Water (lt)',
    steps:      'Steps',
    cardio:     'Cardio'
  };

  for (var key in FIELD_MAP) {
    var val = data[key];
    if (val === null || val === undefined || val === '') continue;
    var colIdx = hMap[FIELD_MAP[key]];
    if (colIdx === undefined) { console.warn('[DataLogger] header not found: ' + FIELD_MAP[key]); continue; }
    allData[targetIdx][colIdx] = isNaN(Number(val)) ? val : Number(val);
  }

  Sheets.Spreadsheets.Values.update(
    { values: allData }, ssId,
    "'" + CONFIG.NUTR_DB + "'!" + startCol + CONFIG.NUTR_DATA_START,
    { valueInputOption: 'RAW' }
  );
  return { success: true };
}


// ══════════════════════════════════════════
// GOALS: READ / WRITE
// ══════════════════════════════════════════

function fetchNutritionGoals(ssId) {
  initNutritionTables(ssId);
  var startLetter = columnToLetter(CONFIG.GOALS_COL_START);
  var endLetter   = columnToLetter(CONFIG.GOALS_COL_START + CONFIG.GOALS_COL_COUNT - 1);
  var dataRow = CONFIG.NUTR_DATA_START;
  var range = "'" + CONFIG.NUTR_DB + "'!" + startLetter + dataRow + ':' + endLetter + dataRow;

  var resp = Sheets.Spreadsheets.Values.get(ssId, range, { valueRenderOption: 'UNFORMATTED_VALUE' });
  var row = (resp.values && resp.values[0]) ? resp.values[0] : [];

  var goals = {};
  GOALS_HEADERS.forEach((h, i) => { goals[h] = row[i] !== undefined ? row[i] : ''; });
  return { goals };
}

function saveNutritionGoals(ssId, goalsData, userEmail, note) {
  initNutritionTables(ssId);
  var startLetter = columnToLetter(CONFIG.GOALS_COL_START);
  var endLetter   = columnToLetter(CONFIG.GOALS_COL_START + CONFIG.GOALS_COL_COUNT - 1);
  var gHistStart  = columnToLetter(CONFIG.GHIST_COL_START);
  var gHistEnd    = columnToLetter(CONFIG.GHIST_COL_START + CONFIG.GHIST_COL_COUNT - 1);

  var now = new Date().toISOString();

  // Build row from GOALS_HEADERS
  var row = GOALS_HEADERS.map(h => {
    if (h === 'updatedAt')    return now;
    if (h === 'prescribedBy') return userEmail || '';
    if (h === 'note')         return note || '';
    var val = goalsData[h];
    return (val === null || val === undefined) ? '' : val;
  });

  // Overwrite Goals row 7
  Sheets.Spreadsheets.Values.update(
    { values: [row] }, ssId,
    "'" + CONFIG.NUTR_DB + "'!" + startLetter + CONFIG.NUTR_DATA_START + ':' + endLetter + CONFIG.NUTR_DATA_START,
    { valueInputOption: 'RAW' }
  );

  // Append to Goals_History
  var histRange = "'" + CONFIG.NUTR_DB + "'!" + gHistStart + CONFIG.NUTR_DATA_START + ':' + gHistEnd + '5000';
  var existing = safeGet(ssId, histRange, false).filter(r => r[0] !== undefined && r[0] !== '');
  var insertRow = CONFIG.NUTR_DATA_START + existing.length;
  Sheets.Spreadsheets.Values.update(
    { values: [row] }, ssId,
    "'" + CONFIG.NUTR_DB + "'!" + gHistStart + insertRow + ':' + gHistEnd + insertRow,
    { valueInputOption: 'RAW' }
  );

  console.log('[DataLogger] saveNutritionGoals: OK, row ' + insertRow + ' in history.');
  return { success: true };
}

function fetchNutritionGoalsHistory(ssId) {
  initNutritionTables(ssId);
  var startLetter = columnToLetter(CONFIG.GHIST_COL_START);
  var endLetter   = columnToLetter(CONFIG.GHIST_COL_START + CONFIG.GHIST_COL_COUNT - 1);
  var range = "'" + CONFIG.NUTR_DB + "'!" + startLetter + CONFIG.NUTR_DATA_START + ':' + endLetter + '5000';

  var rows = safeGet(ssId, range, false).filter(r => r[0] !== undefined && r[0] !== '');

  var history = rows.map(row => {
    var obj = {};
    GOALS_HEADERS.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    var snapshot = {};
    GOALS_HEADERS.forEach(h => { if (h !== 'updatedAt' && h !== 'prescribedBy') snapshot[h] = obj[h]; });
    return {
      changedAt:  obj['updatedAt']    || '',
      changedBy:  obj['prescribedBy'] || '',
      snapshot
    };
  });

  return { history };
}


// ══════════════════════════════════════════
// REFEEDS: READ / WRITE
// ══════════════════════════════════════════

function fetchRefeeds(ssId) {
  initNutritionTables(ssId);
  var startLetter = columnToLetter(CONFIG.REFEED_COL_START);
  var endLetter   = columnToLetter(CONFIG.REFEED_COL_START + CONFIG.REFEED_COL_COUNT - 1);
  var range = "'" + CONFIG.NUTR_DB + "'!" + startLetter + CONFIG.NUTR_DATA_START + ':' + endLetter + '5000';

  var rows = safeGet(ssId, range, false).filter(r => r[0] !== undefined && r[0] !== '');
  var refeeds = rows.map(r => String(r[0] || '')).filter(d => d !== '');
  return { refeeds };
}

function toggleRefeed(ssId, date, add) {
  initNutritionTables(ssId);
  var startLetter = columnToLetter(CONFIG.REFEED_COL_START);
  var endLetter   = columnToLetter(CONFIG.REFEED_COL_START + CONFIG.REFEED_COL_COUNT - 1);
  var range = "'" + CONFIG.NUTR_DB + "'!" + startLetter + CONFIG.NUTR_DATA_START + ':' + endLetter + '5000';

  var rows = safeGet(ssId, range, false);
  var dates = rows.map(r => String(r[0] || '')).filter(d => d !== '');

  if (add) {
    if (!dates.includes(date)) dates.push(date);
  } else {
    dates = dates.filter(d => d !== date);
  }

  // Clear and rewrite
  try { Sheets.Spreadsheets.Values.clear({}, ssId, range); } catch(e) {}
  if (dates.length > 0) {
    var newRows = dates.map(d => [d, '']);
    Sheets.Spreadsheets.Values.update(
      { values: newRows }, ssId,
      "'" + CONFIG.NUTR_DB + "'!" + startLetter + CONFIG.NUTR_DATA_START,
      { valueInputOption: 'RAW' }
    );
  }

  return { success: true };
}


// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function safeGet(ssId, range, headerMode) {
  try {
    var resp = Sheets.Spreadsheets.Values.get(ssId, range, { valueRenderOption: 'UNFORMATTED_VALUE' });
    if (!resp.values) return headerMode ? [] : [];
    return headerMode ? (resp.values[0] || []) : resp.values;
  } catch(e) {
    console.warn('[DataLogger] safeGet failed: ' + range + ' — ' + e.message);
    return headerMode ? [] : [];
  }
}

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
