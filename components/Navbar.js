import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <nav className="container flex flex-wrap items-center gap-3 py-3">
        <Link href="/" className="text-xl font-bold text-brand-700">
          LSRanks
        </Link>
        <div className="flex-1" />
        <div className="flex gap-5 text-sm">
          <Link href="/results" className="hover:text-brand-700">Results</Link>
          <Link href="/records" className="hover:text-brand-700">Records</Link>
          <Link href="/nations" className="hover:text-brand-700">Nations</Link>
          <Link href="/athletes" className="hover:text-brand-700">Athletes</Link>
          <Link href="/about" className="hover:text-brand-700">About</Link>
          <Link href="/contact" className="hover:text-brand-700">Contact</Link>
        </div>
      </nav>
    </header>
  );
}
