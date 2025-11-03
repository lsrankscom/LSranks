// lib/data.js
export async function getSupabase() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  } catch {
    return null;
  }
}

export async function getCompetitions(limit = 50) {
  try {
    const s = await getSupabase();
    if (!s) return [];
    const { data, error } = await s.from('competitions')
      .select('id,name,date,location,status')
      .order('date', { ascending: true })
      .limit(limit);
    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getAthletes(limit = 50) {
  try {
    const s = await getSupabase();
    if (!s) return [];
    const { data, error } = await s.from('athletes')
      .select('id,name,country,club')
      .limit(limit);
    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getAthleteById(id) {
  try {
    const s = await getSupabase();
    if (!s || !id) return null;
    const { data, error } = await s.from('athletes')
      .select('id,name,country,club,biography')
      .eq('id', id)
      .single();
    if (error) return null;
    return data || null;
  } catch { return null; }
}

export async function getNews(limit = 10) {
  try {
    const s = await getSupabase();
    if (!s) return [];
    const { data } = await s.from('news')
      .select('id,title,date')
      .order('date', { ascending: false })
      .limit(limit);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getRecords(limit = 500) {
  // Erwartet Tabelle 'records' mit: id, event, gender, time, category, holder, nation
  try {
    const s = await getSupabase();
    if (!s) return [];
    const { data } = await s.from('records')
      .select('id,event,gender,time,category,holder,nation,updated_at')
      .order('event', { ascending: true })
      .limit(limit);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function getCalendar(limit = 100) {
  // Optional: eigene 'calendar' Tabelle; sonst nutze competitions als Fallback
  const primary = await getCompetitions(limit);
  return primary;
}
