// pages/admin.js
import React from 'react';

export default function AdminPage({ competitions = [], athletes = [] }) {
  const safeCompetitions = Array.isArray(competitions) ? competitions : [];
  const safeAthletes = Array.isArray(athletes) ? athletes : [];

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin</h1>

      <section>
        <h2>Competitions</h2>
        {safeCompetitions.length === 0 ? (
          <p>No competitions yet.</p>
        ) : (
          <ul>
            {safeCompetitions.map((c, i) => (
              <li key={c?.id ?? i}>{c?.name ?? 'Unnamed'}{c?.date ? ` — ${c.date}` : ''}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Athletes</h2>
        {safeAthletes.length === 0 ? (
          <p>No athletes yet.</p>
        ) : (
          <ul>
            {safeAthletes.map((a, i) => (
              <li key={a?.id ?? i}>{a?.name ?? 'Unnamed Athlete'}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// Temporär: keine SSG – immer Server-Side-Rendern
export async function getServerSideProps() {
  // TODO: Hier später echtes Fetching einbauen.
  // Vorläufig leere, aber definierte Arrays zurückgeben, damit .map nie crasht.
  return {
    props: {
      competitions: [],
      athletes: []
    }
  };
}
