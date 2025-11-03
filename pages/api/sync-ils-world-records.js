// pages/api/sync-ils-world-records.js
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const ILS_URL = process.env.ILS_WR_URLS || 'https://sport.ilsf.org/records';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CRON_TOKEN = process.env.CRON_TOKEN;

function getIncomingToken(req) {
  // 1) ?token=...
  if (req.query && typeof req.query.token === 'string') return req.query.token.trim();
  // 2) x-cron-token: ...
  const headerTok = req.headers['x-cron-token'];
  if (typeof headerTok === 'string') return headerTok.trim();
  // 3) Authorization: Bearer ...
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
}

export default async function handler(req, res) {
  // Nur GET/POST zulassen
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // Tokenprüfung (in Dev ohne CRON_TOKEN wird nicht blockiert)
  const incoming = getIncomingToken(req);
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!CRON_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: 'server_misconfigured',
        hint: 'CRON_TOKEN is not set in Vercel Environment Variables (Production).'
      });
    }
    if (incoming !== CRON_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  }

  try {
    // --- Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- HTML holen & parsen
    const resp = await fetch(ILS_URL, { headers: { 'User-Agent': 'LSRanks bot' } });
    const html = await resp.text();
    const $ = cheerio.load(html);

    // Tabellen parsen (vereinfacht – du nutzt bereits deine funktionierende Logik)
    const rows = [];
    $('table').each((_, t) => {
      $(t)
        .find('tbody tr')
        .each((__, tr) => {
          const tds = $(tr).find('td');
          if (tds.length < 4) return;
          const event = $(tds[0]).text().trim();
          const competitor = $(tds[1]).text().trim();
          const date = $(tds[2]).text().trim();
          const time = $(tds[3]).text().trim();

          // Aus Event → disziplin code/gender ableiten (du hast dafür schon Mapping/RegEx – hier nur Platzhalter)
          rows.push({
            record_scope: 'world',
            discipline_code: event.replace(/\s+/g, '_').toUpperCase(),
            gender: /women/i.test(event) ? 'W' : /men/i.test(event) ? 'M' : null,
            pool_length: 50,
            timing: 'ET',
            time_ms: null, // wenn du ms aus time berechnest → hier einsetzen
            athlete_name: competitor || null,
            nation: null,
            club: null,
            meet_name: null,
            record_date: date ? new Date(Date.parse(date)) : null,
            source_url: ILS_URL,
            updated_at: new Date().toISOString()
          });
        });
    });

    // Upsert (entspricht deinem vorhandenen Unique Index)
    // Unique-Index auf (record_scope, discipline_code, gender, pool_length, timing) wird vorausgesetzt.
    let upserts = 0;
    if (rows.length) {
      const { error } = await supabase
        .from('records')
        .upsert(rows, {
          onConflict: 'record_scope,discipline_code,gender,pool_length,timing',
          ignoreDuplicates: false
        });
      if (error) {
        return res.status(400).json({ ok: false, error: error.message });
      }
      upserts = rows.length;
    }

    return res.status(200).json({
      ok: true,
      imported: upserts
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'unknown_error' });
  }
}
