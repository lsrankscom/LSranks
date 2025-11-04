export default function Admin(){
  return (
    <div className="container">
      <h2>Admin</h2>
      <div className="card">
        <strong>🔔 Requests</strong>
        <p>New competition & results requests will appear here.</p>
      </div>
      <div className="grid cols-2" style={{marginTop:"1rem"}}>
        <a className="btn" href="/competitions/request">Add competition</a>
        <a className="btn" href="/calendar">Open calendar</a>
      </div>
    </div>
  );
}
