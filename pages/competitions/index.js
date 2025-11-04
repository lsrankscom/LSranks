import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

export default function Competitions(){
  const t=useTranslations("common");
  const [q,setQ]=useState("");
  const [order,setOrder]=useState("new");
  const [items,setItems]=useState([]);

  useEffect(()=>{
    (async ()=>{
      const res = await fetch(`/api/competitions/list`);
      const data = await res.json();
      setItems(data);
    })();
  },[]);

  const filtered = items
    .filter(x => !q || x.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=> order==="new" ? (b.date>a.date?1:-1) : (a.date>b.date?1:-1));

  return (
    <div className="container">
      <h2>{t("uploadedCompetitions")}</h2>
      <div className="grid cols-3 card">
        <input className="input" placeholder="Search name or location…" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={order} onChange={e=>setOrder(e.target.value)}>
          <option value="new">{t("newest")}</option>
          <option value="old">{t("oldest")}</option>
        </select>
        <button className="btn" onClick={()=>window.location.href="/competitions/request"}>+ {t("request")}</button>
      </div>
      <div className="card">
        {filtered.length===0 && <div>{t("noData")}</div>}
        {filtered.map(c=>(
          <div key={c.id} style={{padding:".6rem 0",borderBottom:"1px solid var(--border)"}}>
            <a href={`/competitions/${c.id}`}>{c.name}</a>
            <div className="muted">{c.city} — {c.pool} — {new Date(c.date).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
