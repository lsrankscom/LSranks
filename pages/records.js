// pages/records.js
import { getRecords } from '../lib/data';
import { useMemo, useState } from 'react';

export default function RecordsPage({ records }) {
  const all = Array.isArray(records) ? records : [];
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = (q || '').trim().toLowerCase();
    if (!s) return all;
    return all.filter(r =>
      [r?.event, r?.gender, r?.category, r?.holder, r?.nation]
        .filter(Boolean).join(' ').toLowerCase().includes(s)
    );
  }, [all, q]);

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">World & National Records</h2>
        <span className="badge">{filtered.length} records</span>
      </div>

      <div className="section-content">
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search event, holder, nation…"
            style={{ flex:1, background:'var(--panel2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--fg)', padding:'10px 12px' }}
          />
        </div>

        {filtered.length === 0 ? <p className="muted">No records found.</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Gender</th>
                <th>Time</th>
                <th>Category</th>
                <th>Holder</th>
                <th>Nation</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r?.id ?? i}>
                  <td>{r?.event ?? '—'}</td>
                  <td>{r?.gender ?? '—'}</td>
                  <td><span className="badge">{r?.time ?? '—'}</span></td>
                  <td>{r?.category ?? '—'}</td>
                  <td>{r?.holder ?? '—'}</td>
                  <td>{r?.nation ?? '—'}</td>
                  <td className="muted">{r?.updated_at ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="muted" style={{marginTop:12}}>
          Quelle: Deine Supabase-Tabelle <code>records</code>. (Falls leer, siehst du oben „No records found“ – die Seite bleibt trotzdem online.)
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const records = await getRecords(1000);
  return { props: { records } };
}
