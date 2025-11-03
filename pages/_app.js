// pages/_app.js
import { useEffect } from 'react'
import Layout from '../components/Layout'

export default function MyApp({ Component, pageProps }) {
  // Sprache aus ?lang merken (damit Navbar und Seiten konsistent sind)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    if (lang) localStorage.setItem('lang', lang);
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
