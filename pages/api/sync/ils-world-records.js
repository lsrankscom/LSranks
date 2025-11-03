import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

/* ===== Helpers ===== */
function parseTimeToMs(input) {
  if (!input) return null;
  const s = String(input).trim().replace(",", ".");
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
function normalizeGender(g) {
  const s = String(g || "").trim().toUpperCase();
  if (/^(M|MALE|MEN|MÄNNER)/.test(s)) return "M";
  if (/^(F|W|FEMALE|WOMEN|FRAUEN)/.test(s)) return "F";
  return "X";
}
function detectPoolLength(...vals) {
  const t = vals.filter(Boolean).map(String).join(" ").toLowerCase();
  if (/25m|25 m|scm|short ?course/.test(t)) return 25;
  if (/50m|50 m|lcm|long ?course/.test(t)) return 50;
  return 50;
}
function detectTiming(v) {
  const s = String(v || "").toUpperCase();
  if (/HAND|MANUAL|HT/.test(s)) return "HT";
  return "ET";
}
function pickBySynonyms(obj, syns) {
  const keys = Object.keys(obj);
  for (const syn of syns) {
    const key = keys.find(k => k.toLowerCase().includes(syn));
    if (key && obj[key] != null && String(obj[key]).trim() !== "") return obj[key];
  }
  return null;
}
function mapDiscipline(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  if (/^[A-Z0-9_]+$/.test(raw)) return raw;

  const dist = (s.match(/\b(50|100|200)\b/) || [])[1];
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
  if (has("line throw") || has("leinenwurf") || has("linethrow")) return "LINE_THROW";
  if (has("rescue tube") && (has("relay") || has("staffel"))) return "R4x50_TUBE";
  if (has("medley") && (has("relay") || has("staffel"))) return "R4x50_MEDLEY";
  if (has("manikin") && (has("relay") || has("staffel"))) return "R4x25_MAN";

  return raw.toUpperCase().replaceAll(" ", "_");
}

/* ===== API Handler ===== */
export default async function handler(req, res) {
  try {
    const token = req.query.token || req.headers["x-admin-token"];
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const urls = (process.env.ILS_WR_URLS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    if (!urls.length) return res.status(400).json({ error: "Missing ILS_WR_URLS" });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let tablesFound = 0, parsedRows = 0, upserts = 0;
    const skipped = { noTime: 0, noDiscipline: 0 };
    const samples = [];

    for (const url of urls) {
      const r = await fetch(url, { headers: { "user-agent": "LSRanksBot/1.0 (+https://lsranks.com)" } });
      if (!r.ok) continue;
      const html = await r.text();
      const $ = cheerio.load(html);

      $("table").each((_, table) => {
        tablesFound++;

        // Header bestimmen
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

          const eventRaw  = pickBySynonyms(row, ["event", "discipline", "bewerb", "strecke", "race", "category"]) || row["event"];
          const timeRaw   = pickBySynonyms(row, ["time", "result", "performance", "record"]) || row["time"];
          const nameRaw   = pickBySynonyms(row, ["competitor", "athlete", "name", "swimmer"]) || row["competitor"];
          const nationRaw = pickBySynonyms(row, ["nation", "country", "nat"]) || null;
          const clubRaw   = pickBySynonyms(row, ["club", "team"]) || null;
          const meetRaw   = pickBySynonyms(row, ["meet", "competition", "event name", "venue", "city"]) || null;
          const dateRaw   = pickBySynonyms(row, ["date"]) || null;
          const courseRaw = pickBySynonyms(row, ["pool", "length", "course", "category"]) || null;

          const discipline_code = mapDiscipline(eventRaw);
          const time_ms = parseTimeToMs(timeRaw);
          const pool_length = detectPoolLength(courseRaw, eventRaw);
          const timing = detectTiming(null);
          // Geschlecht aus Überschrift ableiten (Open - Women/Men), falls nicht in Spalten
          let gender = "X";
          const tableHeadText = $(table).prevAll("h2,h3,h4").first().text().toLowerCase();
          if (/women|female|frauen/.test(tableHeadText)) gender = "F";
          if (/men|male|männer/.test(tableHeadText)) gender = "M";

          if (!time_ms) { skipped.noTime++; return; }
          if (!discipline_code) { skipped.noDiscipline++; return; }

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

          supabase
            .from("records")
            .upsert(
              payload,
              { onConflict: "discipline_code,gender,pool_length,timing", ignoreDuplicates: false }
            )
            .then(({ error }) => { if (!error) upserts++; });
        });
      });
    }

    await new Promise(r => setTimeout(r, 500));

    return res.status(200).json({
      ok: true, tablesFound, parsedRows, upserts, skipped, samplePayloads: samples
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
