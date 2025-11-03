// pages/competitions/index.js
import { getCompetitions } from '../../lib/data';

export default function Competitions({ competitions }) {
  const rows = Array.isArray(competitions) ? competitions : [];
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Competitions</h2>
        <span className="badge">{rows.length} total</span>
      </div>
      <div className="section-content">
        {rows.length === 0 ? <p className="muted">No competitions yet.</p> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Date</th><th>Location</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((c, i) => (
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
  );
}

export async function getServerSideProps() {
  const competitions = await getCompetitions(200);
  return { props: { competitions } };
}
