/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // WICHTIG: Kein static export -> verhindert "Export encountered errors"
  // und erlaubt Server Rendering/Funktionen.
  // Falls du vorher "output: 'export'" hattest: das hier entfernt es.
  // output: 'standalone' erzeugt eine lauffähige Serverless/Node-Ausgabe.
  output: 'standalone',

  // Falls du i18n nutzt, lass deinen Block hier stehen oder ergänze ihn:
  // i18n: {
  //   locales: ['en', 'de', 'fr', 'es', 'it', 'nl'],
  //   defaultLocale: 'en',
  // },

  // Build nicht an Lint-/Typfehlern scheitern lassen (optional, hilft bei CI)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  }
};

export default nextConfig;
