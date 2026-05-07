// ══════════════════════════════════════════════════════════════════════════
// ROUTER SCRIPT — TRAC Athlete Lookup (Central)
//
// Busca en la "allowed list" el email del atleta y devuelve
// la URL del Data Logger de su coach y el Sheet ID de su hoja.
// Admins reciben isAdmin: true + lista completa de atletas.
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New Deployment
//   Type: Web App  |  Execute as: Me  |  Who has access: Anyone
//
// CONFIGURACIÓN:
//   1. Habilitar la API de Google Sheets (Services → Google Sheets API)
//   2. Deploy como Web App
//   3. Configurar VITE_ROUTER_SCRIPT_URL en Vercel con la URL del deployment
// ══════════════════════════════════════════════════════════════════════════

const SHARED_TOKEN    = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7B8C9D0E1F2';
const ALLOWED_LIST_ID = '12bTF4jHeRM5sYplPbs9eF1r2Ax9fb4qDQroAHMKH3Sk';

// Admin emails — tienen acceso completo a todos los atletas
const ADMIN_EMAILS = [
  'diegojp2005@gmail.com'
];

// Columnas en la allowed list (1-indexed)
// A = Sheet ID | B = Data Logger URL | C = Gmail | D = Athlete Name
const COL_SHEET_ID    = 1;
const COL_DATA_LOGGER = 2;
const COL_GMAIL       = 3;
const COL_ATHLETE     = 4;


function doGet(e) {
  try {
    const token  = e.parameter.token;
    const email  = String(e.parameter.email  || '').trim().toLowerCase();
    const action = String(e.parameter.action || '').trim();

    if (!token || token !== SHARED_TOKEN) {
      return jsonResponse({ success: false, error: 'Token inválido.' });
    }

    // ── LOOKUP: resolve email → athlete data ──
    if (action === 'lookup') {
      if (!email) return jsonResponse({ success: false, error: 'Email no proporcionado.' });

      // Admin check first (bypass allowed list)
      if (ADMIN_EMAILS.includes(email)) {
        const athletes = getAllAthletes();
        return jsonResponse({
          success: true,
          data: { isAdmin: true, scriptUrl: null, sheetId: null, athleteName: 'Coach', athletes }
        });
      }

      // Regular athlete lookup
      const result = lookupAthlete(email);
      if (!result) return jsonResponse({ success: false, error: 'Atleta no encontrado en la allowed list.' });
      return jsonResponse({ success: true, data: { isAdmin: false, ...result } });
    }

    // ── LIST ATHLETES: admin-only ──
    if (action === 'listAthletes') {
      if (!email) return jsonResponse({ success: false, error: 'Email no proporcionado.' });
      if (!ADMIN_EMAILS.includes(email)) return jsonResponse({ success: false, error: 'No autorizado.' });
      return jsonResponse({ success: true, data: { athletes: getAllAthletes() } });
    }

    return ContentService.createTextOutput('TRAC Router — OK').setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    console.error('[Router] doGet error: %s', err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}


function lookupAthlete(email) {
  try {
    const rows = getListRows();
    for (let i = 1; i < rows.length; i++) { // i=1: skip header row
      const row       = rows[i];
      const cellEmail = String(row[COL_GMAIL - 1] || '').trim().toLowerCase();
      if (cellEmail !== email) continue;

      const sheetId       = String(row[COL_SHEET_ID    - 1] || '').trim();
      const dataLoggerUrl = String(row[COL_DATA_LOGGER - 1] || '').trim();
      const athleteName   = String(row[COL_ATHLETE     - 1] || '').trim();

      if (!sheetId || !dataLoggerUrl) {
        console.warn('[Router] Fila incompleta para email: %s', email);
        return null;
      }
      return { scriptUrl: dataLoggerUrl, sheetId, athleteName: athleteName || email.split('@')[0] };
    }
    return null;
  } catch (e) {
    console.error('[Router] lookupAthlete error: %s', e.message);
    return null;
  }
}


function getAllAthletes() {
  try {
    const rows     = getListRows();
    const athletes = [];
    for (let i = 1; i < rows.length; i++) { // i=1: skip header row
      const row         = rows[i];
      const email       = String(row[COL_GMAIL       - 1] || '').trim().toLowerCase();
      const sheetId     = String(row[COL_SHEET_ID    - 1] || '').trim();
      const scriptUrl   = String(row[COL_DATA_LOGGER - 1] || '').trim();
      const athleteName = String(row[COL_ATHLETE     - 1] || '').trim();
      if (!email || !sheetId || !scriptUrl) continue;
      athletes.push({ email, name: athleteName || email.split('@')[0], sheetId, scriptUrl });
    }
    return athletes;
  } catch (e) {
    console.error('[Router] getAllAthletes error: %s', e.message);
    return [];
  }
}


function getListRows() {
  const resp = Sheets.Spreadsheets.Values.get(
    ALLOWED_LIST_ID, 'A:D', { valueRenderOption: 'UNFORMATTED_VALUE' }
  );
  return resp.values || [];
}


function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── TESTS ──
function testLookupAdmin() {
  const result = getAllAthletes();
  console.log('[Router] Athletes:', JSON.stringify(result));
}

function testLookupAthlete() {
  const result = lookupAthlete('example@gmail.com');
  console.log('[Router] Athlete:', JSON.stringify(result));
}
