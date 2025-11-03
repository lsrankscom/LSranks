// pages/api/sync-ils-world-records.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const TOKEN = process.env.ADMIN_TOKEN || 'LSRANKS_SECRET_2025';
const ILS_RECORDS_URL = process.env.ILS_WR_URLS || 'https://sport.ilsf.org/records';

// Supabase-Client mit SERVICE ROLE (muss gesetzt sein!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '', // wichtig
  { auth: { persistSession: false } }
);

const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

// ===== Helpers =====
const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');

const parseTimeToMs = (txt) => {
  if (!txt) return null;
  let s = String(txt).trim();
  s = s.replace(',', '.');                 // Komma → Punkt
  s = s.replace(/[^0-9:\.]/g, '');         // nur Ziffern, :, .
  const parts = s.split(':');
  let total = 0;
  if (parts.length === 1) {
    const sec = parseFloat(parts[0] || '0');
    total = Math.round(sec * 1000);
  } else if (parts.length === 2) {
    const mm = parseInt(parts[0] || '0', 10);
    const ss = parseFloat(parts[1] || '0');
    total = mm * 60 * 1000 + Math.round(ss * 1000);
  } else {
    const last = parseFloat(parts.pop() || '0');
    const mm = parseInt(parts.pop() || '0', 10);
    total = mm * 60 * 1000 + Math.round(last * 1000);
  }
  return Number.isFinite(total) ? total : null;
};

const toGender = (headerText) => {
  const t = (headerText || '').toLowerCase();
  if (t.includes('women')) return 'W';
  if (t.includes('men')) return 'M';
  return null;
};

const toDisciplineCode = (eventText) => {
  const T = (eventText || '').toUpperCase();
  const m = T.match(/-\s*([0-9A-Z\s()\/]+?)\s*-\s*/);
  const core = m ? m[1] : T;
  return core.replace(/[()]/g, '').replace(/\s+/g, '_').replace(/__+/g, '_').trim();
};

const inferPoolLength = (eventText) => {
  const t = (eventText || '').toLowerCase();
  if (t.includes('(pool)')) return 50;
  if (t.includes('(open)')) return null;
  return 50;
};

const timingFromContext = () => 'ET';

// ===== Handler =====
export default async function handler(req, res) {
  try {
    if (req.query.token !== TOKEN) {
      return res.status(401).json({ ok: false, error: 'invalid token' });
    }

    // Seite holen
    const { data: html } = await axios.get(ILS_RECORDS_URL, { timeout: 30000 });
    const $ = cheerio.load(html);

    // H2 → Tabelle
    const sections = [];
    $('h2').each((_, h) => {
      const header = $(h).text().trim();
      const table = $(h).next('table');
      if (table && table.find('tbody tr').length > 0) {
        sections.push({ header, table });
      }
    });

    const rows = [];
    const samplePayloads = [];
    let parsedRows = 0;

    for (const sec of sections) {
      const gender = toGender(sec.header);

      sec.table.find('tbody tr').each((_, tr) => {
        const tds = $(tr).find('td');
        if (tds.length < 4) return;

        const eventText = norm($(tds[0]).text());
        const competitor = norm($(tds[1]).text());
        const datePlace = norm($(tds[2]).text());
        const timeText = norm($(tds[3]).text());

        // competitor: "Name\nTeam (GER)" etc.
        let athlete_name = null, nation = null, club = null;
        if (competitor) {
          const lines = competitor.split('\n').map(x => x.trim()).filter(Boolean);
          athlete_name = lines[0] || null;
          if (lines[1]) {
            const mNat = lines[1].match(/\(([A-Z]{3})\)/);
            nation = mNat ? mNat[1] : null;
            club = lines[1].replace(/\([A-Z]{3}\)/, '').trim() || null;
          }
        }

        // datePlace: "City\nDD-MM-YYYY"
        let record_date = null, city = null;
        if (datePlace) {
          const segs = datePlace.split('\n').map(x => x.trim()).filter(Boolean);
          const maybeDate = segs.find(s => /\d{2}-\d{2}-\d{4}/.test(s));
          if (maybeDate) {
            const [d, m, y] = maybeDate.split('-');
            record_date = `${y}-${m}-${d}`;
          }
          city = segs[0] || null;
        }

        const discipline_code = toDisciplineCode(eventText);
        const pool_length = inferPoolLength(eventText);
        const timing = timingFromContext();
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
          meet_name: null,
          record_date,
          city,
          country: null,
          source_url: ILS_RECORDS_URL,
          record_scope: 'world',
          updated_at: new Date().toISOString(),
        };

        rows.push(payload);
        parsedRows++;
        if (samplePayloads.length < 5) samplePayloads.push(payload);
      });
    }

    // Upsert in Batches (falls später mehr Daten)
    let upserts = 0;
    let upsertError = null;

    if (rows.length) {
      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('records')
          .upsert(chunk, {
            onConflict: 'discipline_code,gender,pool_length,timing',
            ignoreDuplicates: false,
          })
          .select('discipline_code');

        if (error) {
          upsertError = error.message || String(error);
          break;
        }
        upserts += (data || []).length;
      }
    }

    return res.status(200).json({
      ok: true,
      hasServiceKey,
      tablesFound: sections.length,
      parsedRows,
      upserts,
      debug: req.query.debug ? { samplePayloads: samplePayloads.slice(0, 3) } : undefined,
      upsertError
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
