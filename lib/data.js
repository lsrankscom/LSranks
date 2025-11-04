// lib/data.js
import { createClient } from '@supabase/supabase-js';

/**
 * Server-Client (für API-Routen, getServerSideProps, SSG)
 * Nutzt SERVICE_ROLE, wenn vorhanden; sonst ANON.
 * SERVICE_ROLE NIEMALS im Browser verwenden!
 */
export function getSupabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_*_KEY environment variables.');
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: fetch }
  });
}

/**
 * Browser-freundlicher Client (falls irgendwo clientseitig benötigt)
 * => NIEMALS Service-Role-Key hier verwenden.
 */
export function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY for client.');
  }
  return createClient(url, key, {
    auth: { persistSession: true },
    global: { fetch: fetch }
  });
}

// Default-Export beibehalten, da bestehender Code evtl. `import supabase from 'lib/data'` nutzt
const supabase = getSupabaseServer();
export default supabase;
