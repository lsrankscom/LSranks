// pages/_app.js
import '../styles/globals.css';
import { I18nProvider } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NavBar from '../components/NavBar';

export default function MyApp({ Component, pageProps }) {
  return (
    <I18nProvider>
      <NavBar />
      <LanguageSwitcher />
      <Component {...pageProps} />
    </I18nProvider>
  );
}
