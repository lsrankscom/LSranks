// pages/api/env-check.js
export default function handler(req, res) {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSrv = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasCron = !!process.env.CRON_SECRET;

  res.status(200).json({
    ok: true,
    NEXT_PUBLIC_SUPABASE_URL_set: hasUrl,
    SUPABASE_SERVICE_ROLE_KEY_set: hasSrv,
    CRON_SECRET_set: hasCron,
  });
}
