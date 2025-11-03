// pages/_app.js
import '../styles/globals.css';
import { I18nProvider } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function MyApp({ Component, pageProps }) {
  return (
    <I18nProvider>
      {/* Sprachwahl global */}
      <LanguageSwitcher />
      <Component {...pageProps} />
    </I18nProvider>
  );
}
