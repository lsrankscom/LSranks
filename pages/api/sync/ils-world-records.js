import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

/* =======================
   Helfer
======================= */

// Zeit "M:SS.hh" / "SS.hh" / Komma statt Punkt -> ms
function parseTimeToMs(input) {
  if (!input) return null;
  const s = String(input).trim().replace(",", ".");
  if (!s) return null;

  // 0:xx.xx oder xx.xx
  let mm = 0, ss = 0, hund = 0;
  if (s.includes(":")) {
    const [m, rest] = s.split(":");
    mm = parseInt(m, 10) || 0;
    const [sec, frac = "0"] = rest.split(".");
    ss = parseInt(sec, 10) || 0;
    hund = parseInt(frac.padEnd(2, "0").slice(0, 2), 10) || 0;
  } else {
    const [sec, frac = "0"] = s.split(".");
    ss = parseInt(sec, 10) || 0;
    hund = parseInt(frac.padEnd(2, "0").slice(0, 2), 10) || 0;
  }
  if (!Number.isFinite(ss) || !Number.isFinite(hund)) return null;
  return ((mm * 60) + ss) * 1000 + hund * 10;
}

// Geschlecht normalisieren
function normalizeGender(g) {
  const s = String(g || "").trim().toUpperCase();
  if (/^(M|MALE|MEN|MÄNNER)/.test(s)) return "M";
  if (/^(F|W|FEMALE|WOMEN|FRAUEN)/.test(s)) return "F";
  return "X";
}

// Poollänge aus Spaltenwerten oder Diszipintext ableiten
function detectPoolLength(...vals) {
  const joined = vals.filter(Boolean).map(v => String(v)).join(" ").toLowerCase();
  if (/25m|25 m|scm|short ?course/.test(joined)) return 25;
  if (/50m|50 m|lcm|long ?course/.test(joined)) return 50;
  return 50; // konservativer Default
}

// Timing aus Text ableiten
function detectTiming(v) {
  const s = String(v || "").toUpperCase();
  if (/HAND|MANUAL|HT/.test(s)) return "HT";
  return "ET";
}

// Disziplin-Fuzzy-Mapping
function mapDiscipline(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();

  // harte Codes
  if (/^[A-Z0-9_]+$/.test(raw)) return raw;

  // Distanz erkennen
  const dist = (s.match(/\b(50|100|200)\b/) || [])[1];

  // Schlüsselwörter
  const has = (kw) => s.includes(kw);

  if (has("obstacle") || has("hindernis")) {
    if (dist === "200") return "200_OBS";
    if (has("relay") || has("staffel")) return "R4x50_OBS";
  }
  if (has("manikin") && has("carry") && has("fins")) {
    if (dist === "100") return "100_MAN_FINS";
  }
  if (has("manikin") && has("carry") && !has("fins")) {
    if (dist === "50") return "50_MAN";
  }
  if (has("rescue") && has("medley")) {
    if (dist === "100") return "100_MEDLEY";
  }
  if (has("tow") && has("fins")) {
    if (dist === "100") return "100_TOW_FINS";
  }
  if (has("super") && has("lifesaver")) {
    if (dist === "200") return "200_SUPER";
  }
  if (has("line throw") || has("leinenwurf") || has("linethrow")) {
    return "LINE_THROW";
  }
  if (has("rescue tube") && (has("relay") || has("staffel"))) {
    return "R4x50_TUBE";
  }
  if ((has("medley") && (has("relay") || has("staffel")))) {
    return "R4x50_MEDLEY";
  }
  if (has("manikin") && (has("relay") || has("staffel"))) {
    return "R4x25_MAN";
  }

  // Fallback: grob in Code verwandeln
  return raw.toUpperCase().replaceAll(" ", "_");
}

// Synonym-Leser für Tabellenobjekte
function pickBySynonyms(obj, synonyms) {
  const keys = Object.keys(obj);
  for (const syn of synonyms) {
    const key = keys.find(k => k.toLowerCase().includes(syn));
    if (key && obj[key] != null && String(obj[key]).trim() !== "") return obj[key];
  }
  return null;
}

/* =======================
   API Handler
======================= */
export default async function handler(req, res) {
  try {
    // Basic Auth
    const token = req.query.token || req.headers["x-admin-token"];
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const urlsRaw = process.env.ILS_WR_URLS || "";
    const urls = urlsRaw.split(",").map(s => s.trim()).filter(Boolean);
    if (!urls.length) {
      return res.status(400).json({ error: "Missing ILS_WR_URLS env" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let tablesFound = 0;
    let parsedRows = 0;
    let upserts = 0;

    // Debug-Zähler
    const skipped = { noTime: 0, noDiscipline: 0, noGender: 0 };
    const samples = []; // erste Payloads zur Ansicht

    for (const url of urls) {
      const resp = await fetch(url, { headers: { "user-agent": "LSRanksBot/1.0 (+https://lsranks.com)" } });
      if (!resp.ok) continue;
      const html = await resp.text();
      const $ = cheerio.load(html);

      $("table").each((_, table) => {
        tablesFound++;

        // Header einlesen
        const headers = [];
        $(table).find("thead tr th, tr:first-child th, tr:first-child td").each((_, h) => {
          headers.push($(h).text().trim().toLowerCase());
        });
        if (!headers.length) return;

        // Zeilen
        $(table).find("tbody tr, tr").each((ri, tr) => {
          if (ri === 0 && $(tr).find("th").length) return;
          const row = {};
          $(tr).find("td").each((ci, td) => {
            const head = headers[ci] || `col${ci}`;
            row[head] = $(td).text().replace(/\s+/g, " ").trim();
          });
          if (!Object.keys(row).length) return;
          parsedRows++;

          // Spaltenzuordnung: möglichst breit
          const eventRaw   = pickBySynonyms(row, ["event", "discipline", "bewerb", "strecke", "race"]);
          const genderRaw  = pickBySynonyms(row, ["gender", "sex", "men", "women", "männer", "frauen"]);
          const timeRaw    = pickBySynonyms(row, ["time", "result", "performance", "record"]);
          const nameRaw    = pickBySynonyms(row, ["athlete", "name", "swimmer"]);
          const nationRaw  = pickBySynonyms(row, ["nation", "country", "nat"]);
          const clubRaw    = pickBySynonyms(row, ["club", "team"]);
          const meetRaw    = pickBySynonyms(row, ["meet", "competition", "event name", "venue"]);
          const dateRaw    = pickBySynonyms(row, ["date"]);
          const courseRaw  = pickBySynonyms(row, ["pool", "length", "course", "category"]);
          const timingRaw  = pickBySynonyms(row, ["timing"]);

          const discipline_code = mapDiscipline(eventRaw);
          const gender = normalizeGender(genderRaw);
          const time_ms = parseTimeToMs(timeRaw);
          const pool_length = detectPoolLength(courseRaw, eventRaw);
          const timing = detectTiming(timingRaw);

          if (!time_ms) { skipped.noTime++; return; }
          if (!discipline_code) { skipped.noDiscipline++; return; }
          if (!gender) { skipped.noGender++; return; }

          const payload = {
            discipline_code,
            gender,
            time_ms,
            athlete_name: nameRaw || null,
            nation: nationRaw || null,
            club: clubRaw || null,
            meet_name: meetRaw || null,
            record_date: dateRaw || null,
            pool_length,
            timing,
            record_scope: "world",
            source_url: url,
            updated_at: new Date().toISOString()
          };

          if (samples.length < 10) samples.push(payload);

          // Upsert (erfordert in Supabase den Unique-Index mit where record_scope='world')
          supabase
            .from("records")
            .upsert(payload, { onConflict: "discipline_code,gender,pool_length,timing", ignoreDuplicates: false })
            .then(({ error }) => {
              if (!error) upserts++;
              // Wenn Fehler auftreten, kannst du hier console.error aktivieren:
              // else console.error(error);
            });
        });
      });
    }

    // kurze Wartezeit für ausstehende Inserts
    await new Promise(r => setTimeout(r, 500));

    return res.status(200).json({
      ok: true,
      tablesFound,
      parsedRows,
      upserts,
      skipped,
      samplePayloads: samples
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
