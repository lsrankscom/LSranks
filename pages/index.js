import Layout from '../components/Layout';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [q, setQ] = useState('');

  const goSearch = (e) => {
    e.preventDefault();
    const query = q.trim();
    window.location.href = query ? `/athletes?query=${encodeURIComponent(query)}` : '/athletes';
  };

  return (
    <>
      <div className="hero">
        <div className="container">
          <h1>LifesavingRankings</h1>
          <p>Global results, records & rankings — refreshed daily</p>
        </div>
      </div>

      <Layout>
        <div className="section card" style={{borderLeft:'6px solid var(--warn)'}}>
          <strong>Heads-up:</strong> This website is still <strong>under active development</strong>.
          Some pages and imports are being refined.
        </div>

        <div className="section">
          <h2>Search for athletes</h2>
          <form onSubmit={goSearch} className="card" style={{display:'flex', gap:10}}>
            <input className="input" placeholder="Name, club, nation…" value={q} onChange={(e)=>setQ(e.target.value)} />
            <button className="btn" type="submit">Search</button>
          </form>
        </div>

        <div className="section">
          <h2>Quick links</h2>
          <div className="card" style={{display:'flex', gap:14, flexWrap:'wrap'}}>
            <Link className="btn" href="/competitions">All competitions →</Link>
            <Link className="btn" href="/records">World Records →</Link>
            <Link className="btn" href="/calendar">Calendar →</Link>
          </div>
        </div>
      </Layout>
    </>
  );
}
