// pages/athletes/[id].js
import React from 'react';
import { useRouter } from 'next/router';

export default function AthleteDetail({ athlete = null }) {
  const router = useRouter();
  const a = athlete ?? {};

  // Fallback-Anzeige, falls bei CSR noch geladen wird
  if (router.isFallback) {
    return <main style={{ padding: 24 }}><p>Loading…</p></main>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Athlete</h1>
      <p><strong>Name:</strong> {a?.name ?? 'Unknown'}</p>
      <p><strong>ID:</strong> {a?.id ?? 'n/a'}</p>

      <section style={{ marginTop: 16 }}>
        <h2>Results</h2>
        {Array.isArray(a?.results) && a.results.length > 0 ? (
          <ul>
            {a.results.map((r, i) => (
              <li key={r?.id ?? i}>
                {r?.event ?? 'Event'} {r?.time ? `— ${r.time}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>No results yet.</p>
        )}
      </section>
    </main>
  );
}

// Keine SSG-Pfade – Server-Side per Request:
export async function getServerSideProps(context) {
  const { id } = context.params ?? {};
  // TODO: echtes Laden per id später einbauen
  // Temporär: definierte Struktur zurückgeben
  return {
    props: {
      athlete: id ? { id, name: `Athlete ${id}`, results: [] } : { id: null, name: 'Unknown', results: [] }
    }
  };
}
