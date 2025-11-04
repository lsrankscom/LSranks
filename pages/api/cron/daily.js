const SYNC_SECRET = process.env.SYNC_SECRET;

async function call(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return await res.json();
}

export default async function handler(req, res) {
  try {
    // Basis: gleiche Domain
    const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN || `https://${req.headers.host}`;
    const secret = SYNC_SECRET ? `?secret=${encodeURIComponent(SYNC_SECRET)}` : '';

    const endpoints = [
      `${origin}/api/sync/ils-world-records${secret}`,
      // zukünftig: `${origin}/api/sync/nation/aus${secret}`, `${origin}/api/sync/nation/ger${secret}`, ...
    ];

    const results = [];
    for (const ep of endpoints) {
      try { results.push({ ep, out: await call(ep) }); }
      catch (e) { results.push({ ep, error: String(e.message || e) }); }
    }
    res.status(200).json({ ok:true, results });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e.message || e) });
  }
}
