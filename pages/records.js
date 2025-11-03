// pages/records.js
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// ---------- Supabase Client (Public anon) ----------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------- Helpers ----------
function formatMs(ms) {
  if (ms == null) return '—';
  const total = Math.round(Number(ms));
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10); // Hundertstel
  const pad2 = (n) => String(n).padStart(2, '0');
  if (m > 0) return `${m}:${pad2(s)}.${pad2(cs)}`;
  return `${s}.${pad2(cs)}`;
}

function parseDisciplineMeta(codeRaw) {
  const code = (codeRaw || '').toUpperCase();

  // Masters-Klassen erkennen (M30..M75 / W30..W75)
  const m = code.match(/_(M|W)(3|4|5|6|7)0\b/); // M30..M70
  const m75 = /_(M|W)75\b/.test(code);
  const ageClass = m ? `${m[1]}${m[2]}0` : m75 ? 'M75' : null;
  const isMasters = /(^|_)MASTERS(_|$)/.test(code) || !!ageClass;

  // Youth erkennen (YOUTH / JUNIOR)
  const isYouth = /(^|_)(YOUTH|JUNIOR)(_|$)/.test(code);

  return { isMasters, isYouth, ageClass };
}

const MASTER_AGE_OPTIONS = [
  'M30', 'M35', 'M40', 'M45', 'M50', 'M55', 'M60', 'M65', 'M70', 'M75',
];

// ---------- Page Component ----------
export default function RecordsPage() {
  // Filter-State
  const [scope, setScope] = useState('');              // '', 'open', 'masters', 'youth'
  const [gender, setGender] = useState('');            // '', 'M', 'W', 'X'
  const [ageClass, setAgeClass] = useState('');        // Masters: M30..M75
  const [poolLen, setPoolLen] = useState('');          // '', '25', '50'
  const [timing, setTiming] = useState('');            // '', 'ET', 'HT'
  const [nationQ, setNationQ] = useState('');          // optional
  const [search, setSearch] = useState('');            // Disziplin-Textsuche

  // Daten
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  // Laden (weltweite Rekorde)
  useEffect(() => {
    let alive = true;

    async function load() {
      setError('');
      // Hole die nötigsten Spalten – der Rest wird clientseitig gefiltert
      const { data, error: err } = await supabase
        .from('records')
        .select(`
          record_scope,
          discipline_code,
          gender,
          pool_length,
          timing,
          time_ms,
          athlete_name,
          nation,
          club,
          meet_name,
          record_date,
          source_url
        `)
        .eq('record_scope', 'world')
        .limit(5000);

      if (!alive) return;
      if (err) {
        setError(err.message || 'Failed to load');
      } else {
        setRows(data || []);
      }
    }
    load();

    return () => { alive = false; };
  }, []);

  // Gefilterte Liste
  const filtered = useMemo(() => {
    return (rows || []).filter((r) => {
      const code = (r.discipline_code || '').toUpperCase();
      const { isMasters, isYouth, ageClass: codeAge } = parseDisciplineMeta(code);

      // Scope-Logik
      if (scope === 'open' && (isMasters || isYouth)) return false;
      if (scope === 'masters' && (!isMasters || isYouth)) return false;
      if (scope === 'youth' && !isYouth) return false;

      // Gender
      if (gender && (r.gender || '').toUpperCase() !== gender) return false;

      // Masters-Altersklasse (nur anwenden, wenn Masters gewählt ist)
      if (scope === 'masters' && ageClass) {
        if ((codeAge || '') !== ageClass.toUpperCase()) return false;
      }

      // Poollänge
      if (poolLen && String(r.pool_length || '') !== poolLen) return false;

      // Timing
      if (timing && (r.timing || '') !== timing) return false;

      // Nation (optional, Teilstring)
      if (nationQ && !(r.nation || '').toUpperCase().includes(nationQ.toUpperCase())) {
        return false;
      }

      // Textsuche Disziplin
      if (search) {
        const hay = (r.discipline_code || '').toUpperCase();
        if (!hay.includes(search.toUpperCase())) return false;
      }

      return true;
    });
  }, [rows, scope, gender, ageClass, poolLen, timing, nationQ, search]);

  return (
    <>
      <Head>
        <title>World Records • LSRanks</title>
      </Head>

      {/* Kein zusätzlicher Header/Nav – nur Seiteninhalt */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold text-slate-800">World Records</h1>

        {/* Filterleiste */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Scope */}
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={scope}
            onChange={(e) => { setScope(e.target.value); setAgeClass(''); }}
          >
            <option value="">All categories</option>
            <option value="open">Open</option>
            <option value="masters">Masters</option>
            <option value="youth">Youth</option>
          </select>

          {/* Gender */}
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">All genders</option>
            <option value="M">Men</option>
            <option value="W">Women</option>
            <option value="X">Mixed</option>
          </select>

          {/* Masters Age (nur sichtbar bei Masters) */}
          <select
            className={`rounded border border-slate-300 bg-white px-3 py-2 ${scope === 'masters' ? '' : 'opacity-50'}`}
            value={ageClass}
            onChange={(e) => setAgeClass(e.target.value)}
            disabled={scope !== 'masters'}
          >
            <option value="">All age classes</option>
            {MASTER_AGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* Pool */}
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={poolLen}
            onChange={(e) => setPoolLen(e.target.value)}
          >
            <option value="">All pools</option>
            <option value="25">25m</option>
            <option value="50">50m</option>
          </select>

          {/* Timing */}
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
          >
            <option value="">All timing</option>
            <option value="ET">ET (Electronic)</option>
            <option value="HT">HT (Hand)</option>
          </select>

          {/* Nation (optional) */}
          <input
            className="rounded border border-slate-300 bg-white px-3 py-2"
            placeholder="Nation (optional)"
            value={nationQ}
            onChange={(e) => setNationQ(e.target.value)}
          />
        </div>

        {/* Freitextsuche Disziplin */}
        <div className="mt-3">
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2"
            placeholder="Search discipline name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Fehleranzeige */}
        {error && (
          <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            Error: {error}
          </div>
        )}

        {/* Tabelle */}
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Discipline</th>
                <th className="px-2 py-3 font-medium">G</th>
                <th className="px-2 py-3 font-medium">Pool</th>
                <th className="px-2 py-3 font-medium">Timing</th>
                <th className="px-3 py-3 font-medium">Time</th>
                <th className="px-3 py-3 font-medium">Athlete</th>
                <th className="px-2 py-3 font-medium">Nation</th>
                <th className="px-2 py-3 font-medium">Club</th>
                <th className="px-3 py-3 font-medium">Meet</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={11}>
                    No records found. Adjust filters.
                  </td>
                </tr>
              )}

              {filtered.map((r, i) => (
                <tr key={`${r.discipline_code}-${i}`} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.discipline_code || '—'}</td>
                  <td className="px-2 py-3">{r.gender || '—'}</td>
                  <td className="px-2 py-3">{r.pool_length || '—'}</td>
                  <td className="px-2 py-3">{r.timing || '—'}</td>
                  <td className="px-3 py-3 tabular-nums">{formatMs(r.time_ms)}</td>
                  <td className="px-3 py-3">{r.athlete_name || '—'}</td>
                  <td className="px-2 py-3">{r.nation || '—'}</td>
                  <td className="px-2 py-3">{r.club || '—'}</td>
                  <td className="px-3 py-3">{r.meet_name || '—'}</td>
                  <td className="px-3 py-3">
                    {r.record_date ? new Date(r.record_date).toISOString().slice(0, 10) : '—'}
                  </td>
                  <td className="px-3 py-3">
                    {r.source_url ? (
                      <Link href={r.source_url} target="_blank" rel="noopener">
                        <span className="text-blue-600 hover:underline">link</span>
                      </Link>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
