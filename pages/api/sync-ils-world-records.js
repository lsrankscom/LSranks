// pages/api/sync-ils-world-records.js
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

/**
 * Diese Route:
 * - prüft SYNC_TOKEN
 * - lädt die ILSF-Seite(n)
 * - extrahiert alle Weltrekorde aus Tabellen
 * - upsertet in public.records auf den Unique-Key
 *   (record_scope, discipline_code, gender, pool_length, timing)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  // WICHTIG: Service Role Key, damit RLS für Inserts/Updates nicht blockiert
  process.env.SUPABASE_SERVICE_KEY
);

const SYNC_TOKEN = process.env.SYNC_TOKEN;
const SOURCE_URLS = (process.env.ILS_WR_URLS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function parseTimeToMs(tstr) {
  // akzeptiert "1:02.78" oder "46.11" etc.
  if (!tstr) return null;
  const s = String(tstr).trim();
  const mm_ss_ms = s.split(':');
  let totalMs = 0;
  if (mm_ss_ms.length === 2) {
    const mm = parseInt(mm_ss_ms[0], 10) || 0;
    const ss_ms = parseFloat(mm_ss_ms[1].replace(',', '.')) || 0;
    totalMs = mm * 60 * 1000 + Math.round(ss_ms * 1000);
  } else {
    const sec = parseFloat(s.replace(',', '.')) || 0;
    totalMs = Math.round(sec * 1000);
  }
  return totalMs;
}

function normalizeGender(g) {
  const s = (g || '').toLowerCase();
  if (s.startsWith('m')) return 'M';
  if (s.startsWith('w') || s.startsWith('f')) return 'W';
  return null;
}

function normalizeTiming(t) {
  const s = (t || '').toUpperCase();
  if (s.includes('ET')) return 'ET';
  if (s.includes('HT')) return 'HT';
  return null;
}

function guessPoolLen(txt) {
  // viele WR-Listen sind 50m; wenn explizit "25" vorkommt, nimm 25
  const s = (txt || '').toLowerCase();
  if (s.includes('25')) return 25;
  if (s.includes('50')) return 50;
  return 50; // Default
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'LSranks sync bot' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

function parseIlsfTables(html, url) {
  const $ = cheerio.load(html);
  const rows = [];

  // Jede Tabelle auf der Seite durchgehen
  $('table').each((_ti, table) => {
    const $table = $(table);
    const headers = [];
    $table.find('thead th').each((_hi, th) => headers.push($(th).text().trim()));

    // Wenn keine thead, versuch die erste tr als header
    if (headers.length === 0) {
      const $hdr = $table.find('tr').first().find('th,td');
      $hdr.each((_hi, th) => headers.push($(th).text().trim()));
    }

    // Spalten-Index grob erkennen
    const idxEvent     = headers.findIndex(h => /event/i.test(h));
    const idxCompet    = headers.findIndex(h => /competitor|athlete/i.test(h));
    const idxDate      = headers.findIndex(h => /date/i.test(h));
    const idxTime      = headers.findIndex(h => /^time$/i.test(h));
    const idxCity      = headers.findIndex(h => /place|city|venue/i.test(h));

    // Body-Zeilen
    $table.find('tbody tr').each((_ri, tr) => {
      const $tds = $(tr).find('td');
      if ($tds.length < 3) return;

      const eventTxt  = idxEvent  >= 0 ? $($tds[idxEvent]).text().trim()  : '';
      const athlete   = idxCompet >= 0 ? $($tds[idxCompet]).text().trim() : '';
      const dateTxt   = idxDate   >= 0 ? $($tds[idxDate]).text().trim()   : '';
      const timeTxt   = idxTime   >= 0 ? $($tds[idxTime]).text().trim()   : '';
      const cityTxt   = idxCity   >= 0 ? $($tds[idxCity]).text().trim()   : '';

      if (!eventTxt || !timeTxt) return;

      // Disziplin- und Metadaten heuristisch aus Eventtext
      const ev = eventTxt.replace(/\s+/g, ' ').trim();
      // Beispiele: "Open - 100m Manikin Carry with Fins - Women"
      // Zerlegen:
      const up = ev.toUpperCase();

      let gender = null;
      if (up.includes('WOMEN')) gender = 'W';
      else if (up.includes('MEN')) gender = 'M';

      let scope = 'world'; // hier nur Weltrekorde
      // KiPo: weitere Scopes später (national etc.)

      // Disziplin als Kode (z.B. OPEN_100M_MANIKIN_CARRY_WITH_FINS)
      let discipline_code = up
        .replace(/\b(OPEN|MEN|WOMEN|MASTERS|YOUTH)\b/g, '')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      // Timing/Beckenlänge
      const timing  = normalizeTiming(headers.join(' ') + ' ' + eventTxt) || 'ET';
      const poolLen = guessPoolLen(headers.join(' ') + ' ' + ev);

      // Zeit in ms
      const time_ms = parseTimeToMs(timeTxt);

      // Datum
      let record_date = null;
      const m = dateTxt.match(/(\d{2})-(\d{2})-(\d{4})|(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        if (m[3]) record_date = `${m[3]}-${m[2]}-${m[1]}`;           // dd-mm-yyyy
        else if (m[6]) record_date = `${m[4]}-${m[5]}-${m[6]}`;      // yyyy-mm-dd
      }

      rows.push({
        record_scope: scope,
        discipline_code,
        gender: normalizeGender(gender),
        pool_length: poolLen,
        timing,
        time_ms,
        athlete_name: athlete || null,
        nation: null,
        club: null,
        meet_name: null,
        city: cityTxt || null,
        country: null,
        record_date: record_date ? record_date : null,
        source_url: url,
        updated_at: new Date().toISOString()
      });
    });
  });

  return rows;
}

export default async function handler(req, res) {
  try {
    // 1) Token prüfen
    const token = (req.query.token || '').toString();
    if (!SYNC_TOKEN || token !== SYNC_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // 2) Quellen sammeln
    const urls = SOURCE_URLS.length ? SOURCE_URLS : ['https://sport.ilsf.org/records'];

    // 3) Seiten laden & parsen
    let parsed = [];
    for (const url of urls) {
      const html = await fetchHtml(url);
      const rows = parseIlsfTables(html, url);
      parsed = parsed.concat(rows);
    }

    // 4) Filtern: nur Datensätze mit den Pflichtfeldern
    const payload = parsed.filter(
      r => r.record_scope && r.discipline_code && r.gender && r.pool_length && r.timing && r.time_ms
    );

    // 5) Upsert in public.records
    // On conflict: exakt die 5 Spalten, für die es bei dir den Unique-Index gibt
    let upserts = 0;
    if (payload.length) {
      const { error, count } = await supabase
        .from('records')
        .upsert(payload, {
          onConflict: 'record_scope,discipline_code,gender,pool_length,timing',
          ignoreDuplicates: false,
          returning: 'minimal',
          count: 'exact'
        });

      if (error) throw error;
      upserts = count || 0;
    }

    return res.status(200).json({
      ok: true,
      tablesFound: 'n/a',
      parsedRows: parsed.length,
      upserts
    });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err?.message || err) });
  }
}
