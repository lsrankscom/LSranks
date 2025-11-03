import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Records() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    scope: 'open',
    gender: '',
    eventType: '',
    pool: '',
    timing: '',
    nation: '',
    discipline: ''
  });

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .ilike('discipline_code', `%${filters.discipline}%`)
        .order('time_ms', { ascending: true });

      if (error) console.error(error);
      else setRecords(data);
      setLoading(false);
    };
    fetchRecords();
  }, [filters]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        World Records
      </h1>

      {/* FILTER-BEREICH */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          justifyContent: 'center'
        }}
      >
        <select
          onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
          value={filters.scope}
          style={{ padding: '0.6rem', minWidth: '140px' }}
        >
          <option value="open">Open only</option>
          <option value="masters">Masters</option>
          <option value="youth">Youth</option>
        </select>

        <select
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
          value={filters.gender}
          style={{ padding: '0.6rem', minWidth: '140px' }}
        >
          <option value="">All genders</option>
          <option value="m">Men</option>
          <option value="w">Women</option>
        </select>

        <select
          onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
          value={filters.eventType}
          style={{ padding: '0.6rem', minWidth: '160px' }}
        >
          <option value="">Einzel & Staffeln</option>
          <option value="individual">Einzel</option>
          <option value="relay">Staffel</option>
        </select>

        <select
          onChange={(e) => setFilters({ ...filters, pool: e.target.value })}
          value={filters.pool}
          style={{ padding: '0.6rem', minWidth: '120px' }}
        >
          <option value="">All pools</option>
          <option value="50">50m</option>
          <option value="25">25m</option>
        </select>

        <select
          onChange={(e) => setFilters({ ...filters, timing: e.target.value })}
          value={filters.timing}
          style={{ padding: '0.6rem', minWidth: '180px' }}
        >
          <option value="">All timing</option>
          <option value="ET">ET (Electronic)</option>
          <option value="MT">MT (Manual)</option>
        </select>

        <input
          placeholder="Nation (optional)"
          value={filters.nation}
          onChange={(e) => setFilters({ ...filters, nation: e.target.value })}
          style={{ padding: '0.6rem', minWidth: '180px' }}
        />

        <input
          placeholder="Disziplin-Suche (z. B. MANIKIN)"
          value={filters.discipline}
          onChange={(e) => setFilters({ ...filters, discipline: e.target.value })}
          style={{ padding: '0.6rem', minWidth: '220px' }}
        />
      </div>

      {/* TABELLE */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading records…</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            borderSpacing: '0',
            fontSize: '0.95rem'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
              <th style={{ padding: '0.8rem' }}>Discipline</th>
              <th style={{ padding: '0.8rem' }}>G</th>
              <th style={{ padding: '0.8rem' }}>Pool</th>
              <th style={{ padding: '0.8rem' }}>Timing</th>
              <th style={{ padding: '0.8rem' }}>Time</th>
              <th style={{ padding: '0.8rem' }}>Athlete / Team</th>
              <th style={{ padding: '0.8rem' }}>Nation</th>
              <th style={{ padding: '0.8rem' }}>Meet</th>
              <th style={{ padding: '0.8rem' }}>Date</th>
              <th style={{ padding: '0.8rem' }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.7rem' }}>{r.discipline_code}</td>
                <td style={{ padding: '0.7rem' }}>{r.gender?.toUpperCase()}</td>
                <td style={{ padding: '0.7rem' }}>{r.pool_length}</td>
                <td style={{ padding: '0.7rem' }}>{r.timing}</td>
                <td style={{ padding: '0.7rem' }}>{(r.time_ms / 1000).toFixed(2)}</td>
                <td style={{ padding: '0.7rem' }}>{r.athlete_name}</td>
                <td style={{ padding: '0.7rem' }}>{r.nation}</td>
                <td style={{ padding: '0.7rem' }}>{r.meet_name || '—'}</td>
                <td style={{ padding: '0.7rem' }}>
                  {r.record_date ? new Date(r.record_date).toISOString().split('T')[0] : '—'}
                </td>
                <td style={{ padding: '0.7rem' }}>
                  <a href={r.source_url} target="_blank" rel="noreferrer">
                    link
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
