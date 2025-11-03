// pages/records.js
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function formatMs(ms) {
  if (ms == null) return '—'
  const total = Number(ms)
  const minutes = Math.floor(total / 60000)
  const seconds = Math.floor((total % 60000) / 1000)
  const hundredths = Math.floor((total % 1000) / 10)
  const mm = String(minutes)
  const ss = String(seconds).padStart(2, '0')
  const hh = String(hundredths).padStart(2, '0')
  return minutes > 0 ? `${mm}:${ss}.${hh}` : `${seconds}.${hh}`
}

export async function getServerSideProps({ query }) {
  const { pool, gender, disc } = query

  let q = supabase
    .from('records')
    .select('*')
    .eq('record_scope', 'world')
    .order('discipline_code', { ascending: true })
    .order('gender', { ascending: true })
    .order('pool_length', { ascending: true })

  if (pool) q = q.eq('pool_length', Number(pool))
  if (gender) q = q.eq('gender', gender)
  if (disc) q = q.eq('discipline_code', disc)

  const { data, error } = await q
  return { props: { rows: data ?? [], error: error?.message ?? null, query: { pool: pool ?? '', gender: gender ?? '', disc: disc ?? '' } } }
}

export default function RecordsPage({ rows, error, query }) {
  return (
    <>
      <Head>
        <title>World Records • LSRanks</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">World Records</h1>

        <p className="text-sm mb-4 text-gray-600">
          Optional filters via URL:&nbsp;
          <code className="rounded bg-gray-100 px-2 py-1">
            /records?pool=50&amp;gender=W&amp;disc=OPEN_100M_RESCUE_MEDLEY
          </code>
        </p>

        {error && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2">Discipline</th>
                <th className="px-3 py-2">G</th>
                <th className="px-3 py-2">Pool</th>
                <th className="px-3 py-2">Timing</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Athlete</th>
                <th className="px-3 py-2">Nation</th>
                <th className="px-3 py-2">Club</th>
                <th className="px-3 py-2">Meet</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                    No records found. Try removing filters or run the sync job.
                  </td>
                </tr>
              )}

              {rows.map((r, i) => (
                <tr key={`${r.discipline_code}-${r.gender}-${r.pool_length}-${i}`} className="border-t">
                  <td className="px-3 py-2 font-medium">{r.discipline_code}</td>
                  <td className="px-3 py-2">{r.gender ?? '—'}</td>
                  <td className="px-3 py-2">{r.pool_length ?? '—'}</td>
                  <td className="px-3 py-2">{r.timing ?? '—'}</td>
                  <td className="px-3 py-2">{formatMs(r.time_ms)}</td>
                  <td className="px-3 py-2">{r.athlete_name ?? '—'}</td>
                  <td className="px-3 py-2">{r.nation ?? '—'}</td>
                  <td className="px-3 py-2">{r.club ?? '—'}</td>
                  <td className="px-3 py-2">{r.meet_name ?? '—'}</td>
                  <td className="px-3 py-2">{r.record_date ?? '—'}</td>
                  <td className="px-3 py-2">
                    {r.source_url ? (
                      <a href={r.source_url} target="_blank" rel="noreferrer" className="underline">
                        Link
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
