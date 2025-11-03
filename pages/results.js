import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function msToTime(ms){const m=Math.floor(ms/60000);const s=Math.floor((ms%60000)/1000);const ms3=String(ms%1000).padStart(3,'0');return `${m}:${String(s).padStart(2,'0')}.${ms3}`;}

export async function getServerSideProps() {
  const { data } = await supabase
    .from('results')
    .select('*, competitions(name)')
    .order('id', { ascending: false })
    .limit(50);
  return { props: { rows: data ?? [] } };
}

export default function Results({ rows }) {
  return (
    <main style={{ padding:'2rem', maxWidth: 1100, margin:'0 auto' }}>
      <Navbar />
      <h1>Latest Results</h1>
      {(!rows || rows.length===0) && <p>No results yet. Add some in Supabase → results.</p>}
      {rows && rows.length>0 && (
        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'1rem' }}>
          <thead>
            <tr>
              <th>Competition</th><th>Discipline</th><th>Gender</th><th>Round</th>
              <th>Athlete</th><th>Nation</th><th>Club</th><th>Time</th><th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.competitions?.name || '-'}</td>
                <td>{r.discipline_code}</td>
                <td style={{textAlign:'center'}}>{r.gender}</td>
                <td>{r.round}</td>
                <td>{r.athlete_name}</td>
                <td style={{textAlign:'center'}}>{r.nation}</td>
                <td>{r.club}</td>
                <td style={{textAlign:'center'}}>{r.time_ms ? msToTime(r.time_ms) : r.status}</td>
                <td style={{textAlign:'center'}}>{r.rank ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
