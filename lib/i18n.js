// lib/i18n.js
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

const DICTS = {
  en: { pool: 'Pool', records: 'Records', results: 'Results', about: 'About' },
  de: { pool: 'Pool', records: 'Rekorde', results: 'Ergebnisse', about: 'Über' },
  fr: { pool: 'Piscine', records: 'Records', results: 'Résultats', about: 'À propos' },
  es: { pool: 'Piscina', records: 'Récords', results: 'Resultados', about: 'Acerca de' },
  it: { pool: 'Piscina', records: 'Record', results: 'Risultati', about: 'Info' },
  pl: { pool: 'Basen', records: 'Rekordy', results: 'Wyniki', about: 'O nas' },
  zh: { pool: '泳池', records: '纪录', results: '成绩', about: '关于' },
  ja: { pool: 'プール', records: '記録', results: '結果', about: '概要' },
};
const DEFAULT_LANG = 'en';

const I18nContext = createContext({
  lang: DEFAULT_LANG,
  t: (k) => (DICTS[DEFAULT_LANG][k] ?? k),
  setLang: () => {},
});

export function I18nProvider({ initialLang = DEFAULT_LANG, children }) {
  const [lang, setLang] = useState(initialLang);

  // Auf Client: lang aus URL oder localStorage übernehmen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('lang');
    const fromStore = window.localStorage.getItem('lang');
    const next = (fromUrl || fromStore || initialLang);
    setLang(DICTS[next] ? next : DEFAULT_LANG);
  }, [initialLang]);

  // gewählte Sprache im localStorage merken
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
    }
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t: (key) => (DICTS[lang]?.[key] ?? key),
    dict: DICTS[lang] || DICTS[DEFAULT_LANG],
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
