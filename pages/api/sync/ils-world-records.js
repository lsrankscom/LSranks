import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { parseTimeToMs, normalizeDiscipline, normalizeGender, toIntOrNull } from "../../../lib/normalize";

const REQUIRED = ["discipline","gender","time"]; // Minimalspalten

// Hilfsfunktion: schluckt unterschiedlich benannte Spalten
function pickBySynonyms(obj, synonyms) {
  for (const name of synonyms) {
    const key = Object.keys(obj).find(k => k.toLowerCase().includes(name));
    if (key && obj[key] != null && String(obj[key]).trim() !== "") return obj[key];
  }
  return null;
}

export default async function handler(req, res) {
  try {
    // Simple-Auth (gegen Fremdzugriffe)
    const token = req.query.token || req.headers["x-admin-token"];
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const urlsRaw = process.env.ILS_WR_URLS || process.env.ILS_WR_URL || "";
    const urls = urlsRaw.split(",").map(s => s.trim()).filter(Boolean);
    if (!urls.length) {
      return res.status(500).json({ error: "Missing ILS_WR_URLS env (comma-separated URLs to the official ILS WR pages)" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let upserts = 0, skipped = 0, errors = 0;

    // Alle angegebenen Seiten abklappern
    for (const url of urls) {
      const resp = await fetch(url, { headers: { "user-agent": "LSRanksBot/1.0" } });
      if (!resp.ok) { errors++; continue; }
      const html = await resp.text();
      const $ = cheerio.load(html);

      // Alle Tabellen durchgehen
      $("table").each((_, table) => {
        const rows = [];
        const headers = [];
        $(table).find("thead tr th, tr:first-child th, tr:first-child td").each((i, h) => {
          headers.push($(h).text().trim().toLowerCase());
        });

        // Wenn keine Header erkannt, überspringen
        if (!headers.length) return;

        // Body-Zeilen parsen
        $(table).find("tbody tr, tr").each((ri, tr) => {
          if (ri === 0 && $(tr).find("th").length) return; // Headerzeile überspringen

          const cells = {};
          $(tr).find("td").each((ci, td) => {
            const head = headers[ci] || `col${ci}`;
            cells[head] = $(td).text().replace(/\s+/g, " ").trim();
          });
          if (Object.keys(cells).length) rows.push(cells);
        });

        // Zeilen normalisieren & upserten
        for (const raw of rows) {
          // Spalten heuristisch lesen
          const disciplineRaw = pickBySynonyms(raw, ["discipline", "event", "bewerb", "strecke"]) || raw["discipline"];
          const genderRaw     = pickBySynonyms(raw, ["gender", "sex", "men", "women"]) || raw["gender"];
          const timeRaw       = pickBySynonyms(raw, ["time", "result"]) || raw["time"];
          const athlete       = pickBySynonyms(raw, ["athlete", "name", "swimmer"]);
          const nation        = pickBySynonyms(raw, ["nation", "country", "nat"]);
          const club          = pickBySynonyms(raw, ["club", "team"]);
          const meet          = pickBySynonyms(raw, ["meet", "competition", "event name", "venue"]);
          const date          = pickBySynonyms(raw, ["date"]);
          const timingRaw     = pickBySynonyms(raw, ["timing"]) || "ET";
          const poolRaw       = pickBySynonyms(raw, ["pool", "length", "course"]); // 25/50

          const discipline_code = normalizeDiscipline(disciplineRaw) || (disciplineRaw || "").toUpperCase().replaceAll(" ", "_");
          const gender = normalizeGender(genderRaw);
          const time_ms = parseTimeToMs(timeRaw);
          const pool_length = toIntOrNull((poolRaw || "").replace(/\D+/g, "")) || 50;
          const timing = String(timingRaw || "ET").toUpperCase().includes("H") ? "HT" : "ET";

          if (!discipline_code || !time_ms) { skipped++; continue; }

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

          // Upsert nach deinem Unique-Index (keine Duplikate)
          supabase
            .from("records")
            .upsert(payload, { onConflict: "discipline_code,gender,pool_length,timing", ignoreDuplicates: false })
            .then(({ error }) => {
              if (error) { errors++; } else { upserts++; }
            })
            .catch(() => { errors++; });
        }
      });
    }

    // bisschen warten, bis alle Promises resolved sind
    await new Promise(r => setTimeout(r, 400));

    return res.status(200).json({ ok: true, upserts, skipped, errors });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
