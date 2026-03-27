// ══════════════════════════════════════════════════════════════════════════
// SCRIPT B — TRAC FORM RECEIVER & WRITER
// Archivo: TRACforms_ScriptB.js
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New Deployment
//   Type: Web App
//   Execute as: Me
//   Who has access: Anyone
// ══════════════════════════════════════════════════════════════════════════

// ── CONFIGURACIÓN ──
const SHARED_TOKEN = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7B8C9D0E1F2';
const MASTER_SHEET_ID = '1u2ryaoeFXo3r7yEg9chEr1iwvU5xFDsucO0dnb7RZas';
const MASTER_EMAIL_COL = 3;  // Columna C: Gmail del atleta
const MASTER_SHEETID_COL = 2; // Columna B: ID de la hoja del atleta

// ── CONFIG TRAC ──
const CONFIG_TRAC = {
    SHEET_TRAC_DB: "TRAC_database",
    DB_HEADER_ROW: 6,
    DB_DATA_START_ROW: 7,
    DB_COL_COUNT: 66,   // columnas A:BN
    POTS_THRESHOLD: 30,
    Z_WINDOW_DEFAULT: 28,
    Z_WINDOW_ORTHO: 14,
    STF_WINDOW: 7,
    LTF_WINDOW: 28,
    EWMA_LAMBDA_STF: 0.25,
    EWMA_LAMBDA_LTF: 0.069,
    ALERT_THRESHOLDS: [-1.0, -1.5, -2.0],

    MAP_GROUP1: [
        { search: "Tap Speed Test", dbCol: "Tap Speed Test", zCol: "Z-Tap Speed Test", category: "fatigue", window: 28 },
        { search: "Tap Variance", dbCol: "Tap_Variance", zCol: "Z-Tap Variance", category: null, window: 28 },
        { search: "Tap Pauses", dbCol: "Tap_Pauses", zCol: "Z-Tap Pauses", category: null, window: 28 },
        { search: "HRV/VFC", dbCol: "VFC/HRV", zCol: null, category: null, window: 14 },
        {
            search: "Orthostatic Test", isOrthostatic: true, category: "fatigue", window: 14,
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

// ── CONFIG NUTRITION_DATABASE ──
const CONFIG_NUTR = {
    SHEET_NAME: "Nutrition_database",
    HEADER_ROW: 6,
    DATA_START_ROW: 7,
    COL_COUNT: 10  // A:J
};

// Wellness scale conversions (1-5 → 0-10)
const SCALE_FATIGUE = { 1: 0, 2: 2.5, 3: 5, 4: 7.5, 5: 10 };
const SCALE_FITNESS = { 1: 10, 2: 7.5, 3: 5, 4: 2.5, 5: 0 };


// ══════════════════════════════════════════
// ENTRY POINT
// ══════════════════════════════════════════

function doPost(e) {
    try {
        const body = JSON.parse(e.postData.contents);

        if (!body.token || body.token !== SHARED_TOKEN) {
            console.warn('[ScriptB] Token inválido.');
            return jsonResponse({ success: false, error: 'Token inválido.' });
        }

        const action = String(body.action || '').trim();
        const email = String(body.email || '').trim().toLowerCase();

        if (!email) {
            return jsonResponse({ success: false, error: 'Email no proporcionado.' });
        }

        const athleteSheetId = findAthleteSheetId(email);
        if (!athleteSheetId) {
            return jsonResponse({ success: false, error: 'Atleta no encontrado: ' + email });
        }

        if (action === 'check') {
            const alreadySubmitted = checkAlreadySubmitted(athleteSheetId);
            return jsonResponse({ success: true, alreadySubmitted });
        }

        if (action === 'save') {
            const result = saveFormData(body.data, athleteSheetId);
            return jsonResponse({ success: true, result });
        }

        if (action === 'saveNutrition') {
            const result = saveNutritionData(body.data, athleteSheetId);
            return jsonResponse({ success: true, result });
        }

        return jsonResponse({ success: false, error: 'Acción desconocida: ' + action });

    } catch (err) {
        console.error('[ScriptB] doPost error: %s', err.message);
        return jsonResponse({ success: false, error: err.message });
    }
}

function doGet(e) {
    try {
        const action = e.parameter.action;
        const email = String(e.parameter.email || '').trim().toLowerCase();
        const token = e.parameter.token;

        if (!token || token !== SHARED_TOKEN) {
            return jsonResponse({ success: false, error: 'Token inválido.' });
        }

        if (action === 'fetchDashboard') {
            if (!email) return jsonResponse({ success: false, error: 'Email requerido.' });
            const athleteSheetId = findAthleteSheetId(email);
            if (!athleteSheetId) return jsonResponse({ success: false, error: 'Atleta no encontrado.' });
            
            const result = fetchDashboardData(athleteSheetId);
            return jsonResponse({ success: true, data: result });
        }

        return ContentService.createTextOutput('TRAC Script B — GET OK').setMimeType(ContentService.MimeType.TEXT);
    } catch (err) {
        return jsonResponse({ success: false, error: err.message });
    }
}


// ══════════════════════════════════════════
// MASTER SHEET: buscar hoja del atleta
// ══════════════════════════════════════════

function findAthleteSheetId(email) {
    try {
        const resp = Sheets.Spreadsheets.Values.get(
            MASTER_SHEET_ID, 'A1:C500',
            { valueRenderOption: 'UNFORMATTED_VALUE' }
        );
        const rows = resp.values || [];

        for (let i = 0; i < rows.length; i++) {
            const cellEmail = String(rows[i][MASTER_EMAIL_COL - 1] || '').trim().toLowerCase();
            if (cellEmail === email) {
                const sheetId = String(rows[i][MASTER_SHEETID_COL - 1] || '').trim();
                if (sheetId) return sheetId;
            }
        }

        console.warn('[ScriptB] Email no encontrado: %s', email);
        return null;

    } catch (e) {
        console.error('[ScriptB] findAthleteSheetId error: %s', e.message);
        return null;
    }
}


// ══════════════════════════════════════════
// CHECK: ¿Ya se rellenó el Morning Survey hoy?
// ══════════════════════════════════════════

function checkAlreadySubmitted(athleteSheetId) {
    try {
        const hdrRow = CONFIG_TRAC.DB_HEADER_ROW;
        const totalCols = columnToLetter(CONFIG_TRAC.DB_COL_COUNT);

        const hdrResp = Sheets.Spreadsheets.Values.get(
            athleteSheetId,
            "'" + CONFIG_TRAC.SHEET_TRAC_DB + "'!A" + hdrRow + ":" + totalCols + hdrRow
        );
        const headers = hdrResp.values ? hdrResp.values[0] : [];
        let dateColIdx = -1;
        headers.forEach((h, i) => { if (String(h).trim() === 'Date') dateColIdx = i; });
        if (dateColIdx === -1) return false;

        const dateColLetter = columnToLetter(dateColIdx + 1);
        const dataRange = "'" + CONFIG_TRAC.SHEET_TRAC_DB + "'!" + dateColLetter + (hdrRow + 1) + ":" + dateColLetter + "5000";
        const dateResp = Sheets.Spreadsheets.Values.get(athleteSheetId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
        const dates = dateResp.values || [];

        const todayStr = getTodayString();
        const todaySerial = getTodaySerial();

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
        console.error('[ScriptB] checkAlreadySubmitted error: %s', e.message);
        return false;
    }
}


// ══════════════════════════════════════════
// SAVE MORNING SURVEY
// ══════════════════════════════════════════

function saveFormData(data, ssId) {
    if (checkAlreadySubmitted(ssId)) {
        throw new Error('Ya completaste el check-in de hoy.');
    }

    const dbEndCol = columnToLetter(CONFIG_TRAC.DB_COL_COUNT);
    const hdrRange = "'" + CONFIG_TRAC.SHEET_TRAC_DB + "'!A" + CONFIG_TRAC.DB_HEADER_ROW + ":" + dbEndCol + CONFIG_TRAC.DB_HEADER_ROW;
    const dataRange = "'" + CONFIG_TRAC.SHEET_TRAC_DB + "'!A" + CONFIG_TRAC.DB_DATA_START_ROW + ":" + dbEndCol + "5007";

    const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
    const rawHeaders = hdrResp.values ? hdrResp.values[0] : [];

    const colMap = {};
    const hMap = {};
    rawHeaders.forEach((h, i) => {
        const name = String(h).trim();
        if (name) { colMap[name] = i + 1; hMap[name] = i; }
    });

    const allDataResp = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
    let allData = (allDataResp.values || []).map(row => {
        const padded = row.slice();
        while (padded.length < CONFIG_TRAC.DB_COL_COUNT) padded.push('');
        return padded;
    });

    // ── Métricas derivadas ──
    const hrv = data.hrv !== undefined ? parseFloat(data.hrv) : '';
    const hr1 = data.hr1 !== undefined ? parseInt(data.hr1) : '';
    const hr2 = data.hr2 !== undefined ? parseInt(data.hr2) : '';
    const hr3 = data.hr3 !== undefined ? parseInt(data.hr3) : '';
    const hr4 = data.hr4 !== undefined ? parseInt(data.hr4) : '';

    const ln_hrv = (typeof hrv === 'number' && hrv > 0) ? Math.log(hrv) : '';
    const orthoResponse = (typeof hr2 === 'number' && typeof hr1 === 'number') ? hr2 - hr1 : '';
    const vagalRecovery = (typeof hr2 === 'number' && typeof hr3 === 'number') ? hr2 - hr3 : '';
    const posturalCost = (typeof hr4 === 'number' && typeof hr1 === 'number') ? hr4 - hr1 : '';
    const pots_flag = typeof orthoResponse === 'number' ? orthoResponse > CONFIG_TRAC.POTS_THRESHOLD : '';
    const lnRMSSD_RR = (ln_hrv !== '' && typeof hr1 === 'number' && hr1 > 0)
        ? ln_hrv / (60000 / hr1) : '';

    const newRow = buildNewRow(colMap, {
        'Date': getTodaySerial(),
        'Measurement_Time': formatTime(new Date()),
        'Protocol_Confirmed': true,
        'Context_Flag': data.contexto || 'Normal',
        'Bodyweight': data.bodyweight !== undefined ? parseFloat(data.bodyweight) : '',
        'VFC/HRV': hrv,
        'ln_HRV': ln_hrv,
        'lnRMSSD_RR_ratio': lnRMSSD_RR,
        'Tap Speed Test': data.tap_total !== undefined ? parseInt(data.tap_total) : '',
        'Tap_Variance': data.tap_variance !== undefined ? parseInt(data.tap_variance) : '',
        'Tap_Pauses': data.tap_pauses !== undefined ? parseInt(data.tap_pauses) : '',
        'HR1': hr1, 'HR2': hr2, 'HR3': hr3, 'HR4': hr4,
        'OrthoResponse': orthoResponse,
        'VagalRecovery': vagalRecovery,
        'PosturalCost': posturalCost,
        'POTS_Flag': pots_flag,
        'Push Soreness': convertWellness(data.push_soreness, 'fatigue'),
        'Pull Soreness': convertWellness(data.pull_soreness, 'fatigue'),
        'Legs Soreness': convertWellness(data.legs_soreness, 'fatigue'),
        'Lesión/Molestia': convertWellness(data.lesion, 'fatigue'),
        'Cansancio': convertWellness(data.cansancio, 'fatigue'),
        'Carga de Trabajo Percibida': convertWellness(data.carga, 'fatigue'),
        'Recuperación Percibida': convertWellness(data.recuperacion, 'fitness'),
        'Horas de Sueño': convertWellness(data.horas_sueno, 'fitness'),
        'Calidad de Sueño': convertWellness(data.calidad_sueno, 'fitness'),
        'Alimentacion': convertWellness(data.alimentacion, 'fitness'),
        'Motivación': convertWellness(data.motivacion, 'fitness'),
    });

    while (newRow.length < CONFIG_TRAC.DB_COL_COUNT) newRow.push('');
    allData.push(newRow);
    const insertRow = CONFIG_TRAC.DB_DATA_START_ROW + allData.length - 1;

    // ── Recalcular ──
    const zMetrics = [];
    CONFIG_TRAC.MAP_GROUP1.forEach(item => {
        if (item.isOrthostatic) item.hrMap.forEach(hr => { if (hr.zCol) zMetrics.push({ dbCol: hr.dbCol, zCol: hr.zCol, window: item.window }); });
        else if (item.zCol) zMetrics.push({ dbCol: item.dbCol, zCol: item.zCol, window: item.window });
    });
    CONFIG_TRAC.DERIVED_METRICS.forEach(dm => { if (dm.zCol) zMetrics.push({ dbCol: dm.dbCol, zCol: dm.zCol, window: dm.window }); });
    CONFIG_TRAC.MAP_GROUP2.forEach(item => { if (item.zCol) zMetrics.push({ dbCol: item.dbCol, zCol: item.zCol, window: item.window }); });

    tracPreCalculate7dMetrics(allData, hMap);
    tracRecalculateZScores(allData, hMap, zMetrics);
    tracRecalculateComposites(allData, hMap);

    Sheets.Spreadsheets.Values.update(
        { values: allData },
        ssId,
        "'" + CONFIG_TRAC.SHEET_TRAC_DB + "'!A" + CONFIG_TRAC.DB_DATA_START_ROW,
        { valueInputOption: 'RAW' }
    );

    console.log('[ScriptB] saveFormData: OK, fila %d.', insertRow);

    // ── Si incluye bodyweight, upsertarlo también en Nutrition_database ──
    if (data.bodyweight !== undefined && data.bodyweight !== '' && data.bodyweight !== null) {
        try {
            upsertNutritionRow(ssId, { bodyweight: parseFloat(data.bodyweight) });
            console.log('[ScriptB] Bodyweight sincronizado en Nutrition_database.');
        } catch (nutrErr) {
            console.warn('[ScriptB] No se pudo sincronizar bodyweight en Nutrition_database: %s', nutrErr.message);
            // No lanzar error — el Morning Survey ya se guardó correctamente
        }
    }

    return { success: true, row: insertRow };
}


// ══════════════════════════════════════════
// SAVE NUTRITION (acción dedicada)
// ══════════════════════════════════════════

/**
 * Upsert en Nutrition_database:
 * - Si ya existe una fila para hoy → actualiza los campos enviados (sin pisar los vacíos).
 * - Si no existe → crea una fila nueva.
 * @param {Object} data  - Campos del formulario de Nutrition.
 * @param {string} ssId  - ID de la hoja del atleta.
 */
function saveNutritionData(data, ssId) {
    const fields = {
        bodyweight: data.bodyweight !== undefined && data.bodyweight !== '' ? parseFloat(data.bodyweight) : null,
        calories: data.calories !== undefined && data.calories !== '' ? parseFloat(data.calories) : null,
        protein: data.protein !== undefined && data.protein !== '' ? parseFloat(data.protein) : null,
        carbs: data.carbs !== undefined && data.carbs !== '' ? parseFloat(data.carbs) : null,
        fat: data.fat !== undefined && data.fat !== '' ? parseFloat(data.fat) : null,
        fiber: data.fiber !== undefined && data.fiber !== '' ? parseFloat(data.fiber) : null,
        water: data.water !== undefined && data.water !== '' ? parseFloat(data.water) : null,
        steps: data.steps !== undefined && data.steps !== '' ? parseInt(data.steps) : null,
        cardio: data.cardio !== undefined && data.cardio !== '' ? String(data.cardio) : null
    };

    upsertNutritionRow(ssId, fields);
    console.log('[ScriptB] saveNutritionData: OK.');
    return { success: true };
}


/**
 * Lógica central de upsert en Nutrition_database.
 * Acepta un objeto parcial con los campos a actualizar.
 * @param {string} ssId   - ID de la hoja del atleta.
 * @param {Object} fields - Mapa de campo → valor (null = no tocar).
 */
function upsertNutritionRow(ssId, fields) {
    const endCol = columnToLetter(CONFIG_NUTR.COL_COUNT);
    const hdrRange = "'" + CONFIG_NUTR.SHEET_NAME + "'!A" + CONFIG_NUTR.HEADER_ROW + ":" + endCol + CONFIG_NUTR.HEADER_ROW;
    const dataRange = "'" + CONFIG_NUTR.SHEET_NAME + "'!A" + CONFIG_NUTR.DATA_START_ROW + ":" + endCol + "5000";

    // ── Leer encabezados ──
    const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
    const headers = hdrResp.values ? hdrResp.values[0] : [];
    const hMap = {};
    headers.forEach((h, i) => { if (h) hMap[String(h).trim()] = i; });

    // ── Leer datos existentes ──
    const dataResp = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
    let allData = (dataResp.values || []).map(row => {
        const padded = row.slice();
        while (padded.length < CONFIG_NUTR.COL_COUNT) padded.push('');
        return padded;
    });

    const todaySerial = getTodaySerial();
    const dateIdx = hMap['Date'];

    // ── Buscar fila de hoy ──
    let targetIdx = -1;
    if (dateIdx !== undefined) {
        targetIdx = allData.findIndex(row => {
            const val = row[dateIdx];
            if (!val && val !== 0) return false;
            const numVal = Number(val);
            return !isNaN(numVal) && Math.abs(numVal - todaySerial) < 1;
        });
    }

    if (targetIdx === -1) {
        // ── Crear fila nueva ──
        const newRow = new Array(CONFIG_NUTR.COL_COUNT).fill('');
        if (dateIdx !== undefined) newRow[dateIdx] = todaySerial;
        allData.push(newRow);
        targetIdx = allData.length - 1;
    }

    // ── Mapa entre claves de `fields` y encabezados de la hoja ──
    const FIELD_TO_HEADER = {
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

    // ── Actualizar solo los campos que vienen con valor ──
    for (const [key, header] of Object.entries(FIELD_TO_HEADER)) {
        const value = fields[key];
        if (value === null || value === undefined) continue; // no tocar
        const colIdx = hMap[header];
        if (colIdx === undefined) {
            console.warn('[ScriptB] upsertNutritionRow: encabezado no encontrado → "%s"', header);
            continue;
        }
        allData[targetIdx][colIdx] = isNaN(value) ? value : value; // string o number
    }

    // ── Escribir de vuelta ──
    Sheets.Spreadsheets.Values.update(
        { values: allData },
        ssId,
        "'" + CONFIG_NUTR.SHEET_NAME + "'!A" + CONFIG_NUTR.DATA_START_ROW,
        { valueInputOption: 'RAW' }
    );
}


// ══════════════════════════════════════════
// TRAC: PRE-CÁLCULO 7d
// ══════════════════════════════════════════

function tracPreCalculate7dMetrics(allData, hMap) {
    const lnHRVIdx = hMap['ln_HRV'];
    const lnHRV7dIdx = hMap['lnHRV_7d_mean'];
    const cvLnHRVIdx = hMap['CV_lnHRV'];
    const lnRRIdx = hMap['lnRMSSD_RR_ratio'];
    const hr1Idx = hMap['HR1'];

    for (let i = 0; i < allData.length; i++) {

        if (lnHRVIdx !== undefined) {
            const windowStart = Math.max(0, i - 6);
            const vals = [];
            for (let j = windowStart; j <= i; j++) {
                const v = parseFloat(allData[j][lnHRVIdx]);
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
            if (existing === '' || existing === null || existing === undefined || isNaN(parseFloat(existing))) {
                const lnHRV = parseFloat(allData[i][lnHRVIdx]);
                const hr1 = parseFloat(allData[i][hr1Idx]);
                if (!isNaN(lnHRV) && !isNaN(hr1) && hr1 > 0) {
                    allData[i][lnRRIdx] = lnHRV / (60000 / hr1);
                }
            }
        }
    }
}


// ══════════════════════════════════════════
// TRAC: Z-SCORES
// ══════════════════════════════════════════

function tracRecalculateZScores(allData, hMap, metrics) {
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

            const currentVal = parseFloat(rawVal);
            if (isNaN(currentVal)) { allData[i][zColIdx] = ''; continue; }

            const windowStart = Math.max(0, i - windowSize + 1);
            const windowValues = [];
            for (let j = windowStart; j <= i; j++) {
                if (contextIdx !== undefined) {
                    const ctx = String(allData[j][contextIdx] || '').trim();
                    if (ctx !== '' && ctx !== 'Normal') continue;
                }
                const v = parseFloat(allData[j][colIdx]);
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
// TRAC: COMPOSITES
// ══════════════════════════════════════════

function tracRecalculateComposites(allData, hMap) {
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

    const avgOfValid = (row, indices) => {
        const vals = indices.map(i => parseFloat(row[i])).filter(v => !isNaN(v));
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : '';
    };

    // Pass 1: Fatigue, Fitness, Readiness
    for (let i = 0; i < allData.length; i++) {
        if (insufficientIdx !== undefined) allData[i][insufficientIdx] = false;
        if (colFatigue !== undefined) allData[i][colFatigue] = avgOfValid(allData[i], fatigueZIdx);
        if (colFitness !== undefined) allData[i][colFitness] = avgOfValid(allData[i], fitnessZIdx);
        if (colReadiness !== undefined && colFatigue !== undefined && colFitness !== undefined) {
            const fat = parseFloat(allData[i][colFatigue]);
            const fit = parseFloat(allData[i][colFitness]);
            allData[i][colReadiness] = (!isNaN(fat) && !isNaN(fit)) ? fit - fat : '';
        }
    }

    // Pass 2: STF, LTF (EWMA)
    if (colFatigue !== undefined) {
        if (colSTF !== undefined) {
            const lambda = CONFIG_TRAC.EWMA_LAMBDA_STF;
            let ewma = null;
            for (let i = 0; i < allData.length; i++) {
                const v = parseFloat(allData[i][colFatigue]);
                if (!isNaN(v)) { ewma = ewma === null ? v : v * lambda + (1 - lambda) * ewma; allData[i][colSTF] = ewma; }
                else allData[i][colSTF] = ewma !== null ? ewma : '';
            }
        }
        if (colLTF !== undefined) {
            const lambda = CONFIG_TRAC.EWMA_LAMBDA_LTF;
            let ewma = null;
            for (let i = 0; i < allData.length; i++) {
                const v = parseFloat(allData[i][colFatigue]);
                if (!isNaN(v)) { ewma = ewma === null ? v : v * lambda + (1 - lambda) * ewma; allData[i][colLTF] = ewma; }
                else allData[i][colLTF] = ewma !== null ? ewma : '';
            }
        }
        if (colSTFLTF !== undefined && colSTF !== undefined && colLTF !== undefined) {
            for (let i = 0; i < allData.length; i++) {
                const stf = parseFloat(allData[i][colSTF]);
                const ltf = parseFloat(allData[i][colLTF]);
                allData[i][colSTFLTF] = (!isNaN(stf) && !isNaN(ltf) && ltf !== 0) ? stf / ltf : '';
            }
        }
    }

    // Z-Readiness
    if (colReadiness !== undefined && zReadinessIdx !== undefined) {
        const contextIdx = hMap['Context_Flag'];
        const windowSize = CONFIG_TRAC.Z_WINDOW_DEFAULT;
        for (let i = 0; i < allData.length; i++) {
            const currentVal = parseFloat(allData[i][colReadiness]);
            if (isNaN(currentVal)) { allData[i][zReadinessIdx] = ''; continue; }
            const windowStart = Math.max(0, i - windowSize + 1);
            const windowValues = [];
            for (let j = windowStart; j <= i; j++) {
                if (contextIdx !== undefined) {
                    const ctx = String(allData[j][contextIdx] || '').trim();
                    if (ctx !== '' && ctx !== 'Normal') continue;
                }
                const v = parseFloat(allData[j][colReadiness]);
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
            const zRead = zReadinessIdx !== undefined ? parseFloat(allData[i][zReadinessIdx]) : NaN;
            if (isNaN(zRead)) allData[i][colAlert] = 0;
            else if (zRead <= CONFIG_TRAC.ALERT_THRESHOLDS[2]) allData[i][colAlert] = 3;
            else if (zRead <= CONFIG_TRAC.ALERT_THRESHOLDS[1]) allData[i][colAlert] = 2;
            else if (zRead <= CONFIG_TRAC.ALERT_THRESHOLDS[0]) allData[i][colAlert] = 1;
            else allData[i][colAlert] = 0;
        }

        if (colANS !== undefined) {
            const zRead = zReadinessIdx !== undefined ? parseFloat(allData[i][zReadinessIdx]) : NaN;
            const alertLvl = colAlert !== undefined ? allData[i][colAlert] : 0;
            const insuffFlag = insufficientIdx !== undefined ? allData[i][insufficientIdx] : false;
            const zLnHRV = zLnHRVIdx !== undefined ? parseFloat(allData[i][zLnHRVIdx]) : NaN;
            const zOrthoResp = zOrthoRespIdx !== undefined ? parseFloat(allData[i][zOrthoRespIdx]) : NaN;
            const zHR1 = zHR1Idx !== undefined ? parseFloat(allData[i][zHR1Idx]) : NaN;
            const zPostural = zPosturalIdx !== undefined ? parseFloat(allData[i][zPosturalIdx]) : NaN;
            const zLnRRIdx = hMap['Z-lnRMSSD_RR'];
            const zLnRR = zLnRRIdx !== undefined ? parseFloat(allData[i][zLnRRIdx]) : NaN;

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
                const zCV = zCVIdx !== undefined ? parseFloat(allData[i][zCVIdx]) : NaN;
                allData[i][colNFOR] = !isNaN(zCV) && zCV < -1.0;
            }
        }

        if (colTrend !== undefined && colReadiness !== undefined) {
            const start = Math.max(0, i - 6);
            const readVals = [];
            for (let j = start; j <= i; j++) {
                const v = parseFloat(allData[j][colReadiness]);
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
            allData[i][colAction] = tracCalculateTRACAction(allData[i], hMap);
        }
    }
}


function tracCalculateTRACAction(row, hMap) {
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

function convertWellness(raw, category) {
    const num = parseInt(raw);
    if (isNaN(num) || num < 1 || num > 5) return '';
    const scale = category === 'fitness' ? SCALE_FITNESS : SCALE_FATIGUE;
    return scale[num];
}

function buildNewRow(colMap, values) {
    const maxCol = Math.max.apply(null, Object.values(colMap));
    const row = new Array(maxCol).fill('');
    Object.entries(values).forEach(([header, val]) => {
        const colIdx = colMap[header];
        if (colIdx) row[colIdx - 1] = (val === null || val === undefined) ? '' : val;
        else console.warn('[ScriptB] Header no encontrado en DB: "%s"', header);
    });
    return row;
}

function getTodaySerial() {
    const today = new Date();
    const epoch = new Date(1899, 11, 30);
    return Math.floor((today - epoch) / 86400000);
}

function getTodayString() {
    const now = new Date();
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
}

function formatTime(date) {
    return date.getHours().toString().padStart(2, '0') + ':' +
        date.getMinutes().toString().padStart(2, '0');
}

function columnToLetter(n) {
    let s = '';
    while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
    return s;
}

function jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}


// ══════════════════════════════════════════
// FETCH DASHBOARD DATA (GET API)
// ══════════════════════════════════════════

function fetchDashboardData(ssId) {
    const endCol = columnToLetter(CONFIG_TRAC.DB_COL_COUNT);
    const hdrRange = "'" + CONFIG_TRAC.SHEET_TRAC_DB + "'!A" + CONFIG_TRAC.DB_HEADER_ROW + ":" + endCol + CONFIG_TRAC.DB_HEADER_ROW;
    const dataRange = "'" + CONFIG_TRAC.SHEET_TRAC_DB + "'!A" + CONFIG_TRAC.DB_DATA_START_ROW + ":" + endCol + "5000";

    const hdrResp = Sheets.Spreadsheets.Values.get(ssId, hdrRange);
    const rawHeaders = hdrResp.values ? hdrResp.values[0] : [];
    const hMap = {};
    rawHeaders.forEach((h, i) => { if (h) hMap[String(h).trim()] = i; });

    const allDataResp = Sheets.Spreadsheets.Values.get(ssId, dataRange, { valueRenderOption: 'UNFORMATTED_VALUE' });
    const allData = (allDataResp.values || []).filter(row => row[0] !== undefined && row[0] !== '');

    if (allData.length === 0) return { error: 'No hay datos' };

    // Get the last row
    const lastRow = allData[allData.length - 1];
    const prevRow = allData.length > 1 ? allData[allData.length - 2] : null;

    // Helper to safely get value
    const getVal = (row, colName, fallback = null) => {
        const idx = hMap[colName];
        if (idx === undefined || !row) return fallback;
        const v = row[idx];
        return (v === undefined || v === '') ? fallback : v;
    };

    // Últimos 7 días válidos para chart y barra
    const last7Days = [];
    const readinessTrend = [];
    const startIdx = Math.max(0, allData.length - 14); // 14 for trend
    for (let i = startIdx; i < allData.length; i++) {
        const dateRaw = getVal(allData[i], 'Date');
        // Convert serial date to string for client if it's a number
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

    const currentHrv7d = getVal(lastRow, 'lnHRV_7d_mean', 0);
    const prevHrv7d = prevRow ? getVal(prevRow, 'lnHRV_7d_mean', 0) : 0;
    const hrvDelta = currentHrv7d - prevHrv7d;

    return {
        athleteName: ssId, // Mapped in client or later
        date: getVal(lastRow, 'Date'),
        alertLevel: getVal(lastRow, 'Alert_Level', 0),
        ansProfile: getVal(lastRow, 'ANS_Profile', 'INSUFFICIENT_DATA'),
        action: getVal(lastRow, 'TRAC_Action', ''),
        readinessZ: getVal(lastRow, 'Z-Readiness', 0),
        fatigueZ: getVal(lastRow, 'Fatigue', 0),
        fitnessZ: getVal(lastRow, 'Fitness', 0),
        hrv7d: currentHrv7d,
        hrvDelta: hrvDelta,
        stfLtfRatio: getVal(lastRow, 'STF_LTF_Ratio', 0),
        stf: getVal(lastRow, 'STF', 0),
        ltf: getVal(lastRow, 'LTF', 0),
        soreness: {
            push: getVal(lastRow, 'Push Soreness', 0),
            pull: getVal(lastRow, 'Pull Soreness', 0),
            legs: getVal(lastRow, 'Legs Soreness', 0),
            injury: getVal(lastRow, 'Lesión/Molestia', 0)
        },
        readinessTrend,
        last7Days
    };
}


// ══════════════════════════════════════════
// TEST
// ══════════════════════════════════════════

function testSaveFormData() {
    const mockEmail = 'diegojp2005@gmail.com';
    const mockData = {
        bodyweight: 80.5, hrv: 58, tap_total: 47, tap_variance: 22, tap_pauses: 0,
        hr1: 58, hr2: 76, hr3: 68, hr4: 70, contexto: 'Normal',
        push_soreness: 2, pull_soreness: 1, legs_soreness: 3, lesion: 1,
        cansancio: 2, carga: 3, recuperacion: 2, horas_sueno: 2,
        calidad_sueno: 1, alimentacion: 1, motivacion: 1,
    };
    const sheetId = findAthleteSheetId(mockEmail);
    if (!sheetId) { console.error('Email no encontrado'); return; }
    try {
        const result = saveFormData(mockData, sheetId);
        console.log('[ScriptB] Test OK:', JSON.stringify(result));
    } catch (e) {
        console.error('[ScriptB] Test FALLÓ:', e.message);
    }
}

function testSaveNutritionData() {
    const mockEmail = 'diegojp2005@gmail.com';
    const mockData = {
        bodyweight: 80.2, calories: 2200, protein: 180, carbs: 250,
        fat: 65, fiber: 30, water: 3.5, steps: 8000, cardio: '30 min caminata'
    };
    const sheetId = findAthleteSheetId(mockEmail);
    if (!sheetId) { console.error('Email no encontrado'); return; }
    try {
        const result = saveNutritionData(mockData, sheetId);
        console.log('[ScriptB] Nutrition Test OK:', JSON.stringify(result));
    } catch (e) {
        console.error('[ScriptB] Nutrition Test FALLÓ:', e.message);
    }
}