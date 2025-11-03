import { useState } from "react";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        dark ? "dark bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      } transition-colors`}
    >
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <a href="/" className="text-xl font-bold text-brand-700 dark:text-brand-400">
            LS<span className="text-brand-500">Ranks</span>
          </a>

          {/* Desktop-Navigation */}
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <a href="/pool" className="hover:text-brand-500">Pool</a>
            <a href="/records" className="hover:text-brand-500">Records</a>
            <a href="/results" className="hover:text-brand-500">Results</a>
            <a href="/about" className="hover:text-brand-500">About</a>
          </nav>

          {/* Buttons rechts */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Dark / Light Mode"
            >
              {dark ? "🌙" : "☀️"}
            </button>
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menü"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile-Menü */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <nav className="flex flex-col items-center py-3 space-y-2 text-sm font-medium">
              <a href="/pool" onClick={() => setMenuOpen(false)}>Pool</a>
              <a href="/records" onClick={() => setMenuOpen(false)}>Records</a>
              <a href="/results" onClick={() => setMenuOpen(false)}>Results</a>
              <a href="/about" onClick={() => setMenuOpen(false)}>About</a>
            </nav>
          </div>
        )}
      </header>

      {/* Inhalt */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} LSranks — Lifesaving Results Platform</p>
        <p>
          <a href="mailto:info@lsranks.com" className="hover:text-brand-500">info@lsranks.com</a>
        </p>
      </footer>
    </div>
  );
}
