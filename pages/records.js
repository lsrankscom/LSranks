import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function msToTime(ms) {
  if (ms == null) return '';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms3 = String(ms % 1000).padStart(3, '0');
  return `${m}:${String(s).padStart(2, '0')}.${ms3}`;
}

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('discipline_code', { ascending: true });
  return { props: { rows: data ?? [], err: error?.message ?? null } };
}

export default function Records({ rows, err }) {
  return (
    <main style={{ padding: '2rem', maxWidth: 980, margin: '0 auto' }}>
      <Navbar />
      <h1>World / National Records</h1>

      {err && <p style={{color:'crimson'}}>Error: {err}</p>}
      {(!rows || rows.length === 0) && <p>No records yet. Add one in Supabase → Table Editor → records.</p>}

      {rows && rows.length > 0 && (
        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'1rem' }}>
          <thead>
            <tr>
              <th style={{textAlign:'left'}}>Discipline</th>
              <th>Gender</th>
              <th>Pool</th>
              <th>Time</th>
              <th style={{textAlign:'left'}}>Athlete</th>
              <th>Nation</th>
              <th style={{textAlign:'left'}}>Meet / Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.discipline_code}</td>
                <td style={{textAlign:'center'}}>{r.gender}</td>
                <td style={{textAlign:'center'}}>{r.pool_length ?? '-'}</td>
                <td style={{textAlign:'center'}}>{msToTime(r.time_ms)}</td>
                <td>{r.athlete_name}{r.club ? ` (${r.club})` : ''}</td>
                <td style={{textAlign:'center'}}>{r.nation}</td>
                <td>{r.meet_name}{r.record_date ? ` (${r.record_date})` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
