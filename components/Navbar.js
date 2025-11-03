// components/Navbar.js
import Link from 'next/link'
import { useRouter } from 'next/router'

const LABELS = {
  en: { pool: 'Pool', records: 'Records', results: 'Results', about: 'About' },
  de: { pool: 'Pool', records: 'Rekorde', results: 'Ergebnisse', about: 'Über' },
  fr: { pool: 'Piscine', records: 'Records', results: 'Résultats', about: 'À propos' },
  es: { pool: 'Piscina', records: 'Récords', results: 'Resultados', about: 'Acerca de' },
  it: { pool: 'Piscina', records: 'Record', results: 'Risultati', about: 'Info' },
  pl: { pool: 'Basen', records: 'Rekordy', results: 'Wyniki', about: 'O nas' },
  zh: { pool: '泳池', records: '纪录', results: '成绩', about: '关于' },
  ja: { pool: 'プール', records: '記録', results: '結果', about: '概要' },
};

function useLang() {
  const router = useRouter();
  const q = router.query || {};
  const lang = (q.lang || (typeof window !== 'undefined' && localStorage.getItem('lang')) || 'en').toString();
  return (LABELS[lang] ? lang : 'en');
}

function withLang(href, lang) {
  if (!href) return '#';
  const url = new URL(href, 'http://x'); // base is ignored in Next
  // keep existing query (if any) and set lang
  const sp = new URLSearchParams(url.search);
  sp.set('lang', lang);
  const qs = sp.toString();
  return `${url.pathname}${qs ? `?${qs}` : ''}`;
}

export default function Navbar() {
  const router = useRouter();
  const lang = useLang();
  const L = LABELS[lang];

  const basePath = (p) => withLang(p, lang);

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href={basePath('/')} className="brand">LSRanks</Link>
        <nav className="links">
          <Link href={basePath('/pool')}>{L.pool}</Link>
          <Link href={basePath('/records')}>{L.records}</Link>
          <Link href={basePath('/results')}>{L.results}</Link>
          <Link href={basePath('/about')}>{L.about}</Link>
        </nav>
      </div>
      <style jsx>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #0f172a; /* dunkelblau */
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .nav__inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .brand {
          font-weight: 700;
          color: #60a5fa;
          text-decoration: none;
          letter-spacing: 0.3px;
        }
        .links {
          display: flex;
          gap: 18px;
        }
        .links :global(a) {
          color: #e2e8f0;
          text-decoration: none;
          font-size: 14px;
        }
        .links :global(a:hover) {
          color: #ffffff;
          text-decoration: underline;
        }
      `}</style>
    </header>
  );
}
