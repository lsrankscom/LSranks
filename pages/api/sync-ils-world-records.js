// pages/api/sync-ils-world-records.js

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// ===== Helper: time "M:SS.hh" | "MM:SS.hh" | "SS.hh" -> millis =====
function timeToMs(t) {
  if (!t) return null;
  const txt = String(t).trim();
  // akzeptiere z.B. "1:02.78", "46.11", "2:01"
  const m = txt.match(/^(\d+):(\d{1,2})(?:[.,](\d{1,3}))?$/) // M:SS.hh
           || txt.match(/^(\d{1,2})(?:[.,](\d{1,3}))?$/);     // SS.hh
  if (!m) return null;

  if (m.length === 4 && m[2] !== undefined) {
    // M:SS.hh
    const mm = parseInt(m[1], 10);
    const ss = parseInt(m[2], 10);
    const hs = parseInt((m[3] || '0').padEnd(2, '0'), 10); // Hundertstel
    return (mm * 60 + ss) * 1000 + hs * 10;
  } else {
    // SS.hh
    const ss = parseInt(m[1], 10);
    const hs = parseInt((m[2] || '0').padEnd(2, '0'), 10);
    return ss * 1000 + hs * 10;
  }
}

// ===== Helper: Event -> discipline_code, gender, age_class =====
function normalizeDiscipline(eventText) {
  const raw = String(eventText || '').trim();
  // Beispiele auf ILSF: "Open - 100m Manikin Carry with Fins - Women"
  //                     "Masters - 100m Manikin Carry with Fins - Men M40"
  //                     "Youth - 50m Manikin Carry - Women"
  // Wir ziehen Teile über " - " auseinander:
  const parts = raw.split(/\s*-\s*/); // ["Open", "100m Manikin Carry with Fins", "Women", ...]
  let scopeOrClass = (parts[0] || '').toUpperCase();  // OPEN | MASTERS | YOUTH
  let name = (parts[1] || '').trim();                 // "100m Manikin Carry with Fins"
  let genderPart = (parts[2] || '').trim().toUpperCase(); // "MEN" | "WOMEN" | "MIXED"
  let ageSuffix = (parts[3] || '').trim().toUpperCase();  // evtl. "M30", "M40", ...

  // Gender ableiten
  let gender = null;
  if (genderPart.startsWith('MEN')) gender = 'M';
  else if (genderPart.startsWith('WOMEN')) gender = 'W';
  else if (genderPart.startsWith('MIXED')) gender = 'X';

  // Klasse als Prefix im Disziplincode
  // OPEN_ / MASTERS_ / YOUTH_
  const classPrefix =
    scopeOrClass.includes('MASTERS') ? 'MASTERS_' :
    scopeOrClass.includes('YOUTH')   ? 'YOUTH_'   :
    'OPEN_';

  // Altersklasse (nur Masters / Youth relevant) – bleibt im Code stehen, z.B. _M40
  let ageClass = '';
  const mAge = ageSuffix.match(/^M\d{2}$/); // z.B. M30, M40 …
  if (mAge) ageClass = '_' + mAge[0];

  // Disziplin-Name → UPPER_UNDERSCORE
  const codeCore = name
    .toUpperCase()
    .replaceAll(/[()]/g, '')
    .replaceAll(/\s+/g, '_');

  // finaler disziplin_code
  const discipline_code = `${classPrefix}${codeCore}${ageClass}`;
  return { discipline_code, gender };
}

// ===== Helper: Datum "DD-MM-YYYY" | "YYYY-MM-DD" -> Date =====
function parseDate(s) {
  if (!s) return null;
  const t = String(s).trim();
  // ILSF zeigt z.B. "19-11-2004" oder "2023-08-10"
  let d = null;
  if (/^\d{2}-\d{2}-\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split('-').map(Number);
    d = new Date(Date.UTC(yyyy, mm - 1, dd));
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [yyyy, mm, dd] = t.split('-').map(Number);
    d = new Date(Date.UTC(yyyy, mm - 1, dd));
  }
  return d ? d.toISOString().slice(0, 10) : null; // YYYY-MM-DD
}

// ===== HTML → Records extrahieren =====
function extractRecordsFromHtml(html, sourceUrl) {
  const $ = cheerio.load(html);
  const rows = [];

  // Auf der ILSF-Seite stehen Bereiche ("Open - Women", ...) mit Tabellen.
  // Jede Tabellenzeile: Event | Competitor | Date | Time | Ort etc.
  $('table').each((_, table) => {
    $(table).find('tbody tr').each((__, tr) => {
      const tds = $(tr).find('td');
      if (tds.length < 4) return;

      const eventText = $(tds[0]).text().trim();
      const competitor = $(tds[1]).text().trim();
      const dateText = $(tds[2]).text().trim();
      const timeText = $(tds[3]).text().trim();

      const { discipline_code, gender } = normalizeDiscipline(eventText);

      const row = {
        record_scope: 'world',
        discipline_code,
        gender,
        pool_length: 50,           // ILSF-Records werden i.d.R. auf 50m geführt
        timing: 'ET',              // ET = electronic (Standardannahme)
        time_ms: timeToMs(timeText),
        athlete_name: competitor || null,
        nation: null,              // ILSF listet dort das Team — Nation kann später nachgezogen werden
        club: null,
        meet_name: null,
        record_date: parseDate(dateText),
        city: null,
        country: null,
        source_url: sourceUrl,
        updated_at: new Date().toISOString(),
      };

      // nur sinnvolle Datensätze übernehmen
      if (row.discipline_code && row.gender && row.time_ms) {
        rows.push(row);
      }
    });
  });

  return rows;
}

export default async function handler(req, res) {
  try {
    // === 1) Token prüfen ===
    const secret = process.env.SYNC_TOKEN;
    if (!secret) {
      return res.status(500).json({ ok: false, error: 'missing SYNC_TOKEN env' });
    }
    if (req.query.token !== secret) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // === 2) Supabase (Service-Role) ===
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ ok: false, error: 'missing supabase envs' });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    // === 3) Quellen lesen ===
    const urlsEnv = process.env.ILS_WR_URLS || '';
    const urls = urlsEnv
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      return res.status(400).json({ ok: false, error: 'ILS_WR_URLS env is empty' });
    }

    let parsedRows = 0;
    let allRows = [];
    for (const url of urls) {
      const resp = await fetch(url, { headers: { 'user-agent': 'LSranksBot/1.0' } });
      if (!resp.ok) {
        return res.status(502).json({ ok: false, error: `fetch failed: ${url} (${resp.status})` });
      }
      const html = await resp.text();
      const rows = extractRecordsFromHtml(html, url);
      parsedRows += rows.length;
      allRows = allRows.concat(rows);
    }

    // === 4) Upsert in public.records ===
    // onConflict MUSS exakt deinem Unique-Index entsprechen:
    // (record_scope, discipline_code, gender, pool_length, timing)
    let upserts = 0;
    const chunkSize = 500;
    for (let i = 0; i < allRows.length; i += chunkSize) {
      const chunk = allRows.slice(i, i + chunkSize);
      const { error, data } = await supabase
        .from('records')
        .upsert(chunk, {
          onConflict: 'record_scope,discipline_code,gender,pool_length,timing',
          ignoreDuplicates: false,
        })
        .select('discipline_code'); // nur um "data" nicht riesig zu machen

      if (error) {
        // Häufige Fehler: RLS / Foreign Keys / falscher onConflict
        return res.status(400).json({
          ok: false,
          error: error.message,
          samplePayloads: allRows.slice(0, 3),
        });
      }
      upserts += (data?.length || 0);
    }

    return res.status(200).json({
      ok: true,
      tablesFound: urls.length,
      parsedRows,
      upserts,
      debug: allRows.slice(0, 3), // kleine Probe zum Nachsehen
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
