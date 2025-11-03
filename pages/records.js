import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function msToTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${hundredths
    .toString()
    .padStart(2, "0")}`;
}

export default function Records({ rows, err }) {
  return (
    <>
      <Navbar />
      <main className="container py-10">
        <h1 className="text-2xl font-bold mb-6 text-brand-700">
          World / National Records
        </h1>

        {err && <p className="text-red-600">{err}</p>}

        {!rows || rows.length === 0 ? (
          <p className="text-gray-600">
            No records yet. Add one in Supabase → <strong>records</strong>.
          </p>
        ) : (
          <div className="card overflow-hidden">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-2 text-center">Gender</th>
                  <th className="py-3 px-2 text-center">Pool</th>
                  <th className="py-3 px-2 text-center">Time</th>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-2 text-center">Nation</th>
                  <th className="py-3 px-4">Meet / Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 px-4">{r.discipline_code}</td>
                    <td className="py-2 px-2 text-center">{r.gender}</td>
                    <td className="py-2 px-2 text-center">
                      {r.pool_length ?? "-"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {r.time_ms ? msToTime(r.time_ms) : "-"}
                    </td>
                    <td className="py-2 px-4">
                      {r.athlete_name}
                      {r.club ? ` (${r.club})` : ""}
                    </td>
                    <td className="py-2 px-2 text-center">{r.nation}</td>
                    <td className="py-2 px-4">
                      {r.meet_name}
                      {r.record_date ? ` (${r.record_date})` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .order("time_ms", { ascending: true });
  return { props: { rows: data ?? [], err: error?.message ?? null } };
}
