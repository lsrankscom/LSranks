import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>LSRanks — Lifesaving Results Platform</title>
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-6">
          Welcome to LSRanks
        </h1>

        <p className="text-lg text-slate-600 mb-8">
          The international Lifesaving Results Platform — tracking and comparing records worldwide.
        </p>

        {/* Hinweisbox */}
        <div className="mx-auto max-w-2xl rounded-lg border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <p className="text-amber-900 text-sm sm:text-base leading-relaxed">
            <strong>Important Notice:</strong>  
            This website is currently under development.  
            Data and results are being synchronized and verified — accuracy cannot be fully guaranteed at this stage.  
            Please check back soon for confirmed and up-to-date records.
          </p>
        </div>

        <div className="mt-10">
          <a
            href="/records"
            className="inline-block rounded bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            View World Records
          </a>
        </div>
      </main>
    </>
  );
}
