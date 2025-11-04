import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

export default function Records(){
  const t = useTranslations("records");
  const [scope,setScope]=useState("world");
  const [gender,setGender]=useState("");
  const [age,setAge]=useState("");
  const [type,setType]=useState("");

  const [rows,setRows]=useState([]);
  useEffect(()=>{
    (async ()=>{
      const base = scope==="world" ? "/api/records/ilsf" : "/api/records/national";
      const res = await fetch(base);
      const data = await res.json();
      setRows(Array.isArray(data)?data:[]);
    })();
  },[scope]);

  const filtered = rows.filter(r =>
    (!gender || r.gender===gender) &&
    (!age || r.age===age) &&
    (!type || r.type===type)
  );

  return (
    <div className="container">
      <h2>{t("title")}</h2>
      <div className="grid cols-3 card">
        <select value={scope} onChange={e=>setScope(e.target.value)}>
          <option value="world">{t("world")}</option>
          <option value="national">{t("national")}</option>
        </select>
        <select value={gender} onChange={e=>setGender(e.target.value)}>
          <option value="">{t("gender")}</option>
          <option value="F">Female</option>
          <option value="M">Male</option>
        </select>
        <div className="grid cols-2">
          <select value={age} onChange={e=>setAge(e.target.value)}>
            <option value="">{t("age")}</option>
            <option value="Youth">Youth</option>
            <option value="Open">Open</option>
            <option value="Masters">Masters</option>
          </select>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="">{t("type")}</option>
            <option value="Individual">{t("individual")}</option>
            <option value="Relay">{t("relay")}</option>
          </select>
        </div>
      </div>

      <div className="card">
        {filtered.length===0 && <div>No records yet.</div>}
        {filtered.map((r,i)=>(
          <div key={i} style={{padding:".55rem 0",borderBottom:"1px solid var(--border)"}}>
            <strong>{r.event}</strong> — {r.time} — {r.athlete} ({r.nation})
          </div>
        ))}
      </div>
    </div>
  );
}
