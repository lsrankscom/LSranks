// lib/i18n.js
import React, { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/router';

const Ctx = createContext({ t: (k) => k, locale: 'en' });

export function I18nProvider({ children, initialLocale }) {
  const router = useRouter();
  const locale = initialLocale || router?.locale || 'en';

  // Hier könntest du später echte Übersetzungen einhängen:
  // const dict = locales[locale] ?? {};
  const dict = {}; // aktuell leer -> t(key) fällt auf key zurück

  const value = useMemo(() => ({
    locale,
    // Minimal-Übersetzer: t('key', {name:'…'})
    t: (key, vars = {}) => {
      const str = dict[key] || key;
      return Object.keys(vars).reduce(
        (s, k) => s.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(vars[k])),
        str
      );
    },
  }), [locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eigener Hook – viele deiner Seiten machen vermutlich: const { t } = useI18n();
export function useI18n() {
  return useContext(Ctx);
}

// Kompatibilität: falls irgendwo react-i18next-Stil genutzt wird:
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, i18n: { language: locale } };
}
