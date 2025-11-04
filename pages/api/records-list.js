import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  try {
    const supa = createClient(url, anon, { auth: { persistSession: false } });
    // Tabelle/VIEW anpassen: world_records ODER eine View wie public.v_records
    const { data, error } = await supa
      .from('world_records')
      .select('discipline, gender, category, athlete, nation, performance, date, venue, uniq_key')
      .order('discipline', { ascending: true });

    if (error) throw error;
    res.status(200).json({ items: data || [] });
  } catch (e) {
    res.status(200).json({ items: [] });
  }
}
