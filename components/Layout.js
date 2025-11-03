export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <a href="/" className="text-xl font-bold text-brand-700 dark:text-brand-400">
            LS<span className="text-brand-500">Ranks</span>
          </a>
          <nav className="space-x-6 text-sm font-medium">
            <a href="/records" className="hover:text-brand-500">Records</a>
            <a href="/results" className="hover:text-brand-500">Results</a>
            <a href="/about" className="hover:text-brand-500">About</a>
          </nav>
        </div>
      </header>

      {/* Inhalt */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center py-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} LSranks — Lifesaving Results Platform</p>
        <p>
          <a href="mailto:info@lsranks.com" className="hover:text-brand-500">info@lsranks.com</a>
        </p>
      </footer>
    </div>
  );
}
