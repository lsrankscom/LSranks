// lib/data.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Client nur erzeugen, wenn Env-Variablen vorhanden sind
export const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Hilfsfunktion: bei fehlender Konfiguration eine leere Antwort zurückgeben,
 * damit der Build nicht abstürzt.
 */
function emptyOnMissingConfig(defaultVal = []) {
  return {
    ok: !hasSupabase,
    data: hasSupabase ? null : defaultVal,
    error: hasSupabase ? null : null,
  };
}

/**
 * ATHLETENLISTE
 * Optional: filter = { name, club, birthFrom, birthTo, limit }
 */
export async function getAthletes(filter = {}) {
  if (!hasSupabase) return [];

  let q = supabase.from('athletes').select('*');

  if (filter.name && filter.name.trim()) {
    // einfache Suche auf Name (vor/zu/nachname), nutzt ILIKE für fuzzy
    q = q.or(
      `first_name.ilike.%${filter.name}%,last_name.ilike.%${filter.name}%,full_name.ilike.%${filter.name}%`
    );
  }

  if (filter.club && filter.club.trim()) {
    q = q.ilike('club', `%${filter.club}%`);
  }

  if (filter.birthFrom) {
    q = q.gte('birth_year', Number(filter.birthFrom));
  }
  if (filter.birthTo) {
    q = q.lte('birth_year', Number(filter.birthTo));
  }

  q = q.order('last_name', { ascending: true }).order('first_name', { ascending: true });

  if (filter.limit) q = q.limit(Number(filter.limit));

  const { data, error } = await q;
  if (error) {
    console.error('getAthletes error:', error);
    return [];
  }
  return data || [];
}

/**
 * ATHLET*IN per ID
 */
export async function getAthleteById(id) {
  if (!hasSupabase) return null;
  if (!id) return null;

  const { data, error } = await supabase.from('athletes').select('*').eq('id', id).single();
  if (error) {
    console.error('getAthleteById error:', error);
    return null;
  }
  return data;
}

/**
 * NEWS (z. B. letzte 20 Einträge)
 */
export async function getNews(limit = 20) {
  if (!hasSupabase) return [];

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(Number(limit));

  if (error) {
    console.error('getNews error:', error);
    return [];
  }
  return data || [];
}

/**
 * (Optional) weitere Helper, falls du sie bald brauchst – robust bei fehlender Config.
 */
export async function getDatabaseStats() {
  if (!hasSupabase) {
    return {
      athletes: 0,
      competitions: 0,
      results: 0,
      records: 0,
      news: 0,
    };
  }

  // Beispiel: COUNTs aus Materialized Views/Tabellen, wenn vorhanden
  const safeCount = async (table) => {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`count ${table} error:`, error);
      return 0;
    }
    return count || 0;
  };

  return {
    athletes: await safeCount('athletes'),
    competitions: await safeCount('competitions'),
    results: await safeCount('results'),
    records: await safeCount('records'),
    news: await safeCount('news'),
  };
}
