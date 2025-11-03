// pages/index.js
import React from 'react';
import Link from 'next/link';

export default function HomePage({ highlight = null, athletes = [], competitions = [], news = [] }) {
  const safeAthletes = Array.isArray(athletes) ? athletes : [];
  const safeCompetitions = Array.isArray(competitions) ? competitions : [];
  const safeNews = Array.isArray(news) ? news : [];
  const hero = highlight ?? { title: 'Welcome to LSranks', subtitle: 'Rankings, results & schedules' };

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{hero.title}</h1>
        <p style={{ marginTop: 8, color: '#666' }}>{hero.subtitle}</p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>Upcoming Competitions</h2>
        {safeCompetitions.length === 0 ? (
          <p>No competitions yet.</p>
        ) : (
          <ul>
            {safeCompetitions.map((c, i) => (
              <li key={c?.id ?? i}>
                {c?.name ?? 'Unnamed'} {c?.date ? `— ${c.date}` : ''}
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 8 }}>
          <Link href="/competitions">All competitions →</Link>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>Athletes</h2>
        {safeAthletes.length === 0 ? (
          <p>No athletes yet.</p>
        ) : (
          <ul>
            {safeAthletes.map((a, i) => (
              <li key={a?.id ?? i}>
                <Link href={`/athletes/${a?.id ?? ''}`}>{a?.name ?? 'Unnamed Athlete'}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: 8 }}>News</h2>
        {safeNews.length === 0 ? (
          <p>No news yet.</p>
        ) : (
          <ul>
            {safeNews.map((n, i) => (
              <li key={n?.id ?? i}>
                {n?.title ?? 'Untitled'} {n?.date ? `— ${n.date}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// WICHTIG: SSR statt SSG, damit beim Build keine undefined-Maps craschen
export async function getServerSideProps() {
  // TODO: Hier später echtes Laden (DB/API). Jetzt nur sichere Defaults.
  return {
    props: {
      highlight: { title: 'LSranks', subtitle: 'Lifesaving rankings & results' },
      athletes: [],
      competitions: [],
      news: []
    }
  };
}
