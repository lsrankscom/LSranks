// pages/index.js
import Link from 'next/link';
import { getCompetitions, getAthletes, getNews } from '../lib/data';

export default function Home({ competitions, athletes, news }) {
  const comps = Array.isArray(competitions) ? competitions.slice(0, 5) : [];
  const aths = Array.isArray(athletes) ? athletes.slice(0, 8) : [];
  const nws = Array.isArray(news) ? news.slice(0, 5) : [];

  return (
    <>
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">LSranks</h2>
          <span className="badge">v3 · new design</span>
        </div>
        <div className="section-content">
          <p className="muted">Lifesaving rankings & results — fast, clean, consistent.</p>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Upcoming Competitions</h3>
          <Link className="btn" href="/competitions">All competitions →</Link>
        </div>
        <div className="section-content">
          {comps.length === 0 ? <p className="muted">No competitions yet.</p> : (
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Date</th><th>Location</th><th>Status</th></tr>
              </thead>
              <tbody>
                {comps.map((c, i) => (
                  <tr key={c?.id ?? i}>
                    <td>{c?.name ?? '—'}</td>
                    <td>{c?.date ?? '—'}</td>
                    <td>{c?.location ?? '—'}</td>
                    <td>{c?.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Athletes</h3>
          <Link className="btn" href="/athletes">Browse →</Link>
        </div>
        <div className="section-content">
          {aths.length === 0 ? <p className="muted">No athletes yet.</p> : (
            <div className="list" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))'}}>
              {aths.map((a, i) => (
                <div className="card" key={a?.id ?? i}>
                  <div style={{fontWeight:600}}>{a?.name ?? 'Unnamed'}</div>
                  <div className="muted">{a?.club ?? a?.country ?? '—'}</div>
                  <div style={{marginTop:10}}>
                    <Link className="btn" href={`/athletes/${a?.id ?? ''}`}>Profile →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">News</h3>
          <Link className="btn" href="/news">All news →</Link>
        </div>
        <div className="section-content">
          {nws.length === 0 ? <p className="muted">No news yet.</p> : (
            <ul className="list">
              {nws.map((n, i) => (
                <li className="card" key={n?.id ?? i}>
                  <strong>{n?.title ?? 'Untitled'}</strong>
                  <div className="muted">{n?.date ?? ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  const [competitions, athletes, news] = await Promise.all([
    getCompetitions(10), getAthletes(12), getNews(10)
  ]);
  return { props: { competitions, athletes, news } };
}
