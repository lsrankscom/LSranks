import React from 'react';

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

export default function LanguageSwitcher({ current = 'en', onChange }) {
  const [open, setOpen] = React.useState(false);
  const active = LANGS.find(l => l.code === current) || LANGS[0];
  return (
    <div className={`lang ${open ? 'open' : ''}`} onBlur={() => setOpen(false)} tabIndex={0}>
      <button className="lang-btn" onClick={() => setOpen(v => !v)} aria-label="Change language">
        <span>{active.flag}</span>
        <span>{active.label}</span>
      </button>
      <div className="lang-menu">
        {LANGS.map(l => (
          <div key={l.code} className="lang-item" onMouseDown={() => { onChange?.(l.code); setOpen(false); }}>
            <span style={{fontSize:18}}>{l.flag}</span><span>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
