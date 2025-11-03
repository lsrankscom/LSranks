// components/NavBar.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useI18n } from '../lib/i18n';

export default function NavBar() {
  const { t } = useI18n();
  const router = useRouter();

  const links = [
    { href: '/pool',    label: t('nav_pool') },
    { href: '/records', label: t('nav_records') },
    { href: '/results', label: t('nav_results') },
    { href: '/about',   label: t('nav_about') },
  ];

  return (
    <header style={wrap}>
      <div style={inner}>
        <Link href="/" style={brand}>LSRanks</Link>
        <nav aria-label="Main">
          <ul style={ul}>
            {links.map((l) => {
              const active = router.pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{
                      ...a,
                      ...(active ? aActive : {}),
                    }}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

const wrap = {
  position: 'sticky',
  top: 0,
  zIndex: 500,
  background: '#0b2a4a',
  borderBottom: '1px solid rgba(255,255,255,.08)',
};

const inner = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '10px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 20,
};

const brand = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: 700,
  letterSpacing: '.3px',
};

const ul = {
  listStyle: 'none',
  display: 'flex',
  gap: 16,
  margin: 0,
  padding: 0,
};

const a = {
  color: 'rgba(255,255,255,.85)',
  textDecoration: 'none',
  fontWeight: 500,
  padding: '6px 8px',
  borderRadius: 8,
};

const aActive = {
  color: '#fff',
  background: 'rgba(255,255,255,.12)',
};
