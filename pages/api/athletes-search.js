// pages/api/athletes-search.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // bleibt nur auf dem Server!
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);

    if (!q) return res.status(200).json({ results: [] });

    // einfacher ILIKE-Prefix; später gern Volltext/Trigram
    const { data, error } = await supabase
      .from('athletes')
      .select('id, full_name, nation, club')
      .ilike('full_name', `%${q}%`)
      .order('full_name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return res.status(200).json({ results: data || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server_error' });
  }
}
