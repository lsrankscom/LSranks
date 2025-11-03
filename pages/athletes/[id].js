// pages/athletes/[id].js
import { getAthleteById } from '../../lib/data';

export default function AthleteDetail({ athlete }) {
  const a = athlete || {};
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{a?.name ?? 'Athlete'}</h2>
        <span className="badge">{a?.country ?? '—'}</span>
      </div>
      <div className="section-content">
        <div className="list">
          <div className="card"><strong>Club</strong><div className="muted">{a?.club ?? '—'}</div></div>
          <div className="card"><strong>Country</strong><div className="muted">{a?.country ?? '—'}</div></div>
        </div>
        <div style={{marginTop:16}} className="card">
          <strong>Bio</strong>
          <p className="muted" style={{marginTop:8}}>{a?.biography ?? 'No biography yet.'}</p>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const id = ctx?.params?.id ?? null;
  const athlete = await getAthleteById(id);
  return { props: { athlete } };
}
