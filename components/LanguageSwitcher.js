// components/LanguageSwitcher.js
import { useI18n } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();

  return (
    <div style={wrapStyle}>
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          style={{
            ...btnStyle,
            ...(lang === l.code ? activeStyle : {}),
          }}
          title={l.label}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

const wrapStyle = {
  position: 'fixed',
  top: 10,
  right: 10,
  zIndex: 1000,
  display: 'flex',
  gap: 6,
  background: 'rgba(255,255,255,0.85)',
  border: '1px solid #e6e6e6',
  borderRadius: 10,
  padding: '6px 8px',
  backdropFilter: 'saturate(120%) blur(8px)',
};

const btnStyle = {
  fontSize: 12,
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid #dcdcdc',
  background: '#fafafa',
  cursor: 'pointer',
};

const activeStyle = {
  background: '#0f62fe',
  borderColor: '#0f62fe',
  color: 'white',
  fontWeight: 600,
};
