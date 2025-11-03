const POOL_EVENTS = [
  // Einzel
  { code: "200_OBS",      name: "200 m Obstacle Swim",     kind: "Individual" },
  { code: "50_MAN",       name: "50 m Manikin Carry",      kind: "Individual" },
  { code: "100_MAN_FINS", name: "100 m Manikin Carry w/ Fins", kind: "Individual" },
  { code: "100_MEDLEY",   name: "100 m Rescue Medley",     kind: "Individual" },
  { code: "100_TOW_FINS", name: "100 m Manikin Tow w/ Fins",   kind: "Individual" },
  { code: "200_SUPER",    name: "200 m Super Lifesaver",   kind: "Individual" },
  // Staffeln + Pairs
  { code: "R4x50_OBS",    name: "4×50 m Obstacle Relay",   kind: "Relay" },
  { code: "R4x25_MAN",    name: "4×25 m Manikin Relay",    kind: "Relay" },
  { code: "R4x50_MEDLEY", name: "4×50 m Medley Relay",     kind: "Relay" },
  { code: "R4x50_TUBE",   name: "4×50 m Rescue Tube Relay",kind: "Relay" },
  { code: "LINE_THROW",   name: "Line Throw (2-person)",   kind: "Pairs" },
];

export default function Pool() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-brand-700 dark:text-brand-400">🏊 Pool Events</h1>

      <h2 className="text-lg font-semibold mt-6 mb-3">Individual</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {POOL_EVENTS.filter(e => e.kind === "Individual").map(e => (
          <a key={e.code} href={`/results?disc=${e.code}`} className="card p-5 hover:shadow-lg rounded-lg">
            <div className="font-medium">{e.name}</div>
            <div className="text-sm text-gray-500 mt-1">View latest results & records</div>
          </a>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-3">Relays</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {POOL_EVENTS.filter(e => e.kind === "Relay").map(e => (
          <a key={e.code} href={`/results?disc=${e.code}`} className="card p-5 hover:shadow-lg rounded-lg">
            <div className="font-medium">{e.name}</div>
            <div className="text-sm text-gray-500 mt-1">View latest results & records</div>
          </a>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-3">Pairs</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {POOL_EVENTS.filter(e => e.kind === "Pairs").map(e => (
          <a key={e.code} href={`/results?disc=${e.code}`} className="card p-5 hover:shadow-lg rounded-lg">
            <div className="font-medium">{e.name}</div>
            <div className="text-sm text-gray-500 mt-1">View latest results & records</div>
          </a>
        ))}
      </div>
    </div>
  );
}
