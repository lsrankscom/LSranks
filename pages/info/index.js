import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

export default function Info(){
  const t = useTranslations("info");
  const [stats,setStats]=useState(null);
  const [news,setNews]=useState([]);

  useEffect(()=>{
    (async ()=>{
      const s = await (await fetch("/api/info/stats")).json();
      const n = await (await fetch("/api/info/news")).json();
      setStats(s); setNews(n);
    })();
  },[]);

  return (
    <div className="container">
      <h2>{t("dbStats")}</h2>
      <div className="grid cols-3">
        {stats ? Object.entries(stats.overview).map(([k,v])=>(
          <div key={k} className="card"><div className="badge">{k}</div><h2 style={{margin:".4rem 0"}}>{v}</h2></div>
        )) : <div className="card">Loading…</div>}
      </div>

      <h3 style={{marginTop:"1.5rem"}}>{t("latestNews")}</h3>
      <div className="card">
        {news.length===0 && <div>No news yet.</div>}
        {news.map((n,i)=>(
          <div key={i} style={{padding:".6rem 0",borderBottom:"1px solid var(--border)"}}>
            <a href={`/news/${n.slug}`}>{n.title}</a> — <span className="muted">{n.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
