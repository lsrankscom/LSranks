// pages/api/sync/ils-world-records.js
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYNC_SECRET = process.env.SYNC_SECRET;

// ⚠️ Passe ggf. den Tabellennamen an (z.B. "world_records")
const TABLE = 'world_records';

// Hilfsfunktion: Supabase Admin-Client
function supabaseAdmin() {
  if (!url || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Normiert Strings
const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');

// Eindeutiger Key für Upsert (passe an deine DB-Constraints an)
const makeKey = (r) =>
  `${r.discipline}__${r.gender}__${r.category}`.toLowerCase().replace(/\s+/g, '_');

// ⇣⇣⇣ Hier wird die ILSF-Seite geparst. Wenn du schon einen Parser hattest, kannst du deinen Code
// in diese Funktion legen und das Rückgabeformat beibehalten.
async function fetchIlsfRecords() {
  // Beispiel: öffentliche WR-Seite (URL ggf. anpassen)
  const target = 'https://www.ilsf.org/lifesaving-sport/world-records/';

  const res = await fetch(target, { headers: { 'user-agent': 'LSranksBot/1.0' } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // ⚠️ Struktur variiert je nach ILSF-Seite. Unten ein robuster Fallback:
  // Erwartet Tabellen mit Disziplin, Geschlecht, Kategorie, Athlet, Nation, Leistung, Datum, Ort.
  // Passe die Selektoren an, falls die Seite anders markiert ist.
  const rows = [];
  $('table tbody tr').each((_, el) => {
    const tds = $(el).find('td').map((i, td) => norm($(td).text())).get();
    if (tds.length < 6) return;

    // Versuche sinnvolle Zuordnung (bitte an deine Spalten anpassen)
    const [discipline, gender, category, athlete, nation, performance, date = '', venue = ''] = tds;

    rows.push({
      discipline,
      gender,
      category,
      athlete,
      nation,
      performance,
      date,
      venue,
    });
  });

  return rows;
}

export default async function handler(req, res) {
  try {
    if (SYNC_SECRET && req.query.secret !== SYNC_SECRET) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const items = await fetchIlsfRecords();
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(500).json({ ok: false, error: 'No records parsed' });
    }

    const admin = supabaseAdmin();

    // Upsert payload (füge unique key & updated_at hinzu)
    const payload = items.map((r) => ({
      ...r,
      uniq_key: makeKey(r),
      updated_at: new Date().toISOString(),
    }));

    // ⚠️ DB-Seite: Tabelle braucht eine UNIQUE-Constraint auf "uniq_key"
    // z.B.: ALTER TABLE world_records ADD CONSTRAINT world_records_uniq UNIQUE (uniq_key);
    const { error } = await admin.from(TABLE).upsert(payload, {
      onConflict: 'uniq_key',
    });

    if (error) throw error;

    return res.status(200).json({ ok: true, count: payload.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
