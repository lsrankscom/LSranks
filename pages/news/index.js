// pages/news/index.js
import { getNews } from '../../lib/data';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function NewsIndex({ news }) {
  const all = Array.isArray(news) ? news : [];
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = (q || '').trim().toLowerCase();
    if (!s) return all;
    return all.filter(n => (n?.title || '').toLowerCase().includes(s));
  }, [all, q]);

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">News</h2>
        <span className="badge">{filtered.length} articles</span>
      </div>

      <div className="section-content">
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search headlines…"
            style={{ flex:1, background:'var(--panel2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--fg)', padding:'10px 12px' }}
            aria-label="Search news"
          />
          <Link className="btn" href="/">Home →</Link>
        </div>

        {filtered.length === 0 ? (
          <p className="muted">No news yet.</p>
        ) : (
          <ul className="list">
            {filtered.map((n, i) => (
              <li className="card" key={n?.id ?? i}>
                <strong style={{display:'block'}}>{n?.title ?? 'Untitled'}</strong>
                <div className="muted" style={{marginTop:4}}>{n?.date ?? ''}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const news = await getNews(200);
  return { props: { news } };
}
