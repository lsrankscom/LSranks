// Zeit-Parser: "M:SS.mm", "SS.mm", auch Komma statt Punkt
export function parseTimeToMs(s) {
  if (!s) return null;
  const str = String(s).trim().replace(",", ".");
  let m = 0, sec = 0, hund = 0;
  if (str.includes(":")) {
    const [mm, rest] = str.split(":");
    m = parseInt(mm, 10) || 0;
    const [ss, frac = "0"] = rest.split(".");
    sec = parseInt(ss, 10) || 0;
    hund = parseInt(frac.padEnd(2, "0").slice(0,2), 10) || 0;
  } else {
    const [ss, frac = "0"] = str.split(".");
    sec = parseInt(ss, 10) || 0;
    hund = parseInt(frac.padEnd(2, "0").slice(0,2), 10) || 0;
  }
  return ((m * 60) + sec) * 1000 + hund * 10;
}

// Disziplin-Namen -> Codes mappen (erweiterbar)
const DISC_ALIAS = {
  "200m hindernisschwimmen": "200_OBS",
  "200 m obstacle swim": "200_OBS",
  "50m manikin carry": "50_MAN",
  "50 m manikin carry": "50_MAN",
  "100m manikin carry with fins": "100_MAN_FINS",
  "100 m manikin carry with fins": "100_MAN_FINS",
  "100m rescue medley": "100_MEDLEY",
  "100 m rescue medley": "100_MEDLEY",
  "100m manikin tow with fins": "100_TOW_FINS",
  "100 m manikin tow with fins": "100_TOW_FINS",
  "200m super lifesaver": "200_SUPER",
  "200 m super lifesaver": "200_SUPER",
  "4x50m obstacle relay": "R4x50_OBS",
  "4×50 m obstacle relay": "R4x50_OBS",
  "4x25m manikin relay": "R4x25_MAN",
  "4x50m medley relay": "R4x50_MEDLEY",
  "4x50m rescue tube relay": "R4x50_TUBE",
  "line throw": "LINE_THROW",
};

export function normalizeDiscipline(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^[A-Z0-9_]+$/.test(s)) return s;   // schon ein Code
  const key = s.toLowerCase().replace(/\s+/g, " ");
  return DISC_ALIAS[key] || null;
}

export function normalizeGender(g) {
  const s = String(g || "").trim().toUpperCase();
  if (s.startsWith("M")) return "M";
  if (s.startsWith("F") || s.startsWith("W")) return "F";
  return "X";
}

export function toIntOrNull(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
