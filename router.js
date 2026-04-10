// ══════════════════════════════════════════════════════════════════════════
// ROUTER SCRIPT — TRAC Athlete Lookup (Central)
//
// Busca en la "allowed list" el email del atleta y devuelve
// la URL del Data Logger de su coach y el Sheet ID de su hoja.
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New Deployment
//   Type: Web App
//   Execute as: Me
//   Who has access: Anyone
//
// CONFIGURACIÓN:
//   1. Habilitar la API de Google Sheets (Services → Google Sheets API)
//   2. Deploy como Web App
//   3. Configurar VITE_ROUTER_SCRIPT_URL en Vercel con la URL del deployment
// ══════════════════════════════════════════════════════════════════════════

const SHARED_TOKEN = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7B8C9D0E1F2';
const ALLOWED_LIST_ID = '12bTF4jHeRM5sYplPbs9eF1r2Ax9fb4qDQroAHMKH3Sk';

// Columnas esperadas en la allowed list (1-indexed)
// A = Sheet ID | B = Data Logger ID | C = Gmail | D = Athlete
const COL_SHEET_ID = 1;       // A
const COL_DATA_LOGGER = 2;    // B
const COL_GMAIL = 3;          // C
const COL_ATHLETE = 4;        // D

function doGet(e) {
  try {
    const token = e.parameter.token;
    const email = String(e.parameter.email || '').trim().toLowerCase();
    const action = String(e.parameter.action || '').trim();

    if (!token || token !== SHARED_TOKEN) {
      return jsonResponse({ success: false, error: 'Token inválido.' });
    }

    if (action === 'lookup') {
      if (!email) {
        return jsonResponse({ success: false, error: 'Email no proporcionado.' });
      }

      const result = lookupAthlete(email);
      if (!result) {
        return jsonResponse({ success: false, error: 'Atleta no encontrado en la allowed list.' });
      }

      return jsonResponse({ success: true, data: result });
    }

    return ContentService.createTextOutput('TRAC Router — OK').setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    console.error('[Router] doGet error: %s', err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

function lookupAthlete(email) {
  try {
    const resp = Sheets.Spreadsheets.Values.get(
      ALLOWED_LIST_ID,
      'A:D',
      { valueRenderOption: 'UNFORMATTED_VALUE' }
    );
    const rows = resp.values || [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cellEmail = String(row[COL_GMAIL - 1] || '').trim().toLowerCase();

      if (cellEmail === email) {
        const sheetId = String(row[COL_SHEET_ID - 1] || '').trim();
        const dataLoggerUrl = String(row[COL_DATA_LOGGER - 1] || '').trim();
        const athleteName = String(row[COL_ATHLETE - 1] || '').trim();

        if (!sheetId || !dataLoggerUrl) {
          console.warn('[Router] Fila incompleta para email: %s', email);
          return null;
        }

        return {
          scriptUrl: dataLoggerUrl,
          sheetId: sheetId,
          athleteName: athleteName || email.split('@')[0]
        };
      }
    }

    return null;

  } catch (e) {
    console.error('[Router] lookupAthlete error: %s', e.message);
    return null;
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── TEST ──
function testLookup() {
  const result = lookupAthlete('diegojp2005@gmail.com');
  console.log('[Router] Test:', JSON.stringify(result));
}
