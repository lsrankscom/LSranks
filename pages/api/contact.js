export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).end();
  console.log("Contact:", req.body); // später: Mail/Store
  res.json({ok:true});
}
