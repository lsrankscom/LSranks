import { createClient } from "@supabase/supabase-js";
import { nationToFlag } from "../lib/flags";

export async function getServerSideProps(context) {
  const disc = context.query.disc || null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let query = supabase.from("records").select("*");

  if (disc) {
    query = query.eq("discipline_code", disc);
  } else {
    const poolCodes = [
      "200_OBS","50_MAN","100_MAN_FINS","100_MEDLEY","100_TOW_FINS","200_SUPER",
      "R4x50_OBS","R4x25_MAN","R4x50_MEDLEY","R4x50_TUBE","LINE_THROW"
    ];
    query = query.in("discipline_code", poolCodes);
  }

  const { data, error } = await query.order("discipline_code", { ascending: true });

  return { props: { rows: data ?? [], err: error?.message ?? null, disc: disc || null } };
}

export default function Records({ rows, err, disc }) {
  if (err) return <p className="text-red-500">Error: {err}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-brand-700 dark:text-brand-400">
        🌍 World / National Records {disc ? `– ${disc}` : ""}
      </h1>

      <div className="overflow-x-auto">
        <table className="table w-full text-sm border-collapse overflow-hidden rounded-lg">
          <thead>
            <tr>
              <th>Discipline</th>
              <th>Gender</th>
              <th>Time</th>
              <th>Athlete</th>
              <th>Nation</th>
              <th>Club</th>
              <th>Meet</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const flag = nationToFlag(r.nation);
              return (
                <tr key={i}>
                  <td>{r.discipline_code}</td>
                  <td>{r.gender}</td>
                  <td className="time-fastest">{(r.time_ms / 1000).toFixed(2)} s</td>
                  <td>{r.athlete_name}</td>
                  <td>
                    <span className="mr-1">{flag}</span>
                    <span className="badge badge-nation">{r.nation}</span>
                  </td>
                  <td><span className="badge badge-club">{r.club}</span></td>
                  <td>{r.meet_name}</td>
                  <td>{r.record_date?.split("T")[0]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Tipp: Filter per <code>?disc=CODE</code>, z. B. <code>/records?disc=100_MEDLEY</code>
      </p>
    </div>
  );
}
