import dynamic from "next/dynamic";
import {useState, useEffect} from "react";
import {useTranslations} from "next-intl";

const FullCalendar = dynamic(()=>import("@fullcalendar/react"),{ssr:false});
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarPage(){
  const t = useTranslations("calendar");
  const [events,setEvents]=useState([]);

  useEffect(()=>{
    (async ()=>{
      const res = await fetch("/api/competitions/list");
      const comps = await res.json();
      setEvents(comps.map(c=>({title:c.name, date:c.date, url:`/competitions/${c.id}`})));
    })();
  },[]);

  return (
    <div className="container">
      <h2>{t("title")}</h2>
      <div className="card">
        <FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" events={events} height="auto"/>
      </div>
      <div style={{marginTop:"1rem"}}>
        <a className="btn" href="/competitions/request">+ Request competition</a>
      </div>
    </div>
  );
}
