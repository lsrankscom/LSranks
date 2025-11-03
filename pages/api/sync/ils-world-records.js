import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

/**
 * Hilfsfunktionen
 */
function parseTimeToMs(s) {
  if (!s) return null;
  const str = String(s).trim().replace(",", ".");
  let m = 0, sec = 0, hund = 0;
  if (str.includes(":")) {
    const [mm, rest] = str.split(":");
    m = parseInt(mm, 10) || 0;
    const [ss, frac = "0"] = rest.split(".");
    sec = parseInt(ss, 10) || 0;
    hund = parseInt(frac.padEnd(2, "0").slice(0, 2), 10) || 0;
  } else {
    const [ss, frac = "0"] = str.split(".");
    sec = parseInt(ss, 10) || 0;
    hund = parseInt(frac.padEnd(2, "0").slice(0, 2), 10) || 0;
  }
  return ((m * 60) + sec) * 1000 + hund * 10;
}

function normalizeGender(g) {
  const s = String(g || "").trim().toUpperCase();
  if (s.startsWith("M")) return "M";
  if (s.startsWith("F") || s.startsWith("W")) return "F";
  return "X";
}

// Disziplin-Namen -> Codes (erweiterbar)
const DISC_ALIAS = {
  "200m obstacle swim": "200_OBS",
  "200 m obstacle swim": "200_OBS",
  "200m hindernisschwimmen": "200_OBS",
  "50m manikin carry": "50_MAN",
  "50 m manikin carry": "50_MAN",
  "100m manikin carry with fins": "100_MAN_FINS",
  "100 m manikin carry with fins": "100_MAN_FINS",
  "100m rescue medley": "100_MEDLEY",
  "100 m rescue medley": "100_MEDLEY",
  "100m manikin tow with fins": "100_TOW_FINS",
  "100 m manikin tow with fins": "100_TOW_FINS",
  "200m super lifesaver": "200_SUPER",
  "200 m super lifesaver": "200_SUPER",
  "4x50m obstacle relay": "R4x50_OBS",
  "4×50 m obstacle relay": "R4x50_OBS",
  "4x25m manikin relay": "R4x25_MAN",
  "4x50m medley relay": "R4x50_MEDLEY",
  "4x50m rescue tube relay": "R4x50_TUBE",
  "line throw": "LINE_THROW",
};

function normalizeDiscipline(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^[A-Z0-9_]+$/.test(s)) return s; // bereits Code
  const key = s.toLowerCase().replace(/\s+/g, " ");
  return DISC_ALIAS[key] || s.toUpperCase().replaceAll(" ", "_");
}

function toIntOrNull(v) {
  const n = parseInt(String(v).replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function pickBySynonyms(obj, synonyms) {
  for (const name of synonyms) {
    const key = Object.keys(obj).find(k => k.toLowerCase().includes(name));
    if (key && obj[key] != null && String(obj[key]).trim() !== "") return obj[key];
  }
  return null;
}

/**
 * Handler
 */
export default async function handler(req, res) {
  try {
    // Auth
    const token = req.query.token || req.headers["x-admin-token"];
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Quellen
    const urlsRaw = process.env.ILS_WR_URLS || "";
    const urls = urlsRaw.split(",").map(s => s.trim()).filter(Boolean);
    if (!urls.length) {
      return res.status(500).json({ error: "Missing env ILS_WR_URLS" });
    }

    // Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let debug = [];
    let upserts = 0, parsedRows = 0, tablesFound = 0;

    for (const url of urls) {
      const r = await fetch(url, { headers: { "user-agent": "LSRanksBot/1.0 (+https://lsranks.com)" } });
      if (!r.ok) {
        debug.push({ url, status: r.status });
        continue;
      }
      const html = await r.text();
      const $ = cheerio.load(html);

      // Finde Tabellen
      const tables = $("table");
      tablesFound += tables.length;
      if (!tables.length) {
        // Debug: evtl. ist die Seite JS-rendered
        const bodyText = $("body").text().trim().slice(0, 200);
        debug.push({ url, note: "no-table-found", sample: bodyText });
      }

      tables.each((_, table) => {
        const headers = [];
        $(table).find("thead tr th, tr:first-child th, tr:first-child td").each((i, h) => {
          headers.push($(h).text().trim().toLowerCase());
        });
        if (!headers.length) return;

        $(table).find("tbody tr, tr").each((ri, tr) => {
          if (ri === 0 && $(tr).find("th").length) return; // Header
          const row = {};
          $(tr).find("td").each((ci, td) => {
            const head = headers[ci] || `col${ci}`;
            row[head] = $(td).text().replace(/\s+/g, " ").trim();
          });
          if (Object.keys(row).length) {
            parsedRows++;

            // Heuristische Spaltenzuordnung
            const disciplineRaw = pickBySynonyms(row, ["discipline", "event", "bewerb", "strecke"]) || row["discipline"];
            const genderRaw     = pickBySynonyms(row, ["gender", "sex", "men", "women"]) || row["gender"];
            const timeRaw       = pickBySynonyms(row, ["time", "result"]) || row["time"];
            const athlete       = pickBySynonyms(row, ["athlete", "name", "swimmer"]) || row["name"];
            const nation        = pickBySynonyms(row, ["nation", "country", "nat"]) || row["nation"];
            const club          = pickBySynonyms(row, ["club", "team"]) || null;
            const meet          = pickBySynonyms(row, ["meet", "competition", "event name", "venue"]) || null;
            const date          = pickBySynonyms(row, ["date"]) || null;
            const timingRaw     = pickBySynonyms(row, ["timing"]) || "ET";
            const poolRaw       = pickBySynonyms(row, ["pool", "length", "course"]) || null;

            const discipline_code = normalizeDiscipline(disciplineRaw);
            const gender = normalizeGender(genderRaw);
            const time_ms = parseTimeToMs(timeRaw);
            const pool_length = toIntOrNull(poolRaw) || 50;
            const timing = String(timingRaw || "ET").toUpperCase().includes("H") ? "HT" : "ET";

            if (!discipline_code || !time_ms) return;

            const payload = {
              discipline_code,
              gender,
              time_ms,
              athlete_name: athlete || null,
              nation: nation || null,
              club: club || null,
              meet_name: meet || null,
              record_date: date || null,
              pool_length,
              timing,
              record_scope: "world",
              source_url: url,
              updated_at: new Date().toISOString()
            };

            // Upsert -> keine Duplikate (einzigartig je Disziplin/Gender/Pool/Timing)
            // Achtung: dafür muss in Supabase der Unique-Index existieren.
            // create unique index if not exists uniq_world_record
            // on public.records (discipline_code, gender, pool_length, timing)
            // where record_scope = 'world';
            supabase
              .from("records")
              .upsert(payload, { onConflict: "discipline_code,gender,pool_length,timing", ignoreDuplicates: false })
              .then(({ error }) => {
                if (!error) upserts++;
              });
          }
        });
      });
    }

    // kurze Wartezeit für ausstehende Upserts
    await new Promise(r => setTimeout(r, 400));

    return res.status(200).json({
      ok: true,
      tablesFound,
      parsedRows,
      upserts,
      debug
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
