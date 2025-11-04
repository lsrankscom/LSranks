import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

export default function AthleteSearch(){
  const t = useTranslations("home");
  const c = useTranslations("common");
  const [q,setQ] = useState("");
  const [club,setClub] = useState("");
  const [yFrom,setYFrom] = useState("");
  const [yTo,setYTo] = useState("");
  const [suggest,setSuggest]=useState([]);

  useEffect(()=>{
    let active=true;
    const fetcher = async ()=>{
      if(!q || q.length<2){ setSuggest([]); return; }
      const params = new URLSearchParams({ q, club, yFrom, yTo });
      const res = await fetch(`/api/athletes/search?${params.toString()}`);
      const data = await res.json();
      if(active) setSuggest(data.slice(0,8));
    };
    const id = setTimeout(fetcher, 200);
    return ()=>{active=false; clearTimeout(id)};
  },[q,club,yFrom,yTo]);

  return (
    <div className="card">
      <div className="grid cols-3">
        <input className="input" placeholder={t("searchPlaceholder")} value={q} onChange={e=>setQ(e.target.value)} />
        <input className="input" placeholder={c("club")} value={club} onChange={e=>setClub(e.target.value)} />
        <div className="grid cols-2">
          <input className="input" placeholder={c("birthFrom")} value={yFrom} onChange={e=>setYFrom(e.target.value)} />
          <input className="input" placeholder={c("birthTo")} value={yTo} onChange={e=>setYTo(e.target.value)} />
        </div>
      </div>
      {suggest.length>0 && (
        <div style={{marginTop:".75rem"}} className="card">
          {suggest.map(a=>(
            <div key={a.id} style={{padding:".35rem 0",borderBottom:"1px solid var(--border)"}}>
              <a href={`/athletes/${a.id}`}>{a.name} <span className="muted">({a.club})</span></a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
