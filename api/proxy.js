/**
 * Vercel serverless proxy for Apps Script write operations.
 * Client sends POST here → proxy forwards as GET to Apps Script (server-side, no CORS).
 * Only allows requests to script.google.com.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { scriptUrl, params } = body ?? {};

  if (!scriptUrl || typeof scriptUrl !== 'string') {
    return res.status(400).json({ success: false });
  }

  let url;
  try {
    url = new URL(scriptUrl);
    if (url.hostname !== 'script.google.com') throw new Error('bad host');
  } catch {
    return res.status(400).json({ success: false });
  }

  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
  }

  try {
    const upstream = await fetch(url.toString());
    if (!upstream.ok) return res.status(502).json({ success: false });
    const json = await upstream.json();
    return res.status(200).json(json);
  } catch {
    return res.status(502).json({ success: false });
  }
}
