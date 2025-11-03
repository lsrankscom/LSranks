import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link href="/">Home</Link>
      <Link href="/results">Results</Link>
      <Link href="/records">Records</Link>
      <Link href="/nations">Nations</Link>
      <Link href="/about">About</Link>
      <Link href="/contact">Contact</Link>
    </nav>
  );
}
