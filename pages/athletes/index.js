// pages/athletes/index.js
import Link from 'next/link';
import { getAthletes } from '../../lib/data';
import { useMemo, useState } from 'react';

export default function AthletesIndex({ athletes }) {
  const all = Array.isArray(athletes) ? athletes : [];
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = (q || '').trim().toLowerCase();
    if (!s) return all;
    return all.filter(a =>
      [a?.name, a?.club, a?.country].filter(Boolean).join(' ').toLowerCase().includes(s)
    );
  }, [all, q]);

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Athletes</h2>
        <span className="badge">{filtered.length} shown</span>
      </div>

      <div className="section-content">
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name, club, country…"
            style={{ flex:1, background:'var(--panel2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--fg)', padding:'10px 12px' }}
            aria-label="Search athletes"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="muted">No athletes yet.</p>
        ) : (
          <div className="list" style={{gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))'}}>
            {filtered.map((a, i) => (
              <div className="card" key={a?.id ?? i}>
                <div style={{fontWeight:600}}>{a?.name ?? 'Unnamed'}</div>
                <div className="muted">{[a?.club, a?.country].filter(Boolean).join(' · ') || '—'}</div>
                <div style={{marginTop:10}}>
                  <Link className="btn" href={`/athletes/${a?.id ?? ''}`}>Open profile →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const athletes = await getAthletes(500);
  return { props: { athletes } };
}
