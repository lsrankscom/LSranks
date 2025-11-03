/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ["en", "de", "es", "fr", "it", "nl"],
    defaultLocale: "en",
  },
  // output: 'export', // nur aktivieren, wenn du wirklich Static Export willst
};

export default nextConfig;
