// lib/i18n.js
import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const I18nCtx = createContext();

const MESSAGES = {
  en: {
    pool: 'Pool',
    records: 'Records',
    results: 'Results',
    about: 'About',
    admin: 'Admin',
    competitions: 'Competitions',
    calendar: 'Calendar',
    hero_title: 'Lifesaving Rankings & Records',
    hero_sub: 'Search athletes, explore competitions and browse world records.',
    search_placeholder: 'Search for athletes…',
    competitions_teaser: 'Find meets, entries and results.',
    records_teaser: 'Browse world, masters & youth records.',
    competitions_intro: 'Competitions overview will be available soon.',
    calendar_intro: 'Season calendar will be available soon.',
  },
  de: {
    pool: 'Pool',
    records: 'Rekorde',
    results: 'Ergebnisse',
    about: 'Über',
    admin: 'Admin',
    competitions: 'Wettkämpfe',
    calendar: 'Kalender',
    hero_title: 'Rettungssport – Rankings & Rekorde',
    hero_sub: 'Suche Athlet:innen, entdecke Wettkämpfe und stöbere in Rekorden.',
    search_placeholder: 'Athleten suchen…',
    competitions_teaser: 'Wettkämpfe, Meldungen und Ergebnisse.',
    records_teaser: 'Open, Masters & Youth Rekorde.',
    competitions_intro: 'Übersicht der Wettkämpfe folgt bald.',
    calendar_intro: 'Saisonkalender folgt bald.',
  },
  fr: {
    pool: 'Piscine',
    records: 'Records',
    results: 'Résultats',
    about: 'À propos',
    admin: 'Admin',
    competitions: 'Compétitions',
    calendar: 'Calendrier',
    hero_title: 'Classements & records en sauvetage',
    hero_sub: 'Recherchez des athlètes, compétitions et records.',
    search_placeholder: 'Rechercher des athlètes…',
    competitions_teaser: 'Compétitions, engagements et résultats.',
    records_teaser: 'Records mondiaux, masters & jeunes.',
    competitions_intro: 'Aperçu des compétitions bientôt disponible.',
    calendar_intro: 'Calendrier de saison bientôt disponible.',
  },
  es: {
    pool: 'Piscina',
    records: 'Récords',
    results: 'Resultados',
    about: 'Acerca de',
    admin: 'Admin',
    competitions: 'Competiciones',
    calendar: 'Calendario',
    hero_title: 'Clasificaciones y récords de salvamento',
    hero_sub: 'Busca atletas, competiciones y récords.',
    search_placeholder: 'Buscar atletas…',
    competitions_teaser: 'Competiciones, inscripciones y resultados.',
    records_teaser: 'Récords mundiales, masters y juveniles.',
    competitions_intro: 'Resumen de competiciones disponible pronto.',
    calendar_intro: 'Calendario de temporada disponible pronto.',
  },
  it: {
    pool: 'Piscina',
    records: 'Record',
    results: 'Risultati',
    about: 'Info',
    admin: 'Admin',
    competitions: 'Gare',
    calendar: 'Calendario',
    hero_title: 'Ranking e record nel salvamento',
    hero_sub: 'Cerca atleti, gare e record.',
    search_placeholder: 'Cerca atleti…',
    competitions_teaser: 'Gare, iscrizioni e risultati.',
    records_teaser: 'Record mondiali, master e youth.',
    competitions_intro: 'Panoramica gare in arrivo.',
    calendar_intro: 'Calendario stagionale in arrivo.',
  },
};

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');

  // persist language in localStorage (client only)
  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('lang');
    if (stored && MESSAGES[stored]) setLang(stored);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    languages: [
      { code: 'en', label: 'EN' },
      { code: 'de', label: 'DE' },
      { code: 'fr', label: 'FR' },
      { code: 'es', label: 'ES' },
      { code: 'it', label: 'IT' },
    ],
    t: (key) => (MESSAGES[lang] && MESSAGES[lang][key]) || key,
  }), [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
