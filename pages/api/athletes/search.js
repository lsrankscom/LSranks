export default function handler(req,res){
  const {q="", club="", yFrom="", yTo=""} = req.query;
  // TODO: echte DB anschließen. Bis dahin: Demo-Daten.
  const demo = [
    {id:"1", name:"Jane Smith", club:"RB Gouda", birthyear:2006},
    {id:"2", name:"John Doe", club:"SLSA NSW", birthyear:2005}
  ];
  const r = demo.filter(a =>
    a.name.toLowerCase().includes(q.toLowerCase()) &&
    (!club || a.club.toLowerCase().includes(club.toLowerCase())) &&
    (!yFrom || a.birthyear >= +yFrom) &&
    (!yTo || a.birthyear <= +yTo)
  );
  res.status(200).json(r);
}
