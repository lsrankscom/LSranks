import Layout from '../components/Layout';

export async function getServerSideProps() {
  // Lies sicher serverseitig aus Supabase. Du kannst hier Deinen bestehenden DB-Client nutzen.
  // Um in jedem Projekt zu funktionieren, verwenden wir fetch gegen eine deiner API-Routen.
  try {
    const base = process.env.NEXT_PUBLIC_SITE_ORIGIN || '';
    const res = await fetch(`${base}/api/records-list`, { headers: { 'x-internal': '1' } });
    const data = res.ok ? await res.json() : { items: [] };
    return { props: { items: Array.isArray(data.items) ? data.items : [] } };
  } catch {
    return { props: { items: [] } };
  }
}

export default function Records({ items }) {
  const rows = Array.isArray(items) ? items : [];
  return (
    <Layout>
      <h1>World Records</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Discipline</th><th>Gender</th><th>Category</th>
              <th>Athlete</th><th>Nation</th><th>Performance</th>
              <th>Date</th><th>Venue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="8" style={{color:'#6f7b90'}}>No records yet.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.uniq_key || i}`}>
                <td>{r.discipline || '-'}</td>
                <td>{r.gender || '-'}</td>
                <td>{r.category || '-'}</td>
                <td>{r.athlete || '-'}</td>
                <td>{r.nation || '-'}</td>
                <td><strong>{r.performance || '-'}</strong></td>
                <td>{r.date || '-'}</td>
                <td>{r.venue || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
