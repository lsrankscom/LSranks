import cheerio from "cheerio";

export default async function handler(req,res){
  try{
    // Beispiel: echte URL per ENV
    const url = process.env.ILSF_RECORDS_URL || "";
    if(!url){ return res.json([]); }
    const html = await fetch(url).then(r=>r.text());
    const $ = cheerio.load(html);
    // TODO: an echte Struktur anpassen
    const rows=[];
    $("table tr").each((_,tr)=>{
      const tds=$(tr).find("td");
      if(tds.length>=5){
        rows.push({
          event:$(tds[0]).text().trim(),
          time:$(tds[1]).text().trim(),
          athlete:$(tds[2]).text().trim(),
          nation:$(tds[3]).text().trim(),
          type:"Individual",
          gender:"M",
          age:"Open"
        });
      }
    });
    res.json(rows);
  }catch(e){
    console.error(e);
    res.json([]); // niemals Fehler werfen -> UI bleibt stabil
  }
}
