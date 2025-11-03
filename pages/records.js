// pages/records.js
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// === Supabase Client (Client-Side) ===
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// kleine Helper
function msToTimeStr(ms) {
  if (ms == null) return '—';
  const total = Math.round(ms / 10) / 100; // Hundertstel
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(2).padStart(5, '0');
  return m > 0 ? `${m}:${s.padStart(5, '0')}` : s;
}

// erkennt Staffel-Disziplinen am Code
function isRelayCode(code = '') {
  const c = String(code).toUpperCase();
  // ILSF-Staffeln enthalten i.d.R. "RELAY" (z. B. 4X50M_LIFESAVING_RELAY, 4X25M_MANIKIN_RELAY)
  return c.includes('RELAY');
}

export default function RecordsPage() {
  // Filter-State
  const [scope, setScope] = useState('OPEN');        // OPEN | YOUTH | MASTERS
  const [gender, setGender] = useState('W');         // W | M
  const [ageClass, setAgeClass] = useState('ALL');   // Nur für Masters/YOUTH: ALL | M30..M75 / W30..W75 etc. (hier lassen wir ALL + freie Suche)
  const [poolLen, setPoolLen] = useState('50');      // 25 | 50 | ALL
  const [timing, setTiming] = useState('ET');        // ET | HT | ALL
  const [nation, setNation] = useState('');          // optional
  const [query, setQuery] = useState('');            // Suchfeld
  const [teamType, setTeamType] = useState('ALL');   // NEW: ALL | INDIVIDUAL | RELAY

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Disziplin-Suchstring aus Eingabe
  const searchTerm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        // Basis-Query: Weltrekorde
        let q = supabase
          .from('records')
          .select(
            [
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
            ].join(',')
          )
          .eq('record_scope', 'world');

        // Scope-Filter (OPEN/YOUTH/MASTERS) über discipline_code Prefix
        if (scope !== 'ALL') {
          q = q.ilike('discipline_code', `${scope}%`);
        }

        // Geschlecht
        if (gender !== 'ALL') q = q.eq('gender', gender);

        // Poollänge
        if (poolLen !== 'ALL') q = q.eq('pool_length', Number(poolLen));

        // Timing
        if (timing !== 'ALL') q = q.eq('timing', timing);

        // Nation (optional) – falls später geparst/gefüllt
        if (nation) q = q.ilike('nation', nation);

        // Einzel/Staffel
        if (teamType === 'INDIVIDUAL') {
          q = q.not('discipline_code', 'ilike', '%RELAY%');
        } else if (teamType === 'RELAY') {
          q = q.ilike('discipline_code', '%RELAY%');
        }

        // Suche im Disziplin-Code
        if (searchTerm) {
          q = q.ilike('discipline_code', `%${searchTerm}%`);
        }

        // sortierbar: erst Disziplin, dann Zeit
        q = q.order('discipline_code', { ascending: true }).order('time_ms', { ascending: true });

        const { data, error } = await q;
        if (error) throw error;
        if (!ignore) setRows(data || []);
      } catch (e) {
        if (!ignore) setErr(e.message || String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [scope, gender, poolLen, timing, nation, searchTerm, teamType]);

  // Anzeige: Altersklassen-Auswahl nur für YOUTH/MASTERS (informativ; Filtering über Suche)
  const ageClassControl =
    scope === 'MASTERS' || scope === 'YOUTH' ? (
      <input
        className="input"
        placeholder="Altersklasse (z. B. M30, W40 …)"
        value={ageClass === 'ALL' ? '' : ageClass}
        onChange={(e) => setAgeClass(e.target.value.toUpperCase() || 'ALL')}
        title="Optional: Filter per Suchstring – z. B. M30, W55 (wirkt auf Disziplin-Suche)"
      />
    ) : null;

  // Wenn Altersklasse gesetzt, hängen wir sie an den Suche-String an (Client-seitig)
  const filteredRows = useMemo(() => {
    if (!ageClass || ageClass === 'ALL') return rows;
    const needle = ageClass.toUpperCase();
    return rows.filter((r) => String(r.discipline_code || '').toUpperCase().includes(needle));
  }, [rows, ageClass]);

  return (
    <>
      <Head>
        <title>World Records – LSRanks</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="container">
        <h1>World Records</h1>

        <div className="filters">
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="OPEN">Open only</option>
            <option value="YOUTH">Youth only</option>
            <option value="MASTERS">Masters only</option>
            <option value="ALL">All categories</option>
          </select>

          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="W">Women</option>
            <option value="M">Men</option>
            <option value="ALL">All genders</option>
          </select>

          {ageClassControl}

          <select value={teamType} onChange={(e) => setTeamType(e.target.value)}>
            <option value="ALL">Einzel + Staffeln</option>
            <option value="INDIVIDUAL">Nur Einzel</option>
            <option value="RELAY">Nur Staffeln</option>
          </select>

          <select value={poolLen} onChange={(e) => setPoolLen(e.target.value)}>
            <option value="50">50m</option>
            <option value="25">25m</option>
            <option value="ALL">25m + 50m</option>
          </select>

          <select value={timing} onChange={(e) => setTiming(e.target.value)}>
            <option value="ET">ET (Electronic)</option>
            <option value="HT">HT (Hand)</option>
            <option value="ALL">ET + HT</option>
          </select>

          <input
            className="input"
            placeholder="Nation (optional, z. B. GER)"
            value={nation}
            onChange={(e) => setNation(e.target.value.toUpperCase())}
          />

          <input
            className="input"
            placeholder="Disziplin-Suche (z. B. MANIKIN, OBSTACLE …)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {err && <p className="error">Error: {err}</p>}
        {loading && <p>Loading…</p>}

        {!loading && !err && (
          <div className="table">
            <div className="thead">
              <div>Discipline</div>
              <div>G</div>
              <div>Pool</div>
              <div>Timing</div>
              <div>Time</div>
              <div>Athlete / Team</div>
              <div>Nation</div>
              <div>Meet</div>
              <div>Date</div>
              <div>Source</div>
            </div>
            {filteredRows.map((r, i) => (
              <div className="trow" key={`${r.discipline_code}-${r.gender}-${r.time_ms}-${i}`}>
                <div className="mono">{r.discipline_code}</div>
                <div>{r.gender || '—'}</div>
                <div>{r.pool_length || '—'}</div>
                <div>{r.timing || '—'}</div>
                <div className="mono">{msToTimeStr(r.time_ms)}</div>
                <div>{(r.athlete_name || '—').replace(/\s*\n\s*/g, ' ')}</div>
                <div>{r.nation || '—'}</div>
                <div>{r.meet_name || '—'}</div>
                <div>{r.record_date || '—'}</div>
                <div>
                  {r.source_url ? (
                    <a href={r.source_url} target="_blank" rel="noreferrer">
                      link
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            ))}
            {filteredRows.length === 0 && <div className="empty">No records found.</div>}
          </div>
        )}

        <footer className="foot">
          <Link href="/">LSRanks</Link>
        </footer>
      </main>

      <style jsx>{`
        .container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        h1 {
          margin: 0 0 16px;
        }
        .filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
          margin-bottom: 16px;
          align-items: center;
        }
        .input {
          padding: 8px 10px;
          border: 1px solid #e2e2e2;
          border-radius: 6px;
          font-size: 14px;
        }
        select {
          padding: 8px 10px;
          border: 1px solid #e2e2e2;
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
        }
        .table {
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
        }
        .thead, .trow {
          display: grid;
          grid-template-columns: 3fr 0.6fr 0.7fr 1fr 1.1fr 2fr 0.9fr 1.2fr 1fr 0.8fr;
          gap: 8px;
          padding: 10px 12px;
          align-items: center;
        }
        .thead {
          background: #fafafa;
          font-weight: 600;
          border-bottom: 1px solid #eee;
        }
        .trow:not(:last-child) {
          border-bottom: 1px solid #f1f1f1;
        }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
        .empty { padding: 16px; color: #777; }
        .error { color: #c02626; margin: 8px 0 0; }
        .foot { margin-top: 28px; font-size: 14px; color: #666; }
      `}</style>
    </>
  );
}
