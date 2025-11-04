import {useRouter} from "next/router";
import {locales, defaultLocale} from "../lib/i18n";

const FLAGS = { en:"🇬🇧", de:"🇩🇪", nl:"🇳🇱", es:"🇪🇸", it:"🇮🇹", zh:"🇨🇳", ja:"🇯🇵" };

export default function LanguageSwitcher(){
  const router = useRouter();
  const locale = (router.query.lang || defaultLocale).toString();

  function setLang(l){
    const q = {...router.query, lang:l};
    router.push({pathname:router.pathname, query:q}, undefined, {shallow:true});
  }

  return (
    <div className="card" style={{padding:".35rem .6rem"}}>
      <select value={locale} onChange={e=>setLang(e.target.value)}>
        {locales.map(l => <option key={l} value={l}>{FLAGS[l]} {l.toUpperCase()}</option>)}
      </select>
    </div>
  );
}
