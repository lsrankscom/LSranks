import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYNC_SECRET = process.env.SYNC_SECRET;
const TABLE = 'results_raw'; // z.B. Rohdaten-Tabelle für Nationsergebnisse

const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
function supa() { return createClient(url, key, { auth: { persistSession:false } }); }

async function fetchAUS() {
  // TODO: echte Quelle(n) der Nation parsen
  // return Array<{ date, meet, city, nation:'AUS', event, gender, age_class, is_relay, athlete, club, performance }>;
  return [];
}

export default async function handler(req, res) {
  try {
    if (SYNC_SECRET && req.query.secret !== SYNC_SECRET) return res.status(401).json({ ok:false });
    const items = await fetchAUS();
    if (!items.length) return res.status(200).json({ ok:true, count:0 });
    const client = supa();
    const { error } = await client.from(TABLE).insert(items, { upsert:false });
    if (error) throw error;
    res.status(200).json({ ok:true, count: items.length });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e.message || e) });
  }
}
