import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// ---- Supabase Client (Public) ----
const supabase =
  typeof window !== 'undefined'
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

// Hilfsfunktionen
function msToTimeStr(ms) {
  if (ms == null) return '—';
  const total = Math.floor(ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const hundredths = Math.floor((total % 1000) / 10);
  return `${minutes > 0 ? minutes + ':' : ''}${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function parseDisciplineMeta(code) {
  // Beispiele:
  // OPEN_100M_RESCUE_MEDLEY
  // MASTERS_100M_MANIKIN_CARRY_WITH_FINS_MEN_M30
  const isMasters = code?.toUpperCase().startsWith('MASTERS_') || false;

  let ageClass = null;
  if (isMasters) {
    const m = code.match(/_M(30|35|40|45|50|55|60|65|70|75)\b/i);
    ageClass = m ? `M${m[1]}` : null;
  }
  return { isMasters, ageClass };
}

// Optionen
const GENDER_OPTS = [
  { value: '', label: 'All' },
  { value: 'M', label: 'Men' },
  { value: 'W', label: 'Women' },
];

const POOL_OPTS = [
  { value: '', label: 'All' },
  { value: '25', label: '25m' },
  { value: '50', label: '50m' },
];

const TIMING_OPTS = [
  { value: '', label: 'All' },
  { value: 'ET', label: 'ET (Electronic)' },
  { value: 'HT', label: 'HT (Hand)' },
];

const MASTERS_AGE_OPTS = [
  { value: '', label: 'All age classes' },
  ...['M30','M35','M40','M45','M50','M55','M60','M65','M70','M75'].map(v => ({ value: v, label: v }))
];

export default function RecordsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter-States
  const [scope, setScope] = useState('');          // '' | 'open' | 'masters'
  const [gender, setGender] = useState('');
  const [ageClass, setAgeClass] = useState('');    // nur Masters
  const [pool, setPool] = useState('');
  const [timing, setTiming] = useState('');
  const [nation, setNation] = useState('');
  const [disciplineSearch, setDisciplineSearch] = useState('');

  // Daten holen (einmal)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErrorMsg('');

        if (!supabase) {
          throw new Error('Supabase client not available');
        }

        // Wir holen alle world-Records; Filtern machen wir clientseitig
        const { data, error } = await supabase
          .from('records')
          .select(
            [
              'id',
              'record_scope',
              'discipline_code',
              'gender',
              'pool_length',
              'timing',
              'time_ms',
              'athlete_name',
              'nation',
              'club',
              'meet_name',
              'record_date',
              'source_url',
              'updated_at'
            ].join(',')
          )
          .eq('record_scope', 'world')
          .order('discipline_code', { ascending: true });

        if (error) throw error;
        if (!cancelled) setRows(data || []);
      } catch (e) {
        if (!cancelled) setErrorMsg(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Abgeleitete Filter
  const filtered = useMemo(() => {
    return (rows || []).filter(r => {
      const code = (r.discipline_code || '').toUpperCase();
      const { isMasters, ageClass: codeAge } = parseDisciplineMeta(code);

      if (scope === 'open' && isMasters) return false;
      if (scope === 'masters' && !isMasters) return false;

      if (gender && (r.gender || '').toUpperCase() !== gender) return false;

      if (scope === 'masters' && ageClass) {
        if ((codeAge || '').toUpperCase() !== ageClass.toUpperCase()) return false;
      }

      if (pool && String(r.pool_length || '') !== pool) return false;
      if (timing && (r.timing || '').toUpperCase() !== timing) return false;

      if (nation && !(r.nation || '').toUpperCase().includes(nation.toUpperCase())) return false;

      if (disciplineSearch) {
        const hay = code.replace(/_/g, ' ');
        if (!hay.toUpperCase().includes(disciplineSearch.toUpperCase())) return false;
      }

      return true;
    });
  }, [rows, scope, gender, ageClass, pool, timing, nation, disciplineSearch]);

  const resetFilters = () => {
    setScope('');
    setGender('');
    setAgeClass('');
    setPool('');
    setTiming('');
    setNation('');
    setDisciplineSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <nav className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-slate-800">LSRanks</Link>
          <div className="flex gap-6 text-slate-600">
            <Link href="/pool" className="hover:text-slate-900">Pool</Link>
            <Link href="/records" className="text-slate-900 font-medium">Records</Link>
            <Link href="/results" className="hover:text-slate-900">Results</Link>
            <Link href="/about" className="hover:text-slate-900">About</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">World Records</h1>

        {/* Filterleiste */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="">Open + Masters</option>
            <option value="open">Open only</option>
            <option value="masters">Masters only</option>
          </select>

          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            {GENDER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            className="rounded border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"
            value={ageClass}
            onChange={(e) => setAgeClass(e.target.value)}
            disabled={scope !== 'masters'}
            title={scope !== 'masters' ? 'Enable by choosing Masters' : undefined}
          >
            {MASTERS_AGE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={pool}
            onChange={(e) => setPool(e.target.value)}
          >
            {POOL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
          >
            {TIMING_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="flex gap-2">
            <input
              value={nation}
              onChange={(e) => setNation(e.target.value)}
              placeholder="Nation (optional)"
              className="flex-1 rounded border border-slate-300 bg-white px-3 py-2"
            />
            <button
              onClick={resetFilters}
              className="rounded border border-slate-300 bg-white px-3 py-2 hover:bg-slate-100"
              title="Reset all filters"
            >
              Reset
            </button>
          </div>

          <input
            value={disciplineSearch}
            onChange={(e) => setDisciplineSearch(e.target.value)}
            placeholder="Search discipline name…"
            className="md:col-span-3 lg:col-span-6 rounded border border-slate-300 bg-white px-3 py-2"
          />
        </div>

        {/* Lade-/Fehlerstatus */}
        {loading && <p className="text-slate-600">Loading…</p>}
        {!loading && errorMsg && (
          <p className="text-red-600">Error: {errorMsg}</p>
        )}

        {/* Tabelle */}
        {!loading && !errorMsg && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Discipline</th>
                  <th className="px-2 py-3 font-semibold">G</th>
                  <th className="px-2 py-3 font-semibold">Pool</th>
                  <th className="px-2 py-3 font-semibold">Timing</th>
                  <th className="px-3 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Athlete</th>
                  <th className="px-2 py-3 font-semibold">Nation</th>
                  <th className="px-2 py-3 font-semibold">Club</th>
                  <th className="px-4 py-3 font-semibold">Meet</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {(r.discipline_code || '').replaceAll('_', ' ')}
                    </td>
                    <td className="px-2 py-2">{r.gender || '—'}</td>
                    <td className="px-2 py-2">{r.pool_length || '—'}</td>
                    <td className="px-2 py-2">{r.timing || '—'}</td>
                    <td className="px-3 py-2 tabular-nums">{msToTimeStr(r.time_ms)}</td>
                    <td className="px-4 py-2">{r.athlete_name || '—'}</td>
                    <td className="px-2 py-2">{r.nation || '—'}</td>
                    <td className="px-2 py-2">{r.club || '—'}</td>
                    <td className="px-4 py-2">{r.meet_name || '—'}</td>
                    <td className="px-3 py-2">{r.record_date || '—'}</td>
                    <td className="px-3 py-2">
                      {r.source_url ? (
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          link
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-slate-500">
                      No records match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-slate-500">
        © {new Date().getFullYear()} LSRanks — Lifesaving Results Platform
        <br />
        <a href="mailto:info@lsranks.com" className="hover:underline">info@lsranks.com</a>
      </footer>
    </div>
  );
}
