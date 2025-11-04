export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).end();
  console.log("Competition request:", req.body); // später: speichern / E-Mail / DB
  res.json({ok:true});
}
