// Mappt gängige Nation-Codes aus dem Rettungssport (IOC/ISO3/Verbandskürzel) auf ISO-2.
// Ergänze hier nach Bedarf weitere Kürzel.
const IOC_TO_ISO2 = {
  GER: "DE", DEU: "DE", DE: "DE",
  AUS: "AU", AUSL: "AU", AU: "AU",
  NZL: "NZ", NZ: "NZ",
  GBR: "GB", UK: "GB", ENG: "GB", SCO: "GB", WLS: "GB", NIR: "GB",
  USA: "US", US: "US",
  CAN: "CA",
  FRA: "FR",
  ITA: "IT",
  ESP: "ES",
  POR: "PT",
  NED: "NL", NLD: "NL", NL: "NL",
  BEL: "BE",
  SWE: "SE",
  NOR: "NO",
  DEN: "DK", DNK: "DK",
  POL: "PL",
  CZE: "CZ",
  SVK: "SK",
  SUI: "CH", CHE: "CH",
  AUT: "AT",
  HUN: "HU",
  IRL: "IE",
  RSA: "ZA", ZAF: "ZA", SAF: "ZA",
  JPN: "JP",
  CHN: "CN",
  KOR: "KR",
  TPE: "TW",
  HKG: "HK",
  SGP: "SG",
  BRA: "BR",
  ARG: "AR",
  MEX: "MX",
};

// ISO-2 → Flaggen-Emoji
function iso2ToFlagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return "";
  const codePoints = [...iso2.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function nationToFlag(nationCode) {
  if (!nationCode) return "";
  const clean = String(nationCode).trim().toUpperCase();
  // Bereits ISO2?
  if (clean.length === 2) return iso2ToFlagEmoji(clean);
  const iso2 = IOC_TO_ISO2[clean];
  return iso2 ? iso2ToFlagEmoji(iso2) : "";
}
