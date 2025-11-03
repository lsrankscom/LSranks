import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container py-10">
        <section className="card p-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            LSRanks – Lifesaving Results & Rankings
          </h1>
          <p className="text-gray-600">
            Global database for Pool & Ocean Lifesaving results, records, and rankings.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-6 mt-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-2">Pool</h2>
            <p className="text-gray-600">25/50 m, ET/HT, full discipline set.</p>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-2">Ocean</h2>
            <p className="text-gray-600">Beach sprint, flags, board, ski…</p>
          </div>
        </section>
      </main>
    </>
  );
}
