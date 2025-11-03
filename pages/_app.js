// pages/_app.js
import Layout from '../components/Layout';
import { I18nProvider } from '../lib/i18n';

export default function MyApp({ Component, pageProps }) {
  // Auf dem Server gibt's keine URL -> initialLang = 'en'
  return (
    <I18nProvider initialLang="en">
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </I18nProvider>
  );
}
