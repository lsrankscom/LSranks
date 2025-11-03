// pages/calendar.js
import { getCalendar } from '../lib/data';

export default function CalendarPage({ events }) {
  const rows = Array.isArray(events) ? events : [];
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Calendar</h2>
        <span className="badge">{rows.length} events</span>
      </div>
      <div className="section-content">
        {rows.length === 0 ? <p className="muted">No events scheduled.</p> : (
          <table className="table">
            <thead><tr><th>Date</th><th>Event</th><th>Location</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={e?.id ?? i}>
                  <td>{e?.date ?? '—'}</td>
                  <td>{e?.name ?? '—'}</td>
                  <td>{e?.location ?? '—'}</td>
                  <td>{e?.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const events = await getCalendar(200);
  return { props: { events } };
}
