import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

/**
 * Vollständiger Sync-Endpoint für ILSF World Records.
 * - Parsed https://sport.ilsf.org/records (oder ILS_WR_URLS aus ENV)
 * - Upsertet in public.records
 * - ON CONFLICT exakt passend zu UNIQUE INDEX records_upsert_unique(record_scope, discipline_code, gender, pool_length, timing)
 *
 * ENV vorausgesetzt:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ILS_WR_URLS (optional, kommasepariert; Standard: https://sport.ilsf.org/records)
 *   ADMIN_TOKEN (ein simpler Token für den Endpoint-Aufruf)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ILS_WR_URLS = (process.env.ILS_WR_URLS || "https://sport.ilsf.org/records")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Hilfsfunktionen
const pad = (n) => n.toString().padStart(2, "0");

/** "1:02.78" -> 62780 ms, "2:01" -> 121000 ms, "0:49" -> 49000 ms */
function timeToMs(s) {
  if (!s) return null;
  const str = String(s).trim();

  // Formate wie "1:02.78", "1:03", "0:49", "2:01", "1:03:12" (hh:mm:ss.xx – theoretisch)
  const parts = str.split(":").map(p => p.trim());
  if (parts.length === 1) {
    // "49.12" oder "49"
    const sec = parseFloat(parts[0].replace(",", "."));
    if (Number.isFinite(sec)) return Math.round(sec * 1000);
    return null;
  }
  // mm:ss(.xx) oder hh:mm:ss(.xx)
  let h = 0, m = 0, ssec = 0;
  if (parts.length === 2) {
    [m, ssec] = parts;
  } else if (parts.length === 3) {
    [h, m, ssec] = parts;
  } else {
    return null;
  }
  const secFloat = parseFloat(String(ssec).replace(",", "."));
  if (!Number.isFinite(secFloat)) return null;
  const totalMs = (Number(h) * 3600 + Number(m) * 60 + secFloat) * 1000;
  return Math.round(totalMs);
}

/** "Kaohsiung23-07-2009" -> Date(2009-07-23) (fallback: null) */
function parseIlsfDate(s) {
  if (!s) return null;
  // viele Einträge sind "CityDD-MM-YYYY" oder "CityDD-MM-YYYY"
  const m = s.match(/(\d{2})[-.](\d{2})[-.](\d{4})/);
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

/** einfache Disziplin-Code-Normierung, z.B. "Open - 100m Rescue Medley - Women" -> "OPEN__100M_RESCUE_MEDLEY" */
function toDisciplineCode(eventTitle) {
  if (!eventTitle) return null;
  return eventTitle
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[\(\)]/g, "")
    .replace(/-_/g, "_")
    .replace(/_{2,}/g, "_")
    .trim();
}

/** Gender aus Titel ableiten */
function inferGender(eventTitle) {
  const t = (eventTitle || "").toLowerCase();
  if (t.includes("women")) return "W";
  if (t.includes("men")) return "M";
  // Mixed Staffeln -> wir speichern "X"
  if (t.includes("mixed")) return "X";
  return null;
}

/** Poollänge: ILSF-WR sind praktisch immer 50 m */
function inferPoolLength(eventTitle) {
  // Falls später 25 m Rekorde auftauchen, hier anpassen/erkennen
  return 50;
}

/** Timing: elektronisch (ET) – die ILSF-Seite zeigt keine Handszeit, daher default ET */
function inferTiming() {
  return "ET";
}

/** Cheerio-Parser: zieht aus der WR-Seite Zeilen zusammen */
async function parseIlsfPage(url) {
  const out = [];
  const html = (await axios.get(url, { timeout: 30000 })).data;
  const $ = cheerio.load(html);

  // Die Seite hat Abschnitte mit Tabellen (Event/Competitor/Date/Time/Location)
  // Wir lesen zeilenweise.
  $("table").each((_, tbl) => {
    $(tbl).find("tbody tr").each((__, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 5) return;

      const eventTitle = $(tds[0]).text().trim();   // "Open - 100m Rescue Medley - Women"
      const competitor = $(tds[1]).text().trim();   // "Name\nNation/Team"
      const dateStrRaw = $(tds[2]).text().trim();   // enthält Datum (oft auf 2 Zeilen)
      const timeStr = $(tds[3]).text().trim();      // "1:02.78"
      const location = $(tds[4]).text().trim();     // Ort/City, teils mit Datum-Anteil

      // Disziplin & Gender
      const discipline_code = toDisciplineCode(eventTitle);
      const gender = inferGender(eventTitle);
      if (!discipline_code || !gender) return;

      // Zeiten
      const time_ms = timeToMs(timeStr);
      if (time_ms == null) return;

      // Datum
      const record_date = parseIlsfDate(dateStrRaw) || null;

      // weitere Felder
      const athlete_name = competitor.split("\n")[0].trim() || null;
      const nation = null; // ILSF listet Team/Club – wir lassen nation/club leer
      const club = null;
      const meet_name = null;
      const city = location ? location.split("\n")[0].trim() : null;
      const country = null;

      const row = {
        discipline_code,
        gender,
        pool_length: inferPoolLength(eventTitle),
        timing: inferTiming(),
        time_ms,
        athlete_name,
        nation,
        club,
        meet_name,
        record_date,      // DATE oder null
        city,
        country,
        record_scope: "world",
        source_url: url,
        updated_at: new Date().toISOString()
      };
      out.push(row);
    });
  });

  return out;
}

export default async function handler(req, res) {
  try {
    // einfacher Token-Check
    if (!ADMIN_TOKEN || req.query.token !== ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    // Seiten parsen
    const debug = req.query.debug ? 1 : 0;
    let rows = [];
    for (const url of ILS_WR_URLS) {
      const part = await parseIlsfPage(url);
      rows = rows.concat(part);
    }

    // Minimal validieren/normalisieren
    rows = rows.filter(r =>
      r.discipline_code && r.gender && Number.isInteger(r.pool_length) &&
      r.timing && Number.isInteger(r.time_ms)
    );

    // === WICHTIG: Upsert exakt mit deinem UNIQUE-Index ===
    const { error: upsertError } = await sb
      .from("records")
      .upsert(rows, {
        ignoreDuplicates: false,
        returning: "minimal",
        onConflict: "record_scope,discipline_code,gender,pool_length,timing"
      });

    if (upsertError) {
      return res.status(500).json({
        ok: true,
        tablesFound: ILS_WR_URLS.length,
        parsedRows: rows.length,
        upserts: 0,
        debug: rows.slice(0, 3),
        upsertError: upsertError.message
      });
    }

    return res.status(200).json({
      ok: true,
      tablesFound: ILS_WR_URLS.length,
      parsedRows: rows.length,
      upserts: rows.length,
      debug: debug ? rows.slice(0, 3) : []
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
