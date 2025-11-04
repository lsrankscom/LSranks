import {useTranslations} from "next-intl";
import AthleteSearch from "../components/AthleteSearch";

export default function Home(){
  const t = useTranslations("home");
  return (
    <div className="container">
      <div className="hero">
        <h1 style={{margin:0}}>{t("title")}</h1>
        <p style={{opacity:.95}}>{t("subtitle")}</p>
      </div>

      <div className="notice card">{t("devNote")}</div>

      <h3>Search for athletes</h3>
      <AthleteSearch/>

      <div className="grid cols-3" style={{marginTop:"1rem"}}>
        <a className="btn" href="/competitions">All competitions →</a>
        <a className="btn" href="/records">World Records →</a>
        <a className="btn" href="/calendar">Calendar →</a>
      </div>
    </div>
  );
}
