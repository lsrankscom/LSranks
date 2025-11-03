// pages/calendar.js
import React from 'react';

export default function CalendarPage({ events = [] }) {
  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <main style={{ padding: 24 }}>
      <h1>Calendar</h1>
      {safeEvents.length === 0 ? (
        <p>No events scheduled.</p>
      ) : (
        <ul>
          {safeEvents.map((e, i) => (
            <li key={e?.id ?? i}>
              {e?.title ?? 'Untitled'} {e?.date ? `— ${e.date}` : ''}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export async function getServerSideProps() {
  // TODO: echtes Laden später
  return { props: { events: [] } };
}
