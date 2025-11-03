import { createClient } from "@supabase/supabase-js";

export async function getServerSideProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from("results")
    .select("*")
    .order("competition_id", { ascending: false });

  return { props: { rows: data ?? [], err: error?.message ?? null } };
}

export default function Results({ rows, err }) {
  if (err) return <p className="text-red-500">Error: {err}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-brand-700 dark:text-brand-400">
        🏁 Ergebnisse aus Pool & Ocean Wettkämpfen
      </h1>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Discipline</th>
              <th>Gender</th>
              <th>Athlete</th>
              <th>Nation</th>
              <th>Club</th>
              <th>Rank</th>
              <th>Time</th>
              <th>Competition</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.discipline_code}</td>
                <td>{r.gender}</td>
                <td>{r.athlete_name}</td>
                <td>
                  <span className="badge badge-nation">{r.nation}</span>
                </td>
                <td>
                  <span className="badge badge-club">{r.club}</span>
                </td>
                <td>{r.rank}</td>
                <td className="time-fastest">
                  {(r.time_ms / 1000).toFixed(2)} s
                </td>
                <td>{r.competition_name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
