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
    scope: '',
    gender: '',
    eventType: '',
    nation: '',
    discipline: ''
  });

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);

      let q = supabase.from('records').select('*');

      if (filters.discipline) {
        q = q.ilike('discipline_code', `%${filters.discipline}%`);
      }
      if (filters.nation) {
        q = q.ilike('nation', `%${filters.nation}%`);
      }
      if (filters.gender) {
        q = q.eq('gender', filters.gender);
      }

      // scope & eventType kannst du bei Bedarf auf deine Felder mappen

      q = q.order('time_ms', { ascending: true });

      const { data, error } = await q;
      if (!error) setRecords(data || []);
      setLoading(false);
    };

    fetchRecords();
  }, [filters]);

  const styles = {
    page: { padding: '1.25rem' },
    title: {
      fontSize: '1.4rem',
      fontWeight: 600,
      margin: '0 0 1rem 0',
      textAlign: 'center'
    },
    filtersWrap: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      justifyContent: 'center',
      marginBottom: '1rem'
    },
    input: {
      padding: '0.45rem 0.55rem',
      minWidth: 130,
      fontSize: '0.9rem',
      border: '1px solid #d9d9d9',
      borderRadius: 6
    },
    tableWrap: {
      width: '100%',
      overflowX: 'hidden'
    },
    table: {
      width: '100%',
      tableLayout: 'fixed',        // Wichtig, damit Breiten greifen
      borderCollapse: 'collapse',
      fontSize: '0.9rem'           // kompakter
    },
    th: {
      background: '#f6f7f8',
      textAlign: 'left',
      padding: '0.55rem 0.5rem',
      borderBottom: '1px solid #e6e6e6'
    },
    td: {
      padding: '0.5rem',
      borderBottom: '1px solid #efefef',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    // Spaltenbreiten (Summe ≈ 100%)
    colDiscipline: { width: '30%' },
    colG:          { width: '6%',  textAlign: 'center' },
    colTime:       { width: '9%' , textAlign: 'right' },
    colAthlete:    { width: '25%' },
    colNation:     { width: '8%'  },
    colMeet:       { width: '14%' },
    colDate:       { width: '8%'  , textAlign: 'right' },
    footer: {
      marginTop: '0.75rem',
      fontSize: '0.8rem',
      color: '#666',
      textAlign: 'right'
    },
    // kleine Screens
    responsive: `
      @media (max-width: 768px) {
        .filters input, .filters select { min-width: 110px; font-size: 0.85rem; }
        table { font-size: 0.85rem; }
        th, td { padding: 0.45rem; }
        .col-discipline { width: 34% !important; }
        .col-athlete    { width: 28% !important; }
        .col-meet       { width: 12% !important; }
        .col-time       { width: 8%  !important; }
        .col-date       { width: 8%  !important; }
      }
    `
  };

  return (
    <div style={styles.page}>
      {/* Inline „CSS“ für Media Query */}
      <style dangerouslySetInnerHTML={{ __html: styles.responsive }} />

      <h1 style={styles.title}>World Records</h1>

      {/* Filter */}
      <div className="filters" style={styles.filtersWrap}>
        <select
          style={styles.input}
          value={filters.scope}
          onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
        >
          <option value="">All categories</option>
          <option value="open">Open only</option>
          <option value="masters">Masters</option>
          <option value="youth">Youth</option>
        </select>

        <select
          style={styles.input}
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
        >
          <option value="">All genders</option>
          <option value="m">Men</option>
          <option value="w">Women</option>
        </select>

        <select
          style={styles.input}
          value={filters.eventType}
          onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
        >
          <option value="">Einzel & Staffeln</option>
          <option value="individual">Einzel</option>
          <option value="relay">Staffel</option>
        </select>

        <input
          style={{ ...styles.input, minWidth: 150 }}
          placeholder="Nation (optional)"
          value={filters.nation}
          onChange={(e) => setFilters({ ...filters, nation: e.target.value })}
        />

        <input
          style={{ ...styles.input, minWidth: 210 }}
          placeholder="Disziplin-Suche (z. B. MANIKIN)"
          value={filters.discipline}
          onChange={(e) => setFilters({ ...filters, discipline: e.target.value })}
        />
      </div>

      {/* Tabelle */}
      <div style={styles.tableWrap}>
        {loading ? (
          <p style={{ textAlign: 'center', margin: '1rem 0' }}>Loading records…</p>
        ) : (
          <table style={styles.table}>
            <colgroup>
              <col className="col-discipline" style={styles.colDiscipline} />
              <col style={styles.colG} />
              <col style={styles.colTime} />
              <col className="col-athlete" style={styles.colAthlete} />
              <col style={styles.colNation} />
              <col className="col-meet" style={styles.colMeet} />
              <col style={styles.colDate} />
            </colgroup>
            <thead>
              <tr>
                <th style={styles.th}>Discipline</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>G</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Time</th>
                <th style={styles.th}>Athlete / Team</th>
                <th style={styles.th}>Nation</th>
                <th style={styles.th}>Meet</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...styles.td }}>{r.discipline_code}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {(r.gender || '').toUpperCase() || '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    {typeof r.time_ms === 'number'
                      ? (r.time_ms / 1000).toFixed(2)
                      : '—'}
                  </td>
                  <td style={styles.td}>{r.athlete_name || '—'}</td>
                  <td style={styles.td}>{r.nation || '—'}</td>
                  <td style={styles.td}>{r.meet_name || '—'}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    {r.record_date
                      ? new Date(r.record_date).toISOString().split('T')[0]
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.footer}>
        Display is condensed for readability. Columns wrap/trim long text automatically.
      </div>
    </div>
  );
}
