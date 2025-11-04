import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYNC_SECRET = process.env.SYNC_SECRET;
const TABLE = 'world_records';

function supabaseAdmin() {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
const makeKey = (r) => `${r.discipline}__${r.gender}__${r.category}`.toLowerCase().replace(/\s+/g, '_');

async function fetchIlsf() {
  const target = 'https://www.ilsf.org/lifesaving-sport/world-records/';
  const res = await fetch(target, { headers: { 'user-agent': 'LSranksBot/1.0' } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const rows = [];
  $('table tbody tr').each((_, el) => {
    const tds = $(el).find('td').map((i, td) => norm($(td).text())).get();
    if (tds.length < 6) return;
    const [discipline, gender, category, athlete, nation, performance, date = '', venue = ''] = tds;
    rows.push({ discipline, gender, category, athlete, nation, performance, date, venue });
  });
  return rows;
}

export default async function handler(req, res) {
  try {
    if (SYNC_SECRET && req.query.secret !== SYNC_SECRET) {
      return res.status(401).json({ ok:false, error:'Unauthorized' });
    }
    const items = await fetchIlsf();
    if (!items.length) return res.status(200).json({ ok:true, count:0 });

    const supa = supabaseAdmin();
    const payload = items.map(r => ({ ...r, uniq_key: makeKey(r), updated_at: new Date().toISOString() }));
    const { error } = await supa.from(TABLE).upsert(payload, { onConflict:'uniq_key' });
    if (error) throw error;

    return res.status(200).json({ ok:true, count:payload.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:String(e.message || e) });
  }
}
