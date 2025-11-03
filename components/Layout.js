// components/Layout.js
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/competitions', label: 'Competitions' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/records', label: 'Records' },
  { href: '/news', label: 'News' },
  { href: '/admin', label: 'Admin' },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useRouter();

  return (
    <>
      <nav className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
            <span>●</span><h1>LS<span style={{color:'var(--brand)'}}>ranks</span></h1>
          </Link>

          <button className="btn nav-toggle" onClick={() => setOpen(v => !v)} aria-label="Menu">
            {open ? 'Close' : 'Menu'}
          </button>

          <div className="navlinks">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        {open && (
          <div className="container nav-drawer">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={pathname === l.href ? 'active' : ''}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="page">
        <div className="container">{children}</div>
      </main>

      <footer className="footer">
        <div className="container">© {new Date().getFullYear()} LSranks — Lifesaving rankings & results</div>
      </footer>
    </>
  );
}
