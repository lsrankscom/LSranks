export default function Home() {
  return (
    <div className="text-center space-y-10">
      <h1 className="text-4xl font-bold mt-10 text-brand-700 dark:text-brand-400">
        Willkommen bei LSranks
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        Deine globale Plattform für Lifesaving Ergebnisse, Ranglisten und Rekorde.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <a href="/records" className="card p-8 hover:shadow-lg transition rounded-lg">
          <h2 className="text-xl font-semibold mb-2">🌍 Weltrekorde</h2>
          <p>Alle offiziellen Lifesaving-Rekorde weltweit, sortiert nach Disziplin und Nation.</p>
        </a>

        <a href="/results" className="card p-8 hover:shadow-lg transition rounded-lg">
          <h2 className="text-xl font-semibold mb-2">🏁 Ergebnisse</h2>
          <p>Vergleiche Zeiten aus Pool & Ocean Wettkämpfen aller Nationen.</p>
        </a>

        <a href="/about" className="card p-8 hover:shadow-lg transition rounded-lg">
          <h2 className="text-xl font-semibold mb-2">ℹ️ Über das Projekt</h2>
          <p>Erfahre mehr über LSranks und wie du mitmachen oder Daten einsenden kannst.</p>
        </a>
      </div>
    </div>
  );
}
