// pages/api/sync-ils-world-records.js
import { createClient } from '@supabase/supabase-js';

// ---- Konfiguration aus ENV (GENAU diese Namen!) ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// kleine Hilfsfunktion, um 401/500 hübsch zu antworten
const j = (res, status, body) => res.status(status).json(body);

// Dummy-Quelle: WELTREKORDE (hier: deine bestehende Fetch/Mapping-Logik verwenden)
async function fetchIlsWorldRecords() {
  // <- hier deine vorhandene Logik/Quelle einhängen
  // Rückgabe: Array von Objekten mit Feldern passend zur Tabelle `records`
  return [
    // nur zum Testen – echte Implementierung hast du schon
  ];
}

export default async function handler(req, res) {
  // 1) Header-Auth (Cron oder manueller Curl)
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!CRON_SECRET) return j(res, 500, { ok: false, error: 'CRON_SECRET missing on server' });
  if (token !== CRON_SECRET) return j(res, 401, { ok: false, error: 'unauthorized' });

  // 2) ENV-Check (Fehler aus deinem Log verhindern)
  if (!SUPABASE_URL) return j(res, 500, { ok: false, error: 'supabaseUrl is required' });
  if (!SERVICE_ROLE_KEY) return j(res, 500, { ok: false, error: 'supabaseKey is required' });

  // 3) Supabase-Client mit Service Role (Server-Kontext)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 4) Daten holen (deine bereits funktionierende Parser/Mapper hier verwenden)
    const rows = await fetchIlsWorldRecords();

    // 5) Upsert in Tabelle `records`
    // wichtig: Conflict Target MUSS deinem Unique-Index entsprechen!
    // Du hast: UNIQUE(record_scope, discipline_code, gender, pool_length, timing)
    const { error } = await supabase
      .from('records')
      .upsert(rows, { onConflict: 'record_scope,discipline_code,gender,pool_length,timing' });

    if (error) return j(res, 500, { ok: false, error: error.message });

    return j(res, 200, { ok: true, count: rows.length });
  } catch (e) {
    return j(res, 500, { ok: false, error: String(e.message || e) });
  }
}
