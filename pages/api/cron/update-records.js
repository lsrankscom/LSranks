export default async function handler(req,res){
  try{
    await fetch(process.env.SELF_URL + "/api/records/ilsf").then(()=>{});
    // TODO: jede Nation anstoßen
    res.json({ok:true});
  }catch(e){
    console.error(e);
    res.json({ok:false});
  }
}
