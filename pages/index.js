// pages/index.js
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';

export default function Home() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef();

  useEffect(() => {
    if (!q) { setHits([]); return; }
    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const run = async () => {
      try {
        const res = await fetch(`/api/athletes-search?q=${encodeURIComponent(q)}&limit=10`, { signal: ctrl.signal });
        const data = await res.json();
        setHits(data.results || []);
      } catch {}
      setLoading(false);
    };
    const id = setTimeout(run, 200); // debounce
    return () => clearTimeout(id);
  }, [q]);

  return (
    <Layout>
      {/* Hero */}
      <section className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white">
        <div className="px-6 py-10 md:px-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t('hero_title')}</h1>
          <p className="mt-2 text-white/90">{t('hero_sub')}</p>

          {/* Search */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 px-4 py-3 pr-12 shadow focus:outline-none focus:ring-4 ring-white/30"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {loading ? <span className="animate-pulse">…</span> : '🔎'}
              </div>
            </div>

            {/* Results dropdown */}
            {hits.length > 0 && (
              <ul className="mt-2 rounded-xl bg-white/95 text-gray-900 shadow divide-y max-h-80 overflow-auto">
                {hits.map((a) => (
                  <li key={a.id} className="px-4 py-2 hover:bg-gray-100">
                    <a href={`/athletes/${a.id}`} className="flex items-center justify-between">
                      <span className="font-semibold">{a.full_name}</span>
                      <span className="text-sm text-gray-500">{[a.club, a.nation].filter(Boolean).join(' · ')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Teaser Cards (optional) */}
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <a href="/competitions" className="rounded-xl border border-gray-200 p-4 hover:border-gray-300">
          <h3 className="font-bold">{t('competitions')}</h3>
          <p className="text-sm text-gray-600 mt-1">{t('competitions_teaser')}</p>
        </a>
        <a href="/records" className="rounded-xl border border-gray-200 p-4 hover:border-gray-300">
          <h3 className="font-bold">{t('records')}</h3>
          <p className="text-sm text-gray-600 mt-1">{t('records_teaser')}</p>
        </a>
      </div>
    </Layout>
  );
}
