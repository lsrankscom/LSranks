import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const onLang = (code) => {
    // einfache clientseitige Sprachumschaltung per Route-Präfix, wenn du i18n-Routing nutzt.
    // Hier nur Platzhalter: leite auf /{code} weiter, ansonsten bleib auf aktueller Seite.
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/(en|de|fr|es|it|nl)/, '');
      if (code === 'en') window.location.href = path || '/';
      else window.location.href = `/${code}${path || ''}`;
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label="LSranks Home">
          <img src="/logo.svg" alt="" width={28} height={28} />
          <span>LSranks</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/competitions">Competitions</Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/records">Records</Link>
          <Link href="/stats">Info Stats</Link>
          <Link href="/about">About</Link>
          <Link href="/admin">Admin</Link>
          <LanguageSwitcher onChange={onLang} />
        </nav>
      </div>
    </header>
  );
}
