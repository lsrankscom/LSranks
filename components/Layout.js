// components/Layout.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useI18n } from '../lib/i18n';

const NAV = [
  { href: '/competitions', key: 'competitions' },
  { href: '/calendar', key: 'calendar' },
  { href: '/records', key: 'records' },
  { href: '/about', key: 'about' },
  { href: '/admin', key: 'admin' },
];

export default function Layout({ children }) {
  const { t, lang, setLang, languages } = useI18n();
  const { pathname } = useRouter();

  return (
    <>
      <header className="sticky top-0 z-50">
        <div className="w-full bg-gradient-to-b from-[#0e3a6d] to-[#1c4a86] text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_4px_10px_rgba(0,0,0,.12)]">
          <div className="mx-auto max-w-[1100px] px-4">
            <div className="flex items-center justify-between py-2.5 gap-3">
              {/* Brand */}
              <Link href="/" className="flex items-center gap-2 text-sky-50 hover:text-white">
                <span className="inline-grid place-items-center h-8 w-8 rounded-md bg-white/15 font-extrabold">LS</span>
                <span className="text-lg font-bold tracking-tight">Ranks</span>
              </Link>

              {/* Links */}
              <nav className="hidden sm:flex items-center gap-1">
                {NAV.map(({ href, key }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={[
                        'px-3 py-1.5 rounded-md text-sm font-semibold transition-colors',
                        active
                          ? 'text-white bg-white/15'
                          : 'text-sky-100 hover:text-white hover:bg-white/10',
                      ].join(' ')}
                    >
                      {t(key)}
                    </Link>
                  );
                })}
              </nav>

              {/* Language */}
              <div className="flex items-center gap-1">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="bg-white/10 text-sky-50 text-sm font-semibold px-2.5 py-1.5 rounded-md outline-none hover:bg-white/15 focus:bg-white/20"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#0e3a6d]">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="h-2 bg-gradient-to-b from-black/10 to-transparent" />
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-6">{children}</main>
    </>
  );
}
