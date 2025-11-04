// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Falls du einige Pages als statisch exportierst, aber Daten fehlen,
  // crasht der Build nicht sofort (nur Warnung). Optional:
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Wenn du Supabase auf dem Client brauchst:
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};
module.exports = nextConfig;
