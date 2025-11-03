// pages/records.js
import Head from "next/head";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function msToTime(ms) {
  if (ms == null) return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  const mm = minutes > 0 ? `${minutes}:` : "";
  const ss = `${seconds}`.padStart(minutes > 0 ? 2 : 1, "0");
  const hh = `${hundredths}`.padStart(2, "0");
  return `${mm}${ss}.${hh}`;
}

export async function getServerSideProps({ query }) {
  const pool = query.pool ? Number(query.pool) : null; // 25 oder 50 optional
  const gender = query.gender || null; // "M" | "W" | null
  const disc = query.disc || null; // z.B. "OPEN_100M_RESCUE_MEDLEY"

  let q = supabase
    .from("records")
    .select(
      "discipline_code, gender, pool_length, timing, time_ms, athlete_name, nation, club, meet_name, record_date, source_url"
    )
    .eq("record_scope", "world");

  if (pool) q = q.eq("pool_length", pool);
  if (gender) q = q.eq("gender", gender);
  if (disc) q = q.eq("discipline_code", disc);

  // sinnvolle Default-Sortierung
  q = q
    .order("discipline_code", { ascending: true })
    .order("gender", { ascending: true })
    .order("pool_length", { ascending: true });

  const { data, error } = await q;

  return {
    props: {
      records: data || [],
      error: error ? error.message : null,
      filters: { pool: pool || "", gender: gender || "", disc: disc || "" },
    },
  };
}

export default function RecordsPage({ records, error, filters }) {
  return (
    <>
      <Head>
        <title>World / National Records — LSRanks</title>
        <meta name="description" content="Official lifesaving world records list (auto-synced from ILS)." />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">World Records</h1>

        {/* Filter-Hinweise */}
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Optional filters via URL:&nbsp;
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            /records?pool=50&amp;gender=W&amp;disc=OPEN_100M_RESCUE_MEDLEY
          </code>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-800">
            Error: {error}
          </div>
        )}

        {records.length === 0 ? (
          <p>No records found. Try removing filters or run the sync job.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left w-56">Discipline</th>
                  <th className="px-3 py-2 text-left w-14">G</th>
                  <th className="px-3 py-2 text-left w-14">Pool</th>
                  <th className="px-3 py-2 text-left w-16">Timing</th>
                  <th className="px-3 py-2 text-left w-32">Time</th>
                  <th className="px-3 py-2 text-left w-64">Athlete</th>
                  <th className="px-3 py-2 text-left w-28">Nation</th>
                  <th className="px-3 py-2 text-left w-44">Club</th>
                  <th className="px-3 py-2 text-left w-44">Meet</th>
                  <th className="px-3 py-2 text-left w-32">Date</th>
                  <th className="px-3 py-2 text-left w-24">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2">{r.discipline_code}</td>
                    <td className="px-3 py-2">{r.gender}</td>
                    <td className="px-3 py-2">{r.pool_length ?? "—"}</td>
                    <td className="px-3 py-2">{r.timing ?? "—"}</td>
                    <td className="px-3 py-2 font-medium">{msToTime(r.time_ms)}</td>
                    <td className="px-3 py-2">{r.athlete_name || "—"}</td>
                    <td className="px-3 py-2">{r.nation || "—"}</td>
                    <td className="px-3 py-2">{r.club || "—"}</td>
                    <td className="px-3 py-2">{r.meet_name || "—"}</td>
                    <td className="px-3 py-2">{r.record_date || "—"}</td>
                    <td className="px-3 py-2">
                      {r.source_url ? (
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2 hover:no-underline"
                        >
                          ILS
                        </a>
                      ) : (
                        "—"
                      )}
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
