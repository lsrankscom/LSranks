// pages/_app.js
import '../styles/globals.css';
import { I18nProvider } from '../lib/i18n';

export default function App({ Component, pageProps }) {
  return (
    <I18nProvider initialLocale={pageProps?.locale}>
      <Component {...pageProps} />
    </I18nProvider>
  );
}
