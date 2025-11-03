import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const token = req.query.token;
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const urls = process.env.ILS_WR_URLS.split(",").map((u) => u.trim());
  let totalUpserts = 0;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const rows = [];
      $("table tbody tr").each((_, el) => {
        const cols = $(el).find("td");
        if (cols.length >= 5) {
          rows.push({
            discipline: $(cols[0]).text().trim(),
            gender: $(cols[1]).text().trim(),
            name: $(cols[2]).text().trim(),
            nation: $(cols[3]).text().trim(),
            time: $(cols[4]).text().trim(),
          });
        }
      });

      for (const record of rows) {
        const { error } = await supabase
          .from("records")
          .upsert(record, { onConflict: "discipline,gender,name" });
        if (error) console.error("Insert error:", error);
        else totalUpserts++;
      }
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
    }
  }

  res.status(200).json({ ok: true, imported: totalUpserts });
}
