/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ["en", "de", "es", "fr", "it", "nl"],
    defaultLocale: "en",
  },
  // optional: falls du static export nutzt, kann das aktiv bleiben
  // output: 'export',
};

module.exports = nextConfig;
