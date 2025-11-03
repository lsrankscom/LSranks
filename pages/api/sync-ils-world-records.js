// pages/api/sync-ils-world-records.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const TOKEN = process.env.ADMIN_TOKEN || 'LSRANKS_SECRET_2025'; // dein Schutz-Token
const ILS_RECORDS_URL = process.env.ILS_WR_URLS || 'https://sport.ilsf.org/records';

// Supabase: Service-Client (darf RLS umgehen)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // WICHTIG: service_role!
  { auth: { persistSession: false } }
);

// Hilfsfunktionen
const parseTimeToMs = (txt) => {
  // Beispiele: "1:02,78"  "0:49"  "2:01."  "1.03,70"
  if (!txt) return null;
  let s = String(txt).trim();

  // Komma als Dezimaltrennzeichen zu Punkt
  s = s.replace(',', '.');

  // Entferne alles außer Ziffern, Punkt, Doppelpunkt
  s = s.replace(/[^0-9:\.]/g, '');

  // Fälle:
  // 1) mm:ss.xx
  // 2) ss.xx
  // 3) m:ss
  const parts = s.split(':');
  let total = 0;

  if (parts.length === 1) {
    // nur Sekunden (.xx erlaubt)
    const sec = parseFloat(parts[0] || '0');
    total = Math.round(sec * 1000);
  } else if (parts.length === 2) {
    const mm = parseInt(parts[0] || '0', 10);
    const ss = parseFloat(parts[1] || '0');
    total = mm * 60 * 1000 + Math.round(ss * 1000);
  } else {
    // Fallback für exotische Formate
    const last = parseFloat(parts.pop() || '0');
    const mm = parseInt(parts.pop() || '0', 10);
    total = mm * 60 * 1000 + Math.round(last * 1000);
  }
  return Number.isFinite(total) ? total : null;
};

const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');

// sehr einfache Disziplin-Kodierung (du kannst das später erweitern/mappen)
const toDisciplineCode = (eventText) => {
  const t = (eventText || '').toUpperCase();
  // Beispieleingaben von ILS: "Open - 100m Rescue Medley - Women"
  // Wir ziehen den mittleren Teil heraus
  const m = t.match(/-\s*([0-9A-Z\s\(\)\/]+?)\s*-\s*/);
  const core = m ? m[1] : t;

  return core
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '')
    .replace(/__+/g, '_')
    .trim();
};

const toGender = (headerText) => {
  // Abschnittsüberschriften sind "Open - Women", "Open - Men", "Junior - Women", ...
  const t = (headerText || '').toLowerCase();
  if (t.includes('women')) return 'W';
  if (t.includes('men')) return 'M';
  return null;
};

const inferPoolLength = (eventText) => {
  const t = (eventText || '').toLowerCase();
  if (t.includes('(pool)')) return 50; // ILS zeigt üblicherweise 50m
  if (t.includes('(open)')) return null; // open water
  return 50; // Default 50m, wenn nichts angegeben
};

const timingFromContext = (eventText) => {
  // ILS nennt das Timing nicht explizit – wir setzen "ET" (elektronisch) als Platzhalter
  return 'ET';
};

export default async function handler(req, res) {
  try {
    // sehr einfacher Token-Schutz ?token=...
    if (req.query.token !== TOKEN) {
      return res.status(401).json({ ok: false, error: 'invalid token' });
    }

    // Seite laden
    const { data: html } = await axios.get(ILS_RECORDS_URL, { timeout: 30000 });
    const $ = cheerio.load(html);

    // Die Seite besteht aus H2-Abschnitten (z. B. "Open - Women") mit darunter jeweils einer Tabelle
    const sections = [];
    $('h2').each((_, h) => {
      const header = $(h).text().trim();
      const table = $(h).next('table'); // direkt folgende Tabelle
      if (table && table.find('tbody tr').length > 0) {
        sections.push({ header, table });
      }
    });

    let parsedRows = 0;
    const rows = [];
    const samplePayloads = [];

    for (const sec of sections) {
      const gender = toGender(sec.header);

      sec.table.find('tbody tr').each((_, tr) => {
        const tds = $(tr).find('td');
        if (tds.length < 5) return;

        // ILS Struktur (Stand heute):
        // 0=Event, 1=Competitor (mit Nation/Club verlinkt), 2=Date/Place, 3=Time
        const eventText = norm($(tds[0]).text());
        const competitor = norm($(tds[1]).text());
        const datePlace = norm($(tds[2]).text());
        const timeText = norm($(tds[3]).text());

        // Zerlegen competitor "Vorname NACHNAME\nGerman National Team (GER)" etc.
        let athlete_name = null, nation = null, club = null;
        if (competitor) {
          const lines = competitor.split('\n').map((x) => x.trim()).filter(Boolean);
          athlete_name = lines[0] || null;
          if (lines[1]) {
            const mNat = lines[1].match(/\(([A-Z]{3})\)/);
            nation = mNat ? mNat[1] : null;
            club = lines[1].replace(/\([A-Z]{3}\)/, '').trim() || null;
          }
        }

        // Zerlegen datePlace "CityName\nDD-MM-YYYY" oder "CityName DD-MM-YYYY"
        let record_date = null, city = null, country = null, meet_name = null;
        if (datePlace) {
          const segs = datePlace.split('\n').map((x) => x.trim()).filter(Boolean);
          // Datum steht meistens in der 2. Zeile
          // Versuche ISO zu bauen
          const maybeDate = segs.find((s) => /\d{2}-\d{2}-\d{4}/.test(s));
          if (maybeDate) {
            const [d, m, y] = maybeDate.split('-');
            record_date = `${y}-${m}-${d}`;
          }
          // Stadt ist meistens die 1. Zeile
          city = segs[0] || null;
        }

        const discipline_code = toDisciplineCode(eventText);
        const pool_length = inferPoolLength(eventText);
        const timing = timingFromContext(eventText);
        const time_ms = parseTimeToMs(timeText);

        if (!discipline_code || !gender || !time_ms) return;

        const payload = {
          discipline_code,
          gender,
          pool_length,
          timing,
          time_ms,
          athlete_name,
          nation,
          club,
          meet_name,
          record_date,
          city,
          country,
          source_url: ILS_RECORDS_URL,
          record_scope: 'world',
          updated_at: new Date().toISOString()
        };

        rows.push(payload);
        parsedRows++;
        if (samplePayloads.length < 5) samplePayloads.push(payload);
      });
    }

    let upserts = 0;
    if (rows.length) {
      const { data, error } = await supabase
        .from('records')
        .upsert(rows, {
          onConflict: 'discipline_code,gender,pool_length,timing',
          ignoreDuplicates: false
        })
        .select('discipline_code'); // damit data.length kommt

      if (error) {
        return res.status(500).json({ ok: false, error: error.message, parsedRows, samplePayloads });
      }
      upserts = (data || []).length;
    }

    return res.status(200).json({
      ok: true,
      tablesFound: sections.length,
      parsedRows,
      upserts,
      skipped: { noTime: rows.filter(r => !r.time_ms).length, noDiscipline: 0 },
      samplePayloads
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
