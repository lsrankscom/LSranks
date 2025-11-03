// pages/records.tsx
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

type Row = {
  row_id: number;
  record_scope: string | null;
  discipline_code: string;
  gender: string | null;
  gender_norm: 'M' | 'W' | null;
  is_masters: boolean | null;
  age_group: string | null; // z.B. M30, W45
  pool_length: number | null; // 25 | 50
  timing: string | null; // 'ET' etc.
  time_ms: number | null;
  athlete_name: string | null;
  nation: string | null;
  club: string | null;
  meet_name: string | null;
  record_date: string | null; // ISO Date
  city: string | null;
  country: string | null;
  source_url: string | null;
  disc_core: string | null; // z.B. OPEN_100M_MANIKIN_CARRY_WITH_FINS
};

const supabase =
  typeof window !== 'undefined'
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      )
    : (null as any);

function msToReadable(ms: number | null): string {
  if (!ms || ms <= 0) return '—';
  // ILSF listet teils Sekunden mit Hundertstel; wir rechnen robust
  const totalMs = Math.round(ms);
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((totalMs % 1000) / 10);
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths
      .toString()
      .padStart(2, '0')}`;
  }
  return `${seconds}.${hundredths.toString().padStart(2, '0')}`;
}

const ALL = 'ALL';

export default function RecordsPage() {
  // Filter-States
  const [gender, setGender] = useState<typeof ALL | 'M' | 'W'>(ALL);
  const [pool, setPool] = useState<typeof ALL | 25 | 50>(ALL);
  const [mastersMode, setMastersMode] = useState<'all' | 'masters' | 'open'>(
    'all'
  );
  const [ageGroup, setAgeGroup] = useState<string | typeof ALL>(ALL);
  const [searchDisc, setSearchDisc] = useState<string>('');

  // Daten
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Altersklassen dynamisch nach Gender
  const ageOptions = useMemo(() => {
    const prefixes =
      gender === 'M' ? ['M'] : gender === 'W' ? ['W'] : ['M', 'W'];
    const ages = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
    const list: string[] = [];
    for (const p of prefixes) for (const a of ages) list.push(`${p}${a}`);
    return list;
  }, [gender]);

  // Fetch
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!supabase) return;
      setLoading(true);
      setErrorText(null);
      // Basisquery
      let q = supabase.from('records_search').select<Row>('*', { count: 'exact' });

      // Masters/Open
      if (mastersMode === 'masters') q = q.eq('is_masters', true);
      if (mastersMode === 'open') q = q.eq('is_masters', false);

      // Gender
      if (gender !== ALL) q = q.eq('gender_norm', gender);

      // AgeGroup (nur sinnvoll bei Masters)
      if (ageGroup !== ALL) q = q.eq('age_group', ageGroup);

      // Pool
      if (pool !== ALL) q = q.eq('pool_length', pool);

      // Disziplin-Suche (auf disc_core und discipline_code)
      const term = searchDisc.trim();
      if (term.length > 0) {
        q = q.or(
          `disc_core.ilike.%${term.replace(/%/g, '')}%,discipline_code.ilike.%${term.replace(
            /%/g,
            ''
          )}%`
        );
      }

      // Sortierung: Kern-Disziplin, Gender, AgeGroup, Zeit
      q = q
        .order('disc_core', { ascending: true, nullsFirst: true })
        .order('gender_norm', { ascending: true, nullsFirst: true })
        .order('age_group', { ascending: true, nullsFirst: true })
        .order('time_ms', { ascending: true, nullsFirst: true })
        .limit(500);

      const { data, error } = await q;

      if (!isMounted) return;
      if (error) {
        setErrorText(error.message);
        setRows([]);
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [gender, pool, mastersMode, ageGroup, searchDisc]);

  // AgeGroup zurücksetzen wenn Masters auf "open" umspringt
  useEffect(() => {
    if (mastersMode === 'open') setAgeGroup(ALL);
  }, [mastersMode]);

  return (
    <>
      <Head>
        <title>World Records — LSRanks</title>
      </Head>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">World Records</h1>

        {/* Filterleiste */}
        <div className="mb-6 rounded-md border border-slate-200 bg-white/70 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Masters/Open */}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Category</span>
              <select
                className="rounded-md border border-slate-300 px-3 py-2"
                value={mastersMode}
                onChange={(e) =>
                  setMastersMode(e.target.value as 'all' | 'masters' | 'open')
                }
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="masters">Masters</option>
              </select>
            </label>

            {/* Gender */}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Gender</span>
              <select
                className="rounded-md border border-slate-300 px-3 py-2"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
              >
                <option value={ALL}>All</option>
                <option value="M">Men</option>
                <option value="W">Women</option>
              </select>
            </label>

            {/* Age Group */}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Age Group</span>
              <select
                className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                disabled={mastersMode !== 'masters'}
              >
                <option value={ALL}>All</option>
                {ageOptions.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </label>

            {/* Pool */}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Pool</span>
              <select
                className="rounded-md border border-slate-300 px-3 py-2"
                value={pool as any}
                onChange={(e) =>
                  setPool(
                    e.target.value === ALL ? ALL : (Number(e.target.value) as 25 | 50)
                  )
                }
              >
                <option value={ALL}>All</option>
                <option value={25}>25 m</option>
                <option value={50}>50 m</option>
              </select>
            </label>

            {/* Disziplin-Suche */}
            <label className="flex flex-col gap-1 text-sm lg:col-span-1 sm:col-span-2">
              <span className="font-medium">Discipline search</span>
              <input
                type="text"
                className="rounded-md border border-slate-300 px-3 py-2"
                placeholder="e.g. MANIKIN_CARRY"
                value={searchDisc}
                onChange={(e) => setSearchDisc(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Tabelle */}
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Discipline</th>
                <th className="px-4 py-3 font-medium">G</th>
                <th className="px-4 py-3 font-medium">Pool</th>
                <th className="px-4 py-3 font-medium">Timing</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Athlete</th>
                <th className="px-4 py-3 font-medium">Nation</th>
                <th className="px-4 py-3 font-medium">Club</th>
                <th className="px-4 py-3 font-medium">Meet</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && errorText && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-red-600">
                    {errorText}
                  </td>
                </tr>
              )}
              {!loading && !errorText && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-slate-500">
                    No records found.
                  </td>
                </tr>
              )}
              {!loading &&
                !errorText &&
                rows.map((r) => (
                  <tr key={r.row_id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium">{r.discipline_code}</td>
                    <td className="px-4 py-2">{r.gender_norm ?? r.gender ?? '—'}</td>
                    <td className="px-4 py-2">{r.pool_length ?? '—'}</td>
                    <td className="px-4 py-2">{r.timing ?? '—'}</td>
                    <td className="px-4 py-2">{msToReadable(r.time_ms)}</td>
                    <td className="px-4 py-2">{r.athlete_name ?? '—'}</td>
                    <td className="px-4 py-2">{r.nation ?? '—'}</td>
                    <td className="px-4 py-2">{r.club ?? '—'}</td>
                    <td className="px-4 py-2">{r.meet_name ?? '—'}</td>
                    <td className="px-4 py-2">
                      {r.record_date ? new Date(r.record_date).toISOString().slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {r.source_url ? (
                        <Link
                          href={r.source_url}
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Link
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* kleine Fußzeile */}
        <p className="mt-3 text-xs text-slate-500">
          Tip: Use the search to narrow disciplines (e.g. <code>MANIKIN</code>,{' '}
          <code>RESCUE_MEDLEY</code>). Masters age groups appear when category is set to Masters.
        </p>
      </main>
    </>
  );
}
