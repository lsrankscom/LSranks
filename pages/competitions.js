// pages/competitions.js
import React from 'react';

export default function CompetitionsPage({ competitions = [] }) {
  const safeCompetitions = Array.isArray(competitions) ? competitions : [];

  return (
    <main style={{ padding: 24 }}>
      <h1>Competitions</h1>
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
    </main>
  );
}

export async function getServerSideProps() {
  // TODO: echtes Laden später
  return { props: { competitions: [] } };
}
