// pages/index.js
import React from 'react';
import Link from 'next/link';

export default function HomePage({ highlight, athletes, competitions, news }) {
  const safeAthletes = Array.isArray(athletes) ? athletes : [];
  const safeCompetitions = Array.isArray(competitions) ? competitions : [];
  const safeNews = Array.isArray(news) ? news : [];
  const hero = highlight ?? { title: 'LSranks', subtitle: 'Lifesaving rankings & results' };

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

// Lädt Daten sicher aus Supabase (wenn ENV vorhanden) – kein Crash bei Fehlern
export async function getServerSideProps() {
  // Defaults, falls irgendwas schiefgeht
  let highlight = { title: 'LSranks', subtitle: 'Lifesaving rankings & results' };
  let athletes = [];
  let competitions = [];
  let news = [];

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Passe Tabellennamen/Spalten bei Bedarf an
      const [{ data: compData }, { data: athData }, { data: newsData }] = await Promise.all([
        supabase.from('competitions').select('id,name,date').order('date', { ascending: true }),
        supabase.from('athletes').select('id,name').limit(20),
        supabase.from('news').select('id,title,date').order('date', { ascending: false }).limit(10),
      ]);

      competitions = Array.isArray(compData) ? compData : [];
      athletes = Array.isArray(athData) ? athData : [];
      news = Array.isArray(newsData) ? newsData : [];
    }
  } catch {
    // schluckt Fehler und liefert leere Listen -> Seite bleibt online
  }

  return { props: { highlight, athletes, competitions, news } };
}
