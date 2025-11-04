export default async function handler(req, res) {
  try {
    // Triggert das Einlesen (hier nur Beispiel; passe SELF_URL in den Env-Variablen an)
    if (process.env.SELF_URL) {
      await fetch(process.env.SELF_URL + "/api/records/ilsf").then(() => {});
      await fetch(process.env.SELF_URL + "/api/records/national").then(() => {});
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.json({ ok: false, error: String(e) });
  }
}
