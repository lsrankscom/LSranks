// pages/api/sync-ils-world-records.js

import { createClient } from '@supabase/supabase-js';

// === Supabase Setup ===
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ACHTUNG: Service Role Key (nicht der Anon Key)
);

// === Auth via CRON_SECRET ===
export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    console.log('🔄 Sync gestartet...');

    // --- Schritt 1: Hole aktuelle ILS-Daten ---
    const response = await fetch('https://sport.ilsf.org/api/v1/records?scope=world');
    const ilsData = await response.json();

    if (!ilsData || !Array.isArray(ilsData.records)) {
      throw new Error('Unerwartetes API-Format von ILS');
    }

    const records = ilsData.records.map((r) => ({
      record_scope: 'world',
      discipline_code: r.discipline_code?.toUpperCase() || null,
      gender: r.gender?.toUpperCase() || null,
      pool_length: r.pool_length ? Number(r.pool_length) : null,
      timing: r.timing || null,
      time_ms: r.time_ms ? Number(r.time_ms) : null,
      athlete_name: r.athlete_name?.trim() || null,
      nation: extractNation(r.athlete_name),
      club: r.club || null,
      meet_name: r.meet_name || null,
      record_date: r.record_date || null,
      source_url: r.source_url || null,
      updated_at: new Date().toISOString(),
    }));

    // --- Schritt 2: In Supabase upserten ---
    const { error } = await supabase
      .from('records')
      .upsert(records, {
        onConflict: 'record_scope,discipline_code,gender,pool_length,timing',
        ignoreDuplicates: false,
      });

    if (error) throw error;

    console.log(`✅ ${records.length} Einträge synchronisiert.`);
    return res.status(200).json({ ok: true, count: records.length });
  } catch (err) {
    console.error('❌ Sync-Fehler:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// === Helper: Nation extrahieren z. B. "(GER)" aus Athletenname ===
function extractNation(name) {
  if (!name) return null;
  const match = name.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : null;
}
